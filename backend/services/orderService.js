const pool = require('../config/db');
const HttpError = require('../utils/httpError');
const { createTrackingNumber } = require('../utils/tracking');

function money(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function promotionPriceSql(alias = 'a') {
  return `
    COALESCE((
      SELECT MIN(
        ROUND(
          CASE
            WHEN p.discount_type = 'PERCENT'
              THEN GREATEST(0, ${alias}.price - (${alias}.price * p.discount_value / 100))
            ELSE GREATEST(0, ${alias}.price - p.discount_value)
          END,
          2
        )
      )
      FROM promotion_articles pa
      INNER JOIN promotions p ON p.id = pa.promotion_id
      WHERE pa.article_id = ${alias}.id
        AND p.is_active = 1
        AND (p.starts_at IS NULL OR p.starts_at <= NOW())
        AND (p.ends_at IS NULL OR p.ends_at >= NOW())
    ), ${alias}.price)
  `;
}

async function createOrder(payload) {
  const cn = await pool.getConnection();

  try {
    await cn.beginTransaction();

    const rawItems = Array.isArray(payload.items) ? payload.items : [];
    if (!rawItems.length) throw new HttpError(400, 'Le panier est vide.');

    let subtotal = 0;
    const resolved = [];
    const stockNeeds = new Map();
    const lockedArticles = new Map();

    const addStockNeed = (articleId, quantity) => {
      stockNeeds.set(articleId, (stockNeeds.get(articleId) || 0) + quantity);
    };

    for (const raw of rawItems) {
      const quantity = Number(raw.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new HttpError(400, 'Quantité invalide.');
      }

      const packId = Number(raw.packId || 0);
      const articleId = Number(raw.articleId || 0);

      if (packId) {
        const [[pack]] = await cn.query(
          `SELECT id,name,price,is_active FROM packs WHERE id=? FOR UPDATE`,
          [packId],
        );

        if (!pack || !Number(pack.is_active)) {
          throw new HttpError(400, 'Pack introuvable ou inactif.');
        }

        const [parts] = await cn.query(
          `SELECT pi.article_id,pi.quantity,a.designation,a.stock_quantity,a.is_active
           FROM pack_items pi
           INNER JOIN articles a ON a.id=pi.article_id
           WHERE pi.pack_id=?
           FOR UPDATE`,
          [packId],
        );

        if (!parts.length) throw new HttpError(400, 'Pack vide.');

        for (const part of parts) {
          if (!Number(part.is_active)) {
            throw new HttpError(409, `L’article ${part.designation} du pack est inactif.`);
          }
          lockedArticles.set(Number(part.article_id), part);
          addStockNeed(Number(part.article_id), Number(part.quantity) * quantity);
        }

        const unitPrice = money(pack.price);
        subtotal = money(subtotal + unitPrice * quantity);
        resolved.push({ type: 'PACK', pack, parts, quantity, unitPrice });
        continue;
      }

      if (articleId) {
        const [[article]] = await cn.query(
          `SELECT a.id,a.designation,a.price,a.stock_quantity,a.is_active,
                  ${promotionPriceSql('a')} AS effective_price
           FROM articles a
           WHERE a.id=?
           FOR UPDATE`,
          [articleId],
        );

        if (!article || !Number(article.is_active)) {
          throw new HttpError(400, `Article ${articleId} introuvable ou inactif.`);
        }

        lockedArticles.set(Number(article.id), article);
        addStockNeed(Number(article.id), quantity);

        const unitPrice = money(article.effective_price);
        subtotal = money(subtotal + unitPrice * quantity);
        resolved.push({ type: 'ARTICLE', article, quantity, unitPrice });
        continue;
      }

      throw new HttpError(400, 'Article ou pack manquant.');
    }

    for (const [articleId, needed] of stockNeeds.entries()) {
      let article = lockedArticles.get(articleId);
      if (!article) {
        const [[row]] = await cn.query(
          `SELECT id,designation,stock_quantity,is_active FROM articles WHERE id=? FOR UPDATE`,
          [articleId],
        );
        article = row;
      }

      if (!article || !Number(article.is_active)) {
        throw new HttpError(409, 'Un article du panier est indisponible.');
      }

      if (Number(article.stock_quantity) < needed) {
        throw new HttpError(
          409,
          `Stock insuffisant pour ${article.designation}. Disponible: ${Number(article.stock_quantity)}, demandé: ${needed}.`,
        );
      }
    }

    const trackingNumber = createTrackingNumber();
    const [or] = await cn.query(
      `INSERT INTO orders(
        tracking_number,customer_name,phone,wilaya,commune,address,note,status,
        subtotal,delivery_fee,total,stock_deducted
      ) VALUES(?,?,?,?,?,?,?,'NOUVELLE',?,0,?,1)`,
      [
        trackingNumber,
        payload.customerName,
        payload.phone,
        payload.wilaya,
        payload.commune,
        payload.address,
        payload.note || null,
        subtotal,
        subtotal,
      ],
    );

    for (const item of resolved) {
      const lineTotal = money(item.unitPrice * item.quantity);

      if (item.type === 'ARTICLE') {
        await cn.query(
          `INSERT INTO order_items(
            order_id,article_id,pack_id,item_type,designation,unit_price,quantity,line_total
          ) VALUES(?,?,NULL,'ARTICLE',?,?,?,?)`,
          [
            or.insertId,
            item.article.id,
            item.article.designation,
            item.unitPrice,
            item.quantity,
            lineTotal,
          ],
        );
      } else {
        await cn.query(
          `INSERT INTO order_items(
            order_id,article_id,pack_id,item_type,designation,unit_price,quantity,line_total
          ) VALUES(?,NULL,?,'PACK',?,?,?,?)`,
          [
            or.insertId,
            item.pack.id,
            item.pack.name,
            item.unitPrice,
            item.quantity,
            lineTotal,
          ],
        );
      }
    }

    for (const [articleId, needed] of stockNeeds.entries()) {
      const [result] = await cn.query(
        `UPDATE articles
         SET stock_quantity = stock_quantity - ?
         WHERE id = ? AND stock_quantity >= ?`,
        [needed, articleId, needed],
      );
      if (!result.affectedRows) {
        throw new HttpError(409, 'Le stock a changé pendant la commande. Réessayez.');
      }
    }

    await cn.query(
      `INSERT INTO order_history(order_id,status,label,description)
       VALUES(?,'NOUVELLE','Commande reçue','Votre commande a été enregistrée avec succès.')`,
      [or.insertId],
    );

    await cn.commit();
    return { id: or.insertId, trackingNumber, subtotal, total: subtotal };
  } catch (error) {
    await cn.rollback();
    throw error;
  } finally {
    cn.release();
  }
}

async function trackOrder({ trackingNumber, phone }) {
  const [[order]] = await pool.query(
    `SELECT * FROM orders WHERE UPPER(tracking_number)=UPPER(?) AND phone=? LIMIT 1`,
    [trackingNumber, phone],
  );
  if (!order) throw new HttpError(404, 'Aucune commande ne correspond à ces informations.');

  const [history] = await pool.query(
    `SELECT id,status,label,description,created_at FROM order_history WHERE order_id=? ORDER BY created_at,id`,
    [order.id],
  );
  const [items] = await pool.query(
    `SELECT id,article_id,pack_id,item_type,designation,unit_price,quantity,line_total FROM order_items WHERE order_id=? ORDER BY id`,
    [order.id],
  );
  return { order, items, history };
}

module.exports = { createOrder, trackOrder };

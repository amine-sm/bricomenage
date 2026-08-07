const pool = require('../config/db');
const slugify = require('slugify');
const HttpError = require('../utils/httpError');

const clean = (value) => String(value ?? '').trim();

function activeValue(value, fallback = 1) {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === true || value === 1 || value === '1') return 1;
  if (value === false || value === 0 || value === '0') return 0;
  const normalized = clean(value).toLowerCase();
  if (['true', 'actif', 'active', 'enabled', 'on'].includes(normalized)) return 1;
  if (['false', 'inactif', 'inactive', 'disabled', 'off'].includes(normalized)) return 0;
  throw new HttpError(400, 'Statut du pack invalide.');
}

function validate(body) {
  const name = clean(body.name);
  const price = Number(body.price);
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const itemMap = new Map();

  for (const item of rawItems) {
    const articleId = Number(item.articleId ?? item.article_id ?? item.id);
    const quantity = Number(item.quantity);
    if (Number.isInteger(articleId) && articleId > 0 && Number.isInteger(quantity) && quantity > 0) {
      itemMap.set(articleId, { articleId, quantity });
    }
  }

  const items = [...itemMap.values()];
  if (!name) throw new HttpError(400, 'Nom du pack obligatoire.');
  if (!Number.isFinite(price) || price <= 0) throw new HttpError(400, 'Prix du pack invalide.');
  if (items.length < 2) throw new HttpError(400, 'Un pack doit contenir au moins deux articles différents.');

  const oldPriceRaw = body.old_price === '' || body.old_price === null || body.old_price === undefined
    ? null
    : Number(body.old_price);
  if (oldPriceRaw !== null && (!Number.isFinite(oldPriceRaw) || oldPriceRaw < 0)) {
    throw new HttpError(400, 'Ancien prix du pack invalide.');
  }

  return {
    name,
    slug: clean(body.slug) || slugify(name, { lower: true, strict: true }),
    description: clean(body.description) || null,
    price,
    oldPrice: oldPriceRaw,
    image: clean(body.image) || null,
    isActive: activeValue(body.is_active, 1),
    items,
  };
}

const CALCULATED_STOCK_SQL = `
  CASE
    WHEN COUNT(pi.article_id) = 0 THEN 0
    WHEN SUM(CASE WHEN a.id IS NULL OR a.is_active = 0 THEN 1 ELSE 0 END) > 0 THEN 0
    ELSE COALESCE(MIN(FLOOR(a.stock_quantity / NULLIF(pi.quantity, 0))), 0)
  END
`;

async function listPacks(req, res) {
  const [rows] = await pool.query(`
    SELECT p.*,
      COUNT(pi.article_id) AS article_count,
      ${CALCULATED_STOCK_SQL} AS calculated_stock
    FROM packs p
    LEFT JOIN pack_items pi ON pi.pack_id = p.id
    LEFT JOIN articles a ON a.id = pi.article_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);

  return res.json({
    success: true,
    packs: rows.map((row) => ({
      ...row,
      is_active: Boolean(Number(row.is_active)),
      article_count: Number(row.article_count || 0),
      calculated_stock: Number(row.calculated_stock || 0),
      stock_quantity: Number(row.calculated_stock || 0),
    })),
  });
}

async function getPack(req, res) {
  const [[pack]] = await pool.query(
    `SELECT p.*, ${CALCULATED_STOCK_SQL} AS calculated_stock
     FROM packs p
     LEFT JOIN pack_items pi ON pi.pack_id=p.id
     LEFT JOIN articles a ON a.id=pi.article_id
     WHERE p.id=?
     GROUP BY p.id`,
    [req.params.id],
  );
  if (!pack) throw new HttpError(404, 'Pack introuvable.');

  const [articles] = await pool.query(
    `SELECT a.id,a.designation,a.reference,a.image,a.images,a.price,a.stock_quantity,a.is_active,
      pi.quantity,(a.price*pi.quantity) AS line_total
     FROM pack_items pi
     JOIN articles a ON a.id=pi.article_id
     WHERE pi.pack_id=?
     ORDER BY a.designation`,
    [req.params.id],
  );

  return res.json({
    success: true,
    pack: {
      ...pack,
      is_active: Boolean(Number(pack.is_active)),
      calculated_stock: Number(pack.calculated_stock || 0),
      stock_quantity: Number(pack.calculated_stock || 0),
      articles: articles.map((a) => ({ ...a, is_active: Boolean(Number(a.is_active)) })),
    },
    ...pack,
    is_active: Boolean(Number(pack.is_active)),
    calculated_stock: Number(pack.calculated_stock || 0),
    stock_quantity: Number(pack.calculated_stock || 0),
    articles: articles.map((a) => ({ ...a, is_active: Boolean(Number(a.is_active)) })),
  });
}

async function save(req, res, isUpdate) {
  const data = validate(req.body);
  const cn = await pool.getConnection();
  try {
    await cn.beginTransaction();
    const ids = data.items.map((i) => i.articleId);
    const placeholders = ids.map(() => '?').join(',');
    const [articles] = await cn.query(
      `SELECT id,designation,price,stock_quantity,is_active FROM articles WHERE id IN (${placeholders}) FOR UPDATE`,
      ids,
    );
    if (articles.length !== ids.length) throw new HttpError(400, 'Article de pack introuvable.');

    const map = new Map(articles.map((a) => [Number(a.id), a]));
    let normalTotal = 0;
    for (const item of data.items) {
      const article = map.get(item.articleId);
      normalTotal += Number(article.price || 0) * item.quantity;
    }
    normalTotal = Math.round(normalTotal * 100) / 100;

    if (data.price >= normalTotal) {
      throw new HttpError(400, 'Le prix du pack doit être inférieur au total normal des articles.');
    }

    const oldPrice = data.oldPrice ?? normalTotal;
    let id = Number(req.params.id || 0);
    let usage = { total: 0 };

    if (isUpdate) {
      const [[existingPack]] = await cn.query('SELECT id FROM packs WHERE id=? FOR UPDATE', [id]);
      if (!existingPack) throw new HttpError(404, 'Pack introuvable.');

      [[usage]] = await cn.query(
        "SELECT COUNT(*) AS total FROM order_items WHERE pack_id=? AND item_type='PACK'",
        [id],
      );

      if (Number(usage.total || 0) > 0) {
        const [currentItems] = await cn.query(
          'SELECT article_id,quantity FROM pack_items WHERE pack_id=? ORDER BY article_id',
          [id],
        );
        const currentKey = currentItems
          .map((item) => `${Number(item.article_id)}:${Number(item.quantity)}`)
          .sort()
          .join('|');
        const requestedKey = data.items
          .map((item) => `${item.articleId}:${item.quantity}`)
          .sort()
          .join('|');

        if (currentKey !== requestedKey) {
          throw new HttpError(
            409,
            'Ce pack existe déjà dans des commandes. Sa composition ne peut plus être modifiée afin de protéger le calcul du stock. Vous pouvez modifier son nom, prix, image et statut.',
          );
        }
      }

      await cn.query(
        `UPDATE packs SET slug=?,name=?,description=?,price=?,old_price=?,image=?,is_active=? WHERE id=?`,
        [data.slug, data.name, data.description, data.price, oldPrice, data.image, data.isActive, id],
      );

      if (Number(usage.total || 0) === 0) {
        await cn.query('DELETE FROM pack_items WHERE pack_id=?', [id]);
      }
    } else {
      const [result] = await cn.query(
        `INSERT INTO packs(slug,name,description,price,old_price,image,stock_quantity,is_active)
         VALUES(?,?,?,?,?,?,0,?)`,
        [data.slug, data.name, data.description, data.price, oldPrice, data.image, data.isActive],
      );
      id = Number(result.insertId);
    }

    if (!isUpdate || Number(usage?.total || 0) === 0) {
      await cn.query(
        'INSERT INTO pack_items(pack_id,article_id,quantity) VALUES ?',
        [data.items.map((item) => [id, item.articleId, item.quantity])],
      );
    }

    await cn.commit();
    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Pack modifié.' : 'Pack créé.',
      pack: { id, slug: data.slug, is_active: Boolean(data.isActive) },
    });
  } catch (error) {
    await cn.rollback();
    if (error?.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ce nom/slug de pack existe déjà.');
    throw error;
  } finally {
    cn.release();
  }
}

async function createPack(req, res) { return save(req, res, false); }
async function updatePack(req, res) { return save(req, res, true); }

async function updatePackStatus(req, res) {
  const requested = req.body.is_active ?? req.body.active ?? req.body.status;
  const isActive = activeValue(requested);
  const [result] = await pool.query('UPDATE packs SET is_active=? WHERE id=?', [isActive, req.params.id]);
  if (!result.affectedRows) throw new HttpError(404, 'Pack introuvable.');
  return res.json({ success: true, message: isActive ? 'Pack activé.' : 'Pack désactivé.', is_active: Boolean(isActive) });
}

async function togglePackStatus(req, res) {
  const [[pack]] = await pool.query('SELECT id,is_active FROM packs WHERE id=?', [req.params.id]);
  if (!pack) throw new HttpError(404, 'Pack introuvable.');
  req.body = { ...req.body, is_active: Number(pack.is_active) ? 0 : 1 };
  return updatePackStatus(req, res);
}

async function deletePack(req, res) {
  const [orderRefs] = await pool.query('SELECT id FROM order_items WHERE pack_id=? LIMIT 1', [req.params.id]);
  if (orderRefs.length) {
    await pool.query('UPDATE packs SET is_active=0 WHERE id=?', [req.params.id]);
    return res.json({ success: true, message: 'Pack utilisé dans une commande : il a été désactivé au lieu d’être supprimé.' });
  }
  const [result] = await pool.query('DELETE FROM packs WHERE id=?', [req.params.id]);
  if (!result.affectedRows) throw new HttpError(404, 'Pack introuvable.');
  return res.json({ success: true, message: 'Pack supprimé.' });
}

module.exports = {
  listPacks,
  getPack,
  createPack,
  updatePack,
  updatePackStatus,
  togglePackStatus,
  deletePack,
};

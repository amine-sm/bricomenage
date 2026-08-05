const pool = require("../config/db");
const HttpError = require("../utils/httpError");
const { createTrackingNumber } = require("../utils/tracking");

async function createOrder(payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const articleIds = payload.items.map((item) => Number(item.articleId));
    const placeholders = articleIds.map(() => "?").join(",");

    const [articles] = await connection.query(
      `
        SELECT id, designation, price, stock_quantity
        FROM articles
        WHERE id IN (${placeholders})
          AND is_active = 1
        FOR UPDATE
      `,
      articleIds
    );

    const articleMap = new Map(
      articles.map((article) => [Number(article.id), article])
    );

    let subtotal = 0;

    for (const item of payload.items) {
      const article = articleMap.get(Number(item.articleId));
      const quantity = Number(item.quantity);

      if (!article) {
        throw new HttpError(400, `Article ${item.articleId} introuvable.`);
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new HttpError(400, "Quantité invalide.");
      }

      if (Number(article.stock_quantity) < quantity) {
        throw new HttpError(
          409,
          `Stock insuffisant pour ${article.designation}.`
        );
      }

      subtotal += Number(article.price) * quantity;
    }

    const trackingNumber = createTrackingNumber();

    const [orderResult] = await connection.query(
      `
        INSERT INTO orders (
          tracking_number,
          customer_name,
          phone,
          wilaya,
          commune,
          address,
          note,
          status,
          subtotal,
          delivery_fee,
          total
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'NOUVELLE', ?, 0, ?)
      `,
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
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of payload.items) {
      const article = articleMap.get(Number(item.articleId));
      const quantity = Number(item.quantity);
      const unitPrice = Number(article.price);

      await connection.query(
        `
          INSERT INTO order_items (
            order_id,
            article_id,
            designation,
            unit_price,
            quantity,
            line_total
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          article.id,
          article.designation,
          unitPrice,
          quantity,
          unitPrice * quantity,
        ]
      );

      await connection.query(
        `
          UPDATE articles
          SET stock_quantity = stock_quantity - ?
          WHERE id = ?
        `,
        [quantity, article.id]
      );
    }

    await connection.query(
      `
        INSERT INTO order_history (
          order_id,
          status,
          label,
          description
        )
        VALUES (
          ?,
          'NOUVELLE',
          'Commande reçue',
          'Votre commande a été enregistrée avec succès.'
        )
      `,
      [orderId]
    );

    await connection.commit();

    return {
      id: orderId,
      trackingNumber,
      subtotal,
      total: subtotal,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function trackOrder({ trackingNumber, phone }) {
  const [orders] = await pool.query(
    `
      SELECT
        id,
        tracking_number,
        customer_name,
        phone,
        wilaya,
        commune,
        address,
        status,
        subtotal,
        delivery_fee,
        total,
        created_at,
        updated_at
      FROM orders
      WHERE UPPER(tracking_number) = UPPER(?)
        AND phone = ?
      LIMIT 1
    `,
    [trackingNumber, phone]
  );

  const order = orders[0];

  if (!order) {
    throw new HttpError(
      404,
      "Aucune commande ne correspond à ces informations."
    );
  }

  const [history] = await pool.query(
    `
      SELECT id, status, label, description, created_at
      FROM order_history
      WHERE order_id = ?
      ORDER BY created_at ASC, id ASC
    `,
    [order.id]
  );

  return { order, history };
}

module.exports = { createOrder, trackOrder };

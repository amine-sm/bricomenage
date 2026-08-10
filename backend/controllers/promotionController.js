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
  throw new HttpError(400, 'Statut de promotion invalide.');
}

function normalizeSqlDateTime(value) {
  const normalized = clean(value);
  if (!normalized) return null;
  const result = normalized.replace('T', ' ').replace(/Z$/i, '').slice(0, 19);
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?$/.test(result)) {
    throw new HttpError(400, 'Format de date invalide.');
  }
  return result.length === 16 ? `${result}:00` : result;
}

function parseArticleIds(body) {
  const source = Array.isArray(body.articleIds)
    ? body.articleIds
    : Array.isArray(body.articles)
      ? body.articles
      : [];

  return [...new Set(source
    .map((item) => (typeof item === 'object' ? Number(item.id ?? item.articleId) : Number(item)))
    .filter((id) => Number.isInteger(id) && id > 0))];
}

function validate(body) {
  const name = clean(body.name);
  const discountType = clean(body.discount_type || 'PERCENT').toUpperCase();
  const discountValue = Number(body.discount_value);
  const articleIds = parseArticleIds(body);
  const startsAt = normalizeSqlDateTime(body.starts_at);
  const endsAt = normalizeSqlDateTime(body.ends_at);

  if (!name) throw new HttpError(400, 'Le nom de la promotion est obligatoire.');
  if (!['PERCENT', 'FIXED'].includes(discountType)) throw new HttpError(400, 'Type de réduction invalide.');
  if (!Number.isFinite(discountValue) || discountValue <= 0) throw new HttpError(400, 'Valeur de réduction invalide.');
  if (discountType === 'PERCENT' && discountValue > 100) throw new HttpError(400, 'Le pourcentage ne peut pas dépasser 100 %.');
  if (!articleIds.length) throw new HttpError(400, 'Sélectionnez au moins un article.');
  if (startsAt && endsAt && endsAt <= startsAt) throw new HttpError(400, 'La date de fin doit être postérieure à la date de début.');

  return {
    name,
    slug: slugify(name, { lower: true, strict: true }),
    description: clean(body.description) || null,
    discountType,
    discountValue,
    startsAt,
    endsAt,
    isActive: activeValue(body.is_active, 1),
    articleIds,
  };
}

async function uniquePromotionSlug(connection, name, excludeId = null) {
  const base = slugify(name, { lower: true, strict: true }) || 'promotion';
  let candidate = base;
  let suffix = 2;

  while (true) {
    const params = [candidate];
    let sql = 'SELECT id FROM promotions WHERE slug=?';
    if (excludeId) {
      sql += ' AND id<>?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';

    const [rows] = await connection.query(sql, params);
    if (!rows.length) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

function promotionalPrice(price, type, value) {
  const original = Number(price || 0);
  const discount = Number(value || 0);
  const result = type === 'PERCENT'
    ? original - (original * discount) / 100
    : original - discount;
  return Math.round(Math.max(0, result) * 100) / 100;
}

const STATUS_SQL = `
  CASE
    WHEN p.is_active = 0 THEN 'INACTIVE'
    WHEN p.starts_at IS NOT NULL AND p.starts_at > NOW() THEN 'SCHEDULED'
    WHEN p.ends_at IS NOT NULL AND p.ends_at < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END
`;

async function fetchPromotion(connection, id) {
  const [[promotion]] = await connection.query(
    `SELECT p.*, COUNT(pa.article_id) AS article_count,
      ${STATUS_SQL} AS effective_status,
      CASE WHEN ${STATUS_SQL} = 'ACTIVE' THEN 1 ELSE 0 END AS is_effective_active
     FROM promotions p
     LEFT JOIN promotion_articles pa ON pa.promotion_id = p.id
     WHERE p.id = ?
     GROUP BY p.id
     LIMIT 1`,
    [id],
  );

  if (!promotion) return null;

  const [articles] = await connection.query(
    `SELECT a.id,a.designation,a.reference,a.image,a.price,a.stock_quantity,a.is_active
     FROM promotion_articles pa
     INNER JOIN articles a ON a.id = pa.article_id
     WHERE pa.promotion_id = ?
     ORDER BY a.designation ASC`,
    [id],
  );

  return {
    ...promotion,
    article_count: Number(promotion.article_count || 0),
    is_active: Boolean(Number(promotion.is_active)),
    is_effective_active: Boolean(Number(promotion.is_effective_active)),
    articles: articles.map((article) => ({
      ...article,
      is_active: Boolean(Number(article.is_active)),
      original_price: Number(article.price || 0),
      promotional_price: promotionalPrice(article.price, promotion.discount_type, promotion.discount_value),
    })),
  };
}

async function verifyArticles(connection, articleIds) {
  const placeholders = articleIds.map(() => '?').join(',');
  const [rows] = await connection.query(
    `SELECT id,designation,price,is_active FROM articles WHERE id IN (${placeholders})`,
    articleIds,
  );
  if (rows.length !== articleIds.length) throw new HttpError(400, 'Un article sélectionné est introuvable.');
  return rows;
}

async function listPromotions(req, res) {
  const status = clean(req.query.status).toUpperCase();
  const search = clean(req.query.search || req.query.q);
  const where = [];
  const params = [];

  if (search) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }

  if (['ACTIVE', 'ACTIF'].includes(status)) where.push(`${STATUS_SQL} = 'ACTIVE'`);
  if (['INACTIVE', 'INACTIF'].includes(status)) where.push(`${STATUS_SQL} = 'INACTIVE'`);
  if (['SCHEDULED', 'PROGRAMMEE', 'PROGRAMMÉE'].includes(status)) where.push(`${STATUS_SQL} = 'SCHEDULED'`);
  if (['EXPIRED', 'EXPIREE', 'EXPIRÉE'].includes(status)) where.push(`${STATUS_SQL} = 'EXPIRED'`);

  const [rows] = await pool.query(
    `SELECT p.*,COUNT(pa.article_id) AS article_count,
      ${STATUS_SQL} AS effective_status,
      CASE WHEN ${STATUS_SQL} = 'ACTIVE' THEN 1 ELSE 0 END AS is_effective_active
     FROM promotions p
     LEFT JOIN promotion_articles pa ON pa.promotion_id = p.id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    params,
  );

  return res.json({
    success: true,
    promotions: rows.map((p) => ({
      ...p,
      article_count: Number(p.article_count || 0),
      is_active: Boolean(Number(p.is_active)),
      is_effective_active: Boolean(Number(p.is_effective_active)),
    })),
  });
}

async function getPromotion(req, res) {
  const promotion = await fetchPromotion(pool, Number(req.params.id));
  if (!promotion) throw new HttpError(404, 'Promotion introuvable.');
  return res.json({ success: true, promotion, ...promotion });
}

async function createPromotion(req, res) {
  const data = validate(req.body);
  const cn = await pool.getConnection();
  try {
    await cn.beginTransaction();
    await verifyArticles(cn, data.articleIds);
    data.slug = await uniquePromotionSlug(cn, data.name);
    const [result] = await cn.query(
      `INSERT INTO promotions(slug,name,description,discount_type,discount_value,starts_at,ends_at,is_active)
       VALUES(?,?,?,?,?,?,?,?)`,
      [data.slug, data.name, data.description, data.discountType, data.discountValue, data.startsAt, data.endsAt, data.isActive],
    );
    const id = Number(result.insertId);
    await cn.query(
      'INSERT INTO promotion_articles(promotion_id,article_id) VALUES ?',
      [data.articleIds.map((articleId) => [id, articleId])],
    );
    await cn.commit();
    const promotion = await fetchPromotion(pool, id);
    return res.status(201).json({ success: true, message: 'Promotion créée avec succès.', promotion });
  } catch (error) {
    await cn.rollback();
    throw error;
  } finally {
    cn.release();
  }
}

async function updatePromotion(req, res) {
  const id = Number(req.params.id);
  const data = validate(req.body);
  const cn = await pool.getConnection();
  try {
    await cn.beginTransaction();
    const [[existing]] = await cn.query('SELECT id FROM promotions WHERE id=? FOR UPDATE', [id]);
    if (!existing) throw new HttpError(404, 'Promotion introuvable.');
    await verifyArticles(cn, data.articleIds);
    data.slug = await uniquePromotionSlug(cn, data.name, id);

    await cn.query(
      `UPDATE promotions SET slug=?,name=?,description=?,discount_type=?,discount_value=?,starts_at=?,ends_at=?,is_active=? WHERE id=?`,
      [data.slug, data.name, data.description, data.discountType, data.discountValue, data.startsAt, data.endsAt, data.isActive, id],
    );
    await cn.query('DELETE FROM promotion_articles WHERE promotion_id=?', [id]);
    await cn.query(
      'INSERT INTO promotion_articles(promotion_id,article_id) VALUES ?',
      [data.articleIds.map((articleId) => [id, articleId])],
    );
    await cn.commit();
    const promotion = await fetchPromotion(pool, id);
    return res.json({ success: true, message: 'Promotion modifiée avec succès.', promotion });
  } catch (error) {
    await cn.rollback();
    throw error;
  } finally {
    cn.release();
  }
}

async function updatePromotionStatus(req, res) {
  const id = Number(req.params.id);
  const requested = req.body.is_active ?? req.body.active ?? req.body.status;
  const isActive = activeValue(requested);
  const [result] = await pool.query('UPDATE promotions SET is_active=? WHERE id=?', [isActive, id]);
  if (!result.affectedRows) throw new HttpError(404, 'Promotion introuvable.');
  const promotion = await fetchPromotion(pool, id);
  return res.json({
    success: true,
    message: isActive ? 'Promotion activée.' : 'Promotion désactivée.',
    promotion,
  });
}

async function togglePromotionStatus(req, res) {
  const id = Number(req.params.id);
  const [[promotion]] = await pool.query('SELECT id,is_active FROM promotions WHERE id=?', [id]);
  if (!promotion) throw new HttpError(404, 'Promotion introuvable.');
  req.body = { ...req.body, is_active: Number(promotion.is_active) ? 0 : 1 };
  return updatePromotionStatus(req, res);
}

async function deletePromotion(req, res) {
  const [result] = await pool.query('DELETE FROM promotions WHERE id=?', [req.params.id]);
  if (!result.affectedRows) throw new HttpError(404, 'Promotion introuvable.');
  return res.json({ success: true, message: 'Promotion supprimée.' });
}

module.exports = {
  listPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  updatePromotionStatus,
  togglePromotionStatus,
  deletePromotion,
};

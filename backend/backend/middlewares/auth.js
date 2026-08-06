const jwt = require("jsonwebtoken");
const HttpError = require("../utils/httpError");

function requireAdmin(req, res, next) {
  const authorization = String(req.headers.authorization || "");

  if (!authorization.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authentification requise."));
  }

  try {
    req.admin = jwt.verify(
      authorization.slice(7).trim(),
      process.env.JWT_SECRET
    );
    return next();
  } catch {
    return next(new HttpError(401, "Session invalide ou expirée."));
  }
}

module.exports = { requireAdmin };

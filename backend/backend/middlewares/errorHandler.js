function notFound(req, res) {
  return res.status(404).json({
    success: false,
    message: "Route introuvable.",
  });
}

function errorHandler(error, req, res, next) {
  console.error(error);

  return res.status(Number(error.status || 500)).json({
    success: false,
    message: error.message || "Erreur interne du serveur.",
    ...(process.env.NODE_ENV !== "production" && error.details
      ? { details: error.details }
      : {}),
  });
}

module.exports = { notFound, errorHandler };

const orderService = require("../services/orderService");
const HttpError = require("../utils/httpError");

function required(value, label) {
  const text = String(value || "").trim();

  if (!text) {
    throw new HttpError(400, `${label} est obligatoire.`);
  }

  return text;
}

async function createOrder(req, res) {
  const items = Array.isArray(req.body.items) ? req.body.items : [];

  if (items.length === 0) {
    throw new HttpError(400, "Le panier est vide.");
  }

  const result = await orderService.createOrder({
    customerName: required(req.body.customerName, "Le nom"),
    phone: required(req.body.phone, "Le téléphone"),
    wilaya: required(req.body.wilaya, "La wilaya"),
    commune: required(req.body.commune, "La commune"),
    address: required(req.body.address, "L’adresse"),
    note: String(req.body.note || "").trim(),
    items,
  });

  return res.status(201).json({
    success: true,
    message: "Commande enregistrée.",
    trackingNumber: result.trackingNumber,
    order: result,
  });
}

async function checkTracking(req, res) {
  const result = await orderService.trackOrder({
    trackingNumber: required(
      req.body.trackingNumber,
      "Le numéro de suivi"
    ),
    phone: required(req.body.phone, "Le téléphone"),
  });

  return res.status(200).json({
    success: true,
    ...result,
  });
}

module.exports = { createOrder, checkTracking };

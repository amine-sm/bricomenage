const HttpError = require("../utils/httpError");
const zrExpressService = require("../services/zrExpressService");

function required(value, label) {
  const text = String(value || "").trim();
  if (!text) {
    throw new HttpError(400, `${label} est obligatoire.`);
  }
  return text;
}

async function status(req, res) {
  return res.json({
    success: true,
    ...(await zrExpressService.configInfo()),
  });
}

async function wilayas(req, res) {
  const items = await zrExpressService.getWilayas();
  return res.json({ success: true, wilayas: items });
}

async function communes(req, res) {
  const cityId = required(req.query.cityId, "La wilaya ZR");
  const items = await zrExpressService.getCommunes(cityId);
  return res.json({ success: true, communes: items });
}

async function hubs(req, res) {
  const items = await zrExpressService.getDestinationHubs({
    cityId: String(req.query.cityId || "").trim(),
    districtId: String(req.query.districtId || "").trim(),
  });

  return res.json({ success: true, hubs: items });
}

async function quote(req, res) {
  const result = await zrExpressService.getDeliveryQuote({
    cityId: required(req.body.cityId, "La wilaya ZR"),
    districtId: required(req.body.districtId, "La commune ZR"),
    deliveryType: String(req.body.deliveryType || "HOME"),
  });

  return res.json({ success: true, ...result });
}

async function adminConfig(req, res) {
  return res.json({
    success: true,
    ...(await zrExpressService.configInfo({ test: true })),
  });
}

async function createForOrder(req, res) {
  const data = await zrExpressService.createParcelForOrder(
    Number(req.params.id),
  );

  const io = req.app.get("io");
  if (io) {
    io.to("admins").emit("order:zr-updated", {
      id: Number(req.params.id),
      zr_tracking_number: data.trackingNumber || null,
      zr_status: data.status || null,
      zr_status_label: data.statusLabel || null,
    });
  }

  return res.status(201).json({
    success: true,
    message: "Colis créé chez ZR Express.",
    data,
  });
}

async function syncOrder(req, res) {
  const data = await zrExpressService.syncParcelForOrder(
    Number(req.params.id),
  );

  const io = req.app.get("io");
  if (io) {
    io.to("admins").emit("order:zr-updated", {
      id: Number(req.params.id),
      zr_tracking_number: data.trackingNumber || null,
      zr_status: data.status || null,
      zr_status_label: data.statusLabel || null,
    });
  }

  return res.json({
    success: true,
    message: "Suivi ZR Express actualisé.",
    data,
  });
}

async function cancelOrder(req, res) {
  const data = await zrExpressService.cancelParcelForOrder(
    Number(req.params.id),
  );

  return res.json({
    success: true,
    message: data.reason === "NO_ZR_PARCEL"
      ? "Cette commande n’avait pas encore de colis ZR Express."
      : "Colis ZR Express annulé.",
    data,
  });
}

async function label(req, res) {
  const data = await zrExpressService.getLabelForOrder(
    Number(req.params.id),
  );

  return res.json({ success: true, data });
}

module.exports = {
  status,
  wilayas,
  communes,
  hubs,
  quote,
  adminConfig,
  createForOrder,
  syncOrder,
  cancelOrder,
  label,
};

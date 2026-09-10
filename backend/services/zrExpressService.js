const pool = require("../config/db");
const HttpError = require("../utils/httpError");

let courierLib = null;
let courierManager = null;
let adapter = null;
let ratesCache = { at: 0, data: [] };
let territoriesCache = new Map();
let hubsCache = { at: 0, data: [] };

function enabled() {
  return String(
    process.env.ZR_EXPRESS_ENABLED || "false",
  ).toLowerCase() === "true";
}

function configured() {
  return Boolean(
    enabled() &&
      String(process.env.ZR_EXPRESS_TENANT_ID || "").trim() &&
      String(process.env.ZR_EXPRESS_SECRET_KEY || "").trim(),
  );
}

function requireConfigured() {
  if (!configured()) {
    throw new HttpError(
      503,
      "ZR Express n’est pas configuré sur le serveur.",
    );
  }
}

function loadCourierLibrary() {
  if (courierLib) {
    return courierLib;
  }

  try {
    courierLib = require("courier-dz");
    return courierLib;
  } catch (error) {
    throw new HttpError(
      500,
      "Le module courier-dz est absent. Exécutez npm install dans le backend.",
      { cause: error.message },
    );
  }
}

function getAdapter() {
  requireConfigured();

  if (adapter) {
    return adapter;
  }

  const {
    CourierManager,
    PROVIDERS,
  } = loadCourierLibrary();

  courierManager = new CourierManager({
    providers: {
      zrexpress_new: {
        tenant_id: String(
          process.env.ZR_EXPRESS_TENANT_ID,
        ).trim(),
        api_key: String(
          process.env.ZR_EXPRESS_SECRET_KEY,
        ).trim(),
      },
    },
  });

  adapter = courierManager.provider(
    PROVIDERS.ZREXPRESS_NEW || "zrexpress_new",
  );

  return adapter;
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const candidates = [
    value.items,
    value.data,
    value.results,
    value.territories,
    value.hubs,
    value.rates,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeTerritory(row) {
  const raw = row?.raw && typeof row.raw === "object"
    ? row.raw
    : row || {};

  return {
    id: clean(
      row?.id ||
        row?.territoryId ||
        raw.id ||
        raw.territoryId,
    ),
    code: clean(
      row?.code ||
        row?.territoryCode ||
        raw.code ||
        raw.territoryCode,
    ),
    name: clean(
      row?.name ||
        row?.label ||
        row?.nameFr ||
        raw.name ||
        raw.label ||
        raw.nameFr ||
        raw.designation,
    ),
    nameAr: clean(
      row?.nameAr ||
        row?.nameArabic ||
        row?.arabicName ||
        raw.nameAr ||
        raw.nameArabic ||
        raw.arabicName,
    ),
    parentId: clean(
      row?.parentId ||
        raw.parentId ||
        raw.parentTerritoryId,
    ) || null,
    level: clean(
      row?.level ||
        row?.territoryLevel ||
        raw.level ||
        raw.territoryLevel,
    ).toLowerCase(),
    hasHomeDelivery:
      row?.hasHomeDelivery ??
      raw.hasHomeDelivery ??
      raw.delivery?.hasHomeDelivery ??
      null,
    hasPickupPoint:
      row?.hasPickupPoint ??
      raw.hasPickupPoint ??
      raw.delivery?.hasPickupPoint ??
      null,
    isDeliverable:
      row?.isDeliverable ??
      raw.isDeliverable ??
      raw.deliverable ??
      row?.hasHomeDelivery ??
      raw.hasHomeDelivery ??
      true,
    raw,
  };
}

function normalizeHub(row) {
  const raw = row?.raw && typeof row.raw === "object"
    ? row.raw
    : row || {};

  return {
    id: clean(
      row?.id ||
        row?.hubId ||
        raw.id ||
        raw.hubId,
    ),
    name: clean(
      row?.name ||
        row?.label ||
        raw.name ||
        raw.label ||
        raw.designation,
    ),
    address: clean(
      row?.address ||
        raw.address ||
        raw.fullAddress,
    ),
    cityId: clean(
      row?.cityTerritoryId ||
        row?.cityId ||
        row?.wilayaId ||
        raw.cityTerritoryId ||
        raw.cityId ||
        raw.wilayaId,
    ) || null,
    districtId: clean(
      row?.districtTerritoryId ||
        row?.districtId ||
        row?.communeId ||
        raw.districtTerritoryId ||
        raw.districtId ||
        raw.communeId,
    ) || null,
    cityName: clean(
      row?.cityName ||
        raw.cityName ||
        raw.city,
    ),
    communeName: clean(
      row?.communeName ||
        raw.communeName ||
        raw.district,
    ),
    pickupOnly:
      row?.isPickupPoint ??
      row?.pickupOnly ??
      raw.isPickupPoint ??
      raw.pickupOnly ??
      raw.isPickupHub ??
      false,
    raw,
  };
}

function normalizeRate(row) {
  const raw = row?.raw && typeof row.raw === "object"
    ? row.raw
    : row || {};

  const numberOrNull = (value) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  return {
    territoryId: clean(
      row?.territoryId ||
        raw.territoryId ||
        raw.toTerritoryId ||
        raw.id,
    ),
    territoryLevel: clean(
      row?.territoryLevel ||
        raw.territoryLevel ||
        raw.level,
    ).toLowerCase(),
    code: clean(
      row?.toWilayaId ||
        raw.code ||
        raw.territoryCode,
    ),
    name: clean(
      row?.toWilayaName ||
        raw.name ||
        raw.territoryName,
    ),
    homeDeliveryPrice: numberOrNull(
      row?.homeDeliveryPrice ??
        raw.homeDeliveryPrice ??
        raw.homePrice ??
        raw.deliveryPrice,
    ),
    stopDeskPrice: numberOrNull(
      row?.stopDeskPrice ??
        raw.stopDeskPrice ??
        raw.pickupPrice ??
        raw.officePrice,
    ),
    returnPrice: numberOrNull(
      row?.returnPrice ??
        raw.returnPrice,
    ),
    raw,
  };
}

async function testConnection() {
  requireConfigured();
  const zr = getAdapter();

  const ok = await zr.testCredentials();

  return {
    ok: Boolean(ok),
    configured: true,
    provider: "ZR Express NEW",
    baseUrl: "https://api.zrexpress.app",
  };
}

async function getTerritories({
  level,
  parentId = null,
  refresh = false,
} = {}) {
  requireConfigured();

  const normalizedLevel = clean(level || "wilaya").toLowerCase();
  const key = `${normalizedLevel}:${clean(parentId)}`;
  const cached = territoriesCache.get(key);

  if (
    !refresh &&
    cached &&
    Date.now() - cached.at < 5 * 60 * 1000
  ) {
    return cached.data;
  }

  const zr = getAdapter();
  const response = await zr.getTerritories({
    level: normalizedLevel,
    ...(parentId ? { parentId } : {}),
    pageSize: normalizedLevel === "wilaya" ? 100 : 2000,
  });

  const rows = asArray(response)
    .map(normalizeTerritory)
    .filter((item) => item.id && item.name)
    .sort((a, b) =>
      a.name.localeCompare(b.name, "fr", {
        sensitivity: "base",
      }),
    );

  territoriesCache.set(key, {
    at: Date.now(),
    data: rows,
  });

  return rows;
}

async function getWilayas(options = {}) {
  return getTerritories({
    level: "wilaya",
    refresh: options.refresh,
  });
}

async function getCommunes(cityId, options = {}) {
  const normalizedCityId = clean(cityId);

  if (!normalizedCityId) {
    throw new HttpError(400, "La wilaya ZR est obligatoire.");
  }

  const communes = await getTerritories({
    level: "commune",
    parentId: normalizedCityId,
    refresh: options.refresh,
  });

  if (!options.stopDeskOnly) {
    return communes;
  }

  /*
   * STOP DESK = bureau physique réel.
   * On filtre donc STRICTEMENT avec la liste des hubs ZR Express.
   * Le flag hasPickupPoint d'un territoire n'est pas suffisant : chez ZR il
   * peut indiquer que le service pickup est disponible dans la zone, sans
   * garantir qu'un bureau physique existe dans cette commune.
   */
  const hubs = await getDestinationHubs({
    cityId: normalizedCityId,
  });

  const hubDistrictIds = new Set(
    hubs
      .map((hub) => clean(hub.districtId))
      .filter(Boolean),
  );

  const normalizeName = (value) =>
    clean(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  // Secours uniquement pour d'anciens payloads ZR dépourvus d'UUID commune.
  // On compare alors le NOM de commune porté par le bureau, jamais le flag
  // hasPickupPoint du territoire.
  const hubCommuneNames = new Set(
    hubs
      .filter((hub) => !clean(hub.districtId))
      .map((hub) => normalizeName(hub.communeName))
      .filter(Boolean),
  );

  return communes.filter((commune) => {
    const communeId = clean(commune.id);

    if (communeId && hubDistrictIds.has(communeId)) {
      return true;
    }

    const communeName = normalizeName(commune.name);
    return Boolean(
      communeName && hubCommuneNames.has(communeName),
    );
  });
}

async function getHubs({ refresh = false } = {}) {
  requireConfigured();

  if (
    !refresh &&
    hubsCache.data.length &&
    Date.now() - hubsCache.at < 5 * 60 * 1000
  ) {
    return hubsCache.data;
  }

  const zr = getAdapter();
  const response = await zr.getOffices({
    pageSize: 1000,
  });

  const rows = asArray(response)
    .map(normalizeHub)
    .filter((hub) => hub.id);

  hubsCache = {
    at: Date.now(),
    data: rows,
  };

  return rows;
}

async function getDestinationHubs({
  cityId,
  districtId,
} = {}) {
  const hubs = await getHubs();
  const city = clean(cityId);
  const district = clean(districtId);

  return hubs.filter((hub) => {
    const hubCity = clean(hub.cityId);
    const hubDistrict = clean(hub.districtId);

    // Si une commune est demandée, le bureau doit appartenir exactement à
    // cette commune. On ne retombe jamais sur "tous les bureaux de la wilaya".
    if (district) {
      if (!hubDistrict || hubDistrict !== district) {
        return false;
      }

      if (city && hubCity && hubCity !== city) {
        return false;
      }

      return true;
    }

    // Pour construire la liste des communes Stop Desk, on récupère seulement
    // les bureaux réellement rattachés à la wilaya choisie.
    if (city) {
      return Boolean(hubCity && hubCity === city);
    }

    return true;
  });
}

async function resolveSourceHub() {
  const configuredId = clean(
    process.env.ZR_EXPRESS_SOURCE_HUB_ID,
  );

  if (configuredId) {
    return {
      id: configuredId,
      name: "Hub configuré",
      source: "env",
    };
  }

  const hubs = await getHubs();

  if (!hubs.length) {
    throw new HttpError(
      503,
      "Aucun hub ZR Express n’est disponible pour votre compte.",
    );
  }

  const search = clean(
    process.env.ZR_EXPRESS_SOURCE_HUB_SEARCH || "Oran",
  ).toLowerCase();

  const match = hubs.find((hub) =>
    JSON.stringify(hub).toLowerCase().includes(search),
  );

  const selected = match || hubs[0];

  return {
    id: selected.id,
    name: selected.name || selected.address || "Hub ZR",
    source: match ? "auto-search" : "auto-first",
  };
}

async function getRates({ refresh = false } = {}) {
  requireConfigured();

  if (
    !refresh &&
    ratesCache.data.length &&
    Date.now() - ratesCache.at < 5 * 60 * 1000
  ) {
    return ratesCache.data;
  }

  const zr = getAdapter();
  const response = await zr.getRates();
  const rows = asArray(response)
    .map(normalizeRate)
    .filter((rate) => rate.territoryId || rate.code);

  ratesCache = {
    at: Date.now(),
    data: rows,
  };

  return rows;
}

async function getDeliveryQuote({
  cityId,
  districtId,
  deliveryType = "HOME",
} = {}) {
  const city = clean(cityId);
  const district = clean(districtId);

  if (!city || !district) {
    throw new HttpError(
      400,
      "Sélectionnez une wilaya et une commune ZR Express.",
    );
  }

  const rates = await getRates();

  let rate = rates.find(
    (item) => item.territoryId === district,
  );

  if (!rate) {
    rate = rates.find(
      (item) => item.territoryId === city,
    );
  }

  if (!rate) {
    throw new HttpError(
      404,
      "Aucun tarif ZR Express n’est disponible pour cette destination.",
    );
  }

  const normalizedType = clean(deliveryType).toUpperCase();
  const fee = normalizedType === "STOP_DESK"
    ? rate.stopDeskPrice
    : rate.homeDeliveryPrice;

  if (fee === null || fee === undefined) {
    throw new HttpError(
      404,
      normalizedType === "STOP_DESK"
        ? "Tarif Stop Desk indisponible pour cette destination."
        : "Tarif livraison à domicile indisponible pour cette destination.",
    );
  }

  return {
    fee: Number(fee),
    deliveryType: normalizedType,
    rate,
  };
}

function splitName(fullName) {
  const parts = clean(fullName).split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return { firstName: "Client", lastName: "BricoMénage" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function normalizeProviderOrder(result) {
  const raw =
    result?.raw && typeof result.raw === "object"
      ? result.raw
      : result || {};

  const trackingNumber = clean(
    result?.trackingNumber ||
      result?.tracking_number ||
      raw.trackingNumber ||
      raw.tracking_number ||
      raw.tracking,
  );

  const parcelId = clean(
    result?.orderId ||
      result?.order_id ||
      raw.id ||
      raw.parcelId ||
      raw.parcel_id,
  );

  const rawStatus = clean(
    result?.rawStatus ||
      result?.raw_status ||
      raw.status?.name ||
      raw.status?.slug ||
      raw.status ||
      raw.state?.name ||
      raw.state?.slug ||
      raw.state,
  );

  let status = clean(result?.status || rawStatus).toLowerCase();

  if (!status) {
    status = "pending";
  }

  let statusLabel = rawStatus || status;

  try {
    if (typeof result?.labelFr === "function") {
      statusLabel = result.labelFr();
    } else if (typeof result?.label === "function") {
      statusLabel = result.label();
    }
  } catch {
    // Le statut brut reste disponible.
  }

  return {
    parcelId,
    trackingNumber,
    status,
    statusLabel,
    rawStatus,
    shippingFee: Number(
      result?.shippingFee ||
        result?.shipping_fee ||
        raw.shippingFee ||
        raw.shipping_fee ||
        0,
    ),
    raw,
  };
}

async function getOrderWithItems(orderId) {
  const [[order]] = await pool.query(
    `SELECT * FROM orders WHERE id=? LIMIT 1`,
    [orderId],
  );

  if (!order) {
    throw new HttpError(404, "Commande introuvable.");
  }

  const [items] = await pool.query(
    `SELECT designation,quantity,item_type,color_name,color_hex FROM order_items WHERE order_id=? ORDER BY id`,
    [orderId],
  );

  return { order, items };
}

async function createParcelForOrder(orderId) {
  requireConfigured();

  const { order, items } = await getOrderWithItems(orderId);

  if (String(order.status).toUpperCase() === "ANNULEE") {
    throw new HttpError(
      409,
      "Une commande annulée ne peut pas être envoyée à ZR Express.",
    );
  }

  if (clean(order.zr_tracking_number)) {
    return syncParcelForOrder(orderId);
  }

  if (!clean(order.zr_city_id) || !clean(order.zr_district_id)) {
    throw new HttpError(
      409,
      "Cette commande ne contient pas les identifiants de destination ZR. Créez une nouvelle commande avec la sélection ZR Express.",
    );
  }

  const sourceHub = await resolveSourceHub();
  const { firstName, lastName } = splitName(order.customer_name);
  const {
    CreateOrderData,
    DELIVERY_TYPE,
  } = loadCourierLibrary();

  const deliveryType = clean(order.zr_delivery_type).toUpperCase() === "STOP_DESK"
    ? (DELIVERY_TYPE?.STOP_DESK || 2)
    : (DELIVERY_TYPE?.HOME || 1);

  const productDescription = items
    .map((item) => {
      const color =
        item.color_name ||
        item.color_hex;

      return `${item.designation}${
        color ? ` (${color})` : ""
      } x${Number(item.quantity || 1)}`;
    })
    .join(" + ")
    .slice(0, 250);

  const notes = [
    `zr_city:${clean(order.zr_city_id)}`,
    `zr_district:${clean(order.zr_district_id)}`,
    `zr_hub:${sourceHub.id}`,
    clean(order.note),
  ]
    .filter(Boolean)
    .join("|");

  const orderData = new CreateOrderData({
    orderId: order.tracking_number,
    firstName,
    lastName,
    phone: clean(order.phone).replace(/\s+/g, ""),
    address: clean(order.address),
    toWilayaId: clean(order.zr_city_id),
    toCommune: clean(order.commune),
    productDescription: productDescription || "Commande BricoMénage",
    price: Number(order.total || 0),
    deliveryType,
    stopDeskId:
      deliveryType === (DELIVERY_TYPE?.STOP_DESK || 2)
        ? clean(order.zr_destination_hub_id) || null
        : null,
    notes,
    weight: Math.max(
      0.1,
      Number(process.env.ZR_EXPRESS_DEFAULT_WEIGHT_KG || 1),
    ),
    quantity: items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    ),
  });

  const zr = getAdapter();
  const result = await zr.createOrder(orderData);
  const normalized = normalizeProviderOrder(result);

  if (!normalized.parcelId && !normalized.trackingNumber) {
    throw new HttpError(
      502,
      "ZR Express a répondu sans identifiant de colis.",
    );
  }

  await pool.query(
    `UPDATE orders
     SET zr_parcel_id=?,
         zr_tracking_number=?,
         zr_status=?,
         zr_status_label=?,
         zr_source_hub_id=?,
         zr_last_payload=?,
         zr_synced_at=NOW()
     WHERE id=?`,
    [
      normalized.parcelId || null,
      normalized.trackingNumber || null,
      normalized.status || null,
      normalized.statusLabel || null,
      sourceHub.id,
      JSON.stringify(normalized.raw || {}),
      orderId,
    ],
  );

  await pool.query(
    `INSERT INTO order_history(order_id,status,label,description)
     VALUES(?,?,?,?)`,
    [
      orderId,
      order.status,
      "Colis créé chez ZR Express",
      normalized.trackingNumber
        ? `Tracking ZR : ${normalized.trackingNumber}`
        : "Colis ZR Express créé.",
    ],
  );

  return {
    ...normalized,
    sourceHub,
  };
}

function mapZrStatusToLocal(status) {
  switch (clean(status).toLowerCase()) {
    case "picked_up":
    case "in_transit":
      return "EXPEDIEE";
    case "out_for_delivery":
      return "EN_LIVRAISON";
    case "delivered":
      return "LIVREE";
    default:
      return null;
  }
}



function normalizeZrHistoryLabel(value) {
  const text = clean(value);
  if (!text) return "";
  const key = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const labels = {
    commande_recue: "Commande reçue",
    orderreceived: "Commande reçue",
    commande_confirmee: "Commande confirmée",
    orderconfirmed: "Commande confirmée",
    pret_a_expedier: "Prêt à expédier",
    readytodispatch: "Prêt à expédier",
    confirme_au_bureau: "Confirmé au bureau",
    confirmedatbranch: "Confirmé au bureau",
    dispatch: "Dispatch dans une autre wilaya",
    dispatched: "Dispatch dans une autre wilaya",
    vers_wilaya: "Dispatch dans une autre wilaya",
    interwilayatransit: "Dispatch dans une autre wilaya",
    en_livraison: "En livraison",
    indelivery: "En livraison",
    sortie_en_livraison: "Sortie en livraison",
    outfordelivery: "Sortie en livraison",
    livre: "Livré",
    delivered: "Livré",
    encaisse: "Encaissé",
    collected: "Encaissé",
    recouvert: "Encaissé",
    disponible_bureau: "Disponible au bureau",
    readyforpickup: "Disponible au bureau",
    retour: "Retour",
    returning: "Retour",
    en_retour: "En retour",
    inreturn: "En retour",
    retourne: "Retourné",
    returned: "Retourné",
    annule: "Annulé",
    cancelled: "Annulé",
  };

  return labels[key] || labels[key.replace(/_/g, "")] || text;
}

function findHistoryArray(raw) {
  if (!raw || typeof raw !== "object") return [];

  const preferredKeys = [
    "history", "histories", "stateHistory", "stateHistories",
    "statusHistory", "statusHistories", "trackingHistory",
    "trackingHistories", "events", "activities", "stateChanges",
    "stateChangeHistory", "workflowHistory", "workflowHistories",
    "transitions", "trackingEvents", "parcelEvents", "shipmentEvents",
  ];

  const arrays = [];
  for (const key of preferredKeys) {
    if (Array.isArray(raw[key])) arrays.push(raw[key]);
  }

  // Some ZR deployments wrap the same arrays under data/result/items.
  for (const key of ["data", "result", "parcel", "shipment"]) {
    const nested = raw[key];
    if (nested && typeof nested === "object") {
      const found = findHistoryArray(nested);
      if (found.length) arrays.push(found);
    }
  }

  return arrays.find((arr) => arr.some((item) => {
    if (!item || typeof item !== "object") return false;
    return Boolean(
      item.state || item.status || item.event || item.eventKey ||
      item.stateName || item.statusName || item.workflowState ||
      item.createdAt || item.timestamp || item.occurredAt || item.date,
    );
  })) || [];
}

function normalizeZrHistory(raw, current) {
  const rows = findHistoryArray(raw);
  if (!rows.length) return [];

  const output = [];
  const seen = new Set();

  const firstValue = (obj, keys) => {
    for (const key of keys) {
      const value = obj?.[key];
      if (value !== undefined && value !== null && clean(value)) return value;
    }
    return null;
  };

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;

    const stateObject = row.state && typeof row.state === "object" ? row.state : null;
    const eventObject = row.event && typeof row.event === "object" ? row.event : null;
    const workflowObject = row.workflowState && typeof row.workflowState === "object" ? row.workflowState : null;

    const rawState = firstValue(row, [
      "stateName", "statusName", "eventName", "name", "label", "title",
      "eventKey", "status", "state", "event",
    ]) || firstValue(stateObject, ["name", "label", "title", "slug", "key"])
      || firstValue(eventObject, ["name", "label", "title", "slug", "key"])
      || firstValue(workflowObject, ["name", "label", "title", "slug", "key"]);

    const label = normalizeZrHistoryLabel(rawState || current?.rawStatus || "Suivi ZR Express");

    const description = firstValue(row, [
      "description", "comment", "note", "observation", "details", "message",
    ]) || firstValue(eventObject, ["description", "comment", "message"]);

    const location = firstValue(row, [
      "hubName", "officeName", "branchName", "location", "hub", "office",
    ]) || firstValue(row.hub, ["name", "label"])
      || firstValue(row.office, ["name", "label"]);

    const date = firstValue(row, [
      "createdAt", "updatedAt", "occurredAt", "timestamp", "date", "eventDate",
      "transitionedAt", "changedAt", "at",
    ]) || firstValue(row.created, ["at", "date"]);

    const finalDescription = [description, location]
      .map(clean)
      .filter(Boolean)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .join(" — ");

    const createdAt = date || current?.updatedAt || current?.createdAt || new Date().toISOString();
    const dedupe = `${label}|${finalDescription}|${createdAt}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    output.push({
      id: clean(row.id || row.eventId || row.stateId) || `${Date.parse(createdAt) || Date.now()}-${output.length}`,
      label,
      description: finalDescription || null,
      createdAt,
      status: clean(row.status || row.statusKey || stateObject?.slug || stateObject?.key) || null,
      raw: row,
    });
  }

  output.sort((a, b) => {
    const ta = Date.parse(a.createdAt);
    const tb = Date.parse(b.createdAt);
    if (Number.isFinite(ta) && Number.isFinite(tb)) return ta - tb;
    return 0;
  });

  return output;
}

async function fetchZrHistoryFallback(zr, normalized) {
  const parcelId = clean(normalized.parcelId || normalized.raw?.id);
  if (!parcelId) return [];

  // ZR's current parcel resource is the primary source. These endpoints are
  // only fallback attempts for account deployments that expose history as a
  // separate resource.
  const candidates = [
    `api/v1/parcels/${encodeURIComponent(parcelId)}/history`,
    `api/v1/parcels/${encodeURIComponent(parcelId)}/state-history`,
    `api/v1/parcels/${encodeURIComponent(parcelId)}/status-history`,
    `api/v1/parcels/${encodeURIComponent(parcelId)}/events`,
  ];

  for (const path of candidates) {
    try {
      const response = await zr.get(path);
      const history = normalizeZrHistory(response, normalized);
      if (history.length) return history;
    } catch (error) {
      const status = Number(error?.statusCode || error?.status || 0);
      // A normal 404 simply means this deployment keeps history inside the
      // parcel resource. Continue to the next compatible endpoint.
      if (status && status !== 404) {
        console.warn(`[ZR Express] Historique ${path}: ${error.message}`);
      }
    }
  }

  return [];
}

async function trackByTrackingNumber(trackingNumber) {
  requireConfigured();

  const tracking = clean(trackingNumber).toUpperCase();

  if (!tracking) {
    throw new HttpError(400, "Le numéro de tracking ZR Express est obligatoire.");
  }

  const zr = getAdapter();

  try {
    const result = await zr.getOrder(tracking);
    const normalized = normalizeProviderOrder(result);

    let history = normalizeZrHistory(normalized.raw, normalized);

    if (!history.length) {
      history = await fetchZrHistoryFallback(zr, normalized);
    }

    // If the provider returns only the current state, keep one event so the
    // customer never sees an empty timeline.
    if (!history.length) {
      history = [{
        id: `current-${Date.now()}`,
        label: normalized.statusLabel || normalized.rawStatus || "Suivi ZR Express",
        description: null,
        createdAt: normalized.updatedAt || normalized.createdAt || new Date().toISOString(),
        status: normalized.status || null,
        raw: null,
      }];
    }

    return {
      trackingNumber: normalized.trackingNumber || tracking,
      status: normalized.status || "unknown",
      statusLabel: normalized.statusLabel || normalized.rawStatus || "Statut indisponible",
      rawStatus: normalized.rawStatus || null,
      recipientName: result?.recipientName || null,
      phone: result?.phone || null,
      address: result?.address || null,
      toWilayaId: result?.toWilayaId || null,
      toCommune: result?.toCommune || null,
      price: Number(result?.price || 0),
      shippingFee: result?.shippingFee == null ? null : Number(result.shippingFee),
      createdAt: result?.createdAt || null,
      updatedAt: result?.updatedAt || null,
      history,
    };
  } catch (error) {
    console.error("[ZR Express] Tracking direct :", error.message);

    const statusCode = Number(
      error?.statusCode ||
      error?.status ||
      error?.response?.status ||
      0,
    );

    if (statusCode === 401 || statusCode === 403) {
      throw new HttpError(
        502,
        "ZR Express a refusé l'authentification. Vérifiez ZR_EXPRESS_TENANT_ID et ZR_EXPRESS_SECRET_KEY.",
        { providerStatus: statusCode },
      );
    }

    if (statusCode >= 500) {
      throw new HttpError(
        502,
        "ZR Express est momentanément indisponible. Réessayez dans quelques instants.",
        { providerStatus: statusCode },
      );
    }

    throw new HttpError(
      404,
      `Le tracking ZR Express « ${tracking} » est introuvable. Vérifiez le numéro saisi.`,
    );
  }
}


async function attachTrackingToOrder(orderId, trackingNumber) {
  requireConfigured();

  const tracking = clean(trackingNumber).toUpperCase();
  if (!tracking) {
    throw new HttpError(400, "Le numéro de tracking ZR Express est obligatoire.");
  }

  const [[order]] = await pool.query(
    `SELECT id,status FROM orders WHERE id=? LIMIT 1`,
    [orderId],
  );

  if (!order) {
    throw new HttpError(404, "Commande introuvable.");
  }

  const zr = getAdapter();
  let result;

  try {
    result = await zr.getOrder(tracking);
  } catch (error) {
    throw new HttpError(
      404,
      `Le tracking ZR Express « ${tracking} » est introuvable. Vérifiez le numéro saisi.`,
    );
  }

  const normalized = normalizeProviderOrder(result);

  if (!normalized.trackingNumber) {
    throw new HttpError(502, "ZR Express n’a pas retourné de numéro de tracking valide.");
  }

  await pool.query(
    `UPDATE orders
     SET zr_parcel_id=?,
         zr_tracking_number=?,
         zr_status=?,
         zr_status_label=?,
         zr_last_payload=?,
         zr_synced_at=NOW()
     WHERE id=?`,
    [
      normalized.parcelId || null,
      normalized.trackingNumber,
      normalized.status || null,
      normalized.statusLabel || null,
      JSON.stringify(normalized.raw || {}),
      orderId,
    ],
  );

  const localStatus = mapZrStatusToLocal(normalized.status);
  if (
    localStatus &&
    String(order.status).toUpperCase() !== "ANNULEE" &&
    String(order.status).toUpperCase() !== localStatus
  ) {
    await pool.query(
      `UPDATE orders SET status=? WHERE id=?`,
      [localStatus, orderId],
    );

    await pool.query(
      `INSERT INTO order_history(order_id,status,label,description)
       VALUES(?,?,?,?)`,
      [
        orderId,
        localStatus,
        `Tracking ZR associé : ${normalized.trackingNumber}`,
        `Statut ZR : ${normalized.statusLabel || normalized.status}`,
      ],
    );
  } else {
    await pool.query(
      `INSERT INTO order_history(order_id,status,label,description)
       VALUES(?,?,?,?)`,
      [
        orderId,
        order.status,
        "Tracking ZR associé",
        `Tracking ZR : ${normalized.trackingNumber} — ${normalized.statusLabel || normalized.status}`,
      ],
    );
  }

  return normalized;
}

async function syncParcelForOrder(orderId) {
  requireConfigured();

  const { order } = await getOrderWithItems(orderId);
  const identifier = clean(
    order.zr_tracking_number || order.zr_parcel_id,
  );

  if (!identifier) {
    throw new HttpError(
      409,
      "Cette commande n’a pas encore de colis ZR Express.",
    );
  }

  const zr = getAdapter();
  const result = await zr.getOrder(identifier);
  const normalized = normalizeProviderOrder(result);

  await pool.query(
    `UPDATE orders
     SET zr_parcel_id=COALESCE(NULLIF(?,''),zr_parcel_id),
         zr_tracking_number=COALESCE(NULLIF(?,''),zr_tracking_number),
         zr_status=?,
         zr_status_label=?,
         zr_last_payload=?,
         zr_synced_at=NOW()
     WHERE id=?`,
    [
      normalized.parcelId,
      normalized.trackingNumber,
      normalized.status || null,
      normalized.statusLabel || null,
      JSON.stringify(normalized.raw || {}),
      orderId,
    ],
  );

  const localStatus = mapZrStatusToLocal(normalized.status);

  if (
    localStatus &&
    String(order.status).toUpperCase() !== "ANNULEE" &&
    String(order.status).toUpperCase() !== localStatus
  ) {
    await pool.query(
      `UPDATE orders SET status=? WHERE id=?`,
      [localStatus, orderId],
    );

    await pool.query(
      `INSERT INTO order_history(order_id,status,label,description)
       VALUES(?,?,?,?)`,
      [
        orderId,
        localStatus,
        `Mise à jour ZR : ${normalized.statusLabel || normalized.status}`,
        normalized.trackingNumber
          ? `Tracking ZR : ${normalized.trackingNumber}`
          : null,
      ],
    );
  }

  return normalized;
}

async function cancelParcelForOrder(orderId) {
  requireConfigured();

  const { order } = await getOrderWithItems(orderId);
  const identifier = clean(
    order.zr_tracking_number || order.zr_parcel_id,
  );

  if (!identifier) {
    return {
      cancelled: false,
      reason: "NO_ZR_PARCEL",
    };
  }

  const zr = getAdapter();
  const cancelled = await zr.cancelOrder(identifier);

  await pool.query(
    `UPDATE orders
     SET zr_status='cancelled',
         zr_status_label='Annulé chez ZR Express',
         zr_synced_at=NOW()
     WHERE id=?`,
    [orderId],
  );

  await pool.query(
    `INSERT INTO order_history(order_id,status,label,description)
     VALUES(?,?,?,?)`,
    [
      orderId,
      order.status,
      "Colis annulé chez ZR Express",
      clean(order.zr_tracking_number) || null,
    ],
  );

  return {
    cancelled: Boolean(cancelled),
  };
}

async function getLabelForOrder(orderId) {
  requireConfigured();

  const { order } = await getOrderWithItems(orderId);
  const tracking = clean(order.zr_tracking_number);

  if (!tracking) {
    throw new HttpError(
      409,
      "Aucun numéro de tracking ZR Express pour cette commande.",
    );
  }

  const zr = getAdapter();
  const label = await zr.getLabel(tracking);

  return {
    trackingNumber: tracking,
    url: clean(label?.url),
    type: label?.type || null,
    raw: label,
  };
}

async function configInfo({ test = false } = {}) {
  const info = {
    enabled: enabled(),
    configured: configured(),
    baseUrl: "https://api.zrexpress.app",
    tenantId: configured()
      ? `${String(process.env.ZR_EXPRESS_TENANT_ID).slice(0, 8)}…`
      : null,
    sourceHub: null,
    connection: null,
  };

  if (!configured()) {
    return info;
  }

  try {
    info.sourceHub = await resolveSourceHub();
  } catch (error) {
    info.sourceHub = {
      error: error.message,
    };
  }

  if (test) {
    try {
      info.connection = await testConnection();
    } catch (error) {
      info.connection = {
        ok: false,
        error: error.message,
      };
    }
  }

  return info;
}

module.exports = {
  enabled,
  configured,
  testConnection,
  getWilayas,
  getCommunes,
  getHubs,
  getDestinationHubs,
  getDeliveryQuote,
  resolveSourceHub,
  createParcelForOrder,
  syncParcelForOrder,
  trackByTrackingNumber,
  attachTrackingToOrder,
  cancelParcelForOrder,
  getLabelForOrder,
  configInfo,
};

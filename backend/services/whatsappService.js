function clean(value) {
  return String(value ?? "").trim();
}

function isEnabled() {
  return ["1", "true", "yes", "on"].includes(
    clean(process.env.WHATSAPP_ENABLED).toLowerCase(),
  );
}

function formatDa(value) {
  return new Intl.NumberFormat("fr-DZ").format(
    Number(value || 0),
  );
}

function itemsText(items = []) {
  return items
    .map((item) =>
      `• ${item.designation} × ${Number(item.quantity || 0)}`,
    )
    .join("\n");
}

function buildText(order) {
  const destination = [order.commune, order.wilaya]
    .filter(Boolean)
    .join(", ");

  return [
    "🛒 Nouvelle commande BricoMénage",
    "",
    `N° suivi : ${order.tracking_number}`,
    `Client : ${order.customer_name}`,
    `Téléphone : ${order.phone}`,
    `Destination : ${destination || "-"}`,
    `Adresse : ${order.address || "-"}`,
    `Total : ${formatDa(order.total)} DA`,
    "",
    "Produits :",
    itemsText(order.items) || "-",
    order.note ? `\nNote : ${order.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendWhatsAppPayload(payload) {
  if (!isEnabled()) {
    return {
      skipped: true,
      reason: "WHATSAPP_ENABLED=false",
    };
  }

  const accessToken = clean(
    process.env.WHATSAPP_ACCESS_TOKEN,
  );
  const phoneNumberId = clean(
    process.env.WHATSAPP_PHONE_NUMBER_ID,
  );
  const graphVersion = clean(
    process.env.WHATSAPP_GRAPH_VERSION,
  );

  if (!accessToken || !phoneNumberId || !graphVersion) {
    throw new Error(
      "Configuration WhatsApp incomplète : WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID et WHATSAPP_GRAPH_VERSION sont obligatoires.",
    );
  }

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      `WhatsApp API HTTP ${response.status}`;

    const error = new Error(message);
    error.details = data;
    throw error;
  }

  return data;
}

async function sendNewOrderToAdmin(order) {
  if (!isEnabled()) {
    return {
      skipped: true,
      reason: "WHATSAPP_ENABLED=false",
    };
  }

  const to = clean(
    process.env.WHATSAPP_ADMIN_NUMBER,
  ).replace(/[^0-9]/g, "");

  if (!to) {
    throw new Error(
      "WHATSAPP_ADMIN_NUMBER est obligatoire lorsque WhatsApp est activé.",
    );
  }

  const templateName = clean(
    process.env.WHATSAPP_TEMPLATE_NAME,
  );

  /*
   * Recommandé en production : template Meta approuvé.
   * Variables attendues dans cet exemple :
   * 1 suivi, 2 client, 3 téléphone, 4 destination,
   * 5 total, 6 résumé des produits.
   */
  if (templateName) {
    const destination = [order.commune, order.wilaya]
      .filter(Boolean)
      .join(", ");

    return sendWhatsAppPayload({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code:
            clean(process.env.WHATSAPP_TEMPLATE_LANG) ||
            "fr",
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: clean(order.tracking_number) },
              { type: "text", text: clean(order.customer_name) },
              { type: "text", text: clean(order.phone) },
              { type: "text", text: destination || "-" },
              { type: "text", text: `${formatDa(order.total)} DA` },
              { type: "text", text: itemsText(order.items).slice(0, 900) || "-" },
            ],
          },
        ],
      },
    });
  }

  /*
   * Mode texte utile pour les tests ou lorsqu'une fenêtre de
   * conversation WhatsApp autorise déjà les messages libres.
   */
  return sendWhatsAppPayload({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: buildText(order),
    },
  });
}

module.exports = {
  sendNewOrderToAdmin,
};

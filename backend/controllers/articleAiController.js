const HttpError = require("../utils/httpError");

/* ========================================================================== */
/*  Configuration                                                             */
/* ========================================================================== */

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const TEXT_MODEL =
  process.env.CLOUDFLARE_TEXT_MODEL ||
  "@cf/meta/llama-3.1-8b-instruct-fp8";

const IMAGE_EDIT_MODEL =
  process.env.CLOUDFLARE_IMAGE_EDIT_MODEL ||
  "black-forest-labs/flux-1-kontext-pro";

const GEMINI_TEXT_MODEL =
  process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";

const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/* ========================================================================== */
/*  Helpers génériques                                                        */
/* ========================================================================== */

function safeText(value, max = 180) {
  return String(value ?? "")
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .slice(0, max);
}

function getImageProvider() {
  const raw = String(process.env.AI_IMAGE_PROVIDER || "cloudflare")
    .trim()
    .toLowerCase();
  return raw === "gemini" ? "gemini" : "cloudflare";
}

/* ========================================================================== */
/*  Cloudflare Workers AI                                                     */
/* ========================================================================== */

function getCloudflareConfig() {
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN || "").trim();

  if (!accountId || !apiToken) {
    throw new HttpError(
      503,
      "La génération IA Cloudflare n’est pas configurée. Ajoutez CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_API_TOKEN au fichier .env du backend.",
    );
  }

  return { accountId, apiToken };
}

function extractCloudflareError(data) {
  const entries = Array.isArray(data?.errors) ? data.errors : [];
  return entries
    .map((item) => `${item?.code ?? ""} ${item?.message ?? ""}`.trim())
    .filter(Boolean)
    .join(" | ");
}

async function cloudflareRequest(model, input) {
  const { accountId, apiToken } = getCloudflareConfig();

  const isWorkersAiModel = model.startsWith("@cf/");
  const url = isWorkersAiModel
    ? `${CLOUDFLARE_API_BASE}/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`
    : `${CLOUDFLARE_API_BASE}/accounts/${encodeURIComponent(accountId)}/ai/run`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(isWorkersAiModel ? input : { model, input }),
      signal: AbortSignal.timeout(120000),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new HttpError(
        504,
        "Cloudflare AI met trop de temps à répondre. Réessayez.",
      );
    }
    console.error("[Cloudflare Workers AI] Erreur réseau :", error?.message);
    throw new HttpError(502, "Impossible de joindre Cloudflare Workers AI.");
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.startsWith("image/")) {
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!response.ok) {
      throw new HttpError(
        response.status || 502,
        "Cloudflare AI n’a pas pu retoucher l’image.",
      );
    }
    return {
      image: bytes.toString("base64"),
      mimeType: contentType.split(";")[0],
    };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new HttpError(
      502,
      "Réponse illisible reçue de Cloudflare Workers AI.",
    );
  }

  if (!response.ok || data?.success === false || data?.errors?.length) {
    const detail = extractCloudflareError(data);
    const lowered = detail.toLowerCase();

    if (
      lowered.includes("3036") ||
      lowered.includes("10,000 neurons") ||
      lowered.includes("daily free allocation")
    ) {
      throw new HttpError(
        429,
        "Le quota quotidien Cloudflare Workers AI est atteint.",
      );
    }

    if (
      lowered.includes("2021") ||
      lowered.includes("insufficient balance") ||
      lowered.includes("byok")
    ) {
      throw new HttpError(
        402,
        "Crédits Cloudflare AI épuisés pour ce modèle. Ajoutez des crédits, activez BYOK, changez CLOUDFLARE_IMAGE_EDIT_MODEL pour un modèle @cf gratuit, ou basculez AI_IMAGE_PROVIDER sur gemini.",
      );
    }

    if (response.status === 429) {
      throw new HttpError(
        429,
        "La limite de requêtes Cloudflare AI est atteinte. Réessayez plus tard.",
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new HttpError(
        503,
        "Cloudflare a refusé l’accès. Vérifiez l’Account ID, le jeton et les permissions Workers AI.",
      );
    }

    console.error(
      "[Cloudflare Workers AI] Réponse API :",
      detail || response.statusText,
    );

    throw new HttpError(
      502,
      `Échec du modèle Cloudflare AI${
        detail ? ` : ${detail}` : ". Vérifiez le modèle configuré."
      }`,
    );
  }

  return data?.result ?? data;
}

/* ========================================================================== */
/*  Google Gemini                                                             */
/* ========================================================================== */

function getGeminiConfig() {
  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();

  if (!apiKey) {
    throw new HttpError(
      503,
      "Gemini n’est pas configuré. Ajoutez GEMINI_API_KEY au fichier .env du backend.",
    );
  }

  return { apiKey };
}

function extractGeminiError(data) {
  return (
    data?.error?.message ||
    data?.message ||
    ""
  );
}

/**
 * Appel générique à Gemini generateContent.
 * @param {string} model    ex: "gemini-2.5-flash" ou "gemini-2.5-flash-image"
 * @param {Array}  parts    tableau de parts Gemini { text } ou { inline_data }
 * @param {Object} config   generationConfig optionnel
 */
async function geminiRequest(model, parts, generationConfig = {}) {
  const { apiKey } = getGeminiConfig();
  const url = `${GEMINI_API_BASE}/${model}:generateContent`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig,
      }),
      signal: AbortSignal.timeout(120000),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new HttpError(
        504,
        "Gemini met trop de temps à répondre. Réessayez.",
      );
    }
    console.error("[Gemini] Erreur réseau :", error?.message);
    throw new HttpError(502, "Impossible de joindre Gemini.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new HttpError(502, "Réponse illisible reçue de Gemini.");
  }

  if (!response.ok || data?.error) {
    const detail = extractGeminiError(data);
    const lowered = detail.toLowerCase();

    if (
      response.status === 429 ||
      lowered.includes("quota") ||
      lowered.includes("rate limit")
    ) {
      throw new HttpError(
        429,
        "Quota Gemini atteint. Vérifiez votre plan ou réessayez plus tard.",
      );
    }

    if (
      response.status === 400 &&
      (lowered.includes("billing") ||
        lowered.includes("free tier") ||
        lowered.includes("paid"))
    ) {
      throw new HttpError(
        402,
        "La génération d’images Gemini nécessite un compte payant. Activez la facturation dans Google AI Studio.",
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new HttpError(
        503,
        "Gemini a refusé l’accès. Vérifiez GEMINI_API_KEY.",
      );
    }

    console.error("[Gemini] Réponse API :", detail || response.statusText);

    throw new HttpError(
      502,
      `Échec de Gemini${detail ? ` : ${detail}` : "."}`,
    );
  }

  return data;
}

async function geminiGenerateText({ systemPrompt, userPrompt, maxTokens = 400 }) {
  const parts = [
    { text: systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt },
  ];

  const data = await geminiRequest(GEMINI_TEXT_MODEL, parts, {
    maxOutputTokens: maxTokens,
    temperature: 0.7,
  });

  const candidates = data?.candidates || [];
  const text = candidates
    .flatMap((c) => c?.content?.parts || [])
    .map((p) => p?.text || "")
    .filter(Boolean)
    .join(" ")
    .trim();

  return text;
}

async function geminiEditImage({ imageBuffer, mimeType, prompt }) {
  const parts = [
    { text: prompt },
    {
      inline_data: {
        mime_type: mimeType || "image/jpeg",
        data: imageBuffer.toString("base64"),
      },
    },
  ];

  const data = await geminiRequest(GEMINI_IMAGE_MODEL, parts, {
    responseModalities: ["IMAGE"],
  });

  const candidates = data?.candidates || [];
  const imagePart = candidates
    .flatMap((c) => c?.content?.parts || [])
    .find((p) => p?.inlineData || p?.inline_data);

  if (!imagePart) {
    throw new HttpError(502, "Gemini n’a pas renvoyé d’image.");
  }

  const inline = imagePart.inlineData || imagePart.inline_data;
  const mime = inline.mimeType || inline.mime_type || "image/png";
  const base64 = inline.data;

  if (!base64) {
    throw new HttpError(502, "Image Gemini vide.");
  }

  return { mimeType: mime, base64 };
}

/* ========================================================================== */
/*  Prompt de retouche produit                                                */
/* ========================================================================== */

function buildRetouchPrompt({ designation, brand, reference, index }) {
  const identity = [
    `Product: ${designation}.`,
    brand
      ? `Known brand (preserve only if it is visible in the source): ${brand}.`
      : "Do not invent or add a brand or logo.",
    reference ? `Reference context: ${reference}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const variation = [
    "Keep the exact same physical product, model, silhouette, proportions, parts, color, packaging, labels and visible details as in the input photo.",
    "Use a clean pure-white seamless studio background, premium softbox lighting, balanced exposure, accurate natural colors, crisp focus and a subtle realistic contact shadow.",
    "Keep the same product and camera angle as the source photo. Improve only photographic quality and the background; do not add accessories, remove components, rewrite labels or create new text.",
  ];

  const framing = [
    "Center the product with comfortable white margins; premium main catalog image.",
    "Use balanced studio lighting and clear detail while keeping the original framing and perspective.",
    "Use refined soft shadows and even white background illumination; preserve the original framing and product identity.",
  ][index % 3];

  return `${identity} ${variation.join(
    " ",
  )} ${framing} Square 1:1 e-commerce product photography. No collage, watermark, border, price tag, promotional badge or added text.`.slice(
    0,
    2048,
  );
}

/* ========================================================================== */
/*  Validation des fichiers                                                   */
/* ========================================================================== */

function getFiles(req) {
  const files = Array.isArray(req.files) ? req.files : [];

  if (files.length === 0) {
    throw new HttpError(
      400,
      "Importez au moins une photo du produit avant de lancer la retouche IA.",
    );
  }

  if (files.length > MAX_IMAGES) {
    throw new HttpError(
      400,
      `Vous pouvez envoyer au maximum ${MAX_IMAGES} photos source.`,
    );
  }

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new HttpError(
        415,
        "Format non pris en charge. Utilisez JPG, PNG ou WEBP.",
      );
    }

    if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new HttpError(400, "Une photo reçue est vide ou illisible.");
    }

    if (
      file.size > MAX_IMAGE_BYTES ||
      file.buffer.length > MAX_IMAGE_BYTES
    ) {
      throw new HttpError(413, "Chaque photo doit faire 8 Mo maximum.");
    }
  }

  return files;
}

/* ========================================================================== */
/*  Édition d'une image (Cloudflare OU Gemini selon .env)                     */
/* ========================================================================== */

async function editOneImageCloudflare(file, prompt, index) {
  const result = await cloudflareRequest(IMAGE_EDIT_MODEL, {
    prompt,
    input_image: file.buffer.toString("base64"),
    aspect_ratio: "1:1",
    output_format: "jpeg",
  });

  const imageValue =
    result?.image || result?.result?.image || result?.b64_json;

  if (typeof imageValue !== "string" || !imageValue) {
    throw new HttpError(
      502,
      `Cloudflare AI n’a pas renvoyé l’image retouchée ${index + 1}.`,
    );
  }

  if (/^https?:\/\//i.test(imageValue)) {
    let response;
    try {
      response = await fetch(imageValue, {
        signal: AbortSignal.timeout(60000),
      });
    } catch {
      throw new HttpError(
        502,
        "Impossible de récupérer l’image retouchée depuis Cloudflare.",
      );
    }

    if (!response.ok) {
      throw new HttpError(
        502,
        "Le téléchargement du résultat IA a échoué.",
      );
    }

    const mimeType = (
      response.headers.get("content-type") || "image/jpeg"
    ).split(";")[0];

    if (!mimeType.startsWith("image/")) {
      throw new HttpError(
        502,
        "Cloudflare a renvoyé un résultat qui n’est pas une image.",
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      name: `visuel-ia-${index + 1}.jpg`,
      mimeType,
      base64: buffer.toString("base64"),
    };
  }

  const base64 = imageValue.replace(/^data:image\/[^;]+;base64,/i, "");

  return {
    name: `visuel-ia-${index + 1}.jpg`,
    mimeType: "image/jpeg",
    base64,
  };
}

async function editOneImageGemini(file, prompt, index) {
  const { mimeType, base64 } = await geminiEditImage({
    imageBuffer: file.buffer,
    mimeType: file.mimetype,
    prompt,
  });

  const extension = mimeType.includes("png")
    ? "png"
    : mimeType.includes("webp")
      ? "webp"
      : "jpg";

  return {
    name: `visuel-ia-${index + 1}.${extension}`,
    mimeType,
    base64,
  };
}

async function editOneImage(file, prompt, index) {
  const provider = getImageProvider();

  if (provider === "gemini") {
    return editOneImageGemini(file, prompt, index);
  }

  return editOneImageCloudflare(file, prompt, index);
}

/* ========================================================================== */
/*  Génération de texte (Cloudflare OU Gemini selon .env)                     */
/* ========================================================================== */

async function generateDescriptionCloudflare({ designation, brand, reference }) {
  const textResult = await cloudflareRequest(TEXT_MODEL, {
    messages: [
      {
        role: "system",
        content:
          "Tu es un rédacteur e-commerce. Rédige une description produit courte (3 à 5 phrases), en français, factuelle, sans inventer de marque ni de prix. N’ajoute aucun slogan marketing excessif.",
      },
      {
        role: "user",
        content: `Désignation: ${designation}. Marque: ${
          brand || "non précisée"
        }. Référence: ${reference || "non précisée"}.`,
      },
    ],
    max_tokens: 400,
  });

  return (
    textResult?.response ||
    textResult?.result?.response ||
    textResult?.choices?.[0]?.message?.content ||
    ""
  );
}

async function generateDescriptionGemini({ designation, brand, reference }) {
  return geminiGenerateText({
    systemPrompt:
      "Tu es un rédacteur e-commerce. Rédige une description produit courte (3 à 5 phrases), en français, factuelle, sans inventer de marque ni de prix.",
    userPrompt: `Désignation: ${designation}. Marque: ${
      brand || "non précisée"
    }. Référence: ${reference || "non précisée"}.`,
    maxTokens: 400,
  });
}

async function generateDescription({ designation, brand, reference }) {
  const provider = getImageProvider();

  if (provider === "gemini") {
    return generateDescriptionGemini({ designation, brand, reference });
  }

  return generateDescriptionCloudflare({ designation, brand, reference });
}

/* ========================================================================== */
/*  Contrôleur principal                                                      */
/* ========================================================================== */

async function generateArticleContent(req, res) {
  console.log("========== DEBUG IA ==========");
  console.log("Content-Type :", req.headers["content-type"]);
  console.log("Body reçu :", req.body);
  console.log("Designation :", req.body?.designation);
  console.log("Nombre de fichiers :", req.files?.length || 0);
  console.log("Fournisseur image :", getImageProvider());
  console.log("==============================");

  const designation = safeText(
    req.body?.designation ??
      req.body?.designationValue ??
      req.body?.nom ??
      "",
    180,
  );

  if (!designation) {
    return res.status(400).json({
      success: false,
      message: "Désignation absente du formulaire.",
      receivedFields: Object.keys(req.body || {}),
      contentType: req.headers["content-type"] || null,
      filesReceived: req.files?.length || 0,
    });
  }

  try {
    const files = getFiles(req);

    const brand = safeText(req.body?.brand, 120);
    const reference = safeText(req.body?.reference, 120);

    const requestedCount = Number(req.body?.count || files.length || 1);
    const count = Math.max(1, Math.min(files.length, requestedCount, 3));

    /* -------- 1) Génération du texte (best-effort, non bloquant) -------- */

    let description = "";

    try {
      description = await generateDescription({
        designation,
        brand,
        reference,
      });
      description = String(description).trim().slice(0, 2000);
    } catch (textError) {
      console.error("[AI] Génération texte échouée :", textError?.message);
    }

    /* -------- 2) Retouche des images -------- */

    const images = [];
    const errors = [];

    for (let i = 0; i < count; i += 1) {
      const prompt = buildRetouchPrompt({
        designation,
        brand,
        reference,
        index: i,
      });

      try {
        const edited = await editOneImage(files[i], prompt, i);
        images.push(edited);
      } catch (imgError) {
        console.error(
          `[AI] Retouche image ${i + 1} échouée :`,
          imgError?.message,
        );
        errors.push({
          index: i,
          message: imgError?.message || "Erreur inconnue",
        });
      }
    }

    if (images.length === 0) {
      return res.status(502).json({
        success: false,
        message:
          "Aucune image n’a pu être retouchée. Vérifiez la configuration du fournisseur IA (Cloudflare ou Gemini).",
        provider: getImageProvider(),
        errors,
      });
    }

    return res.json({
      success: true,
      provider: getImageProvider(),
      description,
      images,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }

    console.error("[AI] Erreur inattendue :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la génération IA.",
    });
  }
}

module.exports = { generateArticleContent };
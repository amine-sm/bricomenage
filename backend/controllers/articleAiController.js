
const HttpError = require("../utils/httpError");

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

const TEXT_MODEL =
  process.env.CLOUDFLARE_TEXT_MODEL ||
  "@cf/meta/llama-3.1-8b-instruct-fp8";

const IMAGE_MODEL =
  process.env.CLOUDFLARE_IMAGE_MODEL ||
  "@cf/black-forest-labs/flux-1-schnell";

function safeText(value, max = 180) {
  return String(value ?? "").trim().slice(0, max);
}

function getConfig() {
  const accountId = String(
    process.env.CLOUDFLARE_ACCOUNT_ID || ""
  ).trim();

  const apiToken = String(
    process.env.CLOUDFLARE_API_TOKEN || ""
  ).trim();

  if (!accountId || !apiToken) {
    throw new HttpError(
      503,
      "La génération IA n’est pas configurée. Ajoutez " +
        "CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_API_TOKEN " +
        "au fichier .env du backend."
    );
  }

  return { accountId, apiToken };
}

function extractCloudflareError(data) {
  const entries = Array.isArray(data?.errors)
    ? data.errors
    : [];

  return entries
    .map(
      (item) =>
        `${item?.code ?? ""} ${item?.message ?? ""}`.trim()
    )
    .filter(Boolean)
    .join(" | ");
}

async function runCloudflareModel(model, input) {
  const { accountId, apiToken } = getConfig();

  const url =
    `${CLOUDFLARE_API_BASE}/accounts/` +
    `${encodeURIComponent(accountId)}/ai/run/${model}`;

  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(120000),
    });
  } catch (error) {
    if (
      error?.name === "TimeoutError" ||
      error?.name === "AbortError"
    ) {
      throw new HttpError(
        504,
        "Cloudflare AI met trop de temps à répondre. Réessayez."
      );
    }

    console.error(
      "[Cloudflare Workers AI] Erreur réseau :",
      error?.message
    );

    throw new HttpError(
      502,
      "Impossible de joindre Cloudflare Workers AI. " +
        "Vérifiez votre connexion réseau."
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  // Prend aussi en charge une réponse image binaire.
  if (contentType.startsWith("image/")) {
    const arrayBuffer = await response.arrayBuffer();

    if (!response.ok) {
      throw new HttpError(
        response.status || 502,
        "Cloudflare AI n’a pas pu générer l’image."
      );
    }

    return {
      image: Buffer.from(arrayBuffer).toString("base64"),
    };
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new HttpError(
      502,
      "Réponse illisible reçue de Cloudflare Workers AI."
    );
  }

  if (
    !response.ok ||
    data?.success === false ||
    data?.errors?.length
  ) {
    const detail = extractCloudflareError(data);
    const lowered = detail.toLowerCase();

    const dailyQuotaExhausted =
      lowered.includes("3036") ||
      lowered.includes("10,000 neurons") ||
      lowered.includes("daily free allocation");

    if (dailyQuotaExhausted) {
      throw new HttpError(
        429,
        "Le quota gratuit quotidien de Cloudflare Workers AI " +
          "est atteint. Attendez sa réinitialisation ou " +
          "consultez le tableau de bord Cloudflare."
      );
    }

    if (response.status === 429) {
      throw new HttpError(
        429,
        "La limite de requêtes Cloudflare Workers AI est " +
          "atteinte. Réessayez plus tard."
      );
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new HttpError(
        503,
        "Cloudflare a refusé l’accès. Vérifiez " +
          "CLOUDFLARE_ACCOUNT_ID, le jeton API et ses " +
          "permissions Workers AI."
      );
    }

    console.error(
      "[Cloudflare Workers AI] Réponse API :",
      detail || response.statusText
    );

    throw new HttpError(
      502,
      `Échec du modèle Cloudflare AI${
        detail
          ? ` : ${detail}`
          : ". Vérifiez le modèle configuré."
      }`
    );
  }

  return data?.result ?? data;
}

async function generateArticleContent(req, res) {
  // Vérifier la configuration avant tout appel IA.
  getConfig();

  const designation = safeText(
    req.body?.designation,
    180
  );

  const brand = safeText(req.body?.brand, 120);
  const reference = safeText(req.body?.reference, 100);

  if (!designation) {
    throw new HttpError(
      400,
      "La désignation du produit est obligatoire."
    );
  }

  const textInput = [
    `Désignation : ${designation}`,
    brand ? `Marque : ${brand}` : "",
    reference ? `Référence : ${reference}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt =
    "Tu es un rédacteur e-commerce francophone pour BricoMénage. " +
    "Rédige une description commerciale claire et naturelle " +
    "de 100 à 160 mots. Ajoute 3 à 5 caractéristiques seulement " +
    "si elles sont déductibles de façon fiable. N’invente aucun " +
    "prix, chiffre technique, certification, garantie, " +
    "compatibilité, matière, dimension ou contenu de boîte " +
    "non fourni. Si une caractéristique est inconnue, " +
    "ne l’invente pas. Retourne uniquement le texte final, " +
    "sans titre Markdown.";

  const imagePrompts = [
    "Vue principale : un seul produit centré, photographie " +
      "e-commerce réaliste, fond blanc propre, éclairage studio " +
      "doux, sans texte ajouté, sans logo inventé et sans watermark.",

    "Vue rapprochée : produit présenté en angle trois-quarts, " +
      "cadrage rapproché, détails visuels soignés mais génériques, " +
      "fond blanc, éclairage studio, sans texte ni watermark.",

    "Mise en situation : produit placé dans un environnement " +
      "domestique ou atelier adapté à sa catégorie, photographie " +
      "commerciale réaliste, sans texte ajouté, sans logo inventé " +
      "ni watermark.",
  ];

  // IMPORTANT :
  // Ne pas envoyer seed au modèle d'image utilisé ici.
  // Cette propriété provoquait l'erreur Cloudflare 5006.

  const [textResult, ...imageResults] = await Promise.all([
    // Génération de la description en français.
    runCloudflareModel(TEXT_MODEL, {
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: textInput,
        },
      ],
      max_tokens: 450,
      temperature: 0.35,
    }),

    // Génération des trois visuels.
    ...imagePrompts.map((viewPrompt, index) => {
      const prompt =
        "Crée une illustration originale pour un catalogue " +
        `e-commerce BricoMénage. Produit demandé : ${designation}. ` +
        (brand ? `Marque indiquée : ${brand}. ` : "") +
        (reference
          ? `Référence indicative : ${reference}. `
          : "") +
        `${viewPrompt} ` +
        "N’affirme pas visuellement une référence précise si " +
        "elle n’est pas connue. Image carrée, un produit " +
        `principal clairement visible. Image ${index + 1} sur 3.`;

      return runCloudflareModel(IMAGE_MODEL, {
        prompt: prompt.slice(0, 2048),
        steps: 4,
      });
    }),
  ]);

  const description = String(
    textResult?.response ||
      textResult?.output_text ||
      ""
  ).trim();

  if (!description) {
    throw new HttpError(
      502,
      "Cloudflare AI n’a pas renvoyé de description. Réessayez."
    );
  }

  const images = imageResults.map((result, index) => {
    const base64 =
      result?.image ||
      result?.b64_json ||
      result?.result?.image;

    if (!base64 || typeof base64 !== "string") {
      throw new HttpError(
        502,
        `Cloudflare AI n’a pas renvoyé le visuel ${
          index + 1
        }. Vérifiez le modèle d’image et son accès.`
      );
    }

    return {
      name: `visuel-ia-${index + 1}.jpg`,
      mimeType: "image/jpeg",
      base64,
    };
  });

  // Conserve le format JSON attendu par le frontend.
  return res.status(200).json({
    success: true,
    description,
    images,
  });
}

module.exports = {
  generateArticleContent,
};

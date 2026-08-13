export const SITE_URL = "https://bricomenage.com";
export const SITE_NAME = "BricoMénage";

export const SITE_DESCRIPTION =
  "BricoMénage, votre boutique de bricolage, outillage, maison et jardin en Algérie : peinture, plomberie, électricité, mobilier et équipements pour tous vos projets.";

export const SEO_CATEGORIES = [
  "Outillage",
  "Jardin",
  "Mobilier",
  "Peinture",
  "Électricité",
  "Plomberie",
] as const;

export function absoluteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function productUrl(slug: string) {
  return `${SITE_URL}/article/?slug=${encodeURIComponent(slug)}`;
}

export function packUrl(slug: string) {
  return `${SITE_URL}/pack/?slug=${encodeURIComponent(slug)}`;
}

export function categoryUrl(category: string) {
  return `${SITE_URL}/articles/?categorie=${encodeURIComponent(category)}`;
}

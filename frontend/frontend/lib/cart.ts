export type CartItemType =
  | "ARTICLE"
  | "PACK";

export type CartItemColor = {
  name?: string | null;
  hex: string;
  rgb?: string | null;
};

export type CartPackComponent = {
  article_id: number;
  slug?: string;
  designation: string;
  image?: string;
  quantity_per_pack: number;
};

export type CartItem = {
  id: number;
  item_type: CartItemType;
  slug?: string;
  designation: string;
  price: number;
  quantity: number;
  image?: string;

  /*
   * Couleur choisie pour un ARTICLE.
   * Elle est figée dans le panier puis envoyée avec la commande.
   * Un même article rouge et bleu constitue donc deux lignes distinctes.
   */
  selected_color?: CartItemColor;

  /*
   * Pour un PACK, on mémorise
   * également ses produits afin
   * de pouvoir les afficher dans
   * le panier sans les confondre
   * avec des articles séparés.
   */
  pack_components?:
    CartPackComponent[];
};

const KEY =
  "bricomenage_cart";

function normalizeHex(
  value: unknown,
) {
  const raw = String(
    value || "",
  )
    .trim()
    .toUpperCase();

  if (!raw) return "";

  const withHash =
    raw.startsWith("#")
      ? raw
      : `#${raw}`;

  return /^#[0-9A-F]{6}$/.test(
    withHash,
  )
    ? withHash
    : "";
}

function normalizeSelectedColor(
  value: unknown,
): CartItemColor | undefined {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return undefined;
  }

  const color = value as {
    name?: unknown;
    hex?: unknown;
    rgb?: unknown;
  };

  const hex = normalizeHex(
    color.hex,
  );

  if (!hex) {
    return undefined;
  }

  return {
    name:
      color.name === null ||
      color.name === undefined
        ? null
        : String(
            color.name,
          ).trim() || null,
    hex,
    rgb:
      color.rgb === null ||
      color.rgb === undefined
        ? null
        : String(
            color.rgb,
          ).trim() || null,
  };
}

export function cartItemKey(
  item: Pick<
    CartItem,
    | "id"
    | "item_type"
    | "selected_color"
  >,
) {
  return [
    item.item_type,
    Number(item.id),
    normalizeHex(
      item.selected_color?.hex,
    ) || "NO_COLOR",
  ].join(":");
}

export function getCart():
  CartItem[] {
  if (
    typeof window ===
    "undefined"
  ) {
    return [];
  }

  try {
    const value =
      JSON.parse(
        localStorage.getItem(
          KEY,
        ) || "[]",
      );

    if (!Array.isArray(value)) {
      return [];
    }

    return value.map(
      (item) => ({
        ...item,
        item_type:
          item.item_type ===
          "PACK"
            ? "PACK"
            : "ARTICLE",
        selected_color:
          normalizeSelectedColor(
            item.selected_color ||
              item.color,
          ),
      }),
    );
  } catch {
    return [];
  }
}

export function saveCart(
  items: CartItem[],
) {
  localStorage.setItem(
    KEY,
    JSON.stringify(items),
  );

  window.dispatchEvent(
    new Event("cart-change"),
  );
}

export function addToCart(
  item:
    Omit<
      CartItem,
      "quantity"
    > & {
      quantity?: number;
    },
) {
  const items = getCart();

  const normalizedItem = {
    ...item,
    selected_color:
      normalizeSelectedColor(
        item.selected_color,
      ),
  };

  const quantity =
    Math.max(
      1,
      Number(
        item.quantity || 1,
      ),
    );

  const wantedKey =
    cartItemKey({
      id: normalizedItem.id,
      item_type:
        normalizedItem.item_type,
      selected_color:
        normalizedItem.selected_color,
    });

  const found =
    items.find(
      (entry) =>
        cartItemKey(entry) ===
        wantedKey,
    );

  if (found) {
    found.quantity += quantity;
  } else {
    items.push({
      ...normalizedItem,
      quantity,
    });
  }

  saveCart(items);
}

const DIRECT_CHECKOUT_KEY =
  "bricomenage_direct_checkout";

export type DirectCheckoutPayload = {
  items: CartItem[];
  returnHref?: string;
};

export function saveDirectCheckout(
  item: CartItem,
  returnHref?: string,
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const payload: DirectCheckoutPayload = {
    items: [
      {
        ...item,
        selected_color:
          normalizeSelectedColor(
            item.selected_color,
          ),
      },
    ],
    returnHref,
  };

  window.sessionStorage.setItem(
    DIRECT_CHECKOUT_KEY,
    JSON.stringify(payload),
  );
}

export function getDirectCheckout():
  DirectCheckoutPayload | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      window.sessionStorage.getItem(
        DIRECT_CHECKOUT_KEY,
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw) as
        DirectCheckoutPayload;

    if (
      !parsed ||
      !Array.isArray(
        parsed.items,
      ) ||
      !parsed.items.length
    ) {
      return null;
    }

    return {
      ...parsed,
      items: parsed.items.map(
        (item) => ({
          ...item,
          item_type:
            item.item_type ===
            "PACK"
              ? "PACK"
              : "ARTICLE",
          quantity: Math.max(
            1,
            Number(
              item.quantity || 1,
            ),
          ),
          price: Number(
            item.price || 0,
          ),
          selected_color:
            normalizeSelectedColor(
              item.selected_color,
            ),
        }),
      ),
    };
  } catch {
    return null;
  }
}

export function clearDirectCheckout() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.sessionStorage.removeItem(
    DIRECT_CHECKOUT_KEY,
  );
}

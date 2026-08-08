"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Package,
  ShoppingCart,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { addToCart } from "@/lib/cart";
import {
  catalogApi,
  type CatalogPack,
} from "@/lib/catalog";

type PackDetail = CatalogPack & {
  articles?: Array<{
    id: number;
    slug?: string;
    designation: string;
    reference?: string | null;
    image?: string | null;
    images?: string[];
    price: number;
    quantity: number;
    line_total: number;
  }>;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat(
    "fr-DZ",
  ).format(Number(value || 0));
}

export default function PackPage() {
  const searchParams =
    useSearchParams();

  const slug =
    searchParams.get("slug") || "";

  const [pack, setPack] =
    useState<PackDetail | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [added, setAdded] =
    useState(false);

  const [
    selectedImage,
    setSelectedImage,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!slug) {
        setError(
          "Pack introuvable.",
        );

        setLoading(false);
        return;
      }

      try {
        const response =
          await catalogApi.packBySlug(
            slug,
          );

        if (active) {
          const loadedPack =
            response.pack as PackDetail;

          setPack(loadedPack);

          const firstImage =
            loadedPack.image ||
            loadedPack.articles?.find(
              (article) =>
                Boolean(article.image),
            )?.image ||
            "";

          setSelectedImage(
            firstImage || "",
          );
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Impossible de charger le pack.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [slug]);

  const galleryImages =
    useMemo(() => {
      if (!pack) {
        return [];
      }

      const articleImages =
        (pack.articles || [])
          .flatMap(
            (article) => [
              article.image,
              ...(article.images || []),
            ],
          )
          .filter(
            (
              image,
            ): image is string =>
              Boolean(image),
          );

      return Array.from(
        new Set(
          [
            pack.image,
            ...articleImages,
          ].filter(
            (
              image,
            ): image is string =>
              Boolean(image),
          ),
        ),
      );
    }, [pack]);

  const activeImageIndex =
    Math.max(
      0,
      galleryImages.findIndex(
        (image) =>
          image === selectedImage,
      ),
    );

  function showPreviousImage() {
    if (
      galleryImages.length <= 1
    ) {
      return;
    }

    const previousIndex =
      activeImageIndex <= 0
        ? galleryImages.length - 1
        : activeImageIndex - 1;

    setSelectedImage(
      galleryImages[
        previousIndex
      ],
    );
  }

  function showNextImage() {
    if (
      galleryImages.length <= 1
    ) {
      return;
    }

    const nextIndex =
      activeImageIndex >=
      galleryImages.length - 1
        ? 0
        : activeImageIndex + 1;

    setSelectedImage(
      galleryImages[
        nextIndex
      ],
    );
  }

  function addPack() {
    if (!pack?.inStock) {
      return;
    }

    addToCart({
      id: pack.id,
      item_type: "PACK",
      slug: pack.slug,
      designation: pack.name,
      price: Number(
        pack.price,
      ),
      image:
        pack.image ||
        selectedImage ||
        pack.articles?.find(
          (article) =>
            Boolean(
              article.image,
            ),
        )?.image ||
        undefined,

      pack_components:
        (pack.articles || []).map(
          (article) => ({
            article_id:
              Number(
                article.id,
              ),
            slug:
              article.slug,
            designation:
              article.designation,
            image:
              article.image ||
              undefined,
            quantity_per_pack:
              Number(
                article.quantity ||
                  1,
              ),
          }),
        ),

      quantity: 1,
    });

    setAdded(true);

    window.setTimeout(
      () => setAdded(false),
      1600,
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-orange-500" />
      </main>
    );
  }

  if (error || !pack) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 text-center">
        <Boxes className="mx-auto h-16 w-16 text-zinc-300" />

        <h1 className="mt-5 text-2xl font-black">
          Pack introuvable
        </h1>

        <p className="mt-2 text-zinc-500">
          {error}
        </p>

        <Link
          href="/articles?pack=1"
          className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-black text-white"
        >
          Retour aux packs
        </Link>
      </main>
    );
  }

  const oldPrice =
    Number(
      pack.old_price || 0,
    );

  const reduction =
    oldPrice > pack.price
      ? Math.round(
          ((oldPrice -
            pack.price) /
            oldPrice) *
            100,
        )
      : null;

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/articles?pack=1"
          className="inline-flex items-center gap-2 text-sm font-black text-zinc-600 hover:text-orange-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux packs
        </Link>

        <div className="mt-7 grid gap-8 rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm lg:grid-cols-2 lg:p-8">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-[28px] bg-zinc-100">
              {selectedImage ? (
                <img
                  src={
                    selectedImage
                  }
                  alt={pack.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Boxes className="h-28 w-28 text-zinc-300" />
                </div>
              )}

              <span className="absolute left-5 top-5 rounded-full bg-zinc-950 px-4 py-2 text-xs font-black uppercase text-white">
                Pack
              </span>

              {reduction !== null &&
                reduction > 0 && (
                  <span className="absolute right-5 top-5 rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-white">
                    -{reduction} %
                  </span>
                )}

              {galleryImages.length >
                1 && (
                <>
                  <button
                    type="button"
                    onClick={
                      showPreviousImage
                    }
                    aria-label="Image précédente"
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-lg backdrop-blur transition hover:bg-orange-500 hover:text-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={
                      showNextImage
                    }
                    aria-label="Image suivante"
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-lg backdrop-blur transition hover:bg-orange-500 hover:text-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-zinc-950/80 px-3 py-1.5 text-xs font-black text-white">
                    {activeImageIndex +
                      1}{" "}
                    /{" "}
                    {
                      galleryImages.length
                    }
                  </span>
                </>
              )}
            </div>

            {galleryImages.length >
              1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                {galleryImages.map(
                  (
                    image,
                    index,
                  ) => {
                    const active =
                      image ===
                      selectedImage;

                    return (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() =>
                          setSelectedImage(
                            image,
                          )
                        }
                        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border transition ${
                          active
                            ? "border-orange-500 ring-4 ring-orange-500/10"
                            : "border-zinc-200 hover:border-orange-300"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${pack.name} ${index + 1}`}
                          className="h-full w-full object-cover"
                        />

                        <span className={`absolute bottom-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black ${
                          active
                            ? "bg-orange-500 text-white"
                            : "bg-zinc-950/70 text-white"
                        }`}>
                          {index + 1}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-[0.15em] text-orange-500">
              {pack.article_count}{" "}
              article
              {pack.article_count >
              1
                ? "s"
                : ""}
            </span>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-950">
              {pack.name}
            </h1>

            <p className="mt-5 leading-7 text-zinc-500">
              {pack.description ||
                "Ensemble complet à prix avantageux."}
            </p>

            <div className="mt-8 flex items-end gap-3">
              <strong className="text-4xl font-black text-zinc-950">
                {formatPrice(
                  pack.price,
                )}{" "}
                DA
              </strong>

              {oldPrice >
                pack.price && (
                <span className="pb-1 text-lg text-zinc-400 line-through">
                  {formatPrice(
                    oldPrice,
                  )}{" "}
                  DA
                </span>
              )}
            </div>

            <p
              className={`mt-4 text-sm font-black ${
                pack.inStock
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {pack.inStock
                ? `${pack.stock_quantity} pack(s) disponible(s)`
                : "Pack indisponible"}
            </p>

            <button
              type="button"
              onClick={addPack}
              disabled={!pack.inStock}
              className={`mt-8 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl px-6 text-sm font-black text-white transition ${
                !pack.inStock
                  ? "cursor-not-allowed bg-zinc-300"
                  : added
                    ? "bg-emerald-500"
                    : "bg-zinc-950 hover:bg-orange-500"
              }`}
            >
              <ShoppingCart className="h-5 w-5" />

              {added
                ? "Pack ajouté au panier"
                : "Ajouter le pack au panier"}
            </button>
          </div>
        </div>

        <section className="mt-8 rounded-[32px] border border-zinc-200 bg-white p-5 shadow-sm lg:p-8">
          <h2 className="text-2xl font-black text-zinc-950">
            Contenu du pack
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(pack.articles || []).map(
              (article) => (
                <article
                  key={article.id}
                  className="flex gap-4 rounded-2xl border border-zinc-200 p-4"
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
                    {article.image ? (
                      <img
                        src={
                          article.image
                        }
                        alt={
                          article.designation
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-9 w-9 text-zinc-300" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-black text-zinc-950">
                      {
                        article.designation
                      }
                    </h3>

                    <p className="mt-1 text-xs text-zinc-400">
                      {article.reference ||
                        "Sans référence"}
                    </p>

                    <p className="mt-3 text-sm font-bold text-zinc-600">
                      Quantité :{" "}
                      {
                        article.quantity
                      }
                    </p>

                    <strong className="mt-1 block text-orange-600">
                      {formatPrice(
                        article.line_total,
                      )}{" "}
                      DA
                    </strong>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

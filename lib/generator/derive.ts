import { hostOf } from "@/lib/qr/payloads/link";
import { encode } from "@/lib/qr/encode";
import { buildGeometry, type QrGeometry } from "@/lib/qr/geometry";
import { exceedsCapacity, HARD_LIMIT_BYTES } from "@/lib/qr/limits";
import { createMatrix } from "@/lib/qr/matrix";
import { SOFT_ICON_SIZE } from "@/lib/favicon/client";
import type { CenterImage, GeneratorState } from "./types";

/** What the preview needs to draw, plus why it might not be able to. */
export type DerivedQr =
  | { status: "empty" }
  | { status: "invalid"; message: string | null }
  | { status: "error"; message: string }
  | {
      status: "ready";
      payload: string;
      title: string;
      geometry: QrGeometry;
      logo: CenterImage | null;
    };

/** The host of the current link, or null when the type is not link or the link is not valid yet. */
export function currentHost(state: GeneratorState): string | null {
  return state.type === "link" ? hostOf(state.fieldsByType.link[0] ?? "") : null;
}

/**
 * Picks the image that will actually be drawn. A selected favicon only counts
 * when it belongs to the link currently in the field, so a stale icon from the
 * previous host never ends up on the wrong code.
 */
export function effectiveLogo(state: GeneratorState): CenterImage | null {
  if (state.center === "upload") return state.upload;
  if (state.center === "favicon") {
    const host = currentHost(state);
    const { favicon } = state;
    if (host && favicon?.host === host && favicon.status === "found") return favicon.image ?? null;
  }
  return null;
}

/** Runs the whole pipeline from form state to drawable geometry. */
export function deriveQr(state: GeneratorState): DerivedQr {
  const encoded = encode(state.type, state.fieldsByType[state.type]);
  if (!encoded.ok) {
    return encoded.message ? { status: "invalid", message: encoded.message } : { status: "empty" };
  }
  if (exceedsCapacity(encoded.payload)) {
    return {
      status: "invalid",
      message: `That is too long for a QR code. The limit is about ${HARD_LIMIT_BYTES.toLocaleString("en-US")} bytes.`,
    };
  }
  try {
    const matrix = createMatrix(encoded.payload);
    const logo = effectiveLogo(state);
    const geometry = buildGeometry(matrix, encoded.payload, logo !== null);
    // Content too long for a logo at all: drop the image so the plate does not show empty.
    const shownLogo = geometry.plate ? logo : null;
    return { status: "ready", payload: encoded.payload, title: encoded.title, geometry, logo: shownLogo };
  } catch {
    return { status: "error", message: "We could not make a code from this content." };
  }
}

/** What the Favicon tile should show and say. The tooltip text comes from the spec. */
export type FaviconTile =
  | { status: "unavailable"; hint: string }
  | { status: "loading"; hint: string }
  | { status: "found"; hint: string; image: CenterImage | null }
  | { status: "missing"; hint: string };

export function faviconTile(state: GeneratorState): FaviconTile {
  if (state.type !== "link") {
    return { status: "unavailable", hint: "Favicons are available for links. Upload your own image instead." };
  }
  const host = currentHost(state);
  if (!host) return { status: "unavailable", hint: "Paste a link and we'll look for its favicon." };
  const { favicon } = state;
  if (!favicon || favicon.host !== host || favicon.status === "loading") {
    return { status: "loading", hint: "Looking for a favicon..." };
  }
  if (favicon.status === "missing") {
    return { status: "missing", hint: `No favicon found for ${host}. Try uploading an image.` };
  }
  const soft = (favicon.sourceSize ?? 0) > 0 && (favicon.sourceSize ?? 0) < SOFT_ICON_SIZE;
  return {
    status: "found",
    image: favicon.image ?? null,
    hint: soft
      ? "This icon is small and may look soft."
      : `Favicon found on ${host}. Paste a different link and we'll fetch it again.`,
  };
}

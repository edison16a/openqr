import type { CenterKind, ContentType } from "@/lib/qr/types";

/** An image the code can show: the blob to store, and a data URL to draw. */
export interface CenterImage {
  blob: Blob;
  dataUrl: string;
}

/** Where the favicon lookup for the current link stands. */
export interface FaviconState {
  host: string;
  status: "loading" | "found" | "missing";
  image?: CenterImage;
  /** Original icon size in pixels, used for the "may look soft" note. */
  sourceSize?: number;
}

/**
 * The only state the generator owns. Payload, matrix and SVG are derived from
 * this and never stored, so they can never drift out of sync with the form.
 */
export interface GeneratorState {
  /** Set when editing a saved code, so autosave updates it instead of adding one. */
  recordId: string | null;
  createdAt: string | null;
  type: ContentType;
  /** Typed values per content type, so switching pills does not lose input. */
  fieldsByType: Record<ContentType, string[]>;
  center: CenterKind;
  /** True once the user clicked a center tile. An explicit choice beats auto-select. */
  centerChosen: boolean;
  upload: CenterImage | null;
  favicon: FaviconState | null;
  fg: string;
  bg: string;
}

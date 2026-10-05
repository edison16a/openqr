import type { CenterKind, ContentType } from "@/lib/qr/types";

/**
 * One saved code. It is self contained: the raw form values let Edit restore
 * the form exactly, and the payload is kept so thumbnails render without
 * re-encoding. Images live in a separate store and are pointed to by key.
 */
export interface SavedCode {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: ContentType;
  /** Raw form values in the order given by content-types.ts. */
  fields: string[];
  payload: string;
  /** Host for links, network name for Wi-Fi, first words for text. Never a password. */
  title: string;
  center: { kind: CenterKind; host?: string; imageKey?: string };
  colors: { fg: string; bg: string };
}

/** A saved code with its center image loaded as a data URL, ready to draw. */
export interface LoadedCode extends SavedCode {
  imageDataUrl: string | null;
}

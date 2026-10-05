import type { SavedCode } from "@/lib/storage/types";
import { currentHost, type DerivedQr } from "./derive";
import { initialState } from "./state";
import type { CenterImage, GeneratorState } from "./types";

type Ready = Extract<DerivedQr, { status: "ready" }>;

/** Short random id like "qr_8f2k1a". Collisions are unlikely for a few hundred local codes. */
export function newRecordId(): string {
  return `qr_${Math.random().toString(36).slice(2, 8)}`;
}

/** Key of the one image a record owns. Derived from the id so it is easy to clean up. */
export const imageKeyFor = (id: string) => `${id}-image`;

/**
 * Snapshots the generator into a saved record. The center kind is the one
 * actually drawn: if the favicon was selected but never arrived, we save
 * "none" rather than a pointer to an image that does not exist.
 */
export function toRecord(state: GeneratorState, derived: Ready, id: string, now: string): SavedCode {
  const kind = derived.logo ? state.center : "none";
  return {
    id,
    createdAt: state.createdAt ?? now,
    updatedAt: now,
    type: state.type,
    fields: state.fieldsByType[state.type],
    payload: derived.payload,
    title: derived.title,
    center: {
      kind,
      host: kind === "favicon" ? (currentHost(state) ?? undefined) : undefined,
      imageKey: derived.logo ? imageKeyFor(id) : undefined,
    },
    colors: { fg: state.fg, bg: state.bg },
  };
}

/** Rebuilds generator state from a record so Edit restores the form exactly. */
export function fromRecord(record: SavedCode, image: CenterImage | null): GeneratorState {
  const state = initialState();
  state.fieldsByType[record.type] = record.fields;
  const { kind, host } = record.center;
  return {
    ...state,
    recordId: record.id,
    createdAt: record.createdAt,
    type: record.type,
    center: image ? kind : "none",
    // Whatever the saved code used is an explicit choice, so auto-select must not override it.
    centerChosen: true,
    upload: kind === "upload" ? image : null,
    favicon: kind === "favicon" && host && image ? { host, status: "found", image } : null,
    fg: record.colors.fg,
    bg: record.colors.bg,
  };
}

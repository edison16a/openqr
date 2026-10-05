import { CONTENT_TYPES } from "@/lib/qr/content-types";
import type { CenterKind, ContentType } from "@/lib/qr/types";
import type { CenterImage, FaviconState, GeneratorState } from "./types";

export const DEFAULT_FG = "#111113";
export const DEFAULT_BG = "#FFFFFF";

export type GeneratorAction =
  | { type: "set-type"; value: ContentType }
  | { type: "set-field"; index: number; value: string }
  | { type: "set-center"; value: CenterKind }
  | { type: "set-upload"; image: CenterImage }
  | { type: "remove-upload" }
  | { type: "favicon-loading"; host: string }
  | { type: "favicon-result"; host: string; image: CenterImage | null; sourceSize?: number }
  | { type: "set-fg"; value: string }
  | { type: "set-bg"; value: string }
  | { type: "load"; state: GeneratorState };

export function initialState(): GeneratorState {
  const fieldsByType = Object.fromEntries(
    CONTENT_TYPES.map((spec) => [spec.type, [...spec.defaults]]),
  ) as Record<ContentType, string[]>;
  return {
    recordId: null,
    createdAt: null,
    type: "link",
    fieldsByType,
    center: "none",
    centerChosen: false,
    upload: null,
    favicon: null,
    fg: DEFAULT_FG,
    bg: DEFAULT_BG,
  };
}

/** Applies a finished favicon lookup, but only if it is for the host we are waiting on. */
function applyFavicon(state: GeneratorState, action: Extract<GeneratorAction, { type: "favicon-result" }>) {
  if (state.favicon?.host !== action.host) return state;
  const found = action.image !== null;
  const favicon: FaviconState = {
    host: action.host,
    status: found ? "found" : "missing",
    image: action.image ?? undefined,
    sourceSize: action.sourceSize,
  };
  // Auto-select only the first time, and only if the user has not picked anything yet.
  const autoSelect = found && !state.centerChosen;
  return { ...state, favicon, center: autoSelect ? "favicon" : state.center };
}

export function generatorReducer(state: GeneratorState, action: GeneratorAction): GeneratorState {
  switch (action.type) {
    case "set-type":
      return { ...state, type: action.value };
    case "set-field": {
      const fields = [...state.fieldsByType[state.type]];
      fields[action.index] = action.value;
      return { ...state, fieldsByType: { ...state.fieldsByType, [state.type]: fields } };
    }
    case "set-center":
      return { ...state, center: action.value, centerChosen: true };
    case "set-upload":
      return { ...state, upload: action.image, center: "upload", centerChosen: true };
    case "remove-upload":
      return { ...state, upload: null, center: state.center === "upload" ? "none" : state.center };
    case "favicon-loading":
      return { ...state, favicon: { host: action.host, status: "loading" } };
    case "favicon-result":
      return applyFavicon(state, action);
    case "set-fg":
      return { ...state, fg: action.value };
    case "set-bg":
      return { ...state, bg: action.value };
    case "load":
      return action.state;
    default:
      return state;
  }
}

import { useMemo, useReducer } from "react";
import { deriveQr } from "@/lib/generator/derive";
import { generatorReducer, initialState } from "@/lib/generator/state";
import { useAutosave } from "./use-autosave";
import { useEditLoader } from "./use-edit-loader";
import { useFavicon } from "./use-favicon";

/**
 * The generator's single entry point: one reducer, with the code derived from
 * it on every render, plus the three side effects (favicon lookup, loading a
 * saved code for editing, and autosave).
 */
export function useGenerator() {
  const [state, dispatch] = useReducer(generatorReducer, undefined, initialState);
  const derived = useMemo(() => deriveQr(state), [state]);
  useFavicon(state, dispatch);
  useEditLoader(dispatch);
  useAutosave(state, derived);
  return { state, derived, dispatch };
}

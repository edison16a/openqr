"use client";

import { useRef, useState, type Dispatch } from "react";
import { Button } from "@/components/ui/button";
import { NoneIcon } from "@/components/ui/icons";
import { InlineMessage } from "@/components/ui/text-input";
import { blobToDataUrl } from "@/lib/image/data-url";
import { processUpload, validateUpload } from "@/lib/image/process-upload";
import { faviconTile } from "@/lib/generator/derive";
import type { GeneratorAction } from "@/lib/generator/state";
import type { GeneratorState } from "@/lib/generator/types";
import { CenterTile } from "./center-tile";
import { FaviconTile } from "./favicon-tile";
import { UploadTile } from "./upload-tile";

interface CenterPickerProps {
  state: GeneratorState;
  dispatch: Dispatch<GeneratorAction>;
}

/** Favicon, Upload and None, three tiles per row at every width. */
export function CenterPicker({ state, dispatch }: CenterPickerProps) {
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const tile = faviconTile(state);

  /** Validates and processes a file. On any problem the previous choice is kept. */
  const handleFile = async (file: File) => {
    const problem = validateUpload(file);
    if (problem) return setError(problem);
    try {
      const blob = await processUpload(file);
      dispatch({ type: "set-upload", image: { blob, dataUrl: await blobToDataUrl(blob) } });
      setError(null);
    } catch {
      setError("We could not read that image. Try a different file.");
    }
  };

  // What is really drawn decides the highlight. A favicon that never arrived
  // falls back to None, so exactly one tile always looks selected.
  const faviconSelected = state.center === "favicon" && tile.status === "found";
  const uploadSelected = state.center === "upload" && state.upload !== null;
  const noneSelected = !faviconSelected && !uploadSelected;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <FaviconTile
          tile={tile}
          selected={faviconSelected}
          onSelect={() => dispatch({ type: "set-center", value: "favicon" })}
        />
        <UploadTile
          image={state.upload}
          selected={uploadSelected}
          pickerRef={picker}
          onSelect={() => dispatch({ type: "set-center", value: "upload" })}
          onFile={handleFile}
        />
        <CenterTile
          label="None"
          selected={noneSelected}
          onClick={() => dispatch({ type: "set-center", value: "none" })}
        >
          <NoneIcon size={24} />
        </CenterTile>
      </div>
      {uploadSelected && (
        <div className="flex gap-2">
          <Button variant="secondary" className="min-h-11 flex-1" onClick={() => picker.current?.click()}>
            Replace image
          </Button>
          <Button variant="secondary" className="min-h-11 flex-1" onClick={() => dispatch({ type: "remove-upload" })}>
            Remove image
          </Button>
        </div>
      )}
      {error && <InlineMessage>{error}</InlineMessage>}
    </div>
  );
}

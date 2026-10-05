import { useRef, useState, type DragEvent } from "react";
import { UploadIcon } from "@/components/ui/icons";
import { ACCEPTED_TYPES } from "@/lib/image/process-upload";
import type { CenterImage } from "@/lib/generator/types";
import { CenterTile } from "./center-tile";

interface UploadTileProps {
  image: CenterImage | null;
  selected: boolean;
  onSelect: () => void;
  onFile: (file: File) => void;
  /** Lets the parent trigger the file picker for the Replace action. */
  pickerRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * The Upload option. Clicking picks a file (or reselects an existing upload),
 * and dropping a file on the tile works too. With no image yet, a click opens
 * the file picker straight away.
 */
export function UploadTile({ image, selected, onSelect, onFile, pickerRef }: UploadTileProps) {
  const [dragging, setDragging] = useState(false);
  const local = useRef<HTMLInputElement>(null);
  const input = pickerRef ?? local;

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`flex rounded-2xl ${dragging ? "ring-2 ring-accent" : ""}`}
    >
      <CenterTile
        label="Upload"
        selected={selected}
        onClick={() => (image ? onSelect() : input.current?.click())}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.dataUrl} alt="Your uploaded image" className="size-7 rounded-lg object-cover" />
        ) : (
          <UploadIcon size={24} />
        )}
      </CenterTile>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload a center image"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          // Clear it so picking the same file again still fires onChange.
          event.target.value = "";
        }}
      />
    </div>
  );
}

import { GlobeIcon } from "@/components/ui/icons";
import { Tooltip } from "@/components/ui/tooltip";
import type { FaviconTile as FaviconTileState } from "@/lib/generator/derive";
import { CenterTile } from "./center-tile";

interface FaviconTileProps {
  tile: FaviconTileState;
  selected: boolean;
  onSelect: () => void;
}

/**
 * The Favicon option. Its states (unavailable, loading, found, missing) and
 * their tooltips come from the spec. There is no hint box on the page, the
 * tooltip carries the explanation.
 */
export function FaviconTile({ tile, selected, onSelect }: FaviconTileProps) {
  const selectable = tile.status === "found";
  return (
    <Tooltip text={tile.hint}>
      {(describedBy) => (
        <CenterTile
          label="Favicon"
          selected={selected}
          disabled={!selectable}
          onClick={onSelect}
          describedBy={describedBy}
        >
          {tile.status === "loading" ? (
            <span className="skeleton size-7 rounded-lg bg-line" aria-hidden="true" />
          ) : tile.status === "found" && tile.image ? (
            // A data URL we made ourselves, so next/image has nothing to optimize.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tile.image.dataUrl} alt="" className="size-7 rounded-lg object-contain" />
          ) : (
            <GlobeIcon size={24} className="text-muted" />
          )}
        </CenterTile>
      )}
    </Tooltip>
  );
}

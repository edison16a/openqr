import { buildGeometry, type QrGeometry } from "./geometry";
import { createMatrix } from "./matrix";

/** Payload to drawable geometry in one step. Used wherever a code is rebuilt from a saved payload. */
export function geometryFor(payload: string, withLogo: boolean): QrGeometry {
  return buildGeometry(createMatrix(payload), payload, withLogo);
}

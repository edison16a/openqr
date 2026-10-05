/** The six kinds of content a code can hold. */
export type ContentType = "link" | "text" | "wifi" | "contact" | "email" | "phone";

/** What the center of the code shows. */
export type CenterKind = "favicon" | "upload" | "none";

/**
 * Result of turning form fields into a payload. When `ok` is false, `message`
 * is only set if the user has typed something, so a blank form stays quiet.
 */
export type EncodeResult =
  | { ok: true; payload: string; title: string }
  | { ok: false; message: string | null };

/** Builds a failure. A null message means "nothing typed yet". */
export function fail(message: string | null = null): EncodeResult {
  return { ok: false, message };
}

import { buildLink } from "./payloads/link";
import { buildVcard } from "./payloads/vcard";
import { buildWifi } from "./payloads/wifi";
import { buildEmail, buildPhone, buildText } from "./payloads/simple";
import { fail, type ContentType, type EncodeResult } from "./types";

/**
 * Turns the raw form values for a content type into the string that goes in
 * the QR code, plus a safe title for the Saved codes page. Fields arrive as an
 * ordered array (see content-types.ts) so saved records can restore the form.
 */
export function encode(type: ContentType, fields: string[]): EncodeResult {
  const field = (index: number) => fields[index] ?? "";
  switch (type) {
    case "link":
      return buildLink(field(0));
    case "text":
      return buildText(field(0));
    case "wifi":
      return buildWifi(field(0), field(1), field(2));
    case "contact":
      return buildVcard(field(0), field(1), field(2));
    case "email":
      return buildEmail(field(0));
    case "phone":
      return buildPhone(field(0));
    default:
      return fail();
  }
}

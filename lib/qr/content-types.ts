import type { ContentType } from "./types";

/** One input in the content form. The UI renders these generically. */
export interface FieldSpec {
  label: string;
  placeholder?: string;
  inputMode?: "text" | "url" | "tel" | "email";
  autoComplete?: string;
  /** Renders a textarea instead of a single line input. */
  multiline?: boolean;
  /** Renders a select with these options instead of a text input. */
  options?: { value: string; label: string }[];
  /** Hides the characters, used for the Wi-Fi password. */
  secret?: boolean;
}

export interface ContentTypeSpec {
  type: ContentType;
  label: string;
  fields: FieldSpec[];
  /** Starting values, one per field, so Wi-Fi security begins on WPA. */
  defaults: string[];
}

/**
 * The single source of truth for what each content type asks for. Field order
 * matters: saved records store raw values as an array in this order.
 */
export const CONTENT_TYPES: ContentTypeSpec[] = [
  {
    type: "link",
    label: "Link",
    fields: [{ label: "Link", placeholder: "https://openqr.app", inputMode: "url", autoComplete: "off" }],
    defaults: [""],
  },
  {
    type: "text",
    label: "Text",
    fields: [{ label: "Text", placeholder: "Anything you want to share", multiline: true }],
    defaults: [""],
  },
  {
    type: "wifi",
    label: "Wi-Fi",
    fields: [
      { label: "Network name", placeholder: "HomeNetwork", autoComplete: "off" },
      { label: "Password", placeholder: "Leave empty for an open network", secret: true, autoComplete: "off" },
      {
        label: "Security",
        options: [
          { value: "WPA", label: "WPA or WPA2" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "None" },
        ],
      },
    ],
    defaults: ["", "", "WPA"],
  },
  {
    type: "contact",
    label: "Contact",
    fields: [
      { label: "Name", placeholder: "Ada Lovelace", autoComplete: "off" },
      { label: "Phone", placeholder: "+1 555 010 0199", inputMode: "tel", autoComplete: "off" },
      { label: "Email", placeholder: "ada@example.com", inputMode: "email", autoComplete: "off" },
    ],
    defaults: ["", "", ""],
  },
  {
    type: "email",
    label: "Email",
    fields: [{ label: "Address", placeholder: "hello@example.com", inputMode: "email", autoComplete: "off" }],
    defaults: [""],
  },
  {
    type: "phone",
    label: "Phone",
    fields: [{ label: "Number", placeholder: "+1 555 010 0199", inputMode: "tel", autoComplete: "off" }],
    defaults: [""],
  },
];

/** Looks up the spec for a type. Every ContentType has one, so this never misses. */
export function specFor(type: ContentType): ContentTypeSpec {
  return CONTENT_TYPES.find((spec) => spec.type === type) as ContentTypeSpec;
}

import { fail, type EncodeResult } from "../types";

/**
 * Wi-Fi codes use backslash escaping for the five characters that would
 * otherwise end a field or confuse the parser. Phones read the payload
 * literally, so a missed escape means a wrong network name or password.
 */
export function escapeWifi(value: string): string {
  return value.replace(/[\;,:"]/g, (char) => `\\${char}`);
}

/**
 * Builds WIFI:T:WPA;S:<ssid>;P:<password>;; and drops the password entirely
 * (T:nopass) when it is empty or the user picked an open network.
 * The title is the network name only, never the password.
 */
export function buildWifi(ssid: string, password: string, security: string): EncodeResult {
  if (!ssid.trim()) return password ? fail("Enter the network name.") : fail();
  const open = security === "nopass" || password === "";
  const type = open ? "nopass" : security === "WEP" ? "WEP" : "WPA";
  const parts = [`T:${type}`, `S:${escapeWifi(ssid)}`];
  if (!open) parts.push(`P:${escapeWifi(password)}`);
  return { ok: true, payload: `WIFI:${parts.join(";")};;`, title: ssid.trim() };
}

import { describe, expect, it } from "vitest";
import { encode } from "@/lib/qr/encode";
import { escapeWifi } from "@/lib/qr/payloads/wifi";

const payloadOf = (result: ReturnType<typeof encode>) => (result.ok ? result.payload : null);

describe("link", () => {
  it("adds https when the scheme is missing", () => {
    expect(payloadOf(encode("link", ["openqr.app"]))).toBe("https://openqr.app");
  });
  it("keeps an existing scheme and path untouched", () => {
    expect(payloadOf(encode("link", ["http://example.com/a?b=1"]))).toBe("http://example.com/a?b=1");
  });
  it("waits for a dot before showing a code", () => {
    expect(encode("link", ["openqr"]).ok).toBe(false);
  });
  it("rejects spaces and non web schemes", () => {
    expect(encode("link", ["not a link.com"]).ok).toBe(false);
    expect(encode("link", ["javascript://x.y"]).ok).toBe(false);
  });
  it("stays quiet for a blank field and explains a bad one", () => {
    expect(encode("link", [""])).toEqual({ ok: false, message: null });
    const bad = encode("link", ["x y"]);
    expect(!bad.ok && bad.message).toBeTruthy();
  });
  it("titles a link by its host without www", () => {
    const result = encode("link", ["https://www.example.com/menu"]);
    expect(result.ok && result.title).toBe("example.com");
  });
});

describe("wifi", () => {
  it("builds a WPA payload", () => {
    expect(payloadOf(encode("wifi", ["Home", "secret", "WPA"]))).toBe("WIFI:T:WPA;S:Home;P:secret;;");
  });
  it("escapes the five special characters", () => {
    expect(escapeWifi('a\\b;c,d:e"f')).toBe('a\\\\b\\;c\\,d\\:e\\"f');
    expect(payloadOf(encode("wifi", ["My;Net", "p:w", "WPA"]))).toBe(String.raw`WIFI:T:WPA;S:My\;Net;P:p\:w;;`);
  });
  it("uses nopass when the password is empty", () => {
    expect(payloadOf(encode("wifi", ["Cafe", "", "WPA"]))).toBe("WIFI:T:nopass;S:Cafe;;");
  });
  it("never puts the password in the title", () => {
    const result = encode("wifi", ["Home", "hunter2", "WPA"]);
    expect(result.ok && result.title).toBe("Home");
  });
});

describe("contact", () => {
  it("builds a vCard 3.0 with CRLF line endings", () => {
    const payload = payloadOf(encode("contact", ["Ada Lovelace", "+1 555 010 0199", "ada@example.com"]));
    expect(payload).toBe(
      [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "N:Lovelace;Ada;;;",
        "FN:Ada Lovelace",
        "TEL;TYPE=CELL:+15550100199",
        "EMAIL:ada@example.com",
        "END:VCARD",
      ].join("\r\n"),
    );
  });
  it("needs at least one field and a valid email", () => {
    expect(encode("contact", ["", "", ""])).toEqual({ ok: false, message: null });
    expect(encode("contact", ["Ada", "", "nope"]).ok).toBe(false);
  });
});

describe("email, phone and text", () => {
  it("builds mailto and tel links", () => {
    expect(payloadOf(encode("email", ["hi@example.com"]))).toBe("mailto:hi@example.com");
    expect(payloadOf(encode("phone", ["(555) 010-0199"]))).toBe("tel:5550100199");
    expect(payloadOf(encode("phone", ["+44 20 7946 0958"]))).toBe("tel:+442079460958");
  });
  it("passes text through unchanged", () => {
    expect(payloadOf(encode("text", ["Hello,  world"]))).toBe("Hello,  world");
  });
  it("rejects a bad email and a short phone number", () => {
    expect(encode("email", ["hi@"]).ok).toBe(false);
    expect(encode("phone", ["12"]).ok).toBe(false);
  });
});

describe("vCard escaping", () => {
  it("escapes semicolons and commas in names", () => {
    const result = encode("contact", ["Ada; Countess, Lovelace", "", ""]);
    expect(result.ok && result.payload).toContain(String.raw`FN:Ada\; Countess\, Lovelace`);
  });
});

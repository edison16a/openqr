import { BlockList, isIP } from "node:net";

/**
 * Every range a public website should never resolve to. If the favicon route
 * could be pointed at one of these it would become a way to poke at private
 * servers, cloud metadata endpoints and the host machine itself.
 */
const blocked = new BlockList();
const V4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];
const V6: [string, number][] = [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["100::", 64],
  ["2001:db8::", 32],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
];
for (const [net, prefix] of V4) blocked.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of V6) blocked.addSubnet(net, prefix, "ipv6");

/**
 * IPv6 can wrap an IPv4 address (::ffff:10.0.0.1), which would slip past the
 * IPv6 ranges above. Unwrap it so the IPv4 rules apply.
 */
function unmapV4(address: string): string {
  const dotted = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (dotted?.[1]) return dotted[1];
  const hex = address.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (hex?.[1] && hex[2]) {
    const hi = parseInt(hex[1], 16);
    const lo = parseInt(hex[2], 16);
    return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  return address;
}

/** True when the address is loopback, private, link-local, reserved or not an IP at all. */
export function isBlockedAddress(address: string): boolean {
  const unwrapped = unmapV4(address.trim());
  const family = isIP(unwrapped);
  if (family === 0) return true;
  return blocked.check(unwrapped, family === 4 ? "ipv4" : "ipv6");
}

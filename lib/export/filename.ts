/** Lowercase letters and digits joined by single dashes, so "Example.com" becomes "example-com". */
export function slugify(text: string, max = 40): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
  return slug || "code";
}

/** Builds names like openqr-example-com-20261005.png. */
export function pngFileName(title: string, date = new Date()): string {
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `openqr-${slugify(title)}-${stamp}.png`;
}

// Counts visible text inside an HTML string. Used for min-length validation and the
// character counter on the rich-text fields, since `description.length` would count
// markup (`<p>hi</p>` is 9 chars but only 2 visible).
export function visibleTextLength(html: string): number {
  if (!html) return 0;
  if (typeof window === "undefined") {
    // Crude server-side fallback: strip tags via regex. Good enough for SSR validation gates.
    return html.replace(/<[^>]*>/g, "").trim().length;
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").trim().length;
}

// True if the HTML contains at least one image. Useful for "is this empty" checks where
// an image-only message should still count as content.
export function hasImage(html: string): boolean {
  return /<img\b/i.test(html);
}

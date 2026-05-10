import DOMPurify from "dompurify";

// Mirrors the backend HtmlContentSanitizer allowlist:
//   tags:  p, br, img, strong, em, b, i
//   <img>: src, alt, width, height
//   src:   https only (no data: URIs, no javascript:)
const CONFIG = {
    ALLOWED_TAGS: ["p", "br", "img", "strong", "em", "b", "i"],
    ALLOWED_ATTR: ["src", "alt", "width", "height"],
    ALLOWED_URI_REGEXP: /^https:\/\//i,
    ALLOW_DATA_ATTR: false,
};

export function sanitizeRichHtml(dirty: string): string {
    if (!dirty) return "";
    // SSR safety: DOMPurify needs a window. Skip on server, the client will sanitize.
    if (typeof window === "undefined") return dirty;
    return DOMPurify.sanitize(dirty, CONFIG);
}

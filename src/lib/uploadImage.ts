import { endpoints } from "./endpoints";

// Bypasses apiFetch because that helper hardcodes Content-Type: application/json,
// which would clobber the multipart boundary the browser sets for FormData.
export async function uploadImage(file: File): Promise<string> {
  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(endpoints.uploadImage, {
    method: "POST",
    body: fd,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new Error(`Upload failed (${res.status}): ${detail || res.statusText}`);
  }

  const { url } = (await res.json()) as { url: string };
  if (!url) throw new Error("Upload returned no URL.");
  return url;
}

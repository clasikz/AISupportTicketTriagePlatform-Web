import { endpoints } from "./endpoints";
import { AuthTokens } from "@/types";

export class RateLimitError extends Error {
  constructor() {
    super("Too many requests. Please wait a moment.");
    this.name = "RateLimitError";
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  if (isRefreshing) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return null;

      const res = await fetch(endpoints.refresh, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userId");
        window.location.href = "/login";
        return null;
      }

      const tokens: AuthTokens = await res.json();
      // Store new tokens immediately — refresh token is one-time use
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      return tokens.accessToken;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function buildHeaders(accessToken: string | null, extra?: HeadersInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...extra,
  };
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = localStorage.getItem("accessToken");

  const res = await fetch(url, {
    ...options,
    headers: buildHeaders(accessToken, options.headers),
  });

  if (res.status === 403) {
    throw new RateLimitError();
  }

  if (res.status === 401) {
    const newToken = await refreshTokens();
    if (!newToken) return res;

    const retried = await fetch(url, {
      ...options,
      headers: buildHeaders(newToken, options.headers),
    });

    if (retried.status === 403) throw new RateLimitError();
    return retried;
  }

  return res;
}

export async function apiUpload(url: string, formData: FormData): Promise<Response> {
  const accessToken = localStorage.getItem("accessToken");

  const makeHeaders = (token: string | null): HeadersInit =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url, {
    method: "POST",
    headers: makeHeaders(accessToken),
    body: formData,
  });

  if (res.status === 403) throw new RateLimitError();

  if (res.status === 401) {
    const newToken = await refreshTokens();
    if (!newToken) return res;
    const retried = await fetch(url, {
      method: "POST",
      headers: makeHeaders(newToken),
      body: formData,
    });
    if (retried.status === 403) throw new RateLimitError();
    return retried;
  }

  return res;
}

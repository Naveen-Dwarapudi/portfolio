export const SITE_URL_FALLBACK = "http://localhost:3000";

export function resolveSiteUrl(
  raw: string | undefined,
  vercelEnv?: string,
): URL {
  const value = raw?.trim();
  if (!value) {
    if (vercelEnv === "production") {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must be set for Vercel production builds.",
      );
    }
    return new URL(SITE_URL_FALLBACK);
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(new URL(withProtocol).origin);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is not a valid URL: "${value}". Expected e.g. https://example.com`,
    );
  }
}

export const siteUrl = resolveSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.VERCEL_ENV,
);

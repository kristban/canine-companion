function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return "https://caninecompanion.app";
  return /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "Canine Companion";

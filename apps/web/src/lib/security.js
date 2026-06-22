const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://browser.sentry-cdn.com", "https://cdn.jsdelivr.net"],
  "style-src": ["'self'", "'unsafe-inline'", "https://ka-p.fontawesome.com", "https://fonts.googleapis.com"],
  "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://cdn.discordapp.com", "https://avatars.githubusercontent.com"],
  "font-src": ["'self'", "https://ka-p.fontawesome.com", "https://fonts.gstatic.com"],
  "connect-src": ["'self'", "https://*.posthog.com", "https://o*.sentry.io", "wss://*", "https://api.anything.com"],
  "frame-src": ["'none'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
};

export function getCSPString(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

export const SECURE_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": getCSPString(),
};

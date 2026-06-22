const SENTRY_DSN = process.env.SENTRY_DSN;
const IS_ENABLED = !!SENTRY_DSN;

export function initSentry() {
  if (!IS_ENABLED) return;
  if (typeof window === "undefined") return;
  const script = document.createElement("script");
  script.src = "https://browser.sentry-cdn.com/8.0.0/bundle.min.js";
  script.crossOrigin = "anonymous";
  script.onload = () => {
    (window as any).Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || "production",
      release: "tictac-arena@" + (process.env.npm_package_version || "1.0.0"),
      integrations: [
        (window as any).Sentry.browserTracingIntegration(),
        (window as any).Sentry.replayIntegration(),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  };
  document.head.appendChild(script);
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!IS_ENABLED || typeof window === "undefined") {
    console.error("[Sentry disabled]", error, context);
    return;
  }
  try {
    (window as any).Sentry?.captureException(error, { extra: context });
  } catch {
    console.error(error);
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (!IS_ENABLED) return;
  try {
    (window as any).Sentry?.captureMessage(message, level);
  } catch {
    console.log("[Sentry]", message);
  }
}

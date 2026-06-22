const POSTHOG_KEY = typeof document !== "undefined"
  ? document.querySelector('meta[name="posthog-key"]')?.getAttribute("content")
  : process.env.NEXT_PUBLIC_POSTHOG_KEY;

const POSTHOG_HOST = typeof document !== "undefined"
  ? document.querySelector('meta[name="posthog-host"]')?.getAttribute("content")
  : process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

const IS_ENABLED = !!POSTHOG_KEY;

declare global {
  interface Window {
    posthog?: {
      init: (key: string, opts: Record<string, unknown>) => void;
      capture: (event: string, props?: Record<string, unknown>) => void;
      identify: (id: string, props?: Record<string, unknown>) => void;
      reset: () => void;
    };
  }
}

export function initPostHog() {
  if (!IS_ENABLED || typeof window === "undefined") return;
  if ((window as any).posthog) return;

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/posthog-js@1.130.0/dist/array.js";
  script.crossOrigin = "anonymous";
  script.onload = () => {
    (window as any).posthog?.init(POSTHOG_KEY!, {
      api_host: POSTHOG_HOST,
      loaded: (ph: any) => {
        if (process.env.NODE_ENV !== "production") ph.opt_out_capturing();
      },
    });
  };
  document.head.appendChild(script);
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!IS_ENABLED || typeof window === "undefined") return;
  try {
    (window as any).posthog?.capture(event, properties);
  } catch {
    console.log("[PostHog]", event, properties);
  }
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!IS_ENABLED || typeof window === "undefined") return;
  try {
    (window as any).posthog?.identify(userId, properties);
  } catch {
    console.log("[PostHog] identify", userId);
  }
}

export function resetUser() {
  if (!IS_ENABLED || typeof window === "undefined") return;
  try {
    (window as any).posthog?.reset();
  } catch {
    console.log("[PostHog] reset");
  }
}

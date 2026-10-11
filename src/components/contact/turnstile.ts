/** The slice of Cloudflare's Turnstile API the contact form uses. */
export type Turnstile = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      appearance?: "always" | "execute" | "interaction-only";
      size?: "normal" | "flexible" | "compact";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      /** Cloudflare is about to show its interactive challenge. */
      "before-interactive-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ): string;
  reset(widgetId?: string): void;
  remove(widgetId?: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<Turnstile> | null = null;

/**
 * Injects Cloudflare's script once and resolves with window.turnstile. Called
 * on the first focus inside the form, never at page load (27.6 KB gzipped).
 */
export function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    // On any failure, forget this attempt and drop the tag, so a later
    // focus retries cleanly (e.g. after an ad blocker served a stub).
    const fail = (reason: string) => {
      loading = null;
      script.remove();
      reject(new Error(reason));
    };
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : fail("turnstile missing");
    script.onerror = () => fail("turnstile failed to load");
    document.head.append(script);
  });
  return loading;
}

/** For tests: forget a previous load. */
export function resetTurnstileLoader() {
  loading = null;
}

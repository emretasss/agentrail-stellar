import * as Sentry from "@sentry/react";

export function initializeMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION ?? "local",
    sendDefaultPii: false,
    tracesSampleRate: import.meta.env.PROD ? 0.15 : 0,
    integrations: [Sentry.browserTracingIntegration()],
  });
}

export function captureProductError(
  error: unknown,
  context: Record<string, string | number | boolean> = {},
) {
  Sentry.captureException(error, { extra: context });
}

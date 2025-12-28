/**
 * Sentry Error Tracking Configuration
 *
 * Initializes Sentry for error monitoring and performance tracking in production.
 * Sentry is optional - gracefully degrades if not installed.
 *
 * NOTE: To enable Sentry:
 * 1. Install dependencies: npm install @sentry/react @sentry/tracing
 * 2. Set VITE_SENTRY_DSN environment variable
 * 3. Uncomment the import statements and initialization code below
 */

/**
 * Initialize Sentry error tracking
 * Only runs in production environment
 */
export const initSentry = () => {
  // Sentry disabled - install @sentry/react and @sentry/tracing to enable
  console.log('Sentry disabled in non-production environment');

  /* To enable Sentry, uncomment this code:

  if (import.meta.env.MODE !== 'production' || !import.meta.env.VITE_SENTRY_DSN) {
    console.log('Sentry disabled in non-production environment');
    return;
  }

  import('@sentry/react').then((Sentry) => {
    return import('@sentry/tracing').then((tracing) => {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
          new tracing.BrowserTracing({
            tracePropagationTargets: ['localhost', /^https:\/\/api\.financeapp\.com/],
          }),
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        release: 'financeapp-frontend@0.1.0',
        beforeSend(event, hint) {
          if (import.meta.env.MODE !== 'production') return null;
          if (event.request?.headers) {
            delete event.request.headers['Authorization'];
            delete event.request.headers['authorization'];
          }
          return event;
        },
        ignoreErrors: ['top.GLOBALS', 'NetworkError', 'Network request failed'],
        attachStacktrace: true,
        initialScope: {
          tags: { 'app.name': 'financeapp-frontend' },
        },
      });
      console.log('Sentry initialized for error tracking');
    });
  }).catch(() => {
    console.log('Sentry not installed - error tracking disabled');
  });
  */
};

/**
 * Set user context for Sentry
 * Call this after user authentication
 */
export const setSentryUser = (user: { id: string; email?: string; name?: string }) => {
  // Sentry disabled
  if (import.meta.env.MODE === 'development') return;

  /* To enable, uncomment:
  import('@sentry/react').then((Sentry) => {
    Sentry.setUser({ id: user.id, email: user.email, username: user.name });
  }).catch(() => {});
  */
};

/**
 * Clear user context (on logout)
 */
export const clearSentryUser = () => {
  // Sentry disabled
  if (import.meta.env.MODE === 'development') return;

  /* To enable, uncomment:
  import('@sentry/react').then((Sentry) => {
    Sentry.setUser(null);
  }).catch(() => {});
  */
};

/**
 * Manually capture an exception
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.MODE !== 'production') {
    console.error('Error:', error, context);
    return;
  }

  /* To enable, uncomment:
  import('@sentry/react').then((Sentry) => {
    Sentry.captureException(error, { extra: context });
  }).catch(() => {});
  */
};

/**
 * Manually capture a message
 */
export const captureMessage = (message: string, level: string = 'info') => {
  if (import.meta.env.MODE !== 'production') {
    console.log(`[${level}]`, message);
    return;
  }

  /* To enable, uncomment:
  import('@sentry/react').then((Sentry) => {
    Sentry.captureMessage(message, level as any);
  }).catch(() => {});
  */
};

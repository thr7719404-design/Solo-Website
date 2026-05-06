/**
 * OpenTelemetry / Azure Monitor bootstrap.
 *
 * MUST be imported before any other module so that auto-instrumentation can
 * patch `http`, `pg`, `nestjs-core`, etc. before they are required by user
 * code. main.ts therefore imports this file FIRST.
 *
 * If `APPLICATIONINSIGHTS_CONNECTION_STRING` is not set (e.g. local dev), this
 * is a no-op so the app still boots.
 */

const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

if (connectionString) {
  // Lazy require so we don't pull the SDK into the bundle in environments
  // where tracing is disabled.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useAzureMonitor } = require('applicationinsights');

  try {
    useAzureMonitor({
      azureMonitorExporterOptions: { connectionString },
      samplingRatio: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,
      instrumentationOptions: {
        // HTTP & Express auto-instrumented; explicitly opt in to Postgres.
        postgreSql: { enabled: true },
        http: { enabled: true },
      },
      enableLiveMetrics: true,
    });
    // eslint-disable-next-line no-console
    console.log('[tracing] Azure Monitor / OpenTelemetry enabled');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[tracing] Failed to initialise Azure Monitor:', (err as Error).message);
  }
} else {
  // eslint-disable-next-line no-console
  console.log('[tracing] APPLICATIONINSIGHTS_CONNECTION_STRING not set – tracing disabled');
}

export {};

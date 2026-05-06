import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import CircuitBreaker = require('opossum');

export interface CircuitOptions {
  /** Operation timeout in ms before the call is treated as failed. */
  timeout?: number;
  /** % of recent failures that trips the breaker (0–100). */
  errorThresholdPercentage?: number;
  /** Time the breaker stays open before allowing a half-open trial call. */
  resetTimeout?: number;
  /** Rolling window the failure ratio is measured over (ms). */
  rollingCountTimeout?: number;
  /** Minimum number of calls in the window before the ratio is evaluated. */
  volumeThreshold?: number;
}

const DEFAULTS: Required<CircuitOptions> = {
  timeout: 10_000,
  errorThresholdPercentage: 50,
  resetTimeout: 30_000,
  rollingCountTimeout: 60_000,
  volumeThreshold: 5,
};

/**
 * Lightweight circuit-breaker registry.
 *
 * Wraps async calls to flaky third-party dependencies (Stripe, SMTP, Tabby,
 * Tamara). Once the breaker trips it short-circuits subsequent calls with a
 * 503 `ServiceUnavailableException` for `resetTimeout` ms instead of letting
 * each request hang for the full network timeout — preventing a downstream
 * outage from cascading into resource exhaustion of our backend.
 *
 * One breaker is created per logical name on first use. Breakers are kept in
 * memory; this is fine because Container Apps replicas don't share state and
 * each replica makes independent decisions about an upstream's health.
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers = new Map<string, CircuitBreaker<any[], any>>();

  /**
   * Execute `fn` through the named breaker. Subsequent calls under the same
   * name reuse the same breaker (its statistics span all callers).
   */
  async execute<T>(name: string, fn: () => Promise<T>, options: CircuitOptions = {}): Promise<T> {
    const breaker = this.getOrCreate(name, options);
    try {
      // Pass `fn` as an arg; the breaker's action invokes it. This way one
      // breaker per upstream can serve different call sites without baking a
      // specific function into the breaker.
      return (await breaker.fire(fn)) as T;
    } catch (err) {
      if (breaker.opened) {
        throw new ServiceUnavailableException(
          `Upstream "${name}" is currently unavailable. Please try again shortly.`,
        );
      }
      throw err;
    }
  }

  private getOrCreate(name: string, options: CircuitOptions): CircuitBreaker<any[], any> {
    const existing = this.breakers.get(name);
    if (existing) return existing;

    const opts = { ...DEFAULTS, ...options };
    // The action is set per-call via `breaker.fire`; use a placeholder here.
    const breaker = new CircuitBreaker(async (action: () => Promise<any>) => action(), {
      timeout: opts.timeout,
      errorThresholdPercentage: opts.errorThresholdPercentage,
      resetTimeout: opts.resetTimeout,
      rollingCountTimeout: opts.rollingCountTimeout,
      volumeThreshold: opts.volumeThreshold,
      name,
    });

    breaker.on('open', () => this.logger.warn(`Circuit OPEN for "${name}"`));
    breaker.on('halfOpen', () => this.logger.log(`Circuit HALF-OPEN for "${name}" (trial call)`));
    breaker.on('close', () => this.logger.log(`Circuit CLOSED for "${name}"`));
    breaker.on('reject', () => this.logger.debug?.(`Circuit "${name}" rejected call (open)`));

    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * Re-shaped fire so callers pass the action at execute time without it being
   * baked into the breaker. opossum supports passing args through `fire(...)`
   * to the underlying action — we exploit that by having the action be
   * "invoke whatever async fn you handed me".
   */
  // Note: keep the fire wrapper hidden; consumers only see `execute()`.
}

// Override: opossum's `fire` is variadic; expose a typed helper for clarity.
// (Implemented inline by replacing `breaker.fire()` above with `breaker.fire(fn)`.)

// App-wide configuration
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '',
  appName: 'Solo',
  currency: 'AED',
  defaultCountry: 'AE',
} as const;

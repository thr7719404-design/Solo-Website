import * as Joi from 'joi';

/**
 * Validates required environment variables at boot.
 * Missing required vars will fail-fast with a clear error.
 */
export const envValidationSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),

  // Database (required)
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),

  // JWT (required). Recommend ≥32 chars in prod; we enforce ≥16 here so
  // existing deployments keep booting while operators rotate to stronger keys.
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // Frontend / CORS
  FRONTEND_URL: Joi.string().default('http://localhost:5000'),

  // Throttler
  THROTTLE_TTL: Joi.number().integer().min(1).default(60),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(1000),
  THROTTLE_STRICT_TTL: Joi.number().integer().min(1).default(900),
  THROTTLE_STRICT_LIMIT: Joi.number().integer().min(1).default(5),

  // Stripe (optional in dev, but if provided must be valid)
  STRIPE_SECRET_KEY: Joi.string().optional().allow(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(''),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional().allow(''),

  // SMTP (optional)
  SMTP_HOST: Joi.string().optional().allow(''),
  SMTP_PORT: Joi.number().integer().optional(),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASS: Joi.string().optional().allow(''),
  SMTP_SECURE: Joi.string().optional().allow(''),
  EMAIL_FROM: Joi.string().optional().allow(''),

  // Storage
  STORAGE_TYPE: Joi.string().valid('local', 's3', 'azure').default('local'),
  UPLOAD_PATH: Joi.string().optional(),
  UPLOAD_DIR: Joi.string().optional(),
  MAX_FILE_SIZE: Joi.number().integer().optional(),

  // AWS S3 (optional)
  AWS_REGION: Joi.string().optional().allow(''),
  AWS_S3_BUCKET: Joi.string().optional().allow(''),
  AWS_S3_ENDPOINT: Joi.string().optional().allow(''),
  AWS_ACCESS_KEY_ID: Joi.string().optional().allow(''),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional().allow(''),
  AWS_S3_CDN_URL: Joi.string().optional().allow(''),

  // Azure Blob (optional)
  AZURE_STORAGE_CONNECTION_STRING: Joi.string().optional().allow(''),
  AZURE_STORAGE_CONTAINER: Joi.string().optional().allow(''),

  // Admin seed
  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_PASSWORD: Joi.string().min(8).optional(),

  // App metadata
  APP_NAME: Joi.string().default('Solo Ecommerce'),
  APP_URL: Joi.string().optional(),
}).unknown(true); // allow other vars (Azure injects many)

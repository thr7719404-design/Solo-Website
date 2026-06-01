// Tracing must be the first import so OpenTelemetry can patch modules before
// they are required by NestJS / Express / Prisma.
import './tracing';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

// Build marker: subcategories-feature-v1 (forces image rebuild)

// ============================================================================
// PROCESS-LEVEL CRASH GUARDS
// NestJS app.enableShutdownHooks() (called below in bootstrap) registers SIGTERM/
// SIGINT listeners that drain in-flight HTTP requests, run OnModuleDestroy hooks
// (Prisma $disconnect), and close the HTTP server. We only add fatal-error guards
// here so unhandled rejections / uncaught exceptions get logged before the
// process terminates.
// ============================================================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED_REJECTION at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT_EXCEPTION:', error);
});

async function bootstrap() {
  console.log('BOOTSTRAP_START');
  try {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Enable raw body for Stripe webhook signature verification
    bufferLogs: true, // Buffer bootstrap logs until pino logger is attached
  });
  // Use pino as the application logger (structured JSON in prod, pretty in dev).
  app.useLogger(app.get(Logger));
  const configService = app.get(ConfigService);

  // ============================================================================
  // STATIC FILE SERVING
  // ============================================================================

  // Serve uploaded files
  const uploadDir = configService.get<string>('UPLOAD_DIR', join(process.cwd(), 'uploads'));
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  // ============================================================================
  // SECURITY: OWASP Top 10 & ASVS Level 2 Compliance
  // ============================================================================

  // 1. Security Headers (helmet)
  const isDevelopment = configService.get<string>('NODE_ENV') === 'development';
  
  app.use(
    helmet({
      hsts: isDevelopment ? false : {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      contentSecurityPolicy: false, // Disable CSP in development
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 1b. Response Compression (gzip / brotli) — large reduction in API payload size.
  app.use(compression());

  // 1c. Strip cache-busting query params (_t) before DTO validation.
  // Frontend (especially admin) appends ?_t=<timestamp> to bypass browser+server cache.
  // We delete it here so whitelist validation doesn't reject it, but the unique URL still
  // produces a unique CacheInterceptor key (cache miss = fresh data).
  app.use((req: any, _res: any, next: any) => {
    if (req.query && Object.prototype.hasOwnProperty.call(req.query, '_t')) {
      delete req.query._t;
    }
    next();
  });

  // 2. CORS Configuration
  const frontendUrlRaw = configService.get<string>('FRONTEND_URL') || 'http://localhost:5000';
  const frontendUrls = frontendUrlRaw.split(',').map(u => u.trim()).filter(Boolean);
  app.enableCors({
    origin: [
      ...frontendUrls, 
      ...(isDevelopment ? [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] : []),
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
  });

  // 3. Global Validation Pipe (Input Validation)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. Global Prefix
  app.setGlobalPrefix('api');

  // 4b. URI Versioning (opt-in via @Version on controllers; existing routes stay unversioned)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: VERSION_NEUTRAL,
    prefix: 'v',
  });

  // 4c. OpenAPI / Swagger documentation (production-safe — no secrets exposed)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Collation Foundation Curation Ecommerce API')
    .setDescription('REST API for Collation Foundation Curation Ecommerce backend')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('health')
    .addTag('auth')
    .addTag('products')
    .addTag('orders')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // 5. Graceful Shutdown — drain in-flight requests, run OnModuleDestroy
  // hooks (Prisma $disconnect, queues, etc.), then close HTTP server.
  // Container Apps sends SIGTERM and waits ~30s before SIGKILL.
  app.enableShutdownHooks();

  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
  console.log('ABOUT_TO_LISTEN port=' + port);
  await app.listen(port, '0.0.0.0');
  console.log('LISTENING port=' + port + ' address=0.0.0.0');

  // Explicit shutdown logging so platform deploys/restarts are observable.
  for (const sig of ['SIGTERM', 'SIGINT'] as const) {
    process.once(sig, () => {
      console.log(`${sig} received — draining and shutting down gracefully`);
    });
  }

  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║   🛍️  Collation Foundation Curation Ecommerce Backend API                          ║
  ║                                                            ║
  ║   Environment: ${configService.get('NODE_ENV') || 'development'}                                   ║
  ║   Port: ${port}                                              ║
  ║   API: http://localhost:${port}/api                         ║
  ║                                                            ║
  ║   🔒 Security: OWASP Top 10 + ASVS Level 2                ║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
  `);
  
  console.log('BOOTSTRAP_COMPLETE - Server should be running');
  } catch (bootstrapError) {
    console.error('BOOTSTRAP_ERROR:', bootstrapError);
    throw bootstrapError;
  }
}

bootstrap().catch((error) => {
  console.error('BOOTSTRAP_CATCH_ERROR:');
  console.error(error);
  // Do NOT call process.exit() - let it run
});

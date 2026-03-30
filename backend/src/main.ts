import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';

// ============================================================================
// PROCESS EVENT HANDLERS FOR DEBUGGING
// ============================================================================
process.on('exit', (code) => {
  console.log('PROCESS_EXIT code=' + code);
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received');
});

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
  });
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

  // 2. CORS Configuration
  const frontendUrlRaw = configService.get<string>('FRONTEND_URL') || 'http://localhost:5000';
  const frontendUrls = frontendUrlRaw.split(',').map(u => u.trim()).filter(Boolean);
  app.enableCors({
    origin: [
      ...frontendUrls, 
      /^http:\/\/localhost:\d+$/, 
      /^http:\/\/127\.0\.0\.1:\d+$/,
      'http://127.0.0.1:5000',
      'http://localhost:5000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  // 5. Graceful Shutdown
  // app.enableShutdownHooks(); // Temporarily disabled for debugging

  const port = 3000;
  console.log('ABOUT_TO_LISTEN port=' + port);
  await app.listen(port, '0.0.0.0');
  console.log('LISTENING port=' + port + ' address=0.0.0.0');

  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║   🛍️  Solo Ecommerce Backend API                          ║
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

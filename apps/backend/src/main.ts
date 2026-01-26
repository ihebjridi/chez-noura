import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpStatus } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { validateEnv } from './common/config/env.validation';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { setupSwagger } from './common/config/swagger.config';

async function bootstrap() {
  // Validate environment variables
  try {
    validateEnv(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Add request ID middleware
  app.use(new RequestIdMiddleware().use.bind(new RequestIdMiddleware()));

  // Global validation pipe for input sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      stopAtFirstError: false, // Collect all validation errors
      validationError: {
        target: false, // Don't expose target object
        value: false, // Don't expose invalid values
      },
    }),
  );

  // Enable CORS for frontend applications
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : [
        'http://localhost:3001', // admin-web (dev)
        'http://localhost:3002', // business-web (dev)
        'http://localhost:3003', // employee-web (dev)
        'https://admin.chez-noura.com', // admin-web (prod)
        'https://business.chez-noura.com', // business-web (prod)
        'https://client.chez-noura.com', // employee-web (prod)
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Idempotency-Key'],
  });

  // Setup Swagger documentation
  setupSwagger(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();

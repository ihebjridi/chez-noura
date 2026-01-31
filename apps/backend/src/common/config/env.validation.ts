import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumberString,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsNumberString()
  @IsOptional()
  PORT?: string;

  @IsString()
  @IsOptional()
  NODE_ENV?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  // Email/SMTP Configuration (all optional - email service will be disabled if not configured)
  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsNumberString()
  @IsOptional()
  SMTP_PORT?: string;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD?: string;

  @IsString()
  @IsOptional()
  SMTP_FROM_EMAIL?: string;

  @IsString()
  @IsOptional()
  SMTP_FROM_NAME?: string;

  @IsString()
  @IsOptional()
  SMTP_SECURE?: string;

  // Cloudflare R2 Storage (required for image uploads)
  @IsString()
  @IsNotEmpty()
  R2_ACCOUNT_ID: string;

  @IsString()
  @IsNotEmpty()
  R2_ACCESS_KEY_ID: string;

  @IsString()
  @IsNotEmpty()
  R2_SECRET_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  R2_BUCKET: string;

  /** Public base URL for R2 objects (e.g. https://pub-xxx.r2.dev or custom domain). No trailing slash. */
  @IsString()
  @IsNotEmpty()
  R2_PUBLIC_URL: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors
        .map((e) => Object.values(e.constraints || {}).join(', '))
        .join('\n')}`,
    );
  }

  return validatedConfig;
}

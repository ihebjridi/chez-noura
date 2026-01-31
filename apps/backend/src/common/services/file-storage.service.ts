import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

export interface FileUploadResult {
  filename: string;
  path: string;
  url: string;
}

@Injectable()
export class FileStorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  /** Local uploads dir for backward compatibility when deleting legacy /uploads/ URLs */
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucket = process.env.R2_BUCKET ?? '';
    this.publicBaseUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId ?? '',
        secretAccessKey: secretAccessKey ?? '',
      },
    });
  }

  /**
   * Upload a variant image to R2
   */
  async uploadVariantImage(file: Express.Multer.File): Promise<FileUploadResult> {
    this.validateFile(file);
    return this.uploadToR2(file, 'variants');
  }

  /**
   * Upload a business logo to R2
   */
  async uploadBusinessLogo(file: Express.Multer.File): Promise<FileUploadResult> {
    this.validateFile(file);
    return this.uploadToR2(file, 'businesses');
  }

  /**
   * Delete a file by URL. Supports both R2 URLs and legacy /uploads/ paths.
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) {
      return;
    }

    try {
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        const key = this.getR2KeyFromUrl(fileUrl);
        if (key) {
          await this.s3.send(
            new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
          );
        }
        return;
      }

      if (fileUrl.startsWith('/uploads/')) {
        this.deleteLegacyFile(fileUrl);
      }
    } catch (error) {
      console.error(`Failed to delete file ${fileUrl}:`, error);
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  /**
   * Upload file to R2 and return public URL
   */
  private async uploadToR2(
    file: Express.Multer.File,
    category: string,
  ): Promise<FileUploadResult> {
    const fileExtension =
      path.extname(file.originalname) ||
      this.getExtensionFromMimeType(file.mimetype);
    const filename = `${uuidv4()}${fileExtension}`;
    const key = `${category}/${filename}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = `${this.publicBaseUrl}/${key}`;

    return {
      filename,
      path: key,
      url,
    };
  }

  /**
   * Extract R2 object key from a full URL or path
   */
  private getR2KeyFromUrl(fileUrl: string): string | null {
    let pathname: string;
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      try {
        pathname = new URL(fileUrl).pathname;
      } catch {
        return null;
      }
    } else {
      pathname = fileUrl;
    }
    const key = pathname.replace(/^\//, '');
    return key || null;
  }

  /**
   * Delete legacy file from local disk (backward compatibility)
   */
  private deleteLegacyFile(fileUrl: string): void {
    const urlPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    const filePath = path.join(process.cwd(), urlPath);
    const normalizedPath = path.normalize(filePath);
    const normalizedUploadsDir = path.normalize(this.uploadsDir);

    if (!normalizedPath.startsWith(normalizedUploadsDir)) {
      return;
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return mimeToExt[mimeType] || '.jpg';
  }
}

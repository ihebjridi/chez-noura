import { Injectable, BadRequestException } from '@nestjs/common';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadResult {
  filename: string;
  path: string;
  url: string;
}

@Injectable()
export class FileStorageService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private readonly variantsDir = path.join(this.uploadsDir, 'variants');
  private readonly businessesDir = path.join(this.uploadsDir, 'businesses');
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  constructor() {
    // Ensure upload directories exist
    this.ensureDirectoryExists(this.uploadsDir);
    this.ensureDirectoryExists(this.variantsDir);
    this.ensureDirectoryExists(this.businessesDir);
  }

  /**
   * Upload a variant image
   */
  async uploadVariantImage(file: Express.Multer.File): Promise<FileUploadResult> {
    this.validateFile(file);
    return this.saveFile(file, this.variantsDir, 'variants');
  }

  /**
   * Upload a business logo
   */
  async uploadBusinessLogo(file: Express.Multer.File): Promise<FileUploadResult> {
    this.validateFile(file);
    return this.saveFile(file, this.businessesDir, 'businesses');
  }

  /**
   * Delete a file by URL
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) {
      return;
    }

    try {
      // Extract path from URL (e.g., /uploads/variants/uuid.jpg)
      let urlPath: string;
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        const url = new URL(fileUrl);
        urlPath = url.pathname;
      } else {
        // Assume it's already a path
        urlPath = fileUrl;
      }

      const filePath = path.join(process.cwd(), urlPath);

      // Verify the file is within the uploads directory for security
      const normalizedPath = path.normalize(filePath);
      const normalizedUploadsDir = path.normalize(this.uploadsDir);

      if (!normalizedPath.startsWith(normalizedUploadsDir)) {
        throw new BadRequestException('Invalid file path');
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Log error but don't throw - file deletion failures shouldn't break the flow
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
   * Save file to disk
   */
  private async saveFile(
    file: Express.Multer.File,
    directory: string,
    category: string,
  ): Promise<FileUploadResult> {
    // Generate unique filename
    const fileExtension = path.extname(file.originalname) || this.getExtensionFromMimeType(file.mimetype);
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(directory, filename);

    // Ensure directory exists
    this.ensureDirectoryExists(directory);

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Generate URL path
    const url = `/uploads/${category}/${filename}`;

    return {
      filename,
      path: filePath,
      url,
    };
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

  /**
   * Ensure directory exists, create if it doesn't
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

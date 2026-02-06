import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private readonly bucket = process.env.AWS_BUCKET!;
  private readonly region = process.env.AWS_REGION!;

  private readonly s3 = new S3Client({
    region: this.region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_SECRET_KEY!,
    },
  });

  /**
   * Upload file to S3
   * ❌ Does NOT return signed URL
   * ✅ Returns only the object key
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ key: string }> {
    try {
      if (!file) {
        throw new BadRequestException('File is required');
      }

      const extension = file?.originalname.split('.').pop();
      const key = `${folder}/${randomUUID()}.${extension}`;

      console.log('Generated S3 Key:', key);

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file?.buffer,
          ContentType: file?.mimetype,
          ServerSideEncryption: 'AES256', // ✅ prod-grade
        }),
      );

      return { key };
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  /**
   * Generate signed URL (READ)
   * ✅ Call this when frontend needs to access media
   */
  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3, command, {
        expiresIn: expiresInSeconds,
      });
    } catch {
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch {
      throw new InternalServerErrorException('Failed to delete file from S3');
    }
  }

  
}

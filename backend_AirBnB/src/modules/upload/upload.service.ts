import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(base64Image: string, folder?: string): Promise<string> {
    try {
      // Base64 image should already include data URL prefix
      // If it doesn't, we'll use it as is
      const uploadOptions: any = {
        resource_type: 'image',
        folder: folder || 'airbnb-listings',
      };

      // Cloudinary accepts base64 data URL directly
      const result = await cloudinary.uploader.upload(
        base64Image,
        uploadOptions
      );

      return result.secure_url;
    } catch (error) {
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }

  async uploadMultipleImages(
    base64Images: string[],
    folder?: string,
  ): Promise<string[]> {
    try {
      const uploadPromises = base64Images.map((image) =>
        this.uploadImage(image, folder),
      );
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      throw new Error(
        `Failed to upload images to Cloudinary: ${error.message}`,
      );
    }
  }
}

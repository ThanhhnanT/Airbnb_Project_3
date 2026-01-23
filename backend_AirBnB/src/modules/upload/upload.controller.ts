import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload một ảnh lên Cloudinary' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          description: 'Base64 encoded image string',
        },
        folder: {
          type: 'string',
          description: 'Folder name in Cloudinary (optional)',
        },
      },
    },
  })
  async uploadImage(
    @Body('image') base64Image: string,
    @Body('folder') folder?: string,
  ) {
    if (!base64Image) {
      throw new Error('Image is required');
    }
    const url = await this.uploadService.uploadImage(base64Image, folder);
    return { url };
  }

  @Post('images')
  @ApiOperation({ summary: 'Upload nhiều ảnh lên Cloudinary' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Array of base64 encoded image strings',
        },
        folder: {
          type: 'string',
          description: 'Folder name in Cloudinary (optional)',
        },
      },
    },
  })
  async uploadImages(
    @Body('images') base64Images: string[],
    @Body('folder') folder?: string,
  ) {
    if (!base64Images || base64Images.length === 0) {
      throw new Error('Images array is required');
    }
    const urls = await this.uploadService.uploadMultipleImages(
      base64Images,
      folder,
    );
    return { urls };
  }
}

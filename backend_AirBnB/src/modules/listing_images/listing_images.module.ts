import { Module } from '@nestjs/common';
import { ListingImagesService } from './listing_images.service';
import { ListingImagesController } from './listing_images.controller';
import { ListingImage, ListingImageSchema } from './schemas/listing_image.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ListingImage.name,
        schema: ListingImageSchema,
      },
    ]),
  ],
  controllers: [ListingImagesController],
  providers: [ListingImagesService],
  exports: [ListingImagesService],
})
export class ListingImagesModule {}

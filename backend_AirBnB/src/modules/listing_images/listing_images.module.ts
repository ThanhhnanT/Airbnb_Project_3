import { Module } from '@nestjs/common';
import { ListingImagesService } from './listing_images.service';
import { ListingImagesController } from './listing_images.controller';

@Module({
  controllers: [ListingImagesController],
  providers: [ListingImagesService],
})
export class ListingImagesModule {}

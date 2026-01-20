import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ListingImagesService } from './listing_images.service';
import { CreateListingImageDto } from './dto/create-listing_image.dto';
import { UpdateListingImageDto } from './dto/update-listing_image.dto';
import { Public } from '@/auth/decorate/customize';

@Controller('listing-images')
export class ListingImagesController {
  constructor(private readonly listingImagesService: ListingImagesService) {}

  @Post()
  create(@Body() createListingImageDto: CreateListingImageDto) {
    return this.listingImagesService.create(createListingImageDto);
  }

  @Public()
  @Get()
  findAll(@Query('listingId') listingId?: string) {
    return this.listingImagesService.findAll(listingId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingImagesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateListingImageDto: UpdateListingImageDto) {
    return this.listingImagesService.update(id, updateListingImageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.listingImagesService.remove(id);
  }
}

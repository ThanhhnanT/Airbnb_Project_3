import { Injectable } from '@nestjs/common';
import { CreateListingImageDto } from './dto/create-listing_image.dto';
import { UpdateListingImageDto } from './dto/update-listing_image.dto';

@Injectable()
export class ListingImagesService {
  create(createListingImageDto: CreateListingImageDto) {
    return 'This action adds a new listingImage';
  }

  findAll() {
    return `This action returns all listingImages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} listingImage`;
  }

  update(id: number, updateListingImageDto: UpdateListingImageDto) {
    return `This action updates a #${id} listingImage`;
  }

  remove(id: number) {
    return `This action removes a #${id} listingImage`;
  }
}

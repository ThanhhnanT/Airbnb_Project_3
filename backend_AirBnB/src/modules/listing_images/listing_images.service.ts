import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateListingImageDto } from './dto/create-listing_image.dto';
import { UpdateListingImageDto } from './dto/update-listing_image.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ListingImage, ListingImageDocument } from './schemas/listing_image.schema';
import { Model } from 'mongoose';

@Injectable()
export class ListingImagesService {
  constructor(
    @InjectModel(ListingImage.name) private listingImageModel: Model<ListingImageDocument>,
  ) {}

  async create(createListingImageDto: CreateListingImageDto): Promise<ListingImage> {
    try {
      const createdImage = new this.listingImageModel(createListingImageDto);
      return await createdImage.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating listing image: ${error.message}`);
    }
  }

  async findAll(listingId?: string): Promise<ListingImage[]> {
    try {
      const filter = listingId ? { listing_id: listingId } : {};
      return await this.listingImageModel.find(filter).exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding listing images: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<ListingImage> {
    try {
      const image = await this.listingImageModel.findById(id).exec();
      if (!image) {
        throw new NotFoundException(`Listing image with ID ${id} not found`);
      }
      return image;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding listing image: ${error.message}`);
    }
  }

  async update(id: string, updateListingImageDto: UpdateListingImageDto): Promise<ListingImage> {
    try {
      const updatedImage = await this.listingImageModel
        .findByIdAndUpdate(id, updateListingImageDto, { new: true })
        .exec();
      if (!updatedImage) {
        throw new NotFoundException(`Listing image with ID ${id} not found`);
      }
      return updatedImage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating listing image: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.listingImageModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Listing image with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting listing image: ${error.message}`);
    }
  }
}

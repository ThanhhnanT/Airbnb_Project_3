import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';
import { Model } from 'mongoose';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
  ) {}

  async create(createFavoriteDto: CreateFavoriteDto): Promise<Favorite> {
    try {
      const existingFavorite = await this.favoriteModel.findOne({
        user_id: createFavoriteDto.user_id,
        listing_id: createFavoriteDto.listing_id,
      }).exec();
      
      if (existingFavorite) {
        throw new BadRequestException('Listing already in favorites');
      }

      const createdFavorite = new this.favoriteModel(createFavoriteDto);
      return await createdFavorite.save();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error creating favorite: ${error.message}`);
    }
  }

  async findAll(userId?: string): Promise<Favorite[]> {
    try {
      const filter = userId ? { user_id: userId } : {};
      return await this.favoriteModel.find(filter).populate('listing_id').exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding favorites: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Favorite> {
    try {
      const favorite = await this.favoriteModel.findById(id).populate('listing_id user_id').exec();
      if (!favorite) {
        throw new NotFoundException(`Favorite with ID ${id} not found`);
      }
      return favorite;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding favorite: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.favoriteModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Favorite with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting favorite: ${error.message}`);
    }
  }

  async removeByUserAndListing(userId: string, listingId: string): Promise<void> {
    try {
      const result = await this.favoriteModel.findOneAndDelete({
        user_id: userId,
        listing_id: listingId,
      }).exec();
      if (!result) {
        throw new NotFoundException('Favorite not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting favorite: ${error.message}`);
    }
  }
}

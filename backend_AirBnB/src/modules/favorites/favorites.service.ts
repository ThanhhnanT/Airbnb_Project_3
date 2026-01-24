import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';
import { Model, Types } from 'mongoose';

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
      let filter: any = {};
      if (userId) {
        // Try both ObjectId and string formats for compatibility
        const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : new Types.ObjectId(userId);
        filter = {
          $or: [
            { user_id: userObjectId },
            { user_id: userId },
          ]
        };
      }
      return await this.favoriteModel.find(filter).populate('listing_id').exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding favorites: ${error.message}`);
    }
  }

  async checkIsFavorite(userId: string, listingId: string): Promise<boolean> {
    try {
      // Convert to ObjectId for proper querying
      const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : new Types.ObjectId(userId);
      const listingObjectId = Types.ObjectId.isValid(listingId) ? new Types.ObjectId(listingId) : new Types.ObjectId(listingId);

      // Try both ObjectId and string formats for compatibility
      const favorite = await this.favoriteModel.findOne({
        $or: [
          { user_id: userObjectId, listing_id: listingObjectId },
          { user_id: userId, listing_id: listingId },
        ]
      }).exec();
      return !!favorite;
    } catch (error) {
      throw new InternalServerErrorException(`Error checking favorite: ${error.message}`);
    }
  }

  async toggleFavorite(userId: string, listingId: string): Promise<{ isFavorite: boolean; favorite?: Favorite }> {
    try {
      // Convert to ObjectId for proper querying
      const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : new Types.ObjectId(userId);
      const listingObjectId = Types.ObjectId.isValid(listingId) ? new Types.ObjectId(listingId) : new Types.ObjectId(listingId);

      console.log('[FavoritesService] toggleFavorite - userId:', userId, 'listingId:', listingId);
      console.log('[FavoritesService] toggleFavorite - userObjectId:', userObjectId.toString(), 'listingObjectId:', listingObjectId.toString());

      // Try both ObjectId and string formats for compatibility
      const existingFavorite = await this.favoriteModel.findOne({
        $or: [
          { user_id: userObjectId, listing_id: listingObjectId },
          { user_id: userId, listing_id: listingId },
        ]
      }).exec();

      console.log('[FavoritesService] toggleFavorite - existingFavorite:', existingFavorite ? existingFavorite._id : 'none');

      if (existingFavorite) {
        await this.favoriteModel.findByIdAndDelete(existingFavorite._id).exec();
        console.log('[FavoritesService] toggleFavorite - removed favorite');
        return { isFavorite: false };
      } else {
        // Create new favorite
        const createdFavorite = new this.favoriteModel({
          user_id: userObjectId,
          listing_id: listingObjectId,
        });
        
        try {
          const saved = await createdFavorite.save();
        console.log('[FavoritesService] toggleFavorite - created favorite:', saved._id);
          return { isFavorite: true, favorite: saved };
        } catch (saveError: any) {
          console.error('[FavoritesService] toggleFavorite - save error:', saveError);
          // Handle duplicate key error (race condition or unique index violation)
          if (saveError.code === 11000 || saveError.name === 'MongoServerError' || saveError.message?.includes('duplicate')) {
            // If duplicate, fetch the existing one
            const existing = await this.favoriteModel.findOne({
              $or: [
                { user_id: userObjectId, listing_id: listingObjectId },
                { user_id: userId, listing_id: listingId },
              ]
            }).exec();
            if (existing) {
              console.log('[FavoritesService] toggleFavorite - found existing after duplicate error');
              return { isFavorite: true, favorite: existing };
            }
          }
          throw saveError;
        }
      }
    } catch (error: any) {
      console.error('[FavoritesService] toggleFavorite - error:', error);
      throw new InternalServerErrorException(`Error toggling favorite: ${error.message}`);
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

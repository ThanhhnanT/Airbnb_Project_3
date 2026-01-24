import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, BadRequestException, Query } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createFavoriteDto: CreateFavoriteDto, @Req() req: any) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    if (!userId) {
      throw new BadRequestException('Người dùng chưa đăng nhập');
    }
    // Override user_id from body with authenticated user
    createFavoriteDto.user_id = userId.toString();
    return this.favoritesService.create(createFavoriteDto);
  }

  @Get('my-favorites')
  @UseGuards(JwtAuthGuard)
  getMyFavorites(@Req() req: any) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    if (!userId) {
      throw new BadRequestException('Người dùng chưa đăng nhập');
    }
    return this.favoritesService.findAll(userId.toString());
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  checkIsFavorite(@Req() req: any, @Query('listing_id') listingId: string) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    if (!userId) {
      throw new BadRequestException('Người dùng chưa đăng nhập');
    }
    if (!listingId) {
      throw new BadRequestException('Listing ID không được để trống');
    }
    return this.favoritesService.checkIsFavorite(userId.toString(), listingId);
  }

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  toggleFavorite(@Req() req: any, @Body() body: { listing_id: string }) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    if (!userId) {
      throw new BadRequestException('Người dùng chưa đăng nhập');
    }
    if (!body.listing_id) {
      throw new BadRequestException('Listing ID không được để trống');
    }
    return this.favoritesService.toggleFavorite(userId.toString(), body.listing_id);
  }

  @Get()
  findAll() {
    return this.favoritesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.favoritesService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.favoritesService.remove(id);
  }
}

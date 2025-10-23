import { PartialType } from '@nestjs/mapped-types';
import { CreateListingImageDto } from './create-listing_image.dto';

export class UpdateListingImageDto extends PartialType(CreateListingImageDto) {}

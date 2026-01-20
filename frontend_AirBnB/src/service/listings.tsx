import { get, post } from "@/helper/api";
import axios from "axios";

export interface Listing {
  _id: string;
  host_id?: {
    _id: string;
    name: string;
    avatar_url?: string;
  };
  title: string;
  description?: string;
  city: string;
  country: string;
  street?: string;
  latitude?: number;
  longitude?: number;
  price_base: number;
  currency: string;
  guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  avg_rating: number;
  review_count: number;
  amenities?: string[];
  cover_image?: string | null;
  availability?: {
    isAvailable: boolean;
    checkInDate: string | Date;
    checkOutDate: string | Date;
    nights: number;
    totalPrice: number;
    currency: string;
  } | null;
}

export interface ListingImage {
  _id: string | { $oid?: string; toString?: () => string };
  listing_id: string | { $oid?: string; toString?: () => string } | { toString(): string };
  image_url: string[];
  is_cover?: boolean;
}

export interface SearchParams {
  city?: string;
  country?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  amenities?: string[];
  bedrooms_min?: number;
  beds_min?: number;
  bathrooms_min?: number;
  keyword?: string;
}

export interface SearchResponse {
  data: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Fetch all listings
export const getAllListings = async (limit: number = 20): Promise<Listing[]> => {
  try {
    const result = await post('listings/search', {
      limit,
      page: 1,
      sort_by: 'createdAt',
      sort_order: 'desc'
    });
    return result?.data || [];
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
};

// Fetch listings with search params
export const searchListings = async (params: SearchParams): Promise<SearchResponse> => {
  const res = await post('listings/search', params);
  return res;
};

// Fetch images for a listing
export const getListingImages = async (listingId: string): Promise<ListingImage[]> => {
  try {
    const result = await get(`listing-images?listingId=${listingId}`);

    if (!result) {
      console.warn('API call returned undefined, possible CORS or network error');
      // Fallback: try without credentials in case backend CORS not restarted yet
      const API_DOMAIN = process.env.API || 'http://localhost:9000/';
      try {
        const fallback = await axios.get(`${API_DOMAIN}listing-images`, {
          params: { listingId },
          withCredentials: false,
        });
        return Array.isArray(fallback.data) ? fallback.data : [];
      } catch (fallbackErr) {
        console.error('Fallback image fetch failed:', fallbackErr);
        return [];
      }
    }

    const images = Array.isArray(result.data) ? result.data : [];
    return images;
  } catch (error) {
    console.error('Error fetching listing images:', error);
    return [];
  }
};

// Fetch images for multiple listings (batch)
export const getListingsImages = async (listingIds: string[]): Promise<Record<string, ListingImage[]>> => {
  try {
    // Prefer server-side filtering when supported
    const imagesMap: Record<string, ListingImage[]> = {};

    for (const id of listingIds) {
      const imgs = await getListingImages(id);
      imagesMap[id] = imgs;
    }

    return imagesMap;
  } catch (error) {
    console.error('Error fetching listings images:', error);
    return {};
  }
};

// Get first image URL for a listing
export const getListingFirstImage = async (listingId: string): Promise<string | null> => {
  const images = await getListingImages(listingId);
  if (images.length > 0) {
    const coverImage = images.find(img => img.is_cover);
    if (coverImage && coverImage.image_url && coverImage.image_url.length > 0) {
      return coverImage.image_url[0];
    }
    if (images[0].image_url && images[0].image_url.length > 0) {
      return images[0].image_url[0];
    }
  }
  return null;
};


import { getAccess, postAccess, deleteData } from "@/helper/api";
import { Listing } from "./listings";

export interface Favorite {
  _id: string;
  user_id: string;
  listing_id: Listing | string;
  createdAt?: string;
  updatedAt?: string;
}

// Get user's favorites
export const getMyFavorites = async (): Promise<Favorite[]> => {
  try {
    const result = await getAccess('favorites/my-favorites');
    return result || [];
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  }
};

// Check if a listing is favorited
export const checkIsFavorite = async (listingId: string): Promise<boolean> => {
  try {
    const result = await getAccess('favorites/check', { listing_id: listingId });
    return result || false;
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

// Toggle favorite (add or remove)
export const toggleFavorite = async (listingId: string): Promise<{ isFavorite: boolean }> => {
  try {
    const result = await postAccess('favorites/toggle', { listing_id: listingId });
    return result;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

// Remove favorite
export const removeFavorite = async (favoriteId: string): Promise<void> => {
  try {
    await deleteData(`favorites/${favoriteId}`);
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};

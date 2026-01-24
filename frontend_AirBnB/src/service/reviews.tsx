"use client";

import { getAccess, postAccess, patchAccess, deleteData } from "@/helper/api";

export interface Review {
  _id: string;
  listing_id: string;
  booking_id: string;
  reviewer_id?: {
    _id: string;
    name: string;
    avatar_url?: string;
  };
  rating: number;
  comment?: string;
  created_at?: string;
  createdAt?: string;
  updatedAt: string;
}

export const getReviewByBooking = async (bookingId: string): Promise<Review> => {
  try {
    return await getAccess(`reviews/by-booking/${bookingId}`);
  } catch (error: any) {
    // 404 means no review exists for this booking - this is expected
    if (error?.response?.status === 404) {
      return null as any; // Return null to indicate no review
    }
    // Re-throw other errors
    throw error;
  }
};

export const createReview = async (data: {
  booking_id: string;
  rating: number;
  comment?: string;
}): Promise<Review> => {
  return await postAccess("reviews", data);
};

export const updateReview = async (
  reviewId: string,
  data: { rating?: number; comment?: string },
): Promise<Review> => {
  return await patchAccess(`reviews/${reviewId}`, data);
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  await deleteData(`reviews/${reviewId}`);
};


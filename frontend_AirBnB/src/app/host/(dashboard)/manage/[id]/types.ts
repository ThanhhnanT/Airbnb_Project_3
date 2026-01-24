export interface ListingAnalytics {
  listingId: string;
  title: string;
  totalBookings: number;
  currentMonthBookings: number;
  avgRating: number;
  reviewCount: number;
  occupancyRate: number;
  bookingTrend: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  ratingDistribution: Record<number, number>;
}

export interface Listing {
  _id: string;
  title: string;
  description: string;
  street?: string;
  city: string;
  country: string;
  postal_code?: string;
  price_base: number;
  currency: string;
  cleaning_fee?: number;
  extra_guest_fee?: number;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  house_rules?: string;
  status: 'active' | 'inactive';
  cover_image?: string;
  avg_rating: number;
  review_count: number;
}

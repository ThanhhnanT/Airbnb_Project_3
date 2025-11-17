import { post } from "@/helper/api";

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
}

export const searchListings = async (params: SearchParams) => {
  const res = await post('listings/search', params);
  return res;
};


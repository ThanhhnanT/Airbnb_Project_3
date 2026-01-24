"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Spin, Empty, Pagination, message, Button, Typography } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import ListingGridCard from "@/components/search/ListingGridCard";
import MapView from "@/components/search/MapView";
import SearchFilters from "@/components/search/SearchFilters";
import { searchListings, SearchParams } from "@/service/search";
import styles from "@/styles/search-page.module.css";

const { Text, Title } = Typography;

interface Listing {
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
}

interface SearchResponse {
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

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [allListings, setAllListings] = useState<Listing[]>([]); // Store all original results from API
  const [listings, setListings] = useState<Listing[]>([]); // Filtered listings for display
  const [loading, setLoading] = useState(true);
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>();
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [showMap, setShowMap] = useState(true);
  const listingsContainerRef = useRef<HTMLDivElement>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  
  // Filter states
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [accommodationType, setAccommodationType] = useState<string[]>([]);
  const [bedrooms, setBedrooms] = useState(0);
  const [beds, setBeds] = useState(0);

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setLoading(true);

        // Get search params from URL
        const params: SearchParams = {
          city: searchParams.get("city") || undefined,
          country: searchParams.get("country") || undefined,
          check_in: searchParams.get("check_in") || undefined,
          check_out: searchParams.get("check_out") || undefined,
          guests: searchParams.get("guests")
            ? parseInt(searchParams.get("guests")!)
            : undefined,
          min_price: searchParams.get("min_price")
            ? parseFloat(searchParams.get("min_price")!)
            : undefined,
          max_price: searchParams.get("max_price")
            ? parseFloat(searchParams.get("max_price")!)
            : undefined,
          latitude: searchParams.get("latitude")
            ? parseFloat(searchParams.get("latitude")!)
            : undefined,
          longitude: searchParams.get("longitude")
            ? parseFloat(searchParams.get("longitude")!)
            : undefined,
          radius: searchParams.get("radius")
            ? parseFloat(searchParams.get("radius")!)
            : undefined,
          page: searchParams.get("page")
            ? parseInt(searchParams.get("page")!)
            : 1,
          limit: 12,
        };

        const result = await searchListings(params);
        
        console.log('=== SEARCH DEBUG ===');
        console.log('Search params:', params);
        console.log('Search result:', result);
        console.log('Result type:', typeof result);
        console.log('Result keys:', result ? Object.keys(result) : 'null/undefined');

        // Check if result is valid
        if (!result) {
          console.error('Search result is null or undefined');
          setListings([]);
          message.error("Không thể kết nối đến server");
          return;
        }

        // Check for error response
        if (result.statusCode && result.statusCode !== 200) {
          console.error('Search API error:', result.statusCode, result.message);
          setListings([]);
          message.warning(result.message || "Không tìm thấy kết quả phù hợp");
          return;
        }

        // Validate and extract data
        const listingsData = Array.isArray(result.data) ? result.data : (result.data ? [result.data] : []);
        console.log('Listings data:', listingsData);
        console.log('Listings count:', listingsData.length);
        
        // Validate and normalize listings structure
        const validListings = listingsData
          .filter((listing: any) => {
            return listing && listing._id && listing.title;
          })
          .map((listing: any) => {
            // Normalize coordinates - convert string to number if needed
            if (listing.latitude && typeof listing.latitude === 'string') {
              listing.latitude = parseFloat(listing.latitude);
            }
            if (listing.longitude && typeof listing.longitude === 'string') {
              listing.longitude = parseFloat(listing.longitude);
            }
            
            // Validate coordinates are valid numbers
            const hasValidCoords = 
              listing.latitude !== undefined && 
              listing.latitude !== null && 
              !isNaN(listing.latitude) &&
              listing.longitude !== undefined && 
              listing.longitude !== null && 
              !isNaN(listing.longitude);
            
            if (!hasValidCoords) {
              console.warn('Listing missing or invalid coordinates:', {
                id: listing._id,
                title: listing.title,
                latitude: listing.latitude,
                longitude: listing.longitude
              });
            }
            
            return listing;
          });
        
        console.log('Valid listings count:', validListings.length);
        console.log('Listings with coordinates:', validListings.filter((l: any) => l.latitude && l.longitude).length);
        
        setAllListings(validListings); // Store original listings
        setListings(validListings); // Set filtered listings (same as original initially)
        
        // Set map center from first listing or search params
        if (validListings.length > 0) {
          const firstListing = validListings[0];
          if (firstListing.latitude && firstListing.longitude) {
            console.log('Setting map center from first listing:', firstListing.latitude, firstListing.longitude);
            setMapCenter({
              lat: firstListing.latitude,
              lng: firstListing.longitude,
            });
          } else if (params.latitude && params.longitude) {
            console.log('Setting map center from search params:', params.latitude, params.longitude);
            setMapCenter({
              lat: params.latitude,
              lng: params.longitude,
            });
          }
        } else if (params.latitude && params.longitude) {
          console.log('No listings, setting map center from search params:', params.latitude, params.longitude);
          setMapCenter({
            lat: params.latitude,
            lng: params.longitude,
          });
        }
        
        // Set pagination
        if (result.pagination) {
          setPagination({
            page: result.pagination.page || 1,
            limit: result.pagination.limit || 12,
            total: result.pagination.total || 0,
            totalPages: result.pagination.totalPages || 0,
          });
        } else {
          // Default pagination if not provided
          setPagination({
            page: 1,
            limit: 12,
            total: validListings.length,
            totalPages: 1,
          });
        }
        
        console.log('=== END SEARCH DEBUG ===');
      } catch (error: any) {
        console.error("Search error:", error);
        message.error(error?.message || "Có lỗi xảy ra khi tìm kiếm");
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchParams]);

  // Client-side filtering when filter values change
  useEffect(() => {
    // Filter listings based on current filter state
    let filtered = allListings.filter((listing) => {
      // Price filter
      if (listing.price_base < minPrice || listing.price_base > maxPrice) {
        return false;
      }

      // Accommodation type filter (if any selected)
      if (accommodationType.length > 0) {
        // Note: This requires accommodation_type in listing data from API
        // For now, we'll skip this if data is not available
        // You can implement this once the API provides accommodation type
      }

      // Bedrooms filter (if specified)
      if (bedrooms > 0 && (!listing.bedrooms || listing.bedrooms < bedrooms)) {
        return false;
      }

      // Beds filter (if specified)
      if (beds > 0 && (!listing.beds || listing.beds < beds)) {
        return false;
      }

      return true;
    });

    setListings(filtered);
  }, [minPrice, maxPrice, accommodationType, bedrooms, beds, allListings]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    window.location.href = `/search?${params.toString()}`;
  };

  const handleListingClick = (listingId: string) => {
    setSelectedListingId(listingId);
    // Scroll to listing card
    const element = document.getElementById(`listing-${listingId}`);
    if (element && listingsContainerRef.current) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleMarkerClick = (listing: Listing) => {
    setSelectedListingId(listing._id);
    // Scroll to listing card
    const element = document.getElementById(`listing-${listing._id}`);
    if (element && listingsContainerRef.current) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleClearFilters = () => {
    setMinPrice(0);
    setMaxPrice(1000);
    setAccommodationType([]);
    setBedrooms(0);
    setBeds(0);
    // Reset listings to all (filter useEffect will handle this)
    setListings(allListings);
  };

  const getSearchSummary = () => {
    const parts: string[] = [];
    if (searchParams.get("city")) {
      parts.push(searchParams.get("city")!);
    }
    if (searchParams.get("country")) {
      parts.push(searchParams.get("country")!);
    }
    if (searchParams.get("check_in") && searchParams.get("check_out")) {
      parts.push(
        `${searchParams.get("check_in")} - ${searchParams.get("check_out")}`
      );
    }
    if (searchParams.get("guests")) {
      parts.push(`${searchParams.get("guests")} khách`);
    }
    return parts.length > 0 ? parts.join(" • ") : "Tất cả listings";
  };

  return (
    <div className={styles.searchPageContainer}>
      {/* Header */}
      <header className={styles.searchHeader}>
        <div className={styles.headerContent}>
          <div>
            <Title level={1} className={styles.searchTitle}>
              {!loading && pagination.total > 0 
                ? `Chỗ ở tại ${searchParams.get("city") || "tất cả vị trí"}`
                : "Kết quả tìm kiếm"}
            </Title>
            <Text type="secondary" className={styles.searchSummary}>
              {!loading && pagination.total > 0 
                ? `Hơn ${pagination.total.toLocaleString()}+ chỗ ở`
                : getSearchSummary()}
            </Text>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.searchContent}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
            <p>Đang tìm kiếm...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className={styles.emptyContainer}>
            <Empty
              description="Không tìm thấy chỗ ở phù hợp"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div className={styles.resultsWrapper}>
            {/* Left Panel - Filters & Listings */}
            <div className={styles.leftPanel}>
              {/* Filters Sidebar */}
              <SearchFilters
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceChange={(min, max) => {
                  setMinPrice(min);
                  setMaxPrice(max);
                }}
                accommodationType={accommodationType}
                onAccommodationTypeChange={setAccommodationType}
                bedrooms={bedrooms}
                onBedroomsChange={setBedrooms}
                beds={beds}
                onBedsChange={setBeds}
                onClearFilters={handleClearFilters}
              />

              {/* Listings Grid */}
              <div className={styles.listingsContainer} ref={listingsContainerRef}>
                {/* Filter Chips */}
                <div className={styles.filterChips}>
                  <div className={styles.chipsGrid}>
                    {/* Add filter chip buttons here if needed */}
                  </div>
                </div>

                {/* Listings Grid */}
                <div className={styles.listingsGrid}>
                {listings.map((listing) => (
                  <div
                    key={listing._id}
                    id={`listing-${listing._id}`}
                    className={`${styles.listingCardWrapper} ${
                      selectedListingId === listing._id ? styles.selectedListing : ""
                    }`}
                    onClick={() => handleListingClick(listing._id)}
                  >
                    <ListingGridCard listing={listing} />
                  </div>
                ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className={styles.paginationContainer}>
                    <Pagination
                      current={pagination.page}
                      total={pagination.total}
                      pageSize={pagination.limit}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showQuickJumper
                      showTotal={(total, range) =>
                        `${range[0]}-${range[1]} của ${total} chỗ ở`
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Map */}
            {showMap && (
              <div className={styles.mapPanel}>
                <MapView
                  listings={listings}
                  center={mapCenter}
                  onMarkerClick={handleMarkerClick}
                  selectedListingId={selectedListingId}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.searchPageContainer}>
          <div className={styles.loadingContainer}>
            <Spin size="large" />
            <p>Đang tải...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}


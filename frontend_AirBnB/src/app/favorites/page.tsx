"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spin, Empty, Select, Checkbox, Button, message } from "antd";
import { FilterOutlined, HeartFilled } from "@ant-design/icons";
import { getMyFavorites, Favorite } from "@/service/favorites";
import { Listing } from "@/service/listings";
import HomeListingCard from "@/components/home/HomeListingCard";
import Cookies from "js-cookie";
import styles from "./favorites.module.css";

// Amenities mapping - key is what's stored in database, label is for display
const amenitiesOptions = [
  { key: "wifi", label: "Wi-fi" },
  { key: "tv", label: "TV" },
  { key: "kitchen", label: "Bếp" },
  { key: "washer", label: "Máy giặt" },
  { key: "free_parking", label: "Chỗ đỗ xe miễn phí" },
  { key: "paid_parking", label: "Chỗ đỗ xe có thu phí" },
  { key: "air_conditioning", label: "Điều hòa nhiệt độ" },
  { key: "workspace", label: "Không gian làm việc" },
  { key: "pool", label: "Bể bơi" },
  { key: "hot_tub", label: "Bồn tắm nước nóng" },
  { key: "patio", label: "Sân" },
  { key: "bbq", label: "Lò nướng BBQ" },
  { key: "outdoor_dining", label: "Khu vực ăn uống ngoài trời" },
  { key: "fire_pit", label: "Bếp đốt lửa trại" },
  { key: "pool_table", label: "Bàn bi-da" },
  { key: "fireplace", label: "Lò sưởi trong nhà" },
  { key: "piano", label: "Đàn piano" },
];

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [uniqueLocations, setUniqueLocations] = useState<{ city: string; country: string }[]>([]);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để xem danh sách yêu thích');
      router.push('/');
      return;
    }
    fetchFavorites();
  }, []);

  useEffect(() => {
    if (listings.length > 0) {
      // Extract unique locations
      const locations = new Map<string, { city: string; country: string }>();
      listings.forEach((listing) => {
        const key = `${listing.city}-${listing.country}`;
        if (!locations.has(key)) {
          locations.set(key, { city: listing.city, country: listing.country });
        }
      });
      setUniqueLocations(Array.from(locations.values()));
    }
  }, [listings]);

  useEffect(() => {
    applyFilters();
  }, [selectedLocation, selectedAmenities, listings]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const favoritesData = await getMyFavorites();
      setFavorites(favoritesData);
      
      // Extract listings from favorites
      const listingsData = favoritesData
        .map((fav) => {
          const listing = fav.listing_id;
          if (typeof listing === 'object' && listing !== null) {
            return listing as Listing;
          }
          return null;
        })
        .filter((listing): listing is Listing => listing !== null);
      
      setListings(listingsData);
      setFilteredListings(listingsData);
    } catch (error: any) {
      console.error("Error fetching favorites:", error);
      if (error?.response?.status === 401) {
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        router.push('/');
      } else {
        message.error('Không thể tải danh sách yêu thích');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    // Filter by location
    if (selectedLocation !== "all") {
      const [city, country] = selectedLocation.split("|");
      filtered = filtered.filter(
        (listing) => listing.city === city && listing.country === country
      );
    }

    // Filter by amenities
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((listing) => {
        if (!listing.amenities || listing.amenities.length === 0) {
          return false;
        }
        // Check if listing has at least one of the selected amenities
        return selectedAmenities.some((amenity) =>
          listing.amenities!.includes(amenity)
        );
      });
    }

    setFilteredListings(filtered);
  };

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
  };

  const handleAmenitiesChange = (checkedValues: string[]) => {
    setSelectedAmenities(checkedValues);
  };

  const clearFilters = () => {
    setSelectedLocation("all");
    setSelectedAmenities([]);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.favoritesContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <HeartFilled className={styles.heartIcon} />
            Danh sách yêu thích
          </h1>
          <p className={styles.subtitle}>
            {filteredListings.length} {filteredListings.length === 1 ? 'chỗ ở' : 'chỗ ở'} yêu thích
          </p>
        </div>
        <Button
          icon={<FilterOutlined />}
          onClick={() => setShowFilters(!showFilters)}
          className={styles.filterButton}
        >
          Bộ lọc
        </Button>
      </div>

      {showFilters && (
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Địa điểm</label>
            <Select
              value={selectedLocation}
              onChange={handleLocationChange}
              className={styles.filterSelect}
              placeholder="Chọn địa điểm"
            >
              <Select.Option value="all">Tất cả địa điểm</Select.Option>
              {uniqueLocations.map((loc, index) => (
                <Select.Option key={index} value={`${loc.city}|${loc.country}`}>
                  {loc.city}, {loc.country}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tiện nghi</label>
            <Checkbox.Group
              value={selectedAmenities}
              onChange={handleAmenitiesChange}
              className={styles.amenitiesGroup}
            >
              {amenitiesOptions.map((amenity) => (
                <Checkbox key={amenity.key} value={amenity.key} className={styles.amenityCheckbox}>
                  {amenity.label}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </div>

          {(selectedLocation !== "all" || selectedAmenities.length > 0) && (
            <Button onClick={clearFilters} className={styles.clearButton}>
              Xóa bộ lọc
            </Button>
          )}
        </div>
      )}

      {filteredListings.length === 0 ? (
        <div className={styles.emptyContainer}>
          <Empty
            description={
              listings.length === 0
                ? "Bạn chưa có chỗ ở yêu thích nào"
                : "Không tìm thấy chỗ ở nào phù hợp với bộ lọc"
            }
          />
          {listings.length === 0 && (
            <Button
              type="primary"
              onClick={() => router.push("/")}
              className={styles.exploreButton}
            >
              Khám phá chỗ ở
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.listingsGrid}>
          {filteredListings.map((listing) => (
            <HomeListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

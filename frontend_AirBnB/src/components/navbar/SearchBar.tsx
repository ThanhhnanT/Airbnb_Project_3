"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button, Divider, Typography, Space, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import LocationDropdown from "../search/LocationDropdown";
import DatePickerModal from "../search/DatePickerModal";
import GuestSelector, { GuestCounts } from "../search/GuestSelector";
import { searchListings } from "@/service/search";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import styles from "@/styles/search.module.css";

const { Text } = Typography;

interface SearchBarProps {
  isExpanded?: boolean;
  isCollapsed?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ isExpanded = false, isCollapsed = false, onExpandChange }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [guests, setGuests] = useState<GuestCounts>({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setLocationOpen(false);
        setDateOpen(false);
        setGuestOpen(false);
        // Collapse when clicking outside
        if (onExpandChange && isExpanded) {
          onExpandChange(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, onExpandChange]);

  const formatDate = (date: Dayjs | null): string => {
    if (!date) return "";
    return date.format("DD/MM/YYYY");
  };

  const formatDateRange = (): string => {
    if (!selectedDates || !selectedDates[0] || !selectedDates[1]) {
      return "Thêm ngày";
    }
    return `${formatDate(selectedDates[0])} - ${formatDate(selectedDates[1])}`;
  };

  const formatGuests = (): string => {
    const total = guests.adults + guests.children + guests.infants;
    if (total === 0) return "Thêm khách";
    const parts: string[] = [];
    if (guests.adults > 0) parts.push(`${guests.adults} ${guests.adults === 1 ? "người lớn" : "người lớn"}`);
    if (guests.children > 0) parts.push(`${guests.children} ${guests.children === 1 ? "trẻ em" : "trẻ em"}`);
    if (guests.infants > 0) parts.push(`${guests.infants} ${guests.infants === 1 ? "em bé" : "em bé"}`);
    if (guests.pets > 0) parts.push(`${guests.pets} ${guests.pets === 1 ? "thú cưng" : "thú cưng"}`);
    return parts.join(", ");
  };

  const handleSearch = async () => {
    try {
      setLoading(true);

      // Parse location to extract city and country or coordinates
      let city: string | undefined;
      let country: string | undefined;
      let latitude: number | undefined;
      let longitude: number | undefined;
      let radius: number | undefined;
      
      if (selectedLocation) {
        // Check if it's a "nearby" location with coordinates
        if (selectedLocation.startsWith('nearby:')) {
          const coords = selectedLocation.replace('nearby:', '').split(',');
          if (coords.length === 2) {
            latitude = parseFloat(coords[0]);
            longitude = parseFloat(coords[1]);
            radius = 10; // Default 10km radius
          }
        } else {
          // Map location names to database values
          const locationMap: { [key: string]: { city: string; country?: string } } = {
            'Thành phố Hồ Chí Minh, Thành phố Hồ Chí Minh': { city: 'Ho Chi Minh City', country: 'Vietnam' },
            'Đà Lạt, Lâm Đồng': { city: 'Da Lat', country: 'Vietnam' },
            'Bangkok, Thái Lan': { city: 'Bangkok', country: 'Thailand' },
            'Hạ Long, Quảng Ninh': { city: 'Ha Long', country: 'Vietnam' },
            'Thành phố Huế, Thừa Thiên-Huế': { city: 'Hue', country: 'Vietnam' },
            'Vũng Tàu, Bà Rịa - Vũng Tàu': { city: 'Vung Tau', country: 'Vietnam' },
          };

          // Check if location is in map
          if (locationMap[selectedLocation]) {
            city = locationMap[selectedLocation].city;
            country = locationMap[selectedLocation].country;
          } else {
            // Try to parse location string (format: "City, Country" or just "City")
            const parts = selectedLocation.split(',').map(s => s.trim());
            if (parts.length > 1) {
              city = parts[0];
              country = parts.slice(1).join(', ');
            } else {
              city = parts[0];
            }
          }
        }
      }

      // Calculate total guests
      const totalGuests = guests.adults + guests.children;

      // Prepare search params
      const searchParams: any = {};

      if (latitude && longitude) {
        searchParams.latitude = latitude;
        searchParams.longitude = longitude;
        if (radius) searchParams.radius = radius;
      } else {
        if (city) searchParams.city = city;
        if (country) searchParams.country = country;
      }
      
      if (selectedDates && selectedDates[0] && selectedDates[1]) {
        searchParams.check_in = selectedDates[0].format('YYYY-MM-DD');
        searchParams.check_out = selectedDates[1].format('YYYY-MM-DD');
      }
      if (totalGuests > 0) {
        searchParams.guests = totalGuests;
      }

      // Call search API
      const result = await searchListings(searchParams);

      if (result && result.data) {
        // Navigate to search results page with query params
        const queryString = new URLSearchParams(searchParams).toString();
        router.push(`/search?${queryString}`);
      } else {
        message.error('Không tìm thấy kết quả phù hợp');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      message.error(error?.message || 'Có lỗi xảy ra khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };


  const handleSearchBarClick = () => {
    if (onExpandChange && !isExpanded) {
      onExpandChange(true);
    }
  };

  const shouldCollapse = isCollapsed && !isExpanded;

  return (
    <div className={styles.searchWrapper}>
      <div className={`${styles.navTabs} ${shouldCollapse ? styles.navTabsCollapsed : ""}`}>
        <Text strong className={styles.navTabItem}>Nơi lưu trú</Text>
        <Text className={styles.navTabItem}>Trải nghiệm</Text>
        <Text className={styles.navTabItem}>Dịch vụ</Text>
      </div>

      {/* Search Capsule */}
      <div
        ref={containerRef}
        className={`${styles.searchBarContainer} ${
          shouldCollapse ? styles.searchBarContainerCollapsed : styles.searchBarContainerExpanded
        }`}
        onClick={handleSearchBarClick}
        style={{ position: "relative", zIndex: 1, overflow: "visible" }}
      >
        {/* Location */}
        <div
          className={`${styles.searchItem} ${locationOpen ? styles.searchItemActive : ""}`}
          onClick={() => {
            setLocationOpen(!locationOpen);
            setDateOpen(false);
            setGuestOpen(false);
          }}
        >
          <Text className={styles.searchItemLabel}>Địa điểm</Text>
          <Text className={styles.searchItemValue}>
            {selectedLocation || "Tìm kiếm điểm đến"}
          </Text>
        </div>
        {locationOpen && (
          <>
            <div className={styles.dropdownBackdrop} onClick={() => setLocationOpen(false)} />
            <LocationDropdown
              visible={locationOpen}
              onClose={() => setLocationOpen(false)}
              onSelect={(location) => {
                setSelectedLocation(location);
                setLocationOpen(false);
              }}
            />
          </>
        )}

        <Divider type="vertical" />

        {/* Date */}
        <div
          className={`${styles.searchItem} ${dateOpen ? styles.searchItemActive : ""}`}
          onClick={() => {
            setDateOpen(!dateOpen);
            setLocationOpen(false);
            setGuestOpen(false);
          }}
        >
          <Text className={styles.searchItemLabel}>Thời gian</Text>
          <Text className={styles.searchItemValue}>
            {formatDateRange()}
          </Text>
        </div>
        {dateOpen && (
          <>
            <div className={styles.dropdownBackdrop} onClick={() => setDateOpen(false)} />
            <DatePickerModal
              visible={dateOpen}
              onClose={() => setDateOpen(false)}
              onSelect={(dates) => {
                setSelectedDates(dates);
                setDateOpen(false);
              }}
            />
          </>
        )}

        <Divider type="vertical" />

        {/* Guests */}
        <div
          className={`${styles.searchItem} ${guestOpen ? styles.searchItemActive : ""}`}
          onClick={() => {
            setGuestOpen(!guestOpen);
            setLocationOpen(false);
            setDateOpen(false);
          }}
        >
          <Text className={styles.searchItemLabel}>Khách</Text>
          <Text className={styles.searchItemValue}>
            {formatGuests()}
          </Text>
        </div>
        {guestOpen && (
          <>
            <div className={styles.dropdownBackdrop} onClick={() => setGuestOpen(false)} />
            <GuestSelector
              visible={guestOpen}
              onClose={() => setGuestOpen(false)}
              onConfirm={(guestCounts) => {
                setGuests(guestCounts);
                setGuestOpen(false);
              }}
              initialGuests={guests}
            />
          </>
        )}

        <Divider type="vertical" />

        {/* Search Button */}
        <button
          className={styles.searchButton}
          onClick={handleSearch}
          disabled={loading}
          aria-label="Tìm kiếm"
        >
          <SearchOutlined style={{ fontSize: 18, color: "#fff" }} />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;

"use client";

import React, { useState } from "react";
import { Input, Typography, Button, Spin } from "antd";
import { 
  AimOutlined, 
  EnvironmentOutlined, 
  HomeOutlined,
  GlobalOutlined,
  BankOutlined,
  ThunderboltOutlined,
  CloseOutlined
} from "@ant-design/icons";
import styles from "@/styles/search.module.css";

const { Text } = Typography;
const { Search } = Input;

interface LocationDropdownProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
}

const suggestedDestinations = [
  {
    icon: <AimOutlined />,
    title: "Lân cận",
    description: "Tìm xung quanh bạn",
    value: "nearby"
  },
  {
    icon: <EnvironmentOutlined />,
    title: "Thành phố Hồ Chí Minh, Thành phố Hồ Chí Minh",
    description: "Có các thắng cảnh như Chợ Bến Thành",
    value: "ho-chi-minh"
  },
  {
    icon: <HomeOutlined />,
    title: "Đà Lạt, Lâm Đồng",
    description: "Phù hợp cho người yêu thiên nhiên",
    value: "da-lat"
  },
  {
    icon: <GlobalOutlined />,
    title: "Bangkok, Thái Lan",
    description: "Có cuộc sống về đêm náo nhiệt",
    value: "bangkok"
  },
  {
    icon: <ThunderboltOutlined />,
    title: "Hạ Long, Quảng Ninh",
    description: "Phù hợp cho người yêu thiên nhiên",
    value: "ha-long"
  },
  {
    icon: <BankOutlined />,
    title: "Thành phố Huế, Thừa Thiên-Huế",
    description: "Có kiến trúc ấn tượng",
    value: "hue"
  },
  {
    icon: <HomeOutlined />,
    title: "Vũng Tàu, Bà Rịa - Vũng Tàu",
    description: "Có đường bờ biển tuyệt đẹp",
    value: "vung-tau"
  }
];

const LocationDropdown: React.FC<LocationDropdownProps> = ({ 
  visible, 
  onClose, 
  onSelect 
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Use OpenStreetMap Nominatim API for reverse geocoding (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=vi`,
        {
          headers: {
            'User-Agent': 'AirBnB-App' // Required by Nominatim
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }
      
      const data = await response.json();
      
      // Extract city/province name from address
      const address = data.address || {};
      // Try different fields for city name (varies by country)
      const cityName = 
        address.city || 
        address.town || 
        address.municipality || 
        address.county || 
        address.state_district ||
        address.state ||
        address.province ||
        '';
      
      const provinceName = 
        address.state || 
        address.province || 
        address.region ||
        '';
      
      // Format: "City, Province" or just "City"
      if (cityName && provinceName && cityName !== provinceName) {
        return `${cityName}, ${provinceName}`;
      } else if (cityName) {
        return cityName;
      } else if (provinceName) {
        return provinceName;
      } else {
        // Fallback to formatted coordinates
        return `Vị trí hiện tại (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      // Fallback to formatted coordinates
      return `Vị trí hiện tại (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    }
  };

  const handleNearbyClick = async () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get city name from coordinates
          const cityName = await reverseGeocode(latitude, longitude);
          
          // Pass both city name and coordinates: "nearby:lat,lng|cityName"
          onSelect(`nearby:${latitude},${longitude}|${cityName}`);
        } catch (error) {
          console.error("Error in reverse geocoding:", error);
          // Fallback: just pass coordinates
          onSelect(`nearby:${latitude},${longitude}`);
        } finally {
          setGettingLocation(false);
          onClose();
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Không thể lấy vị trí của bạn. Vui lòng cho phép truy cập vị trí.");
        setGettingLocation(false);
      }
    );
  };

  const filteredDestinations = suggestedDestinations.filter(dest =>
    dest.title.toLowerCase().includes(searchValue.toLowerCase()) ||
    dest.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (!visible) return null;

  return (
    <div 
      className={styles.locationDropdown} 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ display: visible ? 'block' : 'none' }}
    >
      <div className={styles.locationHeader}>
        <Text strong className={styles.locationTitle}>Điểm đến được đề xuất</Text>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Đóng"
        />
      </div>
      <div className={styles.locationSearch}>
        <Search
          placeholder="Tìm kiếm điểm đến"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          allowClear
        />
      </div>
      <div className={styles.locationList}>
        {filteredDestinations.map((dest, index) => (
          <div
            key={index}
            className={styles.locationItem}
            onClick={() => {
              if (dest.value === "nearby") {
                handleNearbyClick();
              } else {
                onSelect(dest.title);
                onClose();
              }
            }}
          >
            <div className={styles.locationIcon}>
              {gettingLocation && dest.value === "nearby" ? (
                <Spin size="small" />
              ) : (
                dest.icon
              )}
            </div>
            <div className={styles.locationContent}>
              <Text strong className={styles.locationItemTitle}>{dest.title}</Text>
              <Text type="secondary" className={styles.locationItemDesc}>
                {dest.description}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationDropdown;


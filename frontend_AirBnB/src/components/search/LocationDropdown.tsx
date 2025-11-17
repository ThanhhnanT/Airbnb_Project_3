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

  const handleNearbyClick = async () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Pass coordinates as special format
        onSelect(`nearby:${latitude},${longitude}`);
        setGettingLocation(false);
        onClose();
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


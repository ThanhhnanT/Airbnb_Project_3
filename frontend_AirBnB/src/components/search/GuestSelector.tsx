"use client";

import React, { useState } from "react";
import { Typography, Button, Space } from "antd";
import { MinusOutlined, PlusOutlined, CloseOutlined } from "@ant-design/icons";
import styles from "@/styles/search.module.css";

const { Text } = Typography;

interface GuestSelectorProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (guests: GuestCounts) => void;
  initialGuests?: GuestCounts;
}

export interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

const GuestSelector: React.FC<GuestSelectorProps> = ({ 
  visible, 
  onClose, 
  onConfirm,
  initialGuests 
}) => {
  const [guests, setGuests] = useState<GuestCounts>(
    initialGuests || { adults: 0, children: 0, infants: 0, pets: 0 }
  );


  const updateGuest = (type: keyof GuestCounts, delta: number) => {
    setGuests((prev) => {
      const newValue = Math.max(0, prev[type] + delta);
      return { ...prev, [type]: newValue };
    });
  };

  const handleConfirm = () => {
    onConfirm(guests);
    onClose();
  };

  const totalGuests = guests.adults + guests.children + guests.infants;

  const guestTypes = [
    {
      key: "adults" as keyof GuestCounts,
      label: "Người lớn",
      description: "Từ 13 tuổi trở lên",
      count: guests.adults,
    },
    {
      key: "children" as keyof GuestCounts,
      label: "Trẻ em",
      description: "Độ tuổi 2 – 12",
      count: guests.children,
    },
    {
      key: "infants" as keyof GuestCounts,
      label: "Em bé",
      description: "Dưới 2 tuổi",
      count: guests.infants,
    },
    {
      key: "pets" as keyof GuestCounts,
      label: "Thú cưng",
      description: "Bạn sẽ mang theo động vật phục vụ?",
      count: guests.pets,
    },
  ];

  if (!visible) return null;

  return (
    <div 
      className={styles.guestSelector} 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={styles.guestHeader}>
        <Typography.Title level={4} className={styles.guestTitle}>
          Chọn số lượng khách
        </Typography.Title>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Đóng"
        />
      </div>
      {guestTypes.map((type) => (
        <div key={type.key} className={styles.guestItem}>
          <div className={styles.guestInfo}>
            <Text strong className={styles.guestLabel}>{type.label}</Text>
            <Text type="secondary" className={styles.guestDescription}>
              {type.description}
            </Text>
          </div>
          <div className={styles.guestControls}>
            <Button
              icon={<MinusOutlined />}
              onClick={() => updateGuest(type.key, -1)}
              disabled={type.count === 0}
              className={styles.guestButton}
            />
            <Text className={styles.guestCount}>{type.count}</Text>
            <Button
              icon={<PlusOutlined />}
              onClick={() => updateGuest(type.key, 1)}
              className={styles.guestButton}
            />
          </div>
        </div>
      ))}
      <div className={styles.guestFooter}>
        <Button onClick={onClose}>Hủy</Button>
        <Button type="primary" onClick={handleConfirm}>
          Xác nhận ({totalGuests} {totalGuests === 1 ? "khách" : "khách"})
        </Button>
      </div>
    </div>
  );
};

export default GuestSelector;


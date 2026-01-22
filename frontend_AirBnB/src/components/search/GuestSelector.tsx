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
  maxGuests?: number;
  allowPets?: boolean;
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
  initialGuests,
  maxGuests,
  allowPets = true
}) => {
  const [guests, setGuests] = useState<GuestCounts>(
    initialGuests || { adults: 1, children: 0, infants: 0, pets: 0 }
  );

  const updateGuest = (type: keyof GuestCounts, delta: number) => {
    setGuests((prev) => {
      const newValue = Math.max(0, prev[type] + delta);
      const updated = { ...prev, [type]: newValue };
      
      // Check max guests limit (only for adults + children, not infants)
      if (maxGuests && (type === 'adults' || type === 'children')) {
        const totalGuests = updated.adults + updated.children;
        if (totalGuests > maxGuests) {
          // Adjust to not exceed max
          if (type === 'adults') {
            updated.adults = Math.max(1, maxGuests - updated.children);
          } else {
            updated.children = Math.max(0, maxGuests - updated.adults);
          }
        }
      }
      
      // Ensure at least 1 adult
      if (updated.adults < 1) {
        updated.adults = 1;
      }
      
      return updated;
    });
  };

  const handleConfirm = () => {
    onConfirm(guests);
    onClose();
  };

  const totalGuests = guests.adults + guests.children + guests.infants;

  const totalGuestsForLimit = guests.adults + guests.children;
  const canAddMore = maxGuests ? totalGuestsForLimit < maxGuests : true;

  const guestTypes = [
    {
      key: "adults" as keyof GuestCounts,
      label: "Người lớn",
      description: "Từ 13 tuổi trở lên",
      count: guests.adults,
      canDecrease: guests.adults > 1,
      canIncrease: canAddMore,
    },
    {
      key: "children" as keyof GuestCounts,
      label: "Trẻ em",
      description: "Độ tuổi 2 – 12",
      count: guests.children,
      canDecrease: guests.children > 0,
      canIncrease: canAddMore,
    },
    {
      key: "infants" as keyof GuestCounts,
      label: "Em bé",
      description: "Dưới 2 tuổi",
      count: guests.infants,
      canDecrease: guests.infants > 0,
      canIncrease: true, // Infants don't count toward max
    },
    {
      key: "pets" as keyof GuestCounts,
      label: "Thú cưng",
      description: "Bạn sẽ mang theo động vật phục vụ?",
      count: guests.pets,
      canDecrease: guests.pets > 0,
      canIncrease: allowPets,
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
              disabled={!type.canDecrease}
              className={styles.guestButton}
            />
            <Text className={styles.guestCount}>{type.count}</Text>
            <Button
              icon={<PlusOutlined />}
              onClick={() => updateGuest(type.key, 1)}
              disabled={!type.canIncrease}
              className={styles.guestButton}
            />
          </div>
        </div>
      ))}
      {maxGuests && (
        <div style={{ padding: '8px 0', fontSize: '12px', color: '#666' }}>
          <Text type="secondary">
            Chỗ ở này cho phép tối đa {maxGuests} khách, không tính em bé.
          </Text>
        </div>
      )}
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


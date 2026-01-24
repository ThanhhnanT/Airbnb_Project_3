"use client";

import React, { useEffect } from "react";
import { Card, Slider, Checkbox, Space, Typography, InputNumber } from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import styles from "@/styles/search-filters.module.css";

const { Title, Text } = Typography;

interface SearchFiltersProps {
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  accommodationType: string[];
  onAccommodationTypeChange: (types: string[]) => void;
  bedrooms: number;
  onBedroomsChange: (count: number) => void;
  beds: number;
  onBedsChange: (count: number) => void;
  onClearFilters: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  minPrice,
  maxPrice,
  onPriceChange,
  accommodationType,
  onAccommodationTypeChange,
  bedrooms,
  onBedroomsChange,
  beds,
  onBedsChange,
  onClearFilters,
}) => {
  const accommodationTypes = [
    { label: "Toàn bộ nhà", value: "entire_house" },
    { label: "Phòng riêng", value: "private_room" },
    { label: "Phòng chung", value: "shared_room" },
  ];

  return (
    <aside className={styles.filtersSidebar}>
      <div className={styles.filtersHeader}>
        <Title level={4} className={styles.filtersTitle}>
          Lọc kết quả
        </Title>
        <button
          className={styles.clearButton}
          onClick={onClearFilters}
        >
          Xóa bộ lọc
        </button>
      </div>

      {/* Price Range Filter */}
      <Card className={styles.filterCard}>
        <Title level={5} className={styles.filterCardTitle}>
          Khoảng giá
        </Title>
        <div className={styles.priceContainer}>
          <div className={styles.sliderContainer}>
            <Slider
              range
              min={0}
              max={1000}
              step={10}
              value={[minPrice, maxPrice]}
              onChange={(values) => onPriceChange(values[0], values[1])}
              className={styles.slider}
            />
          </div>
          <div className={styles.priceInputs}>
            <div className={styles.priceInputGroup}>
              <label className={styles.priceLabel}>Giá tối thiểu</label>
              <InputNumber
                className={styles.priceInput}
                value={minPrice}
                onChange={(value) => onPriceChange(value || 0, maxPrice)}
                prefix="$"
                min={0}
                max={maxPrice}
              />
            </div>
            <span className={styles.priceSeparator}>–</span>
            <div className={styles.priceInputGroup}>
              <label className={styles.priceLabel}>Giá tối đa</label>
              <InputNumber
                className={styles.priceInput}
                value={maxPrice}
                onChange={(value) => onPriceChange(minPrice, value || 1000)}
                prefix="$"
                min={minPrice}
                max={1000}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Accommodation Type Filter */}
      <Card className={styles.filterCard}>
        <Title level={5} className={styles.filterCardTitle}>
          Loại chỗ ở
        </Title>
        <div className={styles.checkboxGroup}>
          {accommodationTypes.map((type) => (
            <label key={type.value} className={styles.checkboxLabel}>
              <Checkbox
                checked={accommodationType.includes(type.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onAccommodationTypeChange([...accommodationType, type.value]);
                  } else {
                    onAccommodationTypeChange(
                      accommodationType.filter((t) => t !== type.value)
                    );
                  }
                }}
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Rooms and Beds Filter */}
      <Card className={styles.filterCard}>
        <Title level={5} className={styles.filterCardTitle}>
          Phòng & giường
        </Title>
        <div className={styles.counterContainer}>
          <div className={styles.counterItem}>
            <span className={styles.counterLabel}>Phòng ngủ</span>
            <div className={styles.counter}>
              <button
                className={styles.counterButton}
                onClick={() => onBedroomsChange(Math.max(0, bedrooms - 1))}
              >
                <MinusOutlined />
              </button>
              <span className={styles.counterValue}>{bedrooms}</span>
              <button
                className={styles.counterButton}
                onClick={() => onBedroomsChange(bedrooms + 1)}
              >
                <PlusOutlined />
              </button>
            </div>
          </div>

          <div className={styles.counterItem}>
            <span className={styles.counterLabel}>Giường</span>
            <div className={styles.counter}>
              <button
                className={styles.counterButton}
                onClick={() => onBedsChange(Math.max(0, beds - 1))}
              >
                <MinusOutlined />
              </button>
              <span className={styles.counterValue}>{beds}</span>
              <button
                className={styles.counterButton}
                onClick={() => onBedsChange(beds + 1)}
              >
                <PlusOutlined />
              </button>
            </div>
          </div>
        </div>
      </Card>

    </aside>
  );
};

export default SearchFilters;

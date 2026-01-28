"use client";

import { Card, Row, Col, InputNumber, Select, Button, Space, Collapse, Tag } from "antd";
import { FilterOutlined, ClearOutlined } from "@ant-design/icons";
import { useEffect } from "react";

export interface FilterValues {
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bookingCountMin?: number;
  ratingMin?: number;
  status?: string;
}

interface AdvancedFilterProps {
  onFilterChange: (filters: FilterValues) => void;
  onReset: () => void;
  filters: FilterValues;
}

export default function AdvancedFilter({ onFilterChange, onReset, filters }: AdvancedFilterProps) {
  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== "all").length;

  const handlePriceMinChange = (value: number | null) => {
    onFilterChange({ ...filters, priceMin: value || undefined });
  };

  const handlePriceMaxChange = (value: number | null) => {
    onFilterChange({ ...filters, priceMax: value || undefined });
  };

  const handleBedroomsChange = (value: number | null) => {
    onFilterChange({ ...filters, bedrooms: value || undefined });
  };

  const handleBookingCountChange = (value: number | null) => {
    onFilterChange({ ...filters, bookingCountMin: value || undefined });
  };

  const handleRatingChange = (value: number | null) => {
    onFilterChange({ ...filters, ratingMin: value || undefined });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filters, status: value === "all" ? undefined : value });
  };

  const items = [
    {
      key: "1",
      label: (
        <span>
          <FilterOutlined style={{ marginRight: 8 }} />
          Bộ Lọc Nâng Cao
          {activeFilterCount > 0 && <Tag color="blue">{activeFilterCount}</Tag>}
        </span>
      ),
      children: (
        <div style={{ padding: "16px 0" }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Giá Tối Thiểu ($)
                </label>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Từ"
                  value={filters.priceMin}
                  onChange={handlePriceMinChange}
                  min={0}
                  step={10}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Giá Tối Đa ($)
                </label>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Đến"
                  value={filters.priceMax}
                  onChange={handlePriceMaxChange}
                  min={0}
                  step={10}
                />
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Số Phòng Ngủ
                </label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Chọn số phòng ngủ"
                  value={filters.bedrooms}
                  onChange={handleBedroomsChange}
                  options={[
                    { label: "Tất Cả", value: undefined },
                    { label: "1 Phòng", value: 1 },
                    { label: "2 Phòng", value: 2 },
                    { label: "3 Phòng", value: 3 },
                    { label: "4+ Phòng", value: 4 },
                  ]}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Tối Thiểu Booking
                </label>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Tối thiểu"
                  value={filters.bookingCountMin}
                  onChange={handleBookingCountChange}
                  min={0}
                />
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Tối Thiểu Rating
                </label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Chọn rating"
                  value={filters.ratingMin}
                  onChange={handleRatingChange}
                  options={[
                    { label: "Tất Cả", value: undefined },
                    { label: "4.0+ ⭐", value: 4 },
                    { label: "4.5+ ⭐", value: 4.5 },
                    { label: "4.8+ ⭐", value: 4.8 },
                  ]}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Trạng Thái
                </label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Chọn trạng thái"
                  value={filters.status || "all"}
                  onChange={handleStatusChange}
                  options={[
                    { label: "Tất Cả", value: "all" },
                    { label: "Đang Hoạt Động", value: "active" },
                    { label: "Chờ Duyệt", value: "inactive" },
                  ]}
                />
              </div>
            </Col>
          </Row>

          <Space style={{ marginTop: 16 }}>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={() => {
                // Filters are already applied
              }}
            >
              Áp Dụng
            </Button>
            <Button icon={<ClearOutlined />} onClick={onReset}>
              Xóa Bộ Lọc
            </Button>
          </Space>
        </div>
      ),
    },
  ];

  return <Collapse items={items} defaultActiveKeys={activeFilterCount > 0 ? ["1"] : []} />;
}

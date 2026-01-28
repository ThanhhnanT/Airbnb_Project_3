"use client";

import { Card, Table, Typography, Empty, Spin, Tag, Badge } from "antd";
import type { ColumnsType } from "antd/es/table";
import { StarOutlined } from "@ant-design/icons";
import styles from "./dashboard.module.css";

const { Title, Text } = Typography;

interface TopListing {
  _id: string;
  title: string;
  cover_image?: string;
  city: string;
  price_base: number;
  currency: string;
  revenue: number;
  bookingCount: number;
  avgRating: number;
  occupancyRate: number;
}

interface TopListingsProps {
  listings: TopListing[];
  loading?: boolean;
}

export default function TopListings({
  listings,
  loading = false,
}: TopListingsProps) {
  const formatPrice = (price: number, currency: string) => {
    if (currency === "VND") {
      return `${(price / 1000000).toFixed(1)}M₫`;
    }
    // For USD, don't use K suffix
    return `$${price.toFixed(2)}`;
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 70) return "success";
    if (rate >= 50) return "warning";
    return "error";
  };

  const columns: ColumnsType<TopListing> = [
    {
      title: "Chỗ ở",
      key: "title",
      render: (_, record) => (
        <div className={styles.listingCell}>
          {record.cover_image && (
            <div
              className={styles.listingThumbnail}
              style={{
                backgroundImage: `url(${record.cover_image})`,
              }}
            />
          )}
          <div>
            <Text strong className={styles.listingName}>
              {record.title}
            </Text>
            <Text type="secondary" className={styles.listingLocation}>
              {record.city}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Giá/Đêm",
      key: "price",
      align: "right" as const,
      render: (_, record) => (
        <Text strong>{formatPrice(record.price_base, record.currency)}</Text>
      ),
    },
    {
      title: "Doanh Thu",
      key: "revenue",
      align: "right" as const,
      render: (_, record) => (
        <Text strong style={{ color: "#52c41a" }}>
          {formatPrice(record.revenue, record.currency)}
        </Text>
      ),
    },
    {
      title: "Đơn Đặt",
      key: "bookings",
      align: "center" as const,
      render: (_, record) => (
        <Badge
          count={record.bookingCount}
          style={{
            backgroundColor: "#197fe6",
          }}
        />
      ),
    },
    {
      title: "Đánh Giá",
      key: "rating",
      align: "center" as const,
      render: (_, record) => (
        <div className={styles.ratingCell}>
          <StarOutlined style={{ color: "#faad14", marginRight: 4 }} />
          <Text strong>{record.avgRating.toFixed(1)}</Text>
        </div>
      ),
    },
    {
      title: "Lấp Đầy",
      key: "occupancy",
      align: "center" as const,
      render: (_, record) => (
        <Tag color={getOccupancyColor(record.occupancyRate)}>
          {record.occupancyRate}%
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <Card className={styles.topListingsCard}>
        <div className={styles.chartLoader}>
          <Spin />
        </div>
      </Card>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <Card className={styles.topListingsCard}>
        <Title level={4} style={{ marginBottom: 0 }}>
          Chỗ Ở Hàng Đầu
        </Title>
        <Empty
          style={{ marginTop: 40 }}
          description="Chưa có dữ liệu"
        />
      </Card>
    );
  }

  return (
    <Card className={styles.topListingsCard}>
      <Title level={4} style={{ marginBottom: 16 }}>
        5 Chỗ Ở Hiệu Suất Cao Nhất
      </Title>
      <Table
        columns={columns}
        dataSource={listings}
        rowKey="_id"
        pagination={false}
        className={styles.topListingsTable}
      />
    </Card>
  );
}

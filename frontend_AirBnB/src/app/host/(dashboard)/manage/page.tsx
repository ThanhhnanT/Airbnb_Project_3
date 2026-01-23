"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  Tag,
  Space,
  Typography,
  Button,
  Badge,
  Input,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, MoreOutlined, DashboardOutlined } from "@ant-design/icons";
import { getAccess } from "@/helper/api";
import styles from "./host-manage.module.css";

const { Text, Title } = Typography;

interface Listing {
  _id: string;
  title: string;
  street?: string;
  city: string;
  country: string;
  price_base: number;
  currency: string;
  status: "active" | "inactive";
  cover_image?: string;
  bookingCount?: number;
  createdAt?: string;
}

export default function HostManagePage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const [listingsData, bookingCountsData] = await Promise.all([
        getAccess("listings/host/my-listings"),
        getAccess("bookings/host/listing-counts").catch(() => []),
      ]);

      const bookingCountMap = new Map<string, number>();
      if (Array.isArray(bookingCountsData)) {
        bookingCountsData.forEach((item: any) => {
          bookingCountMap.set(item.listingId, item.count || 0);
        });
      }

      const enrichedListings = (listingsData || []).map((listing: any) => ({
        ...listing,
        bookingCount: bookingCountMap.get(listing._id) || 0,
      }));

      setListings(enrichedListings);
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      message.error("Không thể tải danh sách chỗ ở");
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchText.toLowerCase()) ||
      listing.city.toLowerCase().includes(searchText.toLowerCase()) ||
      listing.country.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusTag = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Tag color="green" className={styles.statusTag}>
            <span
              className={styles.statusDot}
              style={{ backgroundColor: "#10b981" }}
            ></span>
            Đang hoạt động
          </Tag>
        );
      case "inactive":
        return (
          <Tag color="orange" className={styles.statusTag}>
            <span
              className={styles.statusDot}
              style={{ backgroundColor: "#f59e0b" }}
            ></span>
            Chờ duyệt
          </Tag>
        );
      default:
        return (
          <Tag color="default" className={styles.statusTag}>
            <span
              className={styles.statusDot}
              style={{ backgroundColor: "#9ca3af" }}
            ></span>
            Tạm dừng
          </Tag>
        );
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === "VND") {
      return `${price.toLocaleString("vi-VN")}đ`;
    }
    return `${price.toLocaleString("vi-VN")} ${currency}`;
  };

  const formatAddress = (listing: Listing) => {
    const parts = [];
    if (listing.street) parts.push(listing.street);
    if (listing.city) parts.push(listing.city);
    if (listing.country) parts.push(listing.country);
    return parts.join(", ");
  };

  const columns: ColumnsType<Listing> = [
    {
      title: "Chỗ ở",
      key: "listing",
      render: (_, record) => (
        <div className={styles.listingCell}>
          <div
            className={styles.listingImage}
            style={{
              backgroundImage: record.cover_image
                ? `url(${record.cover_image})`
                : "url('/placeholder-listing.jpg')",
            }}
          />
          <div className={styles.listingInfo}>
            <Text strong className={styles.listingTitle}>
              {record.title}
            </Text>
            <Text type="secondary" className={styles.listingAddress}>
              {formatAddress(record)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => getStatusTag(record.status),
    },
    {
      title: "Giá / đêm",
      key: "price",
      align: "right",
      render: (_, record) => (
        <Text strong className={styles.priceText}>
          {formatPrice(record.price_base, record.currency)}
        </Text>
      ),
    },
    {
      title: "Đơn đặt",
      key: "bookings",
      align: "center",
      render: (_, record) => (
        <Badge
          count={record.bookingCount || 0}
          showZero
          className={styles.bookingBadge}
          style={{
            backgroundColor: record.bookingCount ? "#197fe6" : "#e5e7eb",
            color: record.bookingCount ? "#fff" : "#6b7280",
          }}
        >
          <span className={styles.bookingText}>
            {record.bookingCount || 0} đơn
          </span>
        </Badge>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            className={styles.actionButton}
            onClick={() => router.push(`/host/listings/${record._id}/edit`)}
          />
          <Button
            type="text"
            icon={<MoreOutlined />}
            className={styles.actionButton}
          />
        </Space>
      ),
    },
  ];

  const activeCount = listings.filter((l) => l.status === "active").length;
  const inactiveCount = listings.filter((l) => l.status === "inactive").length;
  const totalCount = listings.length;

  return (
    <>
      <div style={{ marginBottom: 16, maxWidth: 400 }}>
        <Input
          placeholder="Tìm kiếm chỗ ở..."
          className={styles.searchInput}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className={styles.pageHeader}>
        <div>
          <Title level={2} className={styles.pageTitle}>
            Chỗ ở của tôi
          </Title>
          <Text type="secondary" className={styles.pageSubtitle}>
            Bạn đang quản lý {totalCount} căn hộ và phòng cho thuê trên toàn
            hệ thống.
          </Text>
        </div>
        <Button icon={<DashboardOutlined />}>Xem báo cáo chi tiết</Button>
      </div>

      <div className={styles.filters}>
        <Space wrap>
          <Button
            type={statusFilter === "all" ? "primary" : "default"}
            onClick={() => setStatusFilter("all")}
          >
            Tất cả ({totalCount})
          </Button>
          <Button
            type={statusFilter === "active" ? "primary" : "default"}
            onClick={() => setStatusFilter("active")}
          >
            Đang hoạt động
            <span
              className={styles.statusIndicator}
              style={{ backgroundColor: "#10b981" }}
            />
          </Button>
          <Button
            type={statusFilter === "inactive" ? "primary" : "default"}
            onClick={() => setStatusFilter("inactive")}
          >
            Chờ duyệt
            <span
              className={styles.statusIndicator}
              style={{ backgroundColor: "#f59e0b" }}
            />
          </Button>
          <Button
            type={statusFilter === "paused" ? "primary" : "default"}
            onClick={() => setStatusFilter("paused")}
          >
            Tạm dừng
            <span
              className={styles.statusIndicator}
              style={{ backgroundColor: "#9ca3af" }}
            />
          </Button>
        </Space>
        <div className={styles.sortContainer}>
          <Text className={styles.sortLabel}>Sắp xếp:</Text>
          <Button>
            Mới nhất
            <span style={{ marginLeft: 4 }}>▼</span>
          </Button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          dataSource={filteredListings}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `Hiển thị ${range[0]}-${range[1]} trong số ${total} chỗ ở`,
          }}
          className={styles.listingsTable}
        />
      </div>
    </>
  );
}


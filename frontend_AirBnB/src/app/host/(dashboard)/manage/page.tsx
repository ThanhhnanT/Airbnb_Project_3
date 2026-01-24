"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, Tag, Space, Typography, Button, Badge, Input, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, ExportOutlined, EyeOutlined } from "@ant-design/icons";
import { getAccess, postAccess } from "@/helper/api";
import AdvancedFilter, { FilterValues } from "./components/AdvancedFilter";
import BulkActions from "./components/BulkActions";
import SummaryStats from "./components/SummaryStats";
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
  avg_rating?: number;
  review_count?: number;
  createdAt?: string;
  bedrooms?: number;
  revenue?: number;
}

interface BookingStats {
  listingId: string;
  totalRevenue: number;
  count: number;
}

export default function HostManagePage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<FilterValues>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const [listingsData, bookingStatsData] = await Promise.all([
        getAccess("listings/host/my-listings"),
        getAccess("bookings/host/stats").catch(() => []),
      ]);

      const bookingStatsMap = new Map<string, BookingStats>();
      if (Array.isArray(bookingStatsData)) {
        bookingStatsData.forEach((item: any) => {
          bookingStatsMap.set(item.listingId, {
            listingId: item.listingId,
            totalRevenue: item.totalRevenue || 0,
            count: item.count || 0,
          });
        });
      }

      const enrichedListings = (listingsData || []).map((listing: any) => {
        const stats = bookingStatsMap.get(listing._id);
        return {
          ...listing,
          bookingCount: stats?.count || 0,
          revenue: stats?.totalRevenue || 0,
        };
      });

      setListings(enrichedListings);
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      message.error("Không thể tải danh sách chỗ ở");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    return listings.filter((listing) => {
      const matchesSearch =
        listing.title.toLowerCase().includes(searchText.toLowerCase()) ||
        listing.city.toLowerCase().includes(searchText.toLowerCase()) ||
        listing.country.toLowerCase().includes(searchText.toLowerCase());

      const matchesPrice =
        (!filters.priceMin || listing.price_base >= filters.priceMin) &&
        (!filters.priceMax || listing.price_base <= filters.priceMax);

      const matchesBedrooms = !filters.bedrooms || listing.bedrooms === filters.bedrooms;

      const matchesBooking =
        !filters.bookingCountMin || (listing.bookingCount || 0) >= filters.bookingCountMin;

      const matchesRating =
        !filters.ratingMin || (listing.avg_rating || 0) >= filters.ratingMin;

      const matchesStatus = !filters.status || listing.status === filters.status;

      return matchesSearch && matchesPrice && matchesBedrooms && matchesBooking && matchesRating && matchesStatus;
    });
  };

  const filteredListings = applyFilters();

  const getStatusTag = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Tag color="green" className={styles.statusTag}>
            <span className={styles.statusDot} style={{ backgroundColor: "#10b981" }}></span>
            Đang hoạt động
          </Tag>
        );
      case "inactive":
        return (
          <Tag color="orange" className={styles.statusTag}>
            <span className={styles.statusDot} style={{ backgroundColor: "#f59e0b" }}></span>
            Chờ duyệt
          </Tag>
        );
      default:
        return (
          <Tag color="default" className={styles.statusTag}>
            <span className={styles.statusDot} style={{ backgroundColor: "#9ca3af" }}></span>
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

  const handleExportCSV = () => {
    if (filteredListings.length === 0) {
      message.warning("Không có dữ liệu để export");
      return;
    }

    const headers = ["Tiêu Đề", "Địa Chỉ", "Giá/Đêm", "Trạng Thái", "Booking", "Rating"];
    const rows = filteredListings.map((l) => [
      l.title,
      formatAddress(l),
      `${l.currency} ${l.price_base.toFixed(2)}`,
      l.status,
      l.bookingCount || 0,
      (l.avg_rating || 0).toFixed(1),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `listings-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("Đã export danh sách listings");
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
              backgroundImage: record.cover_image ? `url(${record.cover_image})` : "url('/placeholder-listing.jpg')",
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
          <span className={styles.bookingText}>{record.bookingCount || 0} đơn</span>
        </Badge>
      ),
    },
    {
      title: "Đánh giá",
      key: "rating",
      align: "center",
      render: (_, record) => <Text>{(record.avg_rating || 0).toFixed(1)}⭐</Text>,
    },
    {
      title: "Thao tác",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/host/manage/${record._id}`)}
            title="Xem Chi Tiết"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => router.push(`/host/listings/${record._id}/edit`)}
            title="Chỉnh Sửa"
          />
        </Space>
      ),
    },
  ];

  const totalRevenue = listings.reduce((sum, l) => sum + (l.revenue || 0), 0);
  const totalBookings = listings.reduce((sum, l) => sum + (l.bookingCount || 0), 0);
  const avgRating = listings.length > 0 ? listings.reduce((sum, l) => sum + (l.avg_rating || 0), 0) / listings.length : 0;
  const activeCount = listings.filter((l) => l.status === "active").length;
  const inactiveCount = listings.filter((l) => l.status === "inactive").length;

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <Title level={2} className={styles.pageTitle}>
              Chỗ ở của tôi
            </Title>
            <Text type="secondary" className={styles.pageSubtitle}>
              Bạn đang quản lý {listings.length} căn hộ và phòng cho thuê trên toàn hệ thống.
            </Text>
          </div>
          <Button type="primary" icon={<ExportOutlined />} onClick={handleExportCSV}>
            Xuất CSV
          </Button>
        </div>
      </div>

      {/* Advanced Filter */}
      <AdvancedFilter
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => {
          setFilters({});
          setSearchText("");
          setSelectedRowKeys([]);
        }}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedRowKeys.length}
        selectedIds={selectedRowKeys as string[]}
        onActionComplete={() => {
          setSelectedRowKeys([]);
          fetchListings();
        }}
      />

      {/* Search */}
      <div style={{ marginBottom: 16, maxWidth: 400 }}>
        <Input
          placeholder="Tìm kiếm chỗ ở..."
          className={styles.searchInput}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          dataSource={filteredListings}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} trong số ${total} chỗ ở`,
          }}
          className={styles.listingsTable}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          onRow={(record) => ({
            onClick: () => {
              router.push(`/host/manage/${record._id}`);
            },
            style: { cursor: "pointer" },
          })}
        />
      </div>

      {/* Summary Stats */}
      <SummaryStats
        totalListings={listings.length}
        activeListings={activeCount}
        inactiveListings={inactiveCount}
        totalRevenue={totalRevenue}
        totalBookings={totalBookings}
        avgRating={avgRating}
      />
    </>
  );
}

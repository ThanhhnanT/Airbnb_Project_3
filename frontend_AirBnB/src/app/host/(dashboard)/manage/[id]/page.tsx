"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Tabs, Button, Space, Spin, Empty, message, Tag, Dropdown, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined, ExportOutlined, MoreOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { getAccess } from "@/helper/api";
import OverviewTab from "./components/OverviewTab";
import PerformanceTab from "./components/PerformanceTab";
import BookingsTab from "./components/BookingsTab";
import ReviewsTab from "./components/ReviewsTab";
import { Listing, ListingAnalytics } from "./types";
import styles from "./listing-detail.module.css";

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [analytics, setAnalytics] = useState<ListingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchListing();
    fetchAnalytics();
  }, [listingId]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const data = await getAccess(`listings/${listingId}`);
      setListing(data);
    } catch (error) {
      console.error("Error fetching listing:", error);
      message.error("Không thể tải thông tin listing");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await getAccess(`listings/host/${listingId}/analytics`);
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Don't show error for analytics, it's optional
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/host/listings/${listingId}/edit`);
  };

  const handleDelete = () => {
    // Implement delete functionality
    message.info("Chức năng xóa sẽ được cập nhật");
  };

  const handleExport = () => {
    // Implement export functionality
    message.info("Chức năng export sẽ được cập nhật");
  };

  const menuItems = [
    {
      key: "view-live",
      label: "Xem Trực Tiếp",
      onClick: () => window.open(`/listings/${listingId}`, "_blank"),
    },
    {
      key: "delete",
      label: "Xóa Listing",
      danger: true,
      onClick: handleDelete,
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "600px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!listing) {
    return <Empty description="Listing không tồn tại" />;
  }

  const getStatusColor = (status: string) => {
    return status === "active" ? "success" : "warning";
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div
          className={styles.coverImage}
          style={{
            backgroundImage: listing.cover_image ? `url(${listing.cover_image})` : "none",
          }}
          title={listing.cover_image ? "Hình ảnh phòng" : "Chưa có hình ảnh"}
        >
          {!listing.cover_image && "Không có hình ảnh"}
        </div>
        <div className={styles.headerInfo}>
          <div>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              style={{ marginBottom: 16 }}
            >
              Quay Lại
            </Button>
            <h1 className={styles.headerTitle}>{listing.title}</h1>
            <div className={styles.headerAddress}>
              {listing.street && <div>{listing.street}</div>}
              <div>
                {listing.city}, {listing.country}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Tag color={getStatusColor(listing.status)}>
                {listing.status === "active" ? "Đang Hoạt Động" : "Chờ Duyệt"}
              </Tag>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Tooltip title="Chỉnh Sửa">
              <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                Chỉnh Sửa
              </Button>
            </Tooltip>
            <Tooltip title="Xuất">
              <Button icon={<ExportOutlined />} onClick={handleExport} />
            </Tooltip>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        className={styles.tabsContainer}
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "overview",
            label: "Tổng Quan",
            children: <OverviewTab listing={listing} />,
          },
          {
            key: "performance",
            label: "Hiệu Suất",
            children: analyticsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "500px" }}>
                <Spin size="large" />
              </div>
            ) : (
              <PerformanceTab analytics={analytics} />
            ),
          },
          {
            key: "bookings",
            label: "Booking",
            children: <BookingsTab listingId={listingId} />,
          },
          {
            key: "reviews",
            label: "Đánh Giá",
            children: <ReviewsTab listingId={listingId} />,
          },
        ]}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Typography,
  Button,
  Space,
  message,
  Spin,
  Empty,
} from "antd";
import {
  HomeOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { getAccess } from "@/helper/api";
import StatCard from "@/components/host/dashboard/StatCard";
import RevenueChart from "@/components/host/dashboard/RevenueChart";
import OccupancyChart from "@/components/host/dashboard/OccupancyChart";
import RecentReviews from "@/components/host/dashboard/RecentReviews";
import TopListings from "@/components/host/dashboard/TopListings";
import QuickActions from "@/components/host/dashboard/QuickActions";

const { Title, Text } = Typography;

interface DashboardStats {
  listings: {
    total: number;
    active: number;
    inactive: number;
  };
  earnings: {
    total: number;
    monthly: Array<{
      month: string;
      revenue: number;
    }>;
    trend: string;
  };
  bookings: {
    total: number;
    upcoming: number;
    completionRate: number;
  };
  occupancy: {
    average: number;
    totalDays: number;
    bookedDays: number;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    recentReviews: Array<{
      _id: string;
      listing_id: string;
      rating: number;
      comment: string;
      reviewer_id: string;
      createdAt: Date;
    }>;
  };
  topListings: Array<{
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
  }>;
}

export default function HostDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await getAccess("listings/host/dashboard-stats");
      setStats(data);
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      message.error("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <Empty description="Không thể tải dữ liệu dashboard" />
      </div>
    );
  }

  const formatCurrency = (value: number, currency: string = "USD") => {
    if (currency === "VND") {
      return `${(value / 1000000).toFixed(1)}M₫`;
    }
    return `$${(value / 1000).toFixed(1)}K`;
  };

  const getEarningsTrend = () => {
    if (stats.earnings.trend === "up") return "20% so với tháng trước";
    if (stats.earnings.trend === "down") return "15% so với tháng trước";
    return "Ổn định";
  };

  return (
    <>
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div>
          <Title level={2} className={styles.pageTitle}>
            Bảng Điều Khiển
          </Title>
          <Text type="secondary" className={styles.pageSubtitle}>
            Tổng quan các chỉ số kinh doanh của bạn
          </Text>
        </div>
        <Button type="primary" onClick={fetchDashboardStats}>
          Làm mới dữ liệu
        </Button>
      </div>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} className={styles.section}>
        <Col span={24}>
          <QuickActions />
        </Col>
      </Row>

      {/* Key Stats */}
      <Row gutter={[16, 16]} className={styles.section}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Chỗ Ở Đang Hoạt Động"
            value={stats.listings.active}
            suffix={`/${stats.listings.total}`}
            icon={<HomeOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Doanh Thu Tổng Cộng"
            value={formatCurrency(stats.earnings.total)}
            trend={stats.earnings.trend as "up" | "down" | "stable"}
            trendValue={getEarningsTrend()}
            icon={<DollarOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tổng Đơn Đặt"
            value={stats.bookings.total}
            suffix={`${stats.bookings.upcoming} sắp tới`}
            icon={<CheckCircleOutlined />}
            color="#faad14"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Điểm Đánh Giá"
            value={stats.reviews.averageRating}
            suffix={`/5 (${stats.reviews.totalReviews} đánh giá)`}
            icon={<StarOutlined />}
            color="#722ed1"
          />
        </Col>
      </Row>

      {/* Charts and Detailed Info */}
      <Row gutter={[16, 16]} className={styles.section}>
        <Col xs={24} lg={16}>
          <RevenueChart
            data={stats.earnings.monthly}
            currency={stats.topListings[0]?.currency || "USD"}
          />
        </Col>
        <Col xs={24} lg={8}>
          <OccupancyChart
            occupancyRate={stats.occupancy.average}
            bookedDays={stats.occupancy.bookedDays}
            totalDays={stats.occupancy.totalDays}
          />
        </Col>
      </Row>

      {/* Reviews and Top Listings */}
      <Row gutter={[16, 16]} className={styles.section}>
        <Col xs={24} lg={12}>
          <RecentReviews reviews={stats.reviews.recentReviews} />
        </Col>
        <Col xs={24} lg={12}>
          <TopListings listings={stats.topListings} />
        </Col>
      </Row>
    </>
  );
}

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
  UndoOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import { getAccess } from "@/helper/api";
import StatCard from "@/components/host/dashboard/StatCard";
import RevenueChart from "@/components/host/dashboard/RevenueChart";
import RecentReviews from "@/components/host/dashboard/RecentReviews";
import TopListings from "@/components/host/dashboard/TopListings";
import styles from "./dashboard.module.css";

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
  refunds?: {
    total_pending: number;
    total_confirmed: number;
    total_amount: number;
  };
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
      const [dashboardData, bookingStatsData, refundsData] = await Promise.all([
        getAccess("listings/host/dashboard-stats"),
        getAccess("bookings/host/stats").catch(() => []),
        getAccess("refunds/host/my-refunds").catch(() => []),
      ]);

      // Recalculate total revenue from booking stats to match manage page
      let totalRevenue = 0;
      if (Array.isArray(bookingStatsData)) {
        totalRevenue = bookingStatsData.reduce((sum: number, item: any) => sum + (item.totalRevenue || 0), 0);
      }

      // Calculate refund stats
      const refundsArray = Array.isArray(refundsData) ? refundsData : [];
      const pendingCount = refundsArray.filter((r: any) => r.status === 'pending_host_confirmation').length;
      const confirmedCount = refundsArray.filter((r: any) => r.status === 'confirmed_by_host').length;
      // Only count confirmed refunds in total amount
      const totalAmount = refundsArray
        .filter((r: any) => r.status === 'confirmed_by_host')
        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

      // Subtract confirmed refunds from revenue
      totalRevenue -= totalAmount;

      // Update earnings total with correct revenue (excluding refunded amounts)
      if (dashboardData && dashboardData.earnings) {
        dashboardData.earnings.total = totalRevenue;
      }

      if (dashboardData) {
        dashboardData.refunds = {
          total_pending: pendingCount,
          total_confirmed: confirmedCount,
          total_amount: totalAmount,
        };
      }

      setStats(dashboardData);
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
    // For USD, don't use K suffix
    return `$${value.toFixed(2)}`;
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

      {/* Refund Stats */}
      {stats.refunds && stats.refunds.total_pending > 0 && (
        <Row gutter={[16, 16]} className={styles.section}>
          <Col xs={24}>
            <div style={{
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <AlertOutlined style={{ fontSize: '24px', color: '#ad6800' }} />
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#ad6800' }}>
                    {stats.refunds.total_pending} hoàn tiền chờ xác nhận
                  </h4>
                  <p style={{ margin: '0', color: '#ad6800', fontSize: '12px' }}>
                    Vui lòng xác nhận các yêu cầu hoàn tiền để hoàn thành quy trình
                  </p>
                </div>
              </div>
              <Button 
                type="primary"
                onClick={() => window.location.href = '/host/refunds'}
              >
                Xem Chi Tiết
              </Button>
            </div>
          </Col>
        </Row>
      )}

      {stats.refunds && (
        <Row gutter={[16, 16]} className={styles.section}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Hoàn Tiền Chờ"
              value={stats.refunds.total_pending}
              icon={<AlertOutlined />}
              color="#ff7a45"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Hoàn Tiền Đã Xác Nhận"
              value={stats.refunds.total_confirmed}
              icon={<UndoOutlined />}
              color="#52c41a"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Tổng Hoàn Tiền"
              value={formatCurrency(stats.refunds.total_amount)}
              icon={<DollarOutlined />}
              color="#1890ff"
            />
          </Col>
        </Row>
      )}

      {/* Charts and Detailed Info */}
      <Row gutter={[16, 16]} className={styles.section}>
        <Col xs={24}>
          <RevenueChart
            data={stats.earnings.monthly}
            currency={stats.topListings[0]?.currency || "USD"}
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

"use client";

import { Row, Col, Card, Typography, Spin, Empty, Statistic } from "antd";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarOutlined, CheckCircleOutlined, StarOutlined } from "@ant-design/icons";
import { ListingAnalytics } from "../types";
import styles from "../listing-detail.module.css";

const { Title, Text } = Typography;

interface PerformanceTabProps {
  analytics: ListingAnalytics;
  loading?: boolean;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

export default function PerformanceTab({ analytics, loading = false }: PerformanceTabProps) {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "500px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!analytics) {
    return <Empty description="Không có dữ liệu analytics" />;
  }

  // Format data for charts
  const revenueData = analytics.bookingTrend.map((item) => ({
    month: item.month,
    revenue: item.revenue,
  }));

  const bookingData = analytics.bookingTrend.map((item) => ({
    month: item.month,
    bookings: item.bookings,
  }));

  const ratingDistributionData = Object.entries(analytics.ratingDistribution)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .map(([rating, count]) => ({
      name: `${rating}★`,
      value: count,
    }));

  const occupancyPieData = [
    { name: "Đã đặt", value: Math.round(analytics.occupancyRate) },
    { name: "Còn trống", value: 100 - Math.round(analytics.occupancyRate) },
  ];

  return (
    <>
      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Tổng Doanh Thu"
              value={analytics.bookingTrend.reduce((sum, item) => sum + item.revenue, 0)}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Tổng Booking"
              value={analytics.totalBookings}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Avg Rating"
              value={analytics.avgRating}
              suffix={`/ 5 (${analytics.reviewCount} reviews)`}
              prefix={<StarOutlined />}
              precision={1}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Doanh Thu Theo Tháng" className={styles.chartCard}>
            {revenueData && revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1890ff"
                    strokeWidth={2}
                    dot={{ fill: "#1890ff", r: 4 }}
                    name="Doanh Thu"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có dữ liệu" style={{ marginTop: 40 }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Booking Theo Tháng" className={styles.chartCard}>
            {bookingData && bookingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bookingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#52c41a" name="Booking" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có dữ liệu" style={{ marginTop: 40 }} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Tỷ Lệ Lấp Đầy" className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={occupancyPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {occupancyPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Phân Bố Đánh Giá" className={styles.chartCard}>
            {ratingDistributionData && ratingDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#faad14" name="Số Review" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có reviews" style={{ marginTop: 40 }} />
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
}

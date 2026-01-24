"use client";

import { Card, Row, Col, Statistic, Spin, Empty, Space, Divider } from "antd";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AnalyticsData {
  listingId: string;
  title: string;
  totalBookings: number;
  currentMonthBookings: number;
  avgRating: number;
  reviewCount: number;
  occupancyRate: number;
  bookingTrend: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  ratingDistribution: Record<number, number>;
}

interface ListingAnalyticsProps {
  data: AnalyticsData | null;
  loading?: boolean;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1"];

export default function ListingAnalytics({
  data,
  loading = false,
}: ListingAnalyticsProps) {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return <Empty description="Không có dữ liệu" />;
  }

  // Prepare rating distribution data
  const ratingChartData = [
    { rating: "5 sao", count: data.ratingDistribution[5] || 0 },
    { rating: "4 sao", count: data.ratingDistribution[4] || 0 },
    { rating: "3 sao", count: data.ratingDistribution[3] || 0 },
    { rating: "2 sao", count: data.ratingDistribution[2] || 0 },
    { rating: "1 sao", count: data.ratingDistribution[1] || 0 },
  ].filter((item) => item.count > 0);

  return (
    <div>
      {/* Key Metrics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng Đặt Phòng"
              value={data.totalBookings}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đặt Phòng Tháng Này"
              value={data.currentMonthBookings}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đánh Giá Trung Bình"
              value={data.avgRating}
              suffix="⭐"
              precision={2}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tỷ Lệ Chiếm Phòng"
              value={data.occupancyRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: "#eb2f96" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Booking Trend Chart */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Xu Hướng Đặt Phòng và Doanh Thu</h3>
        {data.bookingTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.bookingTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" label={{ value: "Đặt Phòng", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: "Doanh Thu ($)", angle: 90, position: "insideRight" }} />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Legend />
              <Bar yAxisId="left" dataKey="bookings" fill="#8884d8" name="Số Đặt Phòng" />
              <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Doanh Thu" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="Chưa có dữ liệu" />
        )}
      </Card>

      <Row gutter={16}>
        {/* Review Distribution */}
        <Col xs={24} md={12}>
          <Card>
            <h3 style={{ marginBottom: 16 }}>Phân Bố Đánh Giá ({data.reviewCount} đánh giá)</h3>
            {ratingChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ratingChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ rating, count }) => `${rating}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {ratingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Chưa có đánh giá" />
            )}
          </Card>
        </Col>

        {/* Summary Stats */}
        <Col xs={24} md={12}>
          <Card>
            <h3 style={{ marginBottom: 16 }}>Tóm Tắt</h3>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tên Listing:</span>
                <strong>{data.title}</strong>
              </div>
              <Divider />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tổng Đánh Giá:</span>
                <strong>{data.reviewCount}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Đánh Giá Trung Bình:</span>
                <strong>{data.avgRating.toFixed(2)} ⭐</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tỷ Lệ Chiếm Phòng:</span>
                <strong>{data.occupancyRate.toFixed(1)}%</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Đặt Phòng Hoàn Thành:</span>
                <strong>{data.totalBookings}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Đặt Phòng Tháng Này:</span>
                <strong>{data.currentMonthBookings}</strong>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

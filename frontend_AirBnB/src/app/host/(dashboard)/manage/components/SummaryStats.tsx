"use client";

import { Row, Col, Card, Statistic } from "antd";
import { HomeOutlined, CheckCircleOutlined, ClockCircleOutlined, DollarOutlined, BookOutlined, StarOutlined } from "@ant-design/icons";

interface SummaryStatsProps {
  totalListings: number;
  activeListings: number;
  inactiveListings: number;
  totalRevenue: number;
  totalBookings: number;
  avgRating: number;
}

export default function SummaryStats({
  totalListings,
  activeListings,
  inactiveListings,
  totalRevenue,
  totalBookings,
  avgRating,
}: SummaryStatsProps) {
  return (
    <div style={{ marginTop: 32, paddingTop: 32, borderTop: "1px solid #f0f0f0" }}>
      <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Thống Kê Chung</h3>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Tổng Listings"
              value={totalListings}
              icon={<HomeOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Đang Hoạt Động"
              value={activeListings}
              icon={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Chờ Duyệt"
              value={inactiveListings}
              icon={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Tổng Doanh Thu"
              value={totalRevenue}
              prefix="$"
              precision={2}
              icon={<DollarOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Tổng Booking"
              value={totalBookings}
              icon={<BookOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Avg Rating"
              value={avgRating}
              suffix="/ 5"
              precision={1}
              icon={<StarOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

"use client";

import { Card, Statistic, Row, Col, Empty, Spin } from "antd";
import { HomeOutlined, ShoppingCartOutlined, DollarOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { getAccess } from "@/helper/api";

interface UserAnalyticsProps {
  userId: string;
  userRole?: string;
}

interface AnalyticsData {
  listingCount: number;
  bookingCount: number;
  totalRevenue: number;
}

export default function UserAnalytics({
  userId,
  userRole,
}: UserAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole === "host") {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [userRole, userId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const result = await getAccess(`admin/users/${userId}/analytics`, {}, true);
      setAnalytics(result.data || {
        listingCount: 0,
        bookingCount: 0,
        totalRevenue: 0,
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setAnalytics({
        listingCount: 0,
        bookingCount: 0,
        totalRevenue: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== "host") {
    return (
      <Card title="Thống Kê" style={{ marginBottom: 16 }}>
        <Empty
          description="Chỉ Host mới có thống kê"
          style={{ marginTop: 20 }}
        />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title="Thống Kê" style={{ marginBottom: 16 }}>
        <Spin />
      </Card>
    );
  }

  return (
    <Card title="Thống Kê (Host)" style={{ marginBottom: 16 }}>
      {analytics ? (
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Statistic
              title="Số nhà"
              value={analytics.listingCount}
              prefix={<HomeOutlined />}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Số booking"
              value={analytics.bookingCount}
              prefix={<ShoppingCartOutlined />}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Tổng doanh thu"
              value={analytics.totalRevenue}
              prefix={<DollarOutlined />}
              precision={0}
            />
          </Col>
        </Row>
      ) : (
        <Empty description="Không có dữ liệu" />
      )}
    </Card>
  );
}

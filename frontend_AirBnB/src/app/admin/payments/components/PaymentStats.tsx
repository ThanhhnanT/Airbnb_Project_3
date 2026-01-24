"use client";

import { Row, Col, Statistic, Card, Skeleton } from "antd";
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

interface PaymentStatsData {
  total: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
}

interface PaymentStatsProps {
  stats: PaymentStatsData | null;
  loading?: boolean;
}

export const PaymentStats: React.FC<PaymentStatsProps> = ({
  stats,
  loading,
}) => {
  if (loading) {
    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      {/* Total Payments */}
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Tổng Payments"
            value={stats?.total || 0}
            prefix={<DollarOutlined />}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            Tổng tiền: {((stats?.totalAmount || 0) as number).toLocaleString("vi-VN")} VND
          </div>
        </Card>
      </Col>

      {/* Paid Payments */}
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Đã thanh toán"
            value={stats?.paidCount || 0}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: "#52c41a" }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            Tổng: {((stats?.paidAmount || 0) as number).toLocaleString("vi-VN")} VND
          </div>
        </Card>
      </Col>

      {/* Pending Payments */}
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Chờ xử lý"
            value={stats?.pendingCount || 0}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: "#faad14" }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            Tổng: {((stats?.pendingAmount || 0) as number).toLocaleString("vi-VN")} VND
          </div>
        </Card>
      </Col>

      {/* Failed Payments */}
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Thất bại"
            value={stats?.failedCount || 0}
            prefix={<CloseCircleOutlined />}
            valueStyle={{ color: "#f5222d" }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default PaymentStats;

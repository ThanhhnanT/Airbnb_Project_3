"use client";

import { Row, Col, Statistic, Card, Skeleton } from "antd";
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

interface PayoutStatsData {
  total: number;
  pending: number;
  paid: number;
  failed: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
}

interface PayoutStatsProps {
  stats: PayoutStatsData | null;
  loading?: boolean;
}

export const PayoutStats: React.FC<PayoutStatsProps> = ({
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
      {/* Total Payouts */}
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Tổng Payouts"
            value={stats?.total || 0}
            prefix={<DollarOutlined />}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            Tổng tiền: {((stats?.totalAmount || 0) as number).toLocaleString("vi-VN")} VND
          </div>
        </Card>
      </Col>

      {/* Pending Payouts */}
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Chờ xử lý"
            value={stats?.pending || 0}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: "#faad14" }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            Tổng: {((stats?.pendingAmount || 0) as number).toLocaleString("vi-VN")} VND
          </div>
        </Card>
      </Col>

      {/* Paid Payouts */}
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Đã chuyển"
            value={stats?.paid || 0}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: "#52c41a" }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            Tổng: {((stats?.paidAmount || 0) as number).toLocaleString("vi-VN")} VND
          </div>
        </Card>
      </Col>

      {/* Failed Payouts */}
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Thất bại"
            value={stats?.failed || 0}
            prefix={<CloseCircleOutlined />}
            valueStyle={{ color: "#f5222d" }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default PayoutStats;

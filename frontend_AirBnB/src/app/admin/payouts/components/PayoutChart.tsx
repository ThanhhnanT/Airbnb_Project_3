"use client";

import { Card, Row, Col, Empty, Spin } from "antd";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

interface PayoutStatsData {
  total: number;
  pending: number;
  paid: number;
  failed: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
}

interface PayoutChartProps {
  data: PayoutStatsData | null;
  loading?: boolean;
}

const COLORS = {
  pending: "#faad14",
  paid: "#52c41a",
  failed: "#f5222d",
};

export const PayoutChart: React.FC<PayoutChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={24} md={12}>
          <Card>
            <Spin />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <Card>
            <Spin />
          </Card>
        </Col>
      </Row>
    );
  }

  if (!data) {
    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={24} md={12}>
          <Card>
            <Empty description="Không có dữ liệu" />
          </Card>
        </Col>
      </Row>
    );
  }

  // Pie chart data
  const pieData = [
    { name: "Chờ xử lý", value: data.pending },
    { name: "Đã chuyển", value: data.paid },
    { name: "Thất bại", value: data.failed },
  ];

  // Bar chart data for amounts
  const barData = [
    {
      name: "Số tiền",
      "Chờ xử lý": data.pendingAmount,
      "Đã chuyển": data.paidAmount,
    },
  ];

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      {/* Pie Chart - Payout Status Distribution */}
      <Col xs={24} sm={24} md={12}>
        <Card title="Phân bố Payout theo Trạng thái">
          {pieData.some((item) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) =>
                    `${entry.name}: ${entry.value} (${((entry.value / data.total) * 100).toFixed(1)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill={COLORS.pending} />
                  <Cell fill={COLORS.paid} />
                  <Cell fill={COLORS.failed} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="Không có dữ liệu" />
          )}
        </Card>
      </Col>

      {/* Bar Chart - Amount by Status */}
      <Col xs={24} sm={24} md={12}>
        <Card title="Tổng Tiền Payout">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Chờ xử lý" fill={COLORS.pending} />
              <Bar dataKey="Đã chuyển" fill={COLORS.paid} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );
};

export default PayoutChart;

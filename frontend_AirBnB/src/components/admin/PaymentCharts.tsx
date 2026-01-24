"use client";

import { Card, Row, Col, Empty, Spin } from "antd";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PaymentData {
  total: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
}

interface PaymentChartsProps {
  data: PaymentData | null;
  loading?: boolean;
}

const COLORS = {
  paid: "#52c41a",
  pending: "#faad14",
  failed: "#f5222d",
};

export const PaymentCharts: React.FC<PaymentChartsProps> = ({ data, loading }) => {
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
    { name: "Đã thanh toán", value: data.paidCount },
    { name: "Chờ xử lý", value: data.pendingCount },
    { name: "Thất bại", value: data.failedCount },
  ];

  // Bar chart data for amounts
  const barData = [
    {
      name: "Số tiền",
      "Đã thanh toán": data.paidAmount,
      "Chờ xử lý": data.pendingAmount,
      Thất_bại: 0,
    },
  ];

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      {/* Pie Chart - Payment Status Distribution */}
      <Col xs={24} sm={24} md={12}>
        <Card title="Phân bố Thanh toán theo Trạng thái">
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
                  <Cell fill={COLORS.paid} />
                  <Cell fill={COLORS.pending} />
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
        <Card title="Tổng Tiền Thanh toán">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Đã thanh toán" fill={COLORS.paid} />
              <Bar dataKey="Chờ xử lý" fill={COLORS.pending} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );
};

export default PaymentCharts;

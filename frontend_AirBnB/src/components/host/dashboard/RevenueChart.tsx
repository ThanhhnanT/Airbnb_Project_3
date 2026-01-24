"use client";

import { Card, Typography, Empty, Spin } from "antd";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import styles from "./dashboard.module.css";

const { Title } = Typography;

interface MonthlyData {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data: MonthlyData[];
  loading?: boolean;
  currency?: string;
}

const formatCurrency = (value: number, currency: string = "USD") => {
  if (currency === "VND") {
    return `${(value / 1000000).toFixed(1)}M₫`;
  }
  return `$${(value / 1000).toFixed(1)}K`;
};

export default function RevenueChart({
  data,
  loading = false,
  currency = "USD",
}: RevenueChartProps) {
  if (loading) {
    return (
      <Card className={styles.chartCard}>
        <div className={styles.chartLoader}>
          <Spin />
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={styles.chartCard}>
        <Title level={4} style={{ marginBottom: 0 }}>
          Doanh Thu
        </Title>
        <Empty
          style={{ marginTop: 40 }}
          description="Chưa có dữ liệu doanh thu"
        />
      </Card>
    );
  }

  return (
    <Card className={styles.chartCard}>
      <Title level={4} style={{ marginBottom: 20 }}>
        Doanh Thu Theo Tháng
      </Title>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            stroke="#8c8c8c"
            style={{ fontSize: 12 }}
          />
          <YAxis
            stroke="#8c8c8c"
            style={{ fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value, currency)}
          />
          <Tooltip
            formatter={(value) => formatCurrency(value as number, currency)}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: 4,
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#1890ff"
            strokeWidth={2}
            dot={{ fill: "#1890ff", r: 4 }}
            activeDot={{ r: 6 }}
            name="Doanh Thu"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

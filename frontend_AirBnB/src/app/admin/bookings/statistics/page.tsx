"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Select,
  message,
  Tag,
  Spin,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getAccess, patch } from "@/helper/api";
import { useRouter } from "next/navigation";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface Booking {
  _id: string;
  listing_id?: {
    _id: string;
    title: string;
  };
  guest_id?: {
    _id: string;
    name: string;
    email: string;
  };
  host_id?: {
    _id: string;
    name: string;
  };
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  currency: string;
  status: string;
}

type TimePeriod = "today" | "week" | "month" | "all";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function StatisticsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Request all bookings with a very high limit
      const result = await getAccess("admin/bookings?limit=10000", {}, true);
      setBookings(result.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      message.error("Không thể tải danh sách bookings");
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (period: TimePeriod): [Date, Date] => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        now.setHours(23, 59, 59, 999);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "all":
        startDate.setFullYear(2000);
        break;
    }

    return [startDate, now];
  };

  const filteredBookings = useMemo(() => {
    const [startDate, endDate] = getDateRange(timePeriod);
    return bookings.filter((booking) => {
      const checkInDate = new Date(booking.check_in);
      return checkInDate >= startDate && checkInDate <= endDate;
    });
  }, [bookings, timePeriod]);

  const pendingBookings = useMemo(() => {
    return filteredBookings.filter((b) => b.status === "pending");
  }, [filteredBookings]);

  const metrics = useMemo(() => {
    const totalBookings = filteredBookings.length;
    const totalRevenue = filteredBookings.reduce(
      (sum, b) => sum + b.total_price,
      0
    );
    const uniqueProperties = new Set(
      filteredBookings.map((b) => b.listing_id?._id)
    ).size;

    // Calculate occupancy rate (booked days / total days)
    let totalBookedDays = 0;
    filteredBookings.forEach((booking) => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      const days = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalBookedDays += days;
    });

    const [startDate, endDate] = getDateRange(timePeriod);
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const occupancyRate =
      totalDays > 0 ? ((totalBookedDays / (totalDays * uniqueProperties)) * 100).toFixed(2) : 0;

    return {
      totalBookings,
      totalRevenue: totalRevenue.toFixed(2),
      occupancyRate: isNaN(Number(occupancyRate)) ? 0 : occupancyRate,
      activeProperties: uniqueProperties,
    };
  }, [filteredBookings, timePeriod]);

  const revenueChartData = useMemo(() => {
    const [startDate] = getDateRange(timePeriod);
    const data: any[] = [];
    const tempDate = new Date(startDate);

    // Group revenue by date
    const revenueMap = new Map<string, number>();

    filteredBookings.forEach((booking) => {
      const date = dayjs(booking.check_in).format("DD/MM");
      const current = revenueMap.get(date) || 0;
      revenueMap.set(date, current + booking.total_price);
    });

    // Sort and limit to last 30 days or so
    const sortedDates = Array.from(revenueMap.keys())
      .sort((a, b) => {
        const dateA = dayjs(a, "DD/MM");
        const dateB = dayjs(b, "DD/MM");
        return dateA.isBefore(dateB) ? -1 : 1;
      })
      .slice(-15); // Last 15 data points

    sortedDates.forEach((date) => {
      data.push({
        date,
        revenue: revenueMap.get(date) || 0,
      });
    });

    return data.length > 0
      ? data
      : [{ date: "No data", revenue: 0 }];
  }, [filteredBookings, timePeriod]);

  const statusChartData = useMemo(() => {
    const statusCount = new Map<string, number>();
    filteredBookings.forEach((booking) => {
      const status = booking.status || "unknown";
      statusCount.set(status, (statusCount.get(status) || 0) + 1);
    });

    return Array.from(statusCount, ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [filteredBookings]);

  const topPropertiesData = useMemo(() => {
    const propertyRevenue = new Map<string, number>();

    filteredBookings.forEach((booking) => {
      const title = booking.listing_id?.title || "Unknown";
      propertyRevenue.set(
        title,
        (propertyRevenue.get(title) || 0) + booking.total_price
      );
    });

    return Array.from(propertyRevenue, ([name, revenue]) => ({
      name: name.length > 20 ? name.substring(0, 20) + "..." : name,
      revenue: parseFloat(revenue.toFixed(2)),
    }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredBookings]);

  const handleConfirmBooking = async (id: string) => {
    try {
      await patch(`admin/bookings/${id}/status`, { status: "confirmed" }, true);
      message.success("Xác nhận booking thành công");
      fetchBookings();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const pendingColumns: ColumnsType<Booking> = [
    {
      title: "Listing",
      key: "listing",
      render: (_, record) => record.listing_id?.title || "N/A",
    },
    {
      title: "Khách",
      key: "guest",
      render: (_, record) => record.guest_id?.name || "N/A",
    },
    {
      title: "Check-in",
      dataIndex: "check_in",
      key: "check_in",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Check-out",
      dataIndex: "check_out",
      key: "check_out",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Tổng tiền",
      key: "total_price",
      render: (_, record) => `${record.total_price} ${record.currency}`,
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/bookings/${record._id}`)}
          >
            Chi tiết
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleConfirmBooking(record._id)}
          >
            Xác nhận
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header with Time Period Selector */}
      <Card>
        <Row justify="space-between" align="middle">
          <Col>
            <h2>Thống kê Booking</h2>
          </Col>
          <Col>
            <Select
              value={timePeriod}
              onChange={setTimePeriod}
              style={{ width: 200 }}
              options={[
                { label: "Hôm nay", value: "today" },
                { label: "7 ngày gần đây", value: "week" },
                { label: "30 ngày gần đây", value: "month" },
                { label: "Tất cả", value: "all" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Booking"
              value={metrics.totalBookings}
              suffix="đơn"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Doanh Thu"
              value={metrics.totalRevenue}
              suffix="đ"
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tỷ Lệ Lấp Phòng"
              value={metrics.occupancyRate}
              suffix="%"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Bất Động Sản Hoạt Động"
              value={metrics.activeProperties}
              suffix="nơi"
            />
          </Card>
        </Col>
      </Row>

      {/* Pending Bookings Table */}
      {pendingBookings.length > 0 && (
        <Card title="Booking Đang Chờ Xác Nhận">
          <Table
            columns={pendingColumns}
            dataSource={pendingBookings}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
            scroll={{ x: 800 }}
          />
        </Card>
      )}

      {/* Charts Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Doanh Thu Theo Thời Gian">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    name="Doanh Thu"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                Không có dữ liệu
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Phân Bố Trạng Thái Booking">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                Không có dữ liệu
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Top Properties Chart */}
      <Card title="Top 5 Bất Động Sản Có Doanh Thu Cao Nhất">
        {topPropertiesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPropertiesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#82ca9d" name="Doanh Thu" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            Không có dữ liệu
          </div>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, message, Card, Space, Input, Select, Row, Col, Statistic } from "antd";
import { SearchOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
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

export default function AllBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Request all bookings with a very high limit to avoid pagination issues
      const result = await getAccess("admin/bookings?limit=10000", {}, true); // Use admin token
      setBookings(result.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      message.error("Không thể tải danh sách bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await patch(`admin/bookings/${id}/status`, { status }, true); // Use admin token
      message.success("Cập nhật trạng thái thành công");
      fetchBookings();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const getDateRange = (range: string): [Date, Date] => {
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        now.setHours(23, 59, 59, 999);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        now.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDate.setDate(1); // Start from first day of month
        startDate.setHours(0, 0, 0, 0);
        now.setHours(23, 59, 59, 999);
        break;
      case "all":
        startDate.setFullYear(1900); // Very old date to catch all
        startDate.setHours(0, 0, 0, 0);
        now.setHours(23, 59, 59, 999);
        break;
    }

    return [startDate, now];
  };

  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    const matchesSearch =
      searchText === "" ||
      booking.listing_id?.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.guest_id?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.guest_id?.email?.toLowerCase().includes(searchText.toLowerCase());
    
    // Status filter
    const matchesStatus = !statusFilter || booking.status === statusFilter;
    
    // Date filter
    const [startDate, endDate] = getDateRange(dateRange);
    const checkInDate = new Date(booking.check_in);
    const matchesDate = checkInDate >= startDate && checkInDate <= endDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const columns: ColumnsType<Booking> = [
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
      title: "Số khách",
      dataIndex: "guests",
      key: "guests",
    },
    {
      title: "Tổng tiền",
      key: "total_price",
      render: (_, record) => `${record.total_price} ${record.currency}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: any = {
          pending: "orange",
          confirmed: "green",
          cancelled: "red",
          completed: "blue",
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/bookings/${record._id}`)}
          >
            Chi tiết
          </Button>
          {record.status === "pending" && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleUpdateStatus(record._id, "confirmed")}
            >
              Xác nhận
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      message.warning("Không có dữ liệu để xuất");
      return;
    }

    const headers = [
      "Listing",
      "Khách",
      "Check-in",
      "Check-out",
      "Số khách",
      "Tổng tiền",
      "Trạng thái",
    ];
    const rows = filteredBookings.map((b) => [
      b.listing_id?.title || "N/A",
      b.guest_id?.name || "N/A",
      new Date(b.check_in).toLocaleDateString("vi-VN"),
      new Date(b.check_out).toLocaleDateString("vi-VN"),
      b.guests,
      `${b.total_price} ${b.currency}`,
      b.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_${dayjs().format("YYYY-MM-DD")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("Dữ liệu đã được xuất");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Booking"
              value={filteredBookings.length}
              suffix="đơn"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Doanh Thu"
              value={filteredBookings.reduce((sum, b) => sum + b.total_price, 0).toFixed(0)}
              suffix="đ"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Booking Chờ"
              value={filteredBookings.filter((b) => b.status === "pending").length}
              suffix="đơn"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã Xác Nhận"
              value={filteredBookings.filter((b) => b.status === "confirmed").length}
              suffix="đơn"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={24} md={8}>
              <Input
                placeholder="Tìm kiếm theo listing hoặc tên khách..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Lọc theo trạng thái"
                allowClear
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: "100%" }}
                options={[
                  { label: "Chờ xác nhận", value: "pending" },
                  { label: "Đã xác nhận", value: "confirmed" },
                  { label: "Đã hoàn tất", value: "completed" },
                  { label: "Đã hủy", value: "cancelled" },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Khoảng thời gian"
                value={dateRange}
                onChange={setDateRange}
                style={{ width: "100%" }}
                options={[
                  { label: "Tất cả", value: "all" },
                  { label: "Hôm nay", value: "today" },
                  { label: "7 ngày gần đây", value: "week" },
                  { label: "30 ngày gần đây", value: "month" },
                ]}
              />
            </Col>
          </Row>
          <Row justify="end">
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportCSV}
              type="default"
            >
              Xuất CSV
            </Button>
          </Row>
        </Space>
      </Card>

      {/* Table */}
      <Card 
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
        bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <Table
          columns={columns}
          dataSource={filteredBookings}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ y: "calc(100vh - 500px)", x: 1200 }}
        />
      </Card>
    </div>
  );
}


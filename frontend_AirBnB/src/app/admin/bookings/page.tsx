"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, message, Card, Space, Input } from "antd";
import { SearchOutlined, EyeOutlined } from "@ant-design/icons";
import { getAccess, patch } from "@/helper/api";
import { useRouter } from "next/navigation";
import type { ColumnsType } from "antd/es/table";

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

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const result = await getAccess("admin/bookings");
      setBookings(result.data || []);
    } catch (error) {
      message.error("Không thể tải danh sách bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await patch(`admin/bookings/${id}/status`, { status });
      message.success("Cập nhật trạng thái thành công");
      fetchBookings();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.listing_id?.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.guest_id?.name?.toLowerCase().includes(searchText.toLowerCase())
  );

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

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Card 
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
        bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <Space style={{ marginBottom: 16, width: "100%" }} direction="vertical">
          <Input
            placeholder="Tìm kiếm theo listing hoặc tên khách..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </Space>
        <Table
          columns={columns}
          dataSource={filteredBookings}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ y: "calc(100vh - 300px)" }}
        />
      </Card>
    </div>
  );
}


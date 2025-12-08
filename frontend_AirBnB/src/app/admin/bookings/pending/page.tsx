"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, message, Card } from "antd";
import { CheckCircleOutlined, EyeOutlined } from "@ant-design/icons";
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
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  currency: string;
  status: string;
}

export default function PendingBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const result = await getAccess("admin/bookings");
      const allBookings = result.data || [];
      setBookings(allBookings.filter((b: Booking) => b.status === "pending"));
    } catch (error) {
      message.error("Không thể tải danh sách bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await patch(`admin/bookings/${id}/status`, { status: "confirmed" });
      message.success("Xác nhận booking thành công");
      fetchPendingBookings();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

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
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
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
            onClick={() => handleConfirm(record._id)}
          >
            Xác nhận
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card title="Pending Bookings">
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}


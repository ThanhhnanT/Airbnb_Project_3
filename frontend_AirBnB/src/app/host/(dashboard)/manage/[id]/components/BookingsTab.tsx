"use client";

import { Table, Card, Empty, Spin, Typography, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { getAccess } from "@/helper/api";

const { Text } = Typography;

interface Booking {
  _id: string;
  guest_id: {
    _id: string;
    name: string;
    email: string;
  };
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  total_price: number;
  currency: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

interface BookingsTabProps {
  listingId: string;
}

export default function BookingsTab({ listingId }: BookingsTabProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [listingId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getAccess(`bookings?listing_id=${listingId}`);
      setBookings(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "processing";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Xác Nhận";
      case "completed":
        return "Hoàn Thành";
      case "cancelled":
        return "Hủy";
      default:
        return "Chờ Xử Lý";
    }
  };

  const columns: ColumnsType<Booking> = [
    {
      title: "Khách",
      key: "guest",
      render: (_, record) => (
        <div>
          <Text strong>{record.guest_id.name}</Text>
          <div style={{ fontSize: 12, color: "#8c8c8c" }}>{record.guest_id.email}</div>
        </div>
      ),
    },
    {
      title: "Check In",
      key: "checkIn",
      render: (_, record) => new Date(record.check_in).toLocaleDateString("vi-VN"),
    },
    {
      title: "Check Out",
      key: "checkOut",
      render: (_, record) => new Date(record.check_out).toLocaleDateString("vi-VN"),
    },
    {
      title: "Đêm",
      key: "nights",
      align: "center" as const,
      render: (_, record) => record.nights,
    },
    {
      title: "Khách",
      key: "guests",
      align: "center" as const,
      render: (_, record) => record.guests,
    },
    {
      title: "Giá",
      key: "price",
      align: "right" as const,
      render: (_, record) => (
        <Text strong>
          {record.currency} {record.total_price.toFixed(2)}
        </Text>
      ),
    },
    {
      title: "Trạng Thái",
      key: "status",
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)}>{getStatusLabel(record.status)}</Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return <Empty description="Chưa có booking" />;
  }

  return (
    <Card>
      <Table columns={columns} dataSource={bookings} rowKey="_id" pagination={{ pageSize: 10 }} />
    </Card>
  );
}

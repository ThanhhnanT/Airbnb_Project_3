"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, Tag, Typography, Space, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined } from "@ant-design/icons";
import { getAccess } from "@/helper/api";
import styles from "../manage/host-manage.module.css";

const { Text, Title } = Typography;
const { Option } = Select;

interface HostBooking {
  _id: string;
  listing_id: {
    _id: string;
    title: string;
    city: string;
    country: string;
  };
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
  status: string;
  createdAt?: string;
}

export default function HostBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const data = await getAccess("bookings/host/my-bookings", params);
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching host bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN");

  const formatMoney = (amount: number, currency: string) =>
    `${amount.toLocaleString("vi-VN")} ${currency}`;

  const getStatusTag = (status: string) => {
    switch (status) {
      case "pending":
        return <Tag color="orange">Đang chờ</Tag>;
      case "confirmed":
        return <Tag color="green">Đã xác nhận</Tag>;
      case "completed":
        return <Tag color="blue">Hoàn thành</Tag>;
      case "cancelled":
        return <Tag color="red">Đã hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns: ColumnsType<HostBooking> = [
    {
      title: "Chỗ ở",
      dataIndex: "listing_id",
      key: "listing",
      render: (listing) => (
        <div>
          <div style={{ fontWeight: 600 }}>{listing?.title || "N/A"}</div>
          <div style={{ fontSize: 12, color: "#637588" }}>
            {listing?.city}, {listing?.country}
          </div>
        </div>
      ),
    },
    {
      title: "Khách",
      dataIndex: "guest_id",
      key: "guest",
      render: (guest) => (
        <div>
          <div>{guest?.name || "N/A"}</div>
          <div style={{ fontSize: 12, color: "#637588" }}>{guest?.email}</div>
        </div>
      ),
    },
    {
      title: "Thời gian",
      key: "dates",
      render: (_, record) => (
        <div>
          <div>
            {formatDate(record.check_in)} → {formatDate(record.check_out)}
          </div>
          <div style={{ fontSize: 12, color: "#637588" }}>
            {record.nights} đêm · {record.guests} khách
          </div>
        </div>
      ),
    },
    {
      title: "Tổng tiền",
      key: "total",
      render: (_, record) => (
        <Text strong>
          {formatMoney(record.total_price, record.currency || "USD")}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <a onClick={() => router.push(`/bookings/${record._id}`)}>
            <EyeOutlined /> Chi tiết
          </a>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <Title level={2} className={styles.pageTitle}>
            Đơn đặt phòng
          </Title>
          <Text type="secondary" className={styles.pageSubtitle}>
            Quản lý các đơn đặt phòng cho tất cả chỗ ở của bạn.
          </Text>
        </div>
      </div>

      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 200 }}
        >
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="pending">Đang chờ</Option>
          <Option value="confirmed">Đã xác nhận</Option>
          <Option value="completed">Hoàn thành</Option>
          <Option value="cancelled">Đã hủy</Option>
        </Select>
      </div>

      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </>
  );
}


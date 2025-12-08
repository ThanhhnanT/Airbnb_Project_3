"use client";

import { useEffect, useState } from "react";
import { Table, Tag, message, Card, Space, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getAccess } from "@/helper/api";
import type { ColumnsType } from "antd/es/table";

interface Payment {
  _id: string;
  booking_id?: {
    _id: string;
  };
  user_id?: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  currency: string;
  provider: string;
  status: string;
  createdAt: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const result = await getAccess("payments");
      setPayments(Array.isArray(result) ? result : []);
    } catch (error) {
      message.error("Không thể tải danh sách payments");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.user_id?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      payment.user_id?.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<Payment> = [
    {
      title: "User",
      key: "user",
      render: (_, record) => record.user_id?.name || "N/A",
    },
    {
      title: "Email",
      key: "email",
      render: (_, record) => record.user_id?.email || "N/A",
    },
    {
      title: "Số tiền",
      key: "amount",
      render: (_, record) => `${record.amount} ${record.currency}`,
    },
    {
      title: "Provider",
      dataIndex: "provider",
      key: "provider",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: any = {
          pending: "orange",
          paid: "green",
          failed: "red",
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
  ];

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16, width: "100%" }} direction="vertical">
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </Space>
        <Table
          columns={columns}
          dataSource={filteredPayments}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}


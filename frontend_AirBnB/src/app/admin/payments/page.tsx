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
    check_in?: string;
    check_out?: string;
    total_price?: number;
    currency?: string;
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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchPayments(1, 10);
  }, []);

  const fetchPayments = async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      const result = await getAccess(`admin/payments?page=${page}&limit=${limit}`, {}, true); // Use admin token
      setPayments(result?.data || []);
      if (result?.pagination) {
        setPagination({
          current: result.pagination.page,
          pageSize: result.pagination.limit,
          total: result.pagination.total,
        });
      }
    } catch (error) {
      message.error("Không thể tải danh sách payments");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination: any) => {
    fetchPayments(pagination.current, pagination.pageSize);
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
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Card 
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
        bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
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
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} payments`,
          }}
          onChange={handleTableChange}
          scroll={{ y: "calc(100vh - 300px)" }}
        />
      </Card>
    </div>
  );
}


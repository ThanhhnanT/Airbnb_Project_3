"use client";

import { Table, Tag, Button, Space, Typography, Tooltip } from "antd";
import { EyeOutlined, UndoOutlined, WarningOutlined, DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

export interface Payment {
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

interface PaymentTableProps {
  data: Payment[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onViewDetail: (payment: Payment) => void;
  onRefund: (payment: Payment) => void;
  onExportCSV: () => void;
  onChange: (pagination: any) => void;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  data,
  loading,
  pagination,
  onViewDetail,
  onRefund,
  onExportCSV,
  onChange,
}) => {
  const statusColors: Record<string, string> = {
    pending: "orange",
    paid: "green",
    failed: "red",
    refunded: "blue",
  };

  const statusLabels: Record<string, string> = {
    pending: "Chờ xử lý",
    paid: "Đã thanh toán",
    failed: "Thất bại",
    refunded: "Hoàn tiền",
  };

  const columns: ColumnsType<Payment> = [
    {
      title: "Khách hàng",
      key: "user",
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong>{record.user_id?.name || "N/A"}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.user_id?.email || ""}
          </Text>
        </div>
      ),
    },
    {
      title: "Booking",
      key: "booking",
      width: 180,
      render: (_, record) => {
        if (!record.booking_id) return "N/A";
        return (
          <div>
            <Tooltip title={record.booking_id._id}>
              <Text code style={{ fontSize: 11 }}>
                {record.booking_id._id?.slice(0, 8)}...
              </Text>
            </Tooltip>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.booking_id.check_in
                ? new Date(record.booking_id.check_in).toLocaleDateString("vi-VN")
                : ""}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Số tiền",
      key: "amount",
      width: 120,
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
      render: (_, record) => (
        <Text strong>
          {(record.amount || 0).toLocaleString("vi-VN")} {record.currency}
        </Text>
      ),
    },
    {
      title: "Provider",
      dataIndex: "provider",
      key: "provider",
      width: 100,
      render: (provider: string) => (
        <Tag color="blue">{provider.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status] || status}
        </Tag>
      ),
      filters: [
        { text: "Chờ xử lý", value: "pending" },
        { text: "Đã thanh toán", value: "paid" },
        { text: "Thất bại", value: "failed" },
        { text: "Hoàn tiền", value: "refunded" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: string) => (
        <Text>{new Date(date).toLocaleDateString("vi-VN")}</Text>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewDetail(record)}
            />
          </Tooltip>
          {record.status === "paid" && (
            <Tooltip title="Hoàn tiền">
              <Button
                type="text"
                size="small"
                danger
                icon={<UndoOutlined />}
                onClick={() => onRefund(record)}
              />
            </Tooltip>
          )}
          {record.status === "failed" && (
            <Tooltip title="Tranh chấp">
              <Button
                type="text"
                size="small"
                icon={<WarningOutlined />}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={onExportCSV}
        >
          Xuất CSV
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} payments`,
          pageSizeOptions: ["10", "20", "50"],
        }}
        onChange={onChange}
        scroll={{ x: 1200 }}
      />
    </>
  );
};

export default PaymentTable;

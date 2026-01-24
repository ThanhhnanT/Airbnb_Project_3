"use client";

import { Table, Tag, Button, Space, Typography, Tooltip, Checkbox } from "antd";
import { EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, CalendarOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

export interface Payout {
  _id: string;
  host_id: {
    _id: string;
    name: string;
    email: string;
  };
  booking_id: {
    _id: string;
    check_in?: string;
    check_out?: string;
  };
  payment_id: {
    _id: string;
    amount: number;
    currency: string;
  };
  amount: number;
  platform_fee: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  bank_account_id?: {
    _id: string;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
  };
  admin_note?: string;
  processed_by?: {
    _id: string;
    name: string;
  };
  processed_at?: string;
  createdAt: string;
}

interface PayoutTableProps {
  data: Payout[];
  loading: boolean;
  selectedRowKeys: React.Key[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onViewDetail: (payout: Payout) => void;
  onMarkAsPaid: (payout: Payout) => void;
  onSchedule: (payout: Payout) => void;
  onSelectChange: (selectedKeys: React.Key[]) => void;
  onChange: (pagination: any) => void;
}

export const PayoutTable: React.FC<PayoutTableProps> = ({
  data,
  loading,
  selectedRowKeys,
  pagination,
  onViewDetail,
  onMarkAsPaid,
  onSchedule,
  onSelectChange,
  onChange,
}) => {
  const statusColors: Record<string, string> = {
    pending: "orange",
    paid: "green",
    failed: "red",
  };

  const statusLabels: Record<string, string> = {
    pending: "Chờ xử lý",
    paid: "Đã chuyển",
    failed: "Thất bại",
  };

  const columns: ColumnsType<Payout> = [
    {
      title: "Host",
      key: "host",
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong>{record.host_id?.name || "N/A"}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.host_id?.email || ""}
          </Text>
        </div>
      ),
    },
    {
      title: "Số tiền",
      key: "amount",
      width: 180,
      sorter: (a, b) => a.amount - b.amount,
      render: (_, record) => (
        <div>
          <Text strong>{(record.amount || 0).toLocaleString("vi-VN")} {record.currency}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Phí: {(record.platform_fee || 0).toLocaleString("vi-VN")} {record.currency}
          </Text>
        </div>
      ),
    },
    {
      title: "Thông tin ngân hàng",
      key: "bank",
      width: 200,
      render: (_, record) => {
        if (!record.bank_account_id) {
          return <Text type="danger">Chưa có thông tin</Text>;
        }
        return (
          <div>
            <Text strong>{record.bank_account_id.bank_name}</Text>
            <br />
            <Text code style={{ fontSize: 11 }}>
              {record.bank_account_id.account_number?.slice(-4).padStart(
                record.bank_account_id.account_number?.length,
                "*"
              )}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.bank_account_id.account_holder_name}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const icons: Record<string, React.ReactNode> = {
          pending: <ClockCircleOutlined />,
          paid: <CheckCircleOutlined />,
          failed: <ClockCircleOutlined />,
        };
        return (
          <Tag color={statusColors[status]} icon={icons[status]}>
            {statusLabels[status] || status}
          </Tag>
        );
      },
      filters: [
        { text: "Chờ xử lý", value: "pending" },
        { text: "Đã chuyển", value: "paid" },
        { text: "Thất bại", value: "failed" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: string) => (
        <Text>{new Date(date).toLocaleDateString("vi-VN")}</Text>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewDetail(record)}
            />
          </Tooltip>
          {record.status === "pending" && (
            <>
              <Tooltip title="Đánh dấu đã chuyển">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => onMarkAsPaid(record)}
                />
              </Tooltip>
              <Tooltip title="Lên lịch">
                <Button
                  type="dashed"
                  size="small"
                  icon={<CalendarOutlined />}
                  onClick={() => onSchedule(record)}
                />
              </Tooltip>
            </>
          )}
          {record.status === "paid" && record.processed_at && (
            <Text type="success" style={{ fontSize: 12 }}>
              ✓ {new Date(record.processed_at).toLocaleDateString("vi-VN")}
            </Text>
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="_id"
      loading={loading}
      rowSelection={rowSelection}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} payouts`,
        pageSizeOptions: ["10", "20", "50"],
      }}
      onChange={onChange}
      scroll={{ x: 1400 }}
    />
  );
};

export default PayoutTable;

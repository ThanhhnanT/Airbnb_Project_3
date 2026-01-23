"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Typography,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Select,
  DatePicker,
  Spin,
  message,
} from "antd";
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { getAccess } from "@/helper/api";
import { useMessageApi } from "@/components/providers/Message";
import { useSocket } from "@/components/providers/SocketProvider";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import styles from "./payouts.module.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Payout {
  _id: string;
  amount: number;
  platform_fee: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  createdAt: string;
  processed_at?: string;
  booking_id?: {
    _id: string;
    check_in: string;
    check_out: string;
    total_price: number;
  };
  payment_id?: {
    _id: string;
    amount: number;
  };
}

interface PayoutStats {
  total: number;
  pending: number;
  paid: number;
  failed: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
}

export default function HostPayoutsPage() {
  const messageApi = useMessageApi();
  const { socket } = useSocket();
  const router = useRouter();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchPayouts();
    fetchStats();
  }, [statusFilter]);

  // Listen for bank_account_required and payout_paid notifications
  useEffect(() => {
    if (!socket) return;

    socket.on("bank_account_required", (data: any) => {
      messageApi.warning({
        content: data.message || "Vui lòng thêm thông tin tài khoản ngân hàng để nhận payout",
        duration: 8,
      });
      router.push("/host/bank-account");
    });

    socket.on("payout_paid", (data: any) => {
      messageApi.success({
        content: data.message || `Payout ${data.payout_id} đã được xử lý thành công!`,
        duration: 5,
      });
      fetchPayouts(); // Refresh the list
      fetchStats(); // Refresh stats
    });

    return () => {
      socket.off("bank_account_required");
      socket.off("payout_paid");
    };
  }, [socket, messageApi, router]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const result = await getAccess("payouts/my-payouts", {
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setPayouts(result || []);
    } catch (error: any) {
      console.error("Error fetching payouts:", error);
      messageApi.error("Không thể tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await getAccess("payouts/my-payouts/stats");
      setStats(result);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      paid: { color: "success", icon: <CheckCircleOutlined />, text: "Đã thanh toán" },
      pending: { color: "warning", icon: <ClockCircleOutlined />, text: "Đang chờ" },
      failed: { color: "error", icon: <CloseCircleOutlined />, text: "Thất bại" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const columns: ColumnsType<Payout> = [
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: "Check-in",
      key: "checkIn",
      render: (_, record) =>
        record.booking_id?.check_in
          ? dayjs(record.booking_id.check_in).format("DD/MM/YYYY")
          : "N/A",
    },
    {
      title: "Tổng tiền đặt phòng",
      key: "totalPrice",
      render: (_, record) =>
        record.booking_id?.total_price
          ? formatCurrency(record.booking_id.total_price, record.currency)
          : "N/A",
      align: "right",
    },
    {
      title: "Phí platform",
      dataIndex: "platform_fee",
      key: "platform_fee",
      render: (fee: number, record) => formatCurrency(fee, record.currency),
      align: "right",
    },
    {
      title: "Số tiền nhận",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number, record) => (
        <Text strong style={{ color: "#52c41a" }}>
          {formatCurrency(amount, record.currency)}
        </Text>
      ),
      align: "right",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
      filters: [
        { text: "Đang chờ", value: "pending" },
        { text: "Đã thanh toán", value: "paid" },
        { text: "Thất bại", value: "failed" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Ngày xử lý",
      dataIndex: "processed_at",
      key: "processed_at",
      render: (date: string) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
  ];

  return (
    <div className={styles.container}>
      <Title level={2}>
        <DollarOutlined /> Thanh toán
      </Title>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng thanh toán"
                value={stats.total}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đang chờ"
                value={stats.pending}
                valueStyle={{ color: "#faad14" }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đã thanh toán"
                value={stats.paid}
                valueStyle={{ color: "#52c41a" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng số tiền"
                value={stats.totalAmount}
                precision={2}
                prefix="$"
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Space style={{ marginBottom: 16, width: "100%" }} direction="vertical">
          <Space>
            <Text strong>Lọc theo trạng thái: </Text>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 200 }}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="pending">Đang chờ</Select.Option>
              <Select.Option value="paid">Đã thanh toán</Select.Option>
              <Select.Option value="failed">Thất bại</Select.Option>
            </Select>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={payouts}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} thanh toán`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}

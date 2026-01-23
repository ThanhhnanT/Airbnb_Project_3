"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  message,
  Card,
  Space,
  Input,
  Button,
  Modal,
  Form,
  Typography,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { getAccess, postAccess } from "@/helper/api";
import { useMessageApi } from "@/components/providers/Message";
import { useSocket } from "@/components/providers/SocketProvider";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface Payout {
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

export default function AdminPayoutsPage() {
  const messageApi = useMessageApi();
  const { socket } = useSocket();
  const [form] = Form.useForm();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [markPaidModalVisible, setMarkPaidModalVisible] = useState(false);
  const [markPaidLoading, setMarkPaidLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
  });

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  // Listen for new payout notifications via Socket.IO
  useEffect(() => {
    if (!socket) return;

    socket.on("payout_pending", (data: any) => {
      messageApi.info(`Có payout mới cần xử lý: ${data.amount} ${data.currency}`);
      fetchPayouts(); // Refresh the list
    });

    return () => {
      socket.off("payout_pending");
    };
  }, [socket, messageApi]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `payouts?status=${statusFilter}`
        : "payouts";
      const result = await getAccess(url, {}, true); // Use admin token
      setPayouts(result || []);
      
      // Calculate stats
      const allPayouts = result || [];
      const statsData = {
        total: allPayouts.length,
        pending: allPayouts.filter((p: Payout) => p.status === "pending").length,
        paid: allPayouts.filter((p: Payout) => p.status === "paid").length,
        totalAmount: allPayouts.reduce((sum: number, p: Payout) => sum + p.amount, 0),
        pendingAmount: allPayouts
          .filter((p: Payout) => p.status === "pending")
          .reduce((sum: number, p: Payout) => sum + p.amount, 0),
        paidAmount: allPayouts
          .filter((p: Payout) => p.status === "paid")
          .reduce((sum: number, p: Payout) => sum + p.amount, 0),
      };
      setStats(statsData);
    } catch (error) {
      messageApi.error("Không thể tải danh sách payouts");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (values: { note?: string }) => {
    if (!selectedPayout) return;

    try {
      setMarkPaidLoading(true);
      await postAccess(`payouts/${selectedPayout._id}/mark-paid`, {
        note: values.note || "",
      }, true); // Use admin token
      messageApi.success("Đánh dấu payout đã được chuyển tiền thành công!");
      setMarkPaidModalVisible(false);
      form.resetFields();
      setSelectedPayout(null);
      await fetchPayouts();
    } catch (error: any) {
      console.error("Error marking payout as paid:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể đánh dấu payout đã được chuyển tiền"
      );
    } finally {
      setMarkPaidLoading(false);
    }
  };

  const openMarkPaidModal = (payout: Payout) => {
    setSelectedPayout(payout);
    setMarkPaidModalVisible(true);
  };

  const filteredPayouts = payouts.filter(
    (payout) =>
      payout.host_id?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      payout.host_id?.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      payout.bank_account_id?.account_number?.includes(searchText)
  );

  const columns: ColumnsType<Payout> = [
    {
      title: "Host",
      key: "host",
      render: (_, record) => (
        <div>
          <div>{record.host_id?.name || "N/A"}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.host_id?.email || ""}
          </Text>
        </div>
      ),
    },
    {
      title: "Số tiền",
      key: "amount",
      render: (_, record) => (
        <div>
          <Text strong>{record.amount} {record.currency}</Text>
          <div style={{ fontSize: 12, color: "#999" }}>
            Phí: {record.platform_fee} {record.currency}
          </div>
        </div>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Thông tin ngân hàng",
      key: "bank",
      render: (_, record) => {
        if (!record.bank_account_id) {
          return <Text type="danger">Chưa có thông tin</Text>;
        }
        return (
          <div>
            <div>{record.bank_account_id.bank_name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.bank_account_id.account_number}
            </Text>
            <div style={{ fontSize: 12 }}>
              {record.bank_account_id.account_holder_name}
            </div>
          </div>
        );
      },
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
        const icons: any = {
          pending: <ClockCircleOutlined />,
          paid: <CheckCircleOutlined />,
          failed: <ClockCircleOutlined />,
        };
        return (
          <Tag color={colors[status]} icon={icons[status]}>
            {status === "pending" ? "Chờ xử lý" : status === "paid" ? "Đã chuyển" : "Thất bại"}
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
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        if (record.status === "pending") {
          return (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => openMarkPaidModal(record)}
            >
              Đánh dấu đã chuyển
            </Button>
          );
        }
        if (record.status === "paid") {
          return (
            <div>
              <Text type="success">Đã xử lý</Text>
              {record.processed_at && (
                <div style={{ fontSize: 12, color: "#999" }}>
                  {new Date(record.processed_at).toLocaleDateString("vi-VN")}
                </div>
              )}
            </div>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={2}>Quản lý Payouts</Title>

        {/* Statistics */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng số Payouts"
                value={stats.total}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Chờ xử lý"
                value={stats.pending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã chuyển"
                value={stats.paid}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng tiền chờ xử lý"
                value={stats.pendingAmount}
                suffix="VND"
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card>
          <Space style={{ marginBottom: 16, width: "100%" }} direction="vertical">
            <Space>
              <Input
                placeholder="Tìm kiếm theo host, email hoặc số tài khoản..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 400 }}
              />
              <Button
                onClick={() => setStatusFilter(undefined)}
                type={statusFilter === undefined ? "primary" : "default"}
              >
                Tất cả
              </Button>
              <Button
                onClick={() => setStatusFilter("pending")}
                type={statusFilter === "pending" ? "primary" : "default"}
              >
                Chờ xử lý
              </Button>
              <Button
                onClick={() => setStatusFilter("paid")}
                type={statusFilter === "paid" ? "primary" : "default"}
              >
                Đã chuyển
              </Button>
            </Space>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredPayouts}
            rowKey="_id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} payouts`,
            }}
          />
        </Card>
      </Space>

      {/* Mark as Paid Modal */}
      <Modal
        title="Đánh dấu payout đã được chuyển tiền"
        open={markPaidModalVisible}
        onCancel={() => {
          setMarkPaidModalVisible(false);
          form.resetFields();
          setSelectedPayout(null);
        }}
        footer={null}
      >
        {selectedPayout && (
          <div>
            <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
              <div>
                <Text strong>Host:</Text> {selectedPayout.host_id?.name}
              </div>
              <div>
                <Text strong>Số tiền:</Text> {selectedPayout.amount} {selectedPayout.currency}
              </div>
              {selectedPayout.bank_account_id && (
                <div>
                  <Text strong>Ngân hàng:</Text> {selectedPayout.bank_account_id.bank_name}
                  <br />
                  <Text strong>Số tài khoản:</Text> {selectedPayout.bank_account_id.account_number}
                  <br />
                  <Text strong>Chủ tài khoản:</Text> {selectedPayout.bank_account_id.account_holder_name}
                </div>
              )}
            </Space>

            <Form form={form} onFinish={handleMarkAsPaid} layout="vertical">
              <Form.Item
                label="Ghi chú (tùy chọn)"
                name="note"
              >
                <TextArea
                  rows={4}
                  placeholder="Nhập ghi chú về việc chuyển tiền..."
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={markPaidLoading}
                    icon={<CheckCircleOutlined />}
                  >
                    Xác nhận đã chuyển tiền
                  </Button>
                  <Button
                    onClick={() => {
                      setMarkPaidModalVisible(false);
                      form.resetFields();
                      setSelectedPayout(null);
                    }}
                  >
                    Hủy
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Space,
  message,
  Typography,
  Spin,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Badge,
  Drawer,
  Statistic,
  Row,
  Col,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  CheckOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { getAccess, patch } from "@/helper/api";
import { useSocket } from "@/components/providers/SocketProvider";
import dayjs from "dayjs";
import styles from "./refunds.module.css";

const { Title, Text } = Typography;

interface Refund {
  _id: string;
  booking_id: {
    _id: string;
    check_in: string;
    check_out: string;
    total_price: number;
  };
  guest_id: {
    _id: string;
    name: string;
    email: string;
  };
  host_id: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  currency: string;
  reason: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  admin_notes?: string;
  requested_at: string;
  approved_at?: string;
  completed_at?: string;
  createdAt: string;
}

interface RefundStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  totalAmount: number;
}

export default function RefundsPage() {
  const { socket } = useSocket();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<RefundStats | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchRefunds();
    fetchStats();

    if (socket) {
      socket.on("refund_requested", () => {
        fetchRefunds();
        fetchStats();
        message.info("Có yêu cầu hoàn tiền mới");
      });

      socket.on("refund_approved", () => {
        fetchRefunds();
        fetchStats();
        message.success("Hoàn tiền được phê duyệt");
      });

      socket.on("refund_rejected", () => {
        fetchRefunds();
        fetchStats();
        message.info("Hoàn tiền bị từ chối");
      });

      return () => {
        socket.off("refund_requested");
        socket.off("refund_approved");
        socket.off("refund_rejected");
      };
    }
  }, [socket]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const result = await getAccess(
        `refunds${statusFilter ? `?status=${statusFilter}` : ""}`
      );
      console.log("Refunds result:", result);
      
      // getAccess returns data directly, not wrapped in {data}
      if (result && Array.isArray(result)) {
        setRefunds(result);
        setPagination({
          ...pagination,
          total: result.length,
        });
      } else if (result?.data && Array.isArray(result.data)) {
        setRefunds(result.data);
        setPagination({
          ...pagination,
          total: result.data.length,
        });
      } else {
        console.error("Invalid refunds result format:", result);
        setRefunds([]);
      }
    } catch (error) {
      console.error("Error fetching refunds:", error);
      message.error("Lỗi khi tải danh sách hoàn tiền");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const result = await getAccess("refunds/stats");
      console.log("Stats result:", result);
      
      // getAccess returns data directly
      if (result && typeof result === 'object' && 'total' in result) {
        setStats(result);
      } else if (result?.data) {
        setStats(result.data);
      } else {
        console.error("Invalid stats result format:", result);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRefund) return;

    try {
      setApproveLoading(true);
      const values = await approveForm.validateFields();
      const result = await patch(`refunds/${selectedRefund._id}/approve`, values);
      if (result?.data) {
        message.success("Phê duyệt hoàn tiền thành công");
        setApproveModalVisible(false);
        setDrawerVisible(false);
        approveForm.resetFields();
        fetchRefunds();
        fetchStats();
      } else {
        message.error(result?.message || "Lỗi khi phê duyệt hoàn tiền");
      }
    } catch (error: any) {
      message.error(
        error?.message || "Lỗi khi phê duyệt hoàn tiền"
      );
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRefund) return;

    try {
      setRejectLoading(true);
      const values = await rejectForm.validateFields();
      const result = await patch(`refunds/${selectedRefund._id}/reject`, values);
      if (result?.data) {
        message.success("Từ chối hoàn tiền thành công");
        setRejectModalVisible(false);
        setDrawerVisible(false);
        rejectForm.resetFields();
        fetchRefunds();
        fetchStats();
      } else {
        message.error(result?.message || "Lỗi khi từ chối hoàn tiền");
      }
    } catch (error: any) {
      message.error(
        error?.message || "Lỗi khi từ chối hoàn tiền"
      );
    } finally {
      setRejectLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<
      string,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      pending: {
        color: "orange",
        icon: <ClockCircleOutlined />,
        label: "Đang chờ",
      },
      approved: {
        color: "blue",
        icon: <CheckCircleOutlined />,
        label: "Đã phê duyệt",
      },
      pending_host_confirmation: {
        color: "blue",
        icon: <CheckCircleOutlined />,
        label: "Chờ xác nhận chủ nhà",
      },
      confirmed_by_host: {
        color: "green",
        icon: <CheckCircleOutlined />,
        label: "Hoàn thành",
      },
      rejected: {
        color: "red",
        icon: <CloseCircleOutlined />,
        label: "Bị từ chối",
      },
      completed: {
        color: "green",
        icon: <CheckCircleOutlined />,
        label: "Hoàn thành",
      },
      cancelled: {
        color: "default",
        icon: <StopOutlined />,
        label: "Đã hủy",
      },
    };

    const config = statusMap[status] || statusMap["pending"];
    return <Tag icon={config.icon} color={config.color}>{config.label}</Tag>;
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      guest_request: "Yêu cầu của khách hàng",
      safety_issue: "Vấn đề an toàn",
      not_as_described: "Phòng không như mô tả",
      host_unresponsive: "Chủ nhà không phản hồi",
      other: "Lý do khác",
    };
    return reasonMap[reason] || reason;
  };

  const columns: ColumnsType<Refund> = [
    {
      title: "Khách hàng",
      dataIndex: ["guest_id", "name"],
      key: "guest_name",
      width: 150,
      render: (text: string, record: Refund) => (
        <div>
          <div>{text}</div>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.guest_id.email}
          </Text>
        </div>
      ),
    },
    {
      title: "Phòng",
      key: "booking",
      width: 150,
      render: (_, record: Refund) => (
        <div>
          <div>Check-in: {dayjs(record.booking_id.check_in).format("DD/MM/YYYY")}</div>
          <div>Check-out: {dayjs(record.booking_id.check_out).format("DD/MM/YYYY")}</div>
        </div>
      ),
    },
    {
      title: "Số tiền",
      key: "amount",
      width: 120,
      render: (_, record: Refund) => (
        <Text strong>
          {record.amount} {record.currency}
        </Text>
      ),
    },
    {
      title: "Lý do",
      key: "reason",
      width: 150,
      render: (_, record: Refund) => getReasonLabel(record.reason),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "Yêu cầu lúc",
      key: "requested_at",
      width: 130,
      render: (_, record: Refund) =>
        dayjs(record.requested_at).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      render: (_, record: Refund) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRefund(record);
            setDrawerVisible(true);
          }}
        >
          Xem
        </Button>
      ),
    },
  ];

  const paginatedRefunds = refunds.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  return (
    <div className={styles.container}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={2}>Quản lý Hoàn tiền</Title>
          <Text type="secondary">
            Xem và quản lý tất cả các yêu cầu hoàn tiền từ khách hàng
          </Text>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <Spin />
        ) : stats ? (
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng yêu cầu"
                  value={stats.total}
                  suffix="hoàn tiền"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Đang chờ"
                  value={stats.pending}
                  valueStyle={{ color: "#faad14" }}
                  suffix="yêu cầu"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Đã hoàn thành"
                  value={stats.completed}
                  valueStyle={{ color: "#52c41a" }}
                  suffix="yêu cầu"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng tiền"
                  value={stats.totalAmount}
                  prefix="$"
                  precision={2}
                />
              </Card>
            </Col>
          </Row>
        ) : null}

        {/* Filters */}
        <Card>
          <Space>
            <Text>Lọc theo trạng thái:</Text>
            <Select
              style={{ width: 150 }}
              placeholder="Chọn trạng thái"
              allowClear
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPagination({ ...pagination, current: 1 });
              }}
              options={[
                { label: "Đang chờ", value: "pending" },
                { label: "Đã phê duyệt", value: "approved" },
                { label: "Chờ xác nhận chủ nhà", value: "pending_host_confirmation" },
                { label: "Hoàn thành", value: "confirmed_by_host" },
                { label: "Bị từ chối", value: "rejected" },
                { label: "Đã hủy", value: "cancelled" },
              ]}
            />
          </Space>
        </Card>

        {/* Table */}
        <Card loading={loading}>
          <Table
            columns={columns}
            dataSource={paginatedRefunds}
            rowKey="_id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page) => setPagination({ ...pagination, current: page }),
            }}
          />
        </Card>
      </Space>

      {/* Detail Drawer */}
      <Drawer
        title="Chi tiết hoàn tiền"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedRefund && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Guest Info */}
            <Card title="Thông tin khách hàng" size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Text strong>Tên:</Text>
                  <div>{selectedRefund.guest_id.name}</div>
                </div>
                <div>
                  <Text strong>Email:</Text>
                  <div>{selectedRefund.guest_id.email}</div>
                </div>
              </Space>
            </Card>

            {/* Host Info */}
            <Card title="Thông tin chủ nhà" size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Text strong>Tên:</Text>
                  <div>{selectedRefund.host_id.name}</div>
                </div>
                <div>
                  <Text strong>Email:</Text>
                  <div>{selectedRefund.host_id.email}</div>
                </div>
              </Space>
            </Card>

            {/* Booking Info */}
            <Card title="Thông tin booking" size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Text strong>Check-in:</Text>
                  <div>
                    {dayjs(selectedRefund.booking_id.check_in).format(
                      "DD/MM/YYYY HH:mm"
                    )}
                  </div>
                </div>
                <div>
                  <Text strong>Check-out:</Text>
                  <div>
                    {dayjs(selectedRefund.booking_id.check_out).format(
                      "DD/MM/YYYY HH:mm"
                    )}
                  </div>
                </div>
              </Space>
            </Card>

            {/* Refund Details */}
            <Card title="Chi tiết hoàn tiền" size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Text strong>Trạng thái:</Text>
                  <div>{getStatusTag(selectedRefund.status)}</div>
                </div>
                <div>
                  <Text strong>Số tiền:</Text>
                  <div>
                    {selectedRefund.amount} {selectedRefund.currency}
                  </div>
                </div>
                <div>
                  <Text strong>Lý do:</Text>
                  <div>{getReasonLabel(selectedRefund.reason)}</div>
                </div>
                <div>
                  <Text strong>Mô tả:</Text>
                  <div style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>
                    {selectedRefund.description}
                  </div>
                </div>
                <div>
                  <Text strong>Yêu cầu lúc:</Text>
                  <div>
                    {dayjs(selectedRefund.requested_at).format(
                      "DD/MM/YYYY HH:mm"
                    )}
                  </div>
                </div>
                {selectedRefund.admin_notes && (
                  <div>
                    <Text strong>Ghi chú admin:</Text>
                    <div style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>
                      {selectedRefund.admin_notes}
                    </div>
                  </div>
                )}
              </Space>
            </Card>

            {/* Actions */}
            {selectedRefund.status === "pending" && (
              <Space style={{ width: "100%" }}>
                <Button
                  type="primary"
                  danger
                  block
                  icon={<CloseCircleOutlined />}
                  onClick={() => setRejectModalVisible(true)}
                >
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  block
                  icon={<CheckCircleOutlined />}
                  onClick={() => setApproveModalVisible(true)}
                >
                  Phê duyệt
                </Button>
              </Space>
            )}
          </Space>
        )}
      </Drawer>

      {/* Approve Modal */}
      <Modal
        title="Phê duyệt hoàn tiền"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => {
          setApproveModalVisible(false);
          approveForm.resetFields();
        }}
        confirmLoading={approveLoading}
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item
            label="Ghi chú (tùy chọn)"
            name="admin_notes"
          >
            <Input.TextArea placeholder="Nhập ghi chú về quyết định phê duyệt..." rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Từ chối hoàn tiền"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          rejectForm.resetFields();
        }}
        confirmLoading={rejectLoading}
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            label="Lý do từ chối"
            name="admin_notes"
            rules={[
              { required: true, message: "Vui lòng nhập lý do từ chối" },
            ]}
          >
            <Input.TextArea placeholder="Nhập lý do từ chối hoàn tiền..." rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

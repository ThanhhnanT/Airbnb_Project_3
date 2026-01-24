"use client";

import { Modal, Form, Input, Button, Space, Tag, Empty, Table, message } from "antd";
import { PlusOutlined, WarningOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;

interface Dispute {
  _id: string;
  status: string;
  reason: string;
  createdAt: string;
  resolved_at?: string;
}

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  user_id?: {
    name: string;
    email: string;
  };
}

interface DisputeModalProps {
  visible: boolean;
  payment: Payment | null;
  disputes: Dispute[];
  onClose: () => void;
  onCreateDispute: (paymentId: string, reason: string) => Promise<void>;
  loading?: boolean;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  visible,
  payment,
  disputes,
  onClose,
  onCreateDispute,
  loading,
}) => {
  const [form] = Form.useForm();
  const [creating, setCreating] = Form.useForm();

  const handleCreateDispute = async (values: { reason: string }) => {
    if (!payment) return;
    try {
      await onCreateDispute(payment._id, values.reason);
      form.resetFields();
      message.success("Tạo tranh chấp thành công");
    } catch (error) {
      console.error("Create dispute error:", error);
    }
  };

  const columns: ColumnsType<Dispute> = [
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: Record<string, string> = {
          open: "red",
          in_review: "orange",
          resolved: "green",
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
    <Modal
      title="Quản lý Tranh chấp"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="back" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      {payment && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Existing Disputes */}
          <div>
            <h4>Tranh chấp hiện tại</h4>
            {disputes && disputes.length > 0 ? (
              <Table
                columns={columns}
                dataSource={disputes}
                rowKey="_id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="Không có tranh chấp nào" />
            )}
          </div>

          {/* Create Dispute Form */}
          <div>
            <h4>Tạo tranh chấp mới</h4>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCreateDispute}
              autoComplete="off"
            >
              <Form.Item
                label="Lý do tranh chấp"
                name="reason"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập lý do tranh chấp",
                  },
                ]}
              >
                <TextArea
                  rows={3}
                  placeholder="Nhập chi tiết về tranh chấp..."
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlusOutlined />}
                  loading={loading}
                >
                  Tạo tranh chấp
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Space>
      )}
    </Modal>
  );
};

export default DisputeModal;

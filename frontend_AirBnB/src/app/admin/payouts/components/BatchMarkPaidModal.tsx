"use client";

import { Modal, Form, Input, Button, Space, Alert, Statistic, Row, Col, Table } from "antd";
import { CheckCircleOutlined, DollarOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;

interface Payout {
  _id: string;
  amount: number;
  currency: string;
  host_id: {
    name: string;
  };
}

interface BatchMarkPaidModalProps {
  visible: boolean;
  payouts: Payout[];
  onClose: () => void;
  onConfirm: (payoutIds: string[], note: string) => Promise<void>;
  loading?: boolean;
}

export const BatchMarkPaidModal: React.FC<BatchMarkPaidModalProps> = ({
  visible,
  payouts,
  onClose,
  onConfirm,
  loading,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: { note?: string }) => {
    try {
      const payoutIds = payouts.map((p) => p._id);
      await onConfirm(payoutIds, values.note || "");
      form.resetFields();
    } catch (error) {
      console.error("Batch mark error:", error);
    }
  };

  const totalAmount = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

  const columns: ColumnsType<Payout> = [
    {
      title: "Host",
      dataIndex: ["host_id", "name"],
      key: "host",
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number, record) => (
        <span>{amount.toLocaleString("vi-VN")} {record.currency}</span>
      ),
    },
  ];

  return (
    <Modal
      title="Đánh dấu nhiều Payout đã chuyển"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Alert
          message={`Bạn đang đánh dấu ${payouts.length} payout đã chuyển tiền`}
          type="warning"
          showIcon
        />

        {/* Summary Stats */}
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="Tổng số Payout"
              value={payouts.length}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Tổng tiền"
              value={totalAmount}
              suffix={payouts.length > 0 ? payouts[0].currency : "VND"}
              prefix={<DollarOutlined />}
            />
          </Col>
        </Row>

        {/* Payouts List */}
        <div>
          <h4>Danh sách Payout sẽ được xử lý</h4>
          <Table
            columns={columns}
            dataSource={payouts}
            rowKey="_id"
            pagination={false}
            size="small"
          />
        </div>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Ghi chú chung (tùy chọn)"
            name="note"
          >
            <TextArea
              rows={3}
              placeholder="Nhập ghi chú về việc xử lý này..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<CheckCircleOutlined />}
                loading={loading}
              >
                Xác nhận và đánh dấu đã chuyển
              </Button>
              <Button onClick={onClose}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};

export default BatchMarkPaidModal;

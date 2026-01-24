"use client";

import { Modal, Form, Input, Button, Space, Statistic, Row, Col, message } from "antd";
import { UndoOutlined, DollarOutlined } from "@ant-design/icons";

const { TextArea } = Input;

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  user_id?: {
    name: string;
    email: string;
  };
  booking_id?: {
    _id: string;
  };
}

interface RefundModalProps {
  visible: boolean;
  payment: Payment | null;
  onClose: () => void;
  onConfirm: (paymentId: string, reason: string) => Promise<void>;
  loading?: boolean;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  visible,
  payment,
  onClose,
  onConfirm,
  loading,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: { reason: string }) => {
    if (!payment) return;
    try {
      await onConfirm(payment._id, values.reason);
      form.resetFields();
    } catch (error) {
      console.error("Refund error:", error);
    }
  };

  return (
    <Modal
      title="Hoàn tiền Thanh toán"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      {payment && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Payment Info */}
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Số tiền hoàn"
                  value={payment.amount}
                  suffix={payment.currency}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col span={12}>
                <div>
                  <strong>Khách hàng:</strong>
                  <div>{payment.user_id?.name}</div>
                  <div>{payment.user_id?.email}</div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Refund Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              label="Lý do hoàn tiền"
              name="reason"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập lý do hoàn tiền",
                },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Nhập lý do hoàn tiền cho khách hàng..."
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<UndoOutlined />}
                  loading={loading}
                  danger
                >
                  Xác nhận hoàn tiền
                </Button>
                <Button onClick={onClose}>Hủy</Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      )}
    </Modal>
  );
};

export default RefundModal;

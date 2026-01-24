"use client";

import { Modal, Drawer, Space, Divider, Button, Tag, Typography, Table, Row, Col, Statistic } from "antd";
import { EyeOutlined, UndoOutlined, WarningOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

export interface PaymentDetail {
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
  provider_payment_id?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface PaymentDetailModalProps {
  visible: boolean;
  payment: PaymentDetail | null;
  onClose: () => void;
  onRefund: (payment: PaymentDetail) => void;
  loading?: boolean;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  visible,
  payment,
  onClose,
  onRefund,
  loading,
}) => {
  if (!payment) return null;

  const statusColors: Record<string, string> = {
    pending: "orange",
    paid: "green",
    failed: "red",
    refunded: "blue",
  };

  return (
    <Drawer
      title="Chi tiết Thanh toán"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <Space style={{ float: "right" }}>
          <Button onClick={onClose}>Đóng</Button>
          {payment.status === "paid" && (
            <Button
              type="primary"
              danger
              icon={<UndoOutlined />}
              onClick={() => onRefund(payment)}
              loading={loading}
            >
              Hoàn tiền
            </Button>
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Payment Info */}
        <div>
          <Title level={5}>Thông tin Thanh toán</Title>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Mã Thanh toán:</Text>
              <br />
              <Text code>{payment._id}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Trạng thái:</Text>
              <br />
              <Tag color={statusColors[payment.status]}>
                {payment.status === "pending" && "Chờ xử lý"}
                {payment.status === "paid" && "Đã thanh toán"}
                {payment.status === "failed" && "Thất bại"}
                {payment.status === "refunded" && "Hoàn tiền"}
              </Tag>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
            <Col span={12}>
              <Text strong>Số tiền:</Text>
              <br />
              <Text>{payment.amount} {payment.currency}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Provider:</Text>
              <br />
              <Text>{payment.provider}</Text>
            </Col>
          </Row>
          {payment.provider_payment_id && (
            <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
              <Col span={24}>
                <Text strong>Provider Payment ID:</Text>
                <br />
                <Text code>{payment.provider_payment_id}</Text>
              </Col>
            </Row>
          )}
        </div>

        {/* User Info */}
        <div>
          <Title level={5}>Thông tin Người dùng</Title>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Tên:</Text>
              <br />
              <Text>{payment.user_id?.name || "N/A"}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Email:</Text>
              <br />
              <Text>{payment.user_id?.email || "N/A"}</Text>
            </Col>
          </Row>
        </div>

        {/* Booking Info */}
        {payment.booking_id && (
          <div>
            <Title level={5}>Thông tin Booking</Title>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Booking ID:</Text>
                <br />
                <Text code>{payment.booking_id._id}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Check-in:</Text>
                <br />
                <Text>
                  {payment.booking_id.check_in
                    ? new Date(payment.booking_id.check_in).toLocaleDateString("vi-VN")
                    : "N/A"}
                </Text>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
              <Col span={12}>
                <Text strong>Check-out:</Text>
                <br />
                <Text>
                  {payment.booking_id.check_out
                    ? new Date(payment.booking_id.check_out).toLocaleDateString("vi-VN")
                    : "N/A"}
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>Tổng giá:</Text>
                <br />
                <Text>{payment.booking_id.total_price} {payment.booking_id.currency}</Text>
              </Col>
            </Row>
          </div>
        )}

        {/* Timeline */}
        <div>
          <Title level={5}>Lịch sử</Title>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Ngày tạo:</Text>
              <br />
              <Text>{new Date(payment.createdAt).toLocaleString("vi-VN")}</Text>
            </Col>
            {payment.updatedAt && (
              <Col span={12}>
                <Text strong>Cập nhật:</Text>
                <br />
                <Text>{new Date(payment.updatedAt).toLocaleString("vi-VN")}</Text>
              </Col>
            )}
          </Row>
        </div>
      </Space>
    </Drawer>
  );
};

export default PaymentDetailModal;

"use client";

import { Drawer, Space, Divider, Button, Tag, Typography, Row, Col } from "antd";
import { CheckCircleOutlined, CalendarOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

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

interface PayoutDetailModalProps {
  visible: boolean;
  payout: Payout | null;
  onClose: () => void;
  onMarkAsPaid: (payout: Payout) => void;
  onSchedule: (payout: Payout) => void;
}

export const PayoutDetailModal: React.FC<PayoutDetailModalProps> = ({
  visible,
  payout,
  onClose,
  onMarkAsPaid,
  onSchedule,
}) => {
  if (!payout) return null;

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

  return (
    <Drawer
      title="Chi tiết Payout"
      placement="right"
      onClose={onClose}
      open={visible}
      width={650}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <Space style={{ float: "right" }}>
          <Button onClick={onClose}>Đóng</Button>
          {payout.status === "pending" && (
            <>
              <Button
                type="dashed"
                icon={<CalendarOutlined />}
                onClick={() => {
                  onSchedule(payout);
                  onClose();
                }}
              >
                Lên lịch
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  onMarkAsPaid(payout);
                  onClose();
                }}
              >
                Đánh dấu đã chuyển
              </Button>
            </>
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Payout Info */}
        <div>
          <Title level={5}>Thông tin Payout</Title>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Mã Payout:</Text>
              <br />
              <Text code>{payout._id}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Trạng thái:</Text>
              <br />
              <Tag color={statusColors[payout.status]}>
                {statusLabels[payout.status]}
              </Tag>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
            <Col span={12}>
              <Text strong>Số tiền:</Text>
              <br />
              <Text>{(payout.amount || 0).toLocaleString("vi-VN")} {payout.currency}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Phí nền tảng:</Text>
              <br />
              <Text>{(payout.platform_fee || 0).toLocaleString("vi-VN")} {payout.currency}</Text>
            </Col>
          </Row>
        </div>

        {/* Host Info */}
        <div>
          <Title level={5}>Thông tin Host</Title>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Tên:</Text>
              <br />
              <Text>{payout.host_id?.name || "N/A"}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Email:</Text>
              <br />
              <Text>{payout.host_id?.email || "N/A"}</Text>
            </Col>
          </Row>
        </div>

        {/* Bank Info */}
        {payout.bank_account_id && (
          <div>
            <Title level={5}>Thông tin Ngân hàng</Title>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Ngân hàng:</Text>
                <br />
                <Text>{payout.bank_account_id.bank_name}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Số tài khoản:</Text>
                <br />
                <Text code>{payout.bank_account_id.account_number}</Text>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
              <Col span={24}>
                <Text strong>Chủ tài khoản:</Text>
                <br />
                <Text>{payout.bank_account_id.account_holder_name}</Text>
              </Col>
            </Row>
          </div>
        )}

        {/* Booking Info */}
        <div>
          <Title level={5}>Thông tin Booking</Title>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Booking ID:</Text>
              <br />
              <Text code>{payout.booking_id._id}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Check-in:</Text>
              <br />
              <Text>
                {payout.booking_id.check_in
                  ? new Date(payout.booking_id.check_in).toLocaleDateString("vi-VN")
                  : "N/A"}
              </Text>
            </Col>
          </Row>
        </div>

        {/* Processing Info */}
        {payout.status === "paid" && (
          <div>
            <Title level={5}>Thông tin Xử lý</Title>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>Xử lý bởi:</Text>
                <br />
                <Text>{payout.processed_by?.name || "Hệ thống"}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Ngày xử lý:</Text>
                <br />
                <Text>
                  {payout.processed_at
                    ? new Date(payout.processed_at).toLocaleString("vi-VN")
                    : "N/A"}
                </Text>
              </Col>
            </Row>
            {payout.admin_note && (
              <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
                <Col span={24}>
                  <Text strong>Ghi chú Admin:</Text>
                  <br />
                  <Text>{payout.admin_note}</Text>
                </Col>
              </Row>
            )}
          </div>
        )}

        {/* Timeline */}
        <div>
          <Title level={5}>Lịch sử</Title>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Text strong>Ngày tạo:</Text>
              <br />
              <Text>{new Date(payout.createdAt).toLocaleString("vi-VN")}</Text>
            </Col>
          </Row>
        </div>
      </Space>
    </Drawer>
  );
};

export default PayoutDetailModal;

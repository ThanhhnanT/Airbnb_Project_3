"use client";

import { Card, Descriptions, Button, message, Space, Tag, Alert, Row, Col } from "antd";
import { useState } from "react";
import { patch } from "@/helper/api";
import { ReloadOutlined, LinkOutlined } from "@ant-design/icons";

interface UserStripeConnectProps {
  userId: string;
  stripeAccountId?: string;
  stripeAccountStatus?: string;
  payoutEnabled: boolean;
  onSuccess: () => void;
}

const statusColors: { [key: string]: string } = {
  unverified: "red",
  pending: "orange",
  verified: "green",
};

export default function UserStripeConnect({
  userId,
  stripeAccountId,
  stripeAccountStatus = "unverified",
  payoutEnabled,
  onSuccess,
}: UserStripeConnectProps) {
  const [loading, setLoading] = useState(false);

  const handleSyncStatus = async () => {
    try {
      setLoading(true);
      await patch(`admin/users/${userId}/stripe-sync`, {});
      message.success("Đã cập nhật trạng thái Stripe Connect");
      onSuccess();
    } catch (error) {
      message.error("Không thể cập nhật trạng thái Stripe Connect");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePayout = async () => {
    try {
      setLoading(true);
      await patch(`admin/users/${userId}`, {
        payout_enabled: !payoutEnabled,
      });
      message.success(
        `${!payoutEnabled ? "Kích hoạt" : "Vô hiệu hóa"} payout thành công`
      );
      onSuccess();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Quản Lý Stripe Connect" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        {!stripeAccountId ? (
          <Alert
            message="User chưa kết nối Stripe"
            description="User cần kết nối tài khoản Stripe Connect để có thể rút tiền"
            type="info"
            showIcon
          />
        ) : (
          <>
            <Descriptions bordered size="small">
              <Descriptions.Item label="Stripe Account ID" span={3}>
                <code>{stripeAccountId}</code>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái tài khoản" span={3}>
                <Tag color={statusColors[stripeAccountStatus]}>
                  {stripeAccountStatus?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Payout Enabled" span={3}>
                <Tag color={payoutEnabled ? "green" : "red"}>
                  {payoutEnabled ? "Có" : "Không"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={16}>
              <Col>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleSyncStatus}
                  loading={loading}
                >
                  Cập nhật trạng thái
                </Button>
              </Col>
              <Col>
                <Button
                  type={payoutEnabled ? "default" : "primary"}
                  onClick={handleTogglePayout}
                  loading={loading}
                >
                  {payoutEnabled ? "Vô hiệu hóa" : "Kích hoạt"} Payout
                </Button>
              </Col>
            </Row>
          </>
        )}
      </Space>
    </Card>
  );
}

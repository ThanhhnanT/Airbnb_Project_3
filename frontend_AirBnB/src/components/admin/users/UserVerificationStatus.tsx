"use client";

import { Card, Switch, Row, Col, Space, message, Button } from "antd";
import { useState } from "react";
import { patch } from "@/helper/api";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

interface UserVerificationStatusProps {
  userId: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  onSuccess: () => void;
}

export default function UserVerificationStatus({
  userId,
  emailVerified,
  phoneVerified,
  idVerified,
  onSuccess,
}: UserVerificationStatusProps) {
  const [localEmailVerified, setLocalEmailVerified] = useState(emailVerified);
  const [localPhoneVerified, setLocalPhoneVerified] = useState(phoneVerified);
  const [localIdVerified, setLocalIdVerified] = useState(idVerified);
  const [loading, setLoading] = useState(false);

  const handleToggleVerification = async (type: string, value: boolean) => {
    try {
      setLoading(true);
      await patch(`admin/users/${userId}`, {
        [`${type}_verified`]: value,
      });
      message.success(`Cập nhật xác thực thành công`);
      onSuccess();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const VerificationRow = ({
    label,
    verified,
    type,
  }: {
    label: string;
    verified: boolean;
    type: string;
  }) => (
    <Row
      gutter={16}
      align="middle"
      style={{
        padding: "12px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <Col span={12}>{label}</Col>
      <Col span={6}>
        {verified ? (
          <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
        ) : (
          <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />
        )}
      </Col>
      <Col span={6}>
        <Switch
          checked={verified}
          onChange={(value) => handleToggleVerification(type, value)}
          loading={loading}
        />
      </Col>
    </Row>
  );

  return (
    <Card title="Trạng Thái Xác Thực" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <VerificationRow
          label="Email xác thực"
          verified={localEmailVerified}
          type="email"
        />
        <VerificationRow
          label="Điện thoại xác thực"
          verified={localPhoneVerified}
          type="phone"
        />
        <VerificationRow
          label="ID xác thực"
          verified={localIdVerified}
          type="id"
        />
      </Space>
    </Card>
  );
}

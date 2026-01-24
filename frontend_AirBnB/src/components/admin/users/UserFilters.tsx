"use client";

import { Input, Select, Row, Col, Button, Space } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import type { SelectProps } from "antd";

interface UserFiltersProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  role: string;
  onRoleChange: (value: string) => void;
  emailVerified?: string;
  onEmailVerifiedChange: (value: string) => void;
  phoneVerified?: string;
  onPhoneVerifiedChange: (value: string) => void;
  idVerified?: string;
  onIdVerifiedChange: (value: string) => void;
  stripeStatus?: string;
  onStripeStatusChange: (value: string) => void;
  isActive?: string;
  onIsActiveChange: (value: string) => void;
  onReset: () => void;
}

const roleOptions: SelectProps["options"] = [
  { label: "Tất cả vai trò", value: "" },
  { label: "Guest", value: "guest" },
  { label: "Host", value: "host" },
  { label: "Admin", value: "admin" },
];

const verificationOptions: SelectProps["options"] = [
  { label: "Tất cả", value: "" },
  { label: "Đã xác thực", value: "true" },
  { label: "Chưa xác thực", value: "false" },
];

const stripeStatusOptions: SelectProps["options"] = [
  { label: "Tất cả", value: "" },
  { label: "Unverified", value: "unverified" },
  { label: "Pending", value: "pending" },
  { label: "Verified", value: "verified" },
];

const activeStatusOptions: SelectProps["options"] = [
  { label: "Tất cả", value: "" },
  { label: "Hoạt động", value: "true" },
  { label: "Không hoạt động", value: "false" },
];

export default function UserFilters({
  searchText,
  onSearchChange,
  role,
  onRoleChange,
  emailVerified,
  onEmailVerifiedChange,
  phoneVerified,
  onPhoneVerifiedChange,
  idVerified,
  onIdVerifiedChange,
  stripeStatus,
  onStripeStatusChange,
  isActive,
  onIsActiveChange,
  onReset,
}: UserFiltersProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={24} md={8}>
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            placeholder="Vai trò"
            options={roleOptions}
            value={role || undefined}
            onChange={(value) => onRoleChange(value || "")}
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            placeholder="Email verified"
            options={verificationOptions}
            value={emailVerified || undefined}
            onChange={(value) => onEmailVerifiedChange(value || "")}
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            placeholder="Phone verified"
            options={verificationOptions}
            value={phoneVerified || undefined}
            onChange={(value) => onPhoneVerifiedChange(value || "")}
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            placeholder="ID verified"
            options={verificationOptions}
            value={idVerified || undefined}
            onChange={(value) => onIdVerifiedChange(value || "")}
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            placeholder="Stripe status"
            options={stripeStatusOptions}
            value={stripeStatus || undefined}
            onChange={(value) => onStripeStatusChange(value || "")}
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            placeholder="Trạng thái"
            options={activeStatusOptions}
            value={isActive || undefined}
            onChange={(value) => onIsActiveChange(value || "")}
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} sm={24}>
          <Space>
            <Button type="primary" onClick={onReset} icon={<ClearOutlined />}>
              Đặt lại
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
}

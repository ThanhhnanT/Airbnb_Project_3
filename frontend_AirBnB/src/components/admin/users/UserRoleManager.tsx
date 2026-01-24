"use client";

import { Card, Select, Button, message, Space, Alert } from "antd";
import { useState } from "react";
import { patch } from "@/helper/api";
import type { SelectProps } from "antd";

interface UserRoleManagerProps {
  userId: string;
  currentRole: string;
  onSuccess: () => void;
}

const roleOptions: SelectProps["options"] = [
  { label: "Guest", value: "guest" },
  { label: "Host", value: "host" },
  { label: "Admin", value: "admin" },
];

export default function UserRoleManager({
  userId,
  currentRole,
  onSuccess,
}: UserRoleManagerProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);

  const handleChangeRole = async () => {
    if (selectedRole === currentRole) {
      message.info("Vai trò không thay đổi");
      return;
    }

    try {
      setLoading(true);
      await patch(`admin/users/${userId}`, {
        role: { type: selectedRole },
      });
      message.success("Cập nhật vai trò thành công");
      onSuccess();
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật vai trò");
      setSelectedRole(currentRole);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Vai Trò & Quyền" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Alert
          message="Thay đổi vai trò sẽ ảnh hưởng đến quyền truy cập của user"
          type="warning"
          showIcon
        />
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            Vai trò hiện tại
          </label>
          <Select
            value={selectedRole}
            options={roleOptions}
            onChange={setSelectedRole}
            style={{ width: "100%", marginBottom: 16 }}
          />
        </div>
        <Button
          type="primary"
          onClick={handleChangeRole}
          loading={loading}
          disabled={selectedRole === currentRole}
        >
          Cập nhật vai trò
        </Button>
      </Space>
    </Card>
  );
}

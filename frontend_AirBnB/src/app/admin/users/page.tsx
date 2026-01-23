"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, message, Card, Space, Input, Switch } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getAccess, patch } from "@/helper/api";
import type { ColumnsType } from "antd/es/table";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: {
    type: string;
  };
  isActive: boolean;
  email_verified?: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await getAccess("admin/users", {}, true); // Use admin token
      setUsers(result.data || []);
    } catch (error) {
      message.error("Không thể tải danh sách users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await patch(`admin/users/${id}/status`, { isActive: !isActive });
      message.success("Cập nhật trạng thái thành công");
      fetchUsers();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<User> = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => phone || "N/A",
    },
    {
      title: "Vai trò",
      key: "role",
      render: (_, record) => (
        <Tag color={record.role?.type === "admin" ? "red" : "blue"}>
          {record.role?.type || "guest"}
        </Tag>
      ),
    },
    {
      title: "Email verified",
      key: "email_verified",
      render: (_, record) => (
        <Tag color={record.email_verified ? "green" : "orange"}>
          {record.email_verified ? "Đã xác thực" : "Chưa xác thực"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      key: "isActive",
      render: (_, record) => (
        <Switch
          checked={record.isActive}
          onChange={() => handleToggleActive(record._id, record.isActive)}
        />
      ),
    },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Card 
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
        bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <Space style={{ marginBottom: 16, width: "100%" }} direction="vertical">
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </Space>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ y: "calc(100vh - 300px)" }}
        />
      </Card>
    </div>
  );
}


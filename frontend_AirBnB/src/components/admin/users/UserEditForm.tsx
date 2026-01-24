"use client";

import { Form, Input, Button, message, Space, Card } from "antd";
import { useState } from "react";
import { patch } from "@/helper/api";

interface UserEditFormProps {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  onSuccess: () => void;
}

export default function UserEditForm({
  userId,
  name,
  email,
  phone,
  bio,
  avatar_url,
  onSuccess,
}: UserEditFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await patch(`admin/users/${userId}`, {
        name: values.name,
        email: values.email,
        phone: values.phone,
        bio: values.bio,
        avatar_url: values.avatar_url,
      });
      message.success("Cập nhật thông tin thành công");
      onSuccess();
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Thông Tin Cơ Bản" style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ name, email, phone, bio, avatar_url }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Tên"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên" }]}
        >
          <Input placeholder="Nhập tên user" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input placeholder="Nhập email" />
        </Form.Item>

        <Form.Item label="Số điện thoại" name="phone">
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item label="Bio" name="bio">
          <Input.TextArea rows={4} placeholder="Nhập tiểu sử" />
        </Form.Item>

        <Form.Item label="Avatar URL" name="avatar_url">
          <Input placeholder="Nhập URL avatar" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu thay đổi
            </Button>
            <Button onClick={() => form.resetFields()}>Đặt lại</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}

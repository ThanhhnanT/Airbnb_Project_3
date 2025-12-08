"use client";

import { useState } from "react";
import { Card, Form, Input, Button, message, Divider } from "antd";
import { SaveOutlined } from "@ant-design/icons";

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      // TODO: Implement settings update API
      message.success("Cập nhật cài đặt thành công");
    } catch (error) {
      message.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="Cài đặt hệ thống">
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            name="siteName"
            label="Tên website"
            initialValue="Airbnb Clone"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="siteDescription"
            label="Mô tả website"
            initialValue="Platform đặt phòng trực tuyến"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Divider />

          <Form.Item
            name="adminEmail"
            label="Email quản trị viên"
            initialValue="admin@example.com"
          >
            <Input type="email" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              Lưu cài đặt
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}


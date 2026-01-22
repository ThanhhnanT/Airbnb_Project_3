"use client";

import { useState, useEffect } from "react";
import { Card, Form, Input, Button, message, Divider, Spin } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { getAccess, patchAccess } from "@/helper/api";

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const result = await getAccess("admin/settings");
      if (result) {
        form.setFieldsValue({
          siteName: result.siteName || "Airbnb Clone",
          siteDescription: result.siteDescription || "Platform đặt phòng trực tuyến",
          adminEmail: result.adminEmail || "admin@example.com",
        });
      }
    } catch (error) {
      message.error("Không thể tải cài đặt");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await patchAccess("admin/settings", values);
      message.success("Cập nhật cài đặt thành công");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra khi cập nhật cài đặt";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

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
            rules={[{ required: true, message: "Vui lòng nhập tên website" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="siteDescription"
            label="Mô tả website"
            rules={[{ required: true, message: "Vui lòng nhập mô tả website" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Divider />

          <Form.Item
            name="adminEmail"
            label="Email quản trị viên"
            rules={[
              { required: true, message: "Vui lòng nhập email quản trị viên" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
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


"use client";

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { handleAdminLogin } from "@/service/auth";
import { useMessageApi } from "@/components/providers/Message";
import Cookies from "js-cookie";
import styles from "./admin-login.module.css";

const { Title, Text } = Typography;

export default function AdminLoginPage() {
  const messageApi = useMessageApi();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    // If already logged in as admin, redirect to dashboard
    const token = Cookies.get("access_token");
    if (token) {
      // Check if user is admin by trying to access profile
      // This will be handled by the layout, but we can redirect here too
      router.push("/admin");
    }
  }, [router]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data = {
        email: values.email?.trim(),
        password: values.password,
      };

      try {
        const res = await handleAdminLogin(data);

        // Check for errors
        if (!res) {
          messageApi.error(
            "Không nhận được phản hồi từ server. Vui lòng thử lại sau."
          );
          setLoading(false);
          return;
        }

        // Network error (statusCode 0)
        if (res.statusCode === 0) {
          messageApi.error(
            res.message ||
              "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
          );
          setLoading(false);
          return;
        }

        // Server errors (4xx, 5xx)
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          const errorMessage =
            res.message || res.error || "Đã xảy ra lỗi. Vui lòng thử lại.";
          messageApi.error(errorMessage);
          setLoading(false);
          return;
        }

        // Success case
        if (!res.access_token) {
          messageApi.error("Đăng nhập thất bại. Không nhận được token.");
          setLoading(false);
          return;
        }

        Cookies.set("access_token", res.access_token);
        messageApi.success("Đăng nhập thành công");
        router.push("/admin");
      } catch (e: any) {
        console.error("API call error:", e);
        const errorMessage =
          e?.message ||
          e?.response?.data?.message ||
          "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
        messageApi.error(errorMessage);
      } finally {
        setLoading(false);
      }
    } catch (error: any) {
      // Form validation errors
      if (error.errorFields) {
        const firstError = error.errorFields[0];
        messageApi.warning(
          firstError?.errors?.[0]?.message ||
            "Vui lòng kiểm tra lại thông tin đã nhập"
        );
      } else {
        console.error("Validation Failed:", error);
        messageApi.error("Vui lòng điền đầy đủ thông tin");
      }
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginWrapper}>
        <Card className={styles.loginCard}>
          <div className={styles.logoContainer}>
            <Image
              src="/AirBnB_Big.png"
              alt="Airbnb Admin"
              width={180}
              height={48}
              priority
            />
          </div>
          <Title level={2} className={styles.title}>
            Đăng nhập Admin
          </Title>
          <Text type="secondary" className={styles.subtitle}>
            Vui lòng đăng nhập bằng tài khoản admin
          </Text>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className={styles.form}
            size="large"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập email admin"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                { min: 1, message: "Mật khẩu không được để trống!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className={styles.submitButton}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}

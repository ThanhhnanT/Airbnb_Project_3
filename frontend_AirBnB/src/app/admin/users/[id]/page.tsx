"use client";

import { useEffect, useState } from "react";
import { Card, Spin, Button, Row, Col, Descriptions, Tag, Avatar, Space, message, Divider, Alert } from "antd";
import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { getAccess } from "@/helper/api";
import UserEditForm from "@/components/admin/users/UserEditForm";
import UserRoleManager from "@/components/admin/users/UserRoleManager";
import UserVerificationStatus from "@/components/admin/users/UserVerificationStatus";
import UserStripeConnect from "@/components/admin/users/UserStripeConnect";
import UserAnalytics from "@/components/admin/users/UserAnalytics";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: {
    type: string;
  };
  bio?: string;
  avatar_url?: string;
  languages?: string[];
  email_verified: boolean;
  phone_verified: boolean;
  id_verified: boolean;
  isActive: boolean;
  stripe_account_id?: string;
  stripe_account_status?: string;
  payout_enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId, refreshKey]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const result = await getAccess(`admin/users/${userId}`, {}, true);
      setUser(result.data || null);
    } catch (error) {
      message.error("Không thể tải thông tin user");
      setTimeout(() => router.back(), 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSuccess = () => {
    message.success("Cập nhật thành công");
    handleRefresh();
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <Alert message="User không tồn tại" type="error" />
        <Button onClick={() => router.back()} style={{ marginTop: 16 }}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              Quay lại
            </Button>
            <h1 style={{ margin: 0 }}>Chi tiết User: {user.name}</h1>
          </Space>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Làm mới
          </Button>
        </Col>
      </Row>

      {/* User Profile Card */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8} style={{ textAlign: "center" }}>
            <Avatar
              size={120}
              src={user.avatar_url}
              style={{
                backgroundColor: "#87d068",
                marginBottom: 16,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <h2 style={{ margin: "8px 0" }}>{user.name}</h2>
              <Tag color={user.isActive ? "green" : "red"}>
                {user.isActive ? "Hoạt động" : "Không hoạt động"}
              </Tag>
            </div>
          </Col>
          <Col xs={24} sm={16}>
            <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Điện thoại">
                {user.phone || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                <Tag color={user.role?.type === "admin" ? "red" : user.role?.type === "host" ? "blue" : "cyan"}>
                  {user.role?.type?.toUpperCase() || "GUEST"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngôn ngữ">
                {user.languages?.join(", ") || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Bio">
                {user.bio || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      <Divider />

      {/* Edit Form */}
      <UserEditForm
        userId={userId}
        name={user.name}
        email={user.email}
        phone={user.phone}
        bio={user.bio}
        avatar_url={user.avatar_url}
        onSuccess={handleSuccess}
      />

      {/* Role Manager */}
      <UserRoleManager
        userId={userId}
        currentRole={user.role?.type || "guest"}
        onSuccess={handleSuccess}
      />

      {/* Verification Status */}
      <UserVerificationStatus
        userId={userId}
        emailVerified={user.email_verified}
        phoneVerified={user.phone_verified}
        idVerified={user.id_verified}
        onSuccess={handleSuccess}
      />

      {/* Stripe Connect */}
      <UserStripeConnect
        userId={userId}
        stripeAccountId={user.stripe_account_id}
        stripeAccountStatus={user.stripe_account_status}
        payoutEnabled={user.payout_enabled}
        onSuccess={handleSuccess}
      />

      {/* Analytics */}
      <UserAnalytics
        userId={userId}
        userRole={user.role?.type}
      />
    </div>
  );
}

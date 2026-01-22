"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layout,
  Card,
  Typography,
  Button,
  Avatar,
  Space,
  Divider,
  message,
  Form,
  Input,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  CreditCardOutlined,
  BellOutlined,
  StarOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { getUserProfile, updateUserProfile } from "@/service/user";
import { useMessageApi } from "@/components/providers/Message";
import Cookies from "js-cookie";
import styles from "./profile.module.css";

const { Content } = Layout;
const { Title, Text } = Typography;

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  bio?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const messageApi = useMessageApi();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!Cookies.get("access_token")) {
      router.push("/");
      return;
    }
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      setUser(profile);
      // Set form values when profile is loaded
      form.setFieldsValue({
        name: profile.name,
        phone: profile.phone || "",
      });
    } catch (error: any) {
      messageApi.error("Không thể tải thông tin hồ sơ");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!user?._id) return;

      setIsSaving(true);
      await updateUserProfile(user._id, values);
      messageApi.success("Cập nhật thông tin thành công");
      fetchProfile();
    } catch (error: any) {
      messageApi.error("Không thể cập nhật thông tin");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("access_token");
    messageApi.success("Đăng xuất thành công");
    router.push("/");
  };

  const maskEmail = (email: string) => {
    if (!email) return "";
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    const maskedLocal = local.slice(0, 2) + "**";
    const maskedDomain = domain.slice(0, 1) + "****";
    return `${maskedLocal}@${maskedDomain}.com`;
  };

  if (loading) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <Text>Đang tải...</Text>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.profileContainer}>
      <Layout className={styles.layout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <Card className={styles.sidebarCard}>
            <div className={styles.userSummary}>
              <Avatar
                size={48}
                src={user.avatar_url}
                icon={<UserOutlined />}
                className={styles.avatar}
              />
              <div className={styles.userInfo}>
                <Title level={5} className={styles.userName}>
                  {user.name}
                </Title>
                <Text type="secondary" className={styles.userEmail}>
                  {user.email}
                </Text>
              </div>
            </div>

            <div className={styles.navMenu}>
              <div className={styles.navItemActive}>
                <UserOutlined className={styles.navIcon} />
                <Text className={styles.navText}>Thông tin cá nhân</Text>
              </div>
              <div className={styles.navItem}>
                <SafetyOutlined className={styles.navIcon} />
                <Text className={styles.navText}>Bảo mật & Đăng nhập</Text>
              </div>
              <div className={styles.navItem}>
                <CreditCardOutlined className={styles.navIcon} />
                <Text className={styles.navText}>Thanh toán</Text>
              </div>
              <div className={styles.navItem}>
                <BellOutlined className={styles.navIcon} />
                <Text className={styles.navText}>Thông báo</Text>
              </div>
              <div className={styles.navItem}>
                <StarOutlined className={styles.navIcon} />
                <Text className={styles.navText}>Đánh giá</Text>
              </div>
            </div>

            <Divider className={styles.divider} />

            <div className={styles.logoutSection}>
              <div className={styles.navItem} onClick={handleLogout}>
                <LogoutOutlined className={styles.navIcon} />
                <Text className={styles.navText}>Đăng xuất</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Content className={styles.mainContent}>
          <Form form={form} onFinish={handleSave}>
            {/* Account Information */}
            <Card className={styles.infoCard}>
            <Title level={4} className={styles.sectionTitle}>
              Thông tin tài khoản
            </Title>

            <div className={styles.infoList}>
              {/* Legal Name */}
              <div className={styles.infoItem}>
                <div className={styles.infoLeft}>
                  <div className={styles.infoIcon}>
                    <UserOutlined />
                  </div>
                  <div className={styles.infoContent}>
                    <Text strong className={styles.infoLabel}>
                      Tên pháp lý
                    </Text>
                    <Form.Item name="name" className={styles.formItem}>
                      <Input 
                        placeholder="Nhập tên pháp lý"
                        className={styles.inputField}
                      />
                    </Form.Item>
                  </div>
                </div>
              </div>

              <Divider className={styles.itemDivider} />

              {/* Email */}
              <div className={styles.infoItem}>
                <div className={styles.infoLeft}>
                  <div className={styles.infoIcon}>
                    <MailOutlined />
                  </div>
                  <div className={styles.infoContent}>
                    <Text strong className={styles.infoLabel}>
                      Địa chỉ email
                    </Text>
                    <Text type="secondary" className={styles.infoValue}>
                      {maskEmail(user.email)}
                    </Text>
                  </div>
                </div>
              </div>

              <Divider className={styles.itemDivider} />

              {/* Phone */}
              <div className={styles.infoItem}>
                <div className={styles.infoLeft}>
                  <div className={styles.infoIcon}>
                    <PhoneOutlined />
                  </div>
                  <div className={styles.infoContent}>
                    <Text strong className={styles.infoLabel}>
                      Số điện thoại
                    </Text>
                    <Form.Item name="phone" className={styles.formItem}>
                      <Input 
                        placeholder="Nhập số điện thoại"
                        className={styles.inputField}
                      />
                    </Form.Item>
                  </div>
                </div>
              </div>

              <Divider className={styles.itemDivider} />

              {/* Address */}
              <div className={styles.infoItem}>
                <div className={styles.infoLeft}>
                  <div className={styles.infoIcon}>
                    <EnvironmentOutlined />
                  </div>
                  <div className={styles.infoContent}>
                    <Text strong className={styles.infoLabel}>
                      Địa chỉ
                    </Text>
                    <Text type="secondary" className={styles.infoValue}>
                      Chưa cung cấp
                    </Text>
                  </div>
                </div>
                <Button
                  type="link"
                  className={styles.editLink}
                  onClick={() => messageApi.info("Tính năng đang phát triển")}
                >
                  Thêm
                </Button>
              </div>
            </div>
            
            {/* Save Button */}
            <div className={styles.saveButtonContainer}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={isSaving}
                className={styles.saveButton}
                size="large"
              >
                Lưu thay đổi
              </Button>
            </div>
          </Card>

          {/* Verified Information */}
          <Card className={styles.infoCard}>
            <Title level={4} className={styles.sectionTitle}>
              Thông tin đã xác minh
            </Title>

            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <div className={styles.infoLeft}>
                  <div className={styles.infoIconVerified}>
                    <SafetyOutlined />
                  </div>
                  <div className={styles.infoContent}>
                    <Text strong className={styles.infoLabel}>
                      Email đã xác minh
                    </Text>
                    <Text type="secondary" className={styles.infoValue}>
                      Thông tin liên lạc của bạn đã được xác nhận.
                    </Text>
                  </div>
                </div>
                <div className={styles.verifiedBadge}>
                  <CheckCircleOutlined className={styles.verifiedIcon} />
                </div>
              </div>
            </div>
          </Card>
          </Form>
        </Content>
      </Layout>
    </div>
  );
}

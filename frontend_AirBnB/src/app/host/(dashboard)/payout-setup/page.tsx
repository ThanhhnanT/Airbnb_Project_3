"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Typography,
  Space,
  Alert,
  Spin,
  Tag,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { getAccess, postAccess } from "@/helper/api";
import { useMessageApi } from "@/components/providers/Message";
import styles from "./payout-setup.module.css";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface StripeAccountStatus {
  has_account: boolean;
  account_id?: string;
  status: "unverified" | "pending" | "verified";
  payout_enabled: boolean;
}

export default function PayoutSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messageApi = useMessageApi();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [accountLinkUrl, setAccountLinkUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchAccountStatus();
    
    // Check for success/refresh params from Stripe redirect
    const success = searchParams?.get("success");
    const refresh = searchParams?.get("refresh");
    
    if (success === "true") {
      messageApi.success("Đã kết nối tài khoản Stripe thành công!");
      fetchAccountStatus();
    }
    if (refresh === "true") {
      fetchAccountStatus();
    }

    // Lắng nghe message từ popup callback
    const messageHandler = (event: MessageEvent) => {
      if (event.data === 'stripe-onboarding-complete') {
        messageApi.success("Đã kết nối tài khoản Stripe thành công!");
        fetchAccountStatus();
      }
    };
    window.addEventListener('message', messageHandler);

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [searchParams]);

  const fetchAccountStatus = async () => {
    try {
      setStatusLoading(true);
      const status = await getAccess("users/stripe-connect/status");
      setAccountStatus(status);
      
      if (status?.has_account && status.status === "pending") {
        // Get account link if account exists but not verified
        fetchAccountLink();
      }
    } catch (error: any) {
      console.error("Error fetching account status:", error);
      messageApi.error("Không thể tải trạng thái tài khoản");
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchAccountLink = async () => {
    try {
      const result = await getAccess("users/stripe-connect/account-link");
      if (result?.url) {
        setAccountLinkUrl(result.url);
      }
    } catch (error) {
      console.error("Error fetching account link:", error);
    }
  };

  const handleCreateAccount = async (values: { email: string; country: string; type: string }) => {
    try {
      setLoading(true);
      const result = await postAccess("users/stripe-connect/create", {
        email: values.email,
        country: values.country,
        type: values.type || "express",
      });

      if (result?.account_id) {
        messageApi.success("Tài khoản Stripe Connect đã được tạo!");
        await fetchAccountLink();
        form.resetFields();
      }
    } catch (error: any) {
      console.error("Error creating account:", error);
      messageApi.error(error?.response?.data?.message || "Không thể tạo tài khoản Stripe");
    } finally {
      setLoading(false);
    }
  };

  const handleGetAccountLink = async (openInPopup: boolean = true) => {
    try {
      setLoading(true);
      const result = await getAccess("users/stripe-connect/account-link");
      if (result?.url) {
        if (openInPopup) {
          // Mở trong popup window
          const width = 800;
          const height = 900;
          const left = (window.screen.width - width) / 2;
          const top = (window.screen.height - height) / 2;
          
          const popup = window.open(
            result.url,
            'Stripe Onboarding',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,location=no`
          );

          if (!popup) {
            messageApi.warning("Popup bị chặn. Vui lòng cho phép popup và thử lại, hoặc chọn 'Mở trong tab mới'.");
            return;
          }

          messageApi.info("Cửa sổ đăng ký Stripe đã mở. Vui lòng hoàn tất đăng ký trong cửa sổ đó.");

          // Kiểm tra khi popup đóng hoặc redirect về
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed);
              // Kiểm tra lại trạng thái sau khi popup đóng
              setTimeout(() => {
                fetchAccountStatus();
                messageApi.success("Đang kiểm tra trạng thái đăng ký...");
              }, 1000);
            }
          }, 500);

          // Lắng nghe message từ popup (nếu có)
          const messageHandler = (event: MessageEvent) => {
            if (event.data === 'stripe-onboarding-complete') {
              fetchAccountStatus();
              window.removeEventListener('message', messageHandler);
            }
          };
          window.addEventListener('message', messageHandler);
        } else {
          // Redirect toàn trang (fallback)
          window.location.href = result.url;
        }
      }
    } catch (error: any) {
      console.error("Error getting account link:", error);
      messageApi.error("Không thể lấy link đăng ký");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccount = async () => {
    try {
      setLoading(true);
      await postAccess("users/stripe-connect/verify", {});
      messageApi.success("Đã cập nhật trạng thái tài khoản");
      await fetchAccountStatus();
    } catch (error: any) {
      console.error("Error verifying account:", error);
      messageApi.error("Không thể xác minh tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = () => {
    if (!accountStatus) return null;

    const statusConfig = {
      verified: { color: "success", icon: <CheckCircleOutlined />, text: "Đã xác minh" },
      pending: { color: "warning", icon: <LoadingOutlined />, text: "Đang chờ" },
      unverified: { color: "default", icon: <CloseCircleOutlined />, text: "Chưa xác minh" },
    };

    const config = statusConfig[accountStatus.status] || statusConfig.unverified;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  if (statusLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={2}>
              <CreditCardOutlined /> Thiết lập thanh toán
            </Title>
            <Paragraph>
              Kết nối tài khoản Stripe Connect để nhận thanh toán từ các đặt phòng của bạn.
              Stripe là nền tảng thanh toán được sử dụng bởi hàng triệu doanh nghiệp trên toàn thế giới.
            </Paragraph>
            <Alert
              message="Quy trình đăng ký"
              description={
                <ol style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                  <li>Tạo tài khoản Stripe Connect (chỉ cần email và quốc gia)</li>
                  <li>Hoàn tất đăng ký qua cửa sổ Stripe (xác minh danh tính và tài khoản ngân hàng)</li>
                  <li>Nhận thanh toán tự động sau mỗi đặt phòng thành công</li>
                </ol>
              }
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>

          {accountStatus?.has_account ? (
            <Card>
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div>
                  <Text strong>Trạng thái tài khoản: </Text>
                  {getStatusTag()}
                </div>

                {accountStatus.account_id && (
                  <div>
                    <Text strong>Account ID: </Text>
                    <Text code>{accountStatus.account_id}</Text>
                  </div>
                )}

                {accountStatus.payout_enabled ? (
                  <Alert
                    message="Tài khoản đã sẵn sàng nhận thanh toán"
                    description="Bạn sẽ nhận được thanh toán tự động sau mỗi đặt phòng thành công."
                    type="success"
                    showIcon
                  />
                ) : (
                  <>
                    <Alert
                      message="Cần hoàn tất đăng ký"
                      description={
                        <div>
                          <p style={{ marginBottom: 8 }}>Để nhận thanh toán, bạn cần hoàn tất đăng ký Stripe Connect. Quá trình này bao gồm:</p>
                          <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 20 }}>
                            <li>Xác minh danh tính cá nhân</li>
                            <li>Thông tin thuế (nếu cần)</li>
                            <li>Thông tin tài khoản ngân hàng để nhận tiền</li>
                          </ul>
                          <p style={{ marginTop: 8, marginBottom: 0, fontSize: '12px', color: '#666' }}>
                            <strong>Lưu ý:</strong> Quá trình đăng ký sẽ mở trong cửa sổ popup để đảm bảo bảo mật. 
                            Sau khi hoàn tất, bạn sẽ được chuyển về trang này tự động.
                          </p>
                        </div>
                      }
                      type="warning"
                      showIcon
                    />
                    <Space wrap>
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => handleGetAccountLink(true)}
                        loading={loading}
                        icon={<CreditCardOutlined />}
                      >
                        Hoàn tất đăng ký (Cửa sổ mới)
                      </Button>
                      <Button 
                        onClick={() => handleGetAccountLink(false)}
                        loading={loading}
                      >
                        Mở trong tab mới
                      </Button>
                      <Button onClick={handleVerifyAccount} loading={loading}>
                        Kiểm tra lại trạng thái
                      </Button>
                    </Space>
                  </>
                )}
              </Space>
            </Card>
          ) : (
            <Card>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleCreateAccount}
                initialValues={{ type: "express" }}
              >
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Vui lòng nhập email" },
                    { type: "email", message: "Email không hợp lệ" },
                  ]}
                >
                  <Input placeholder="your@email.com" />
                </Form.Item>

                <Form.Item
                  label="Quốc gia"
                  name="country"
                  rules={[{ required: true, message: "Vui lòng chọn quốc gia" }]}
                >
                  <Select placeholder="Chọn quốc gia">
                    <Option value="US">United States</Option>
                    <Option value="VN">Vietnam</Option>
                    <Option value="GB">United Kingdom</Option>
                    <Option value="CA">Canada</Option>
                    <Option value="AU">Australia</Option>
                    <Option value="SG">Singapore</Option>
                    <Option value="TH">Thailand</Option>
                    <Option value="MY">Malaysia</Option>
                    <Option value="ID">Indonesia</Option>
                    <Option value="PH">Philippines</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Loại tài khoản"
                  name="type"
                  tooltip="Express accounts có quy trình đăng ký đơn giản hơn"
                >
                  <Select>
                    <Option value="express">Express (Khuyến nghị)</Option>
                    <Option value="standard">Standard</Option>
                  </Select>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    Tạo tài khoản Stripe Connect
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Alert,
  Spin,
  message,
  Modal,
  Popconfirm,
} from "antd";
import {
  BankOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { getAccess, postAccess, patchAccess, deleteData } from "@/helper/api";
import { useMessageApi } from "@/components/providers/Message";
import { useSocket } from "@/components/providers/SocketProvider";
import { useRouter } from "next/navigation";
import styles from "./bank-account.module.css";

const { Title, Text } = Typography;

interface BankAccount {
  _id: string;
  account_number: string;
  bank_name: string;
  account_holder_name: string;
  is_primary: boolean;
  is_verified: boolean;
}

export default function BankAccountPage() {
  const messageApi = useMessageApi();
  const { socket } = useSocket();
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchBankAccount();
  }, []);

  // Listen for bank_account_required notification
  useEffect(() => {
    if (!socket) return;

    socket.on("bank_account_required", (data: any) => {
      messageApi.warning({
        content: data.message || "Vui lòng thêm thông tin tài khoản ngân hàng để nhận payout",
        duration: 8,
      });
      // Optionally redirect to bank account page if not already there
      if (window.location.pathname !== "/host/bank-account") {
        router.push("/host/bank-account");
      }
    });

    return () => {
      socket.off("bank_account_required");
    };
  }, [socket, messageApi, router]);

  const fetchBankAccount = async () => {
    try {
      setFetchLoading(true);
      const result = await getAccess("users/bank-account/primary");
      if (result) {
        setBankAccount(result);
        form.setFieldsValue({
          account_number: result.account_number,
          bank_name: result.bank_name,
          account_holder_name: result.account_holder_name,
        });
      }
    } catch (error: any) {
      // No bank account found is okay
      if (error?.response?.status !== 404) {
        console.error("Error fetching bank account:", error);
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (values: {
    account_number: string;
    bank_name: string;
    account_holder_name: string;
  }) => {
    try {
      setLoading(true);
      if (isEditing && bankAccount) {
        // Update existing
        await patchAccess(`users/bank-account/${bankAccount._id}`, values);
        messageApi.success("Cập nhật thông tin ngân hàng thành công!");
      } else {
        // Create new
        await postAccess("users/bank-account", values);
        messageApi.success("Thêm thông tin ngân hàng thành công!");
      }
      setIsEditing(false);
      await fetchBankAccount();
      form.resetFields();
    } catch (error: any) {
      console.error("Error saving bank account:", error);
      messageApi.error(
        error?.response?.data?.message || "Không thể lưu thông tin ngân hàng"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!bankAccount) return;

    try {
      setLoading(true);
      await deleteData(`users/bank-account/${bankAccount._id}`);
      messageApi.success("Xóa thông tin ngân hàng thành công!");
      setBankAccount(null);
      form.resetFields();
    } catch (error: any) {
      console.error("Error deleting bank account:", error);
      messageApi.error("Không thể xóa thông tin ngân hàng");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
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
              <BankOutlined /> Thông tin tài khoản ngân hàng
            </Title>
            <Text>
              Thông tin này sẽ được sử dụng để chuyển tiền payout cho bạn sau mỗi đặt phòng thành công.
            </Text>
          </div>

          {bankAccount && !isEditing ? (
            <Card>
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Alert
                  message="Thông tin ngân hàng đã được lưu"
                  description={
                    <div>
                      <p><strong>Tên ngân hàng:</strong> {bankAccount.bank_name}</p>
                      <p><strong>Số tài khoản:</strong> {bankAccount.account_number}</p>
                      <p><strong>Tên chủ tài khoản:</strong> {bankAccount.account_holder_name}</p>
                      {bankAccount.is_verified && (
                        <p style={{ color: "#52c41a" }}>
                          <CheckCircleOutlined /> Đã được xác minh
                        </p>
                      )}
                    </div>
                  }
                  type="success"
                  showIcon
                />
                <Space>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => setIsEditing(true)}
                  >
                    Chỉnh sửa
                  </Button>
                  <Popconfirm
                    title="Xóa thông tin ngân hàng"
                    description="Bạn có chắc chắn muốn xóa thông tin này?"
                    onConfirm={handleDelete}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={loading}
                    >
                      Xóa
                    </Button>
                  </Popconfirm>
                </Space>
              </Space>
            </Card>
          ) : (
            <Card>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <Form.Item
                  label="Tên ngân hàng"
                  name="bank_name"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên ngân hàng" },
                  ]}
                >
                  <Input placeholder="Ví dụ: Vietcombank, Techcombank, BIDV..." />
                </Form.Item>

                <Form.Item
                  label="Số tài khoản"
                  name="account_number"
                  rules={[
                    { required: true, message: "Vui lòng nhập số tài khoản" },
                    {
                      pattern: /^[0-9]+$/,
                      message: "Số tài khoản chỉ được chứa chữ số",
                    },
                  ]}
                >
                  <Input placeholder="Nhập số tài khoản ngân hàng" />
                </Form.Item>

                <Form.Item
                  label="Tên chủ tài khoản"
                  name="account_holder_name"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên chủ tài khoản" },
                  ]}
                >
                  <Input placeholder="Tên chủ tài khoản (viết hoa, không dấu)" />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                    >
                      {isEditing ? "Cập nhật" : "Lưu thông tin"}
                    </Button>
                    {isEditing && (
                      <Button onClick={() => {
                        setIsEditing(false);
                        form.resetFields();
                        fetchBankAccount();
                      }}>
                        Hủy
                      </Button>
                    )}
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}

          {!bankAccount && !isEditing && (
            <Alert
              message="Chưa có thông tin ngân hàng"
              description="Vui lòng điền thông tin tài khoản ngân hàng để nhận payout sau mỗi đặt phòng thành công."
              type="warning"
              showIcon
            />
          )}
        </Space>
      </Card>
    </div>
  );
}

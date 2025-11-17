"use client";

import React, { useState } from "react";
import { Modal, Form, Input, Button, Space, Typography } from "antd";
import { SafetyOutlined, MailOutlined } from "@ant-design/icons";
import { useMessageApi } from "@/components/providers/Message"; 
import Cookies from "js-cookie";
import { handleVerify } from "@/service/auth";
import styles from "@/styles/verifyModal.module.css";

const { Text } = Typography;

interface VerifyEmailModalProps {
  open: boolean;
  onClose: () => void;
}

const VerifyEmailModal: React.FC<VerifyEmailModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const messageApi = useMessageApi();
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async () => {
    const email = Cookies.get("email");
    if (!email) {
      messageApi.warning("Không tìm thấy email. Vui lòng đăng ký lại!");
      onClose();
      return;
    }

    try {
      const value = await form.validateFields();
      setLoading(true);

      const data = { 
        email: email.trim(), 
        codeId: value.codeId?.trim() 
      };

      if (!data.codeId) {
        messageApi.error("Vui lòng nhập mã xác thực!");
        setLoading(false);
        return;
      }

      const res = await handleVerify(data);

      // Check for errors
      if (!res) {
        messageApi.error("Không nhận được phản hồi từ server. Vui lòng thử lại sau.");
        setLoading(false);
        return;
      }

      // Network error
      if (res.statusCode === 0) {
        messageApi.error(res.message || "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
        setLoading(false);
        return;
      }

      // Server errors
      if (res.statusCode !== 200 && res.statusCode !== 201) {
        const errorMessage = res.message || res.error || "Mã xác thực không đúng hoặc đã hết hạn!";
        messageApi.error(errorMessage);
        setLoading(false);
        return;
      }

      // Success
      if (!res.access_token) {
        messageApi.error("Xác thực thành công nhưng không nhận được token. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      Cookies.set("access_token", res.access_token);
      Cookies.remove("email");
      messageApi.success("Xác thực email thành công!");
      onClose();
    } catch (err: any) {
      console.error("Verify error:", err);
      
      // Form validation errors
      if (err.errorFields) {
        const firstError = err.errorFields[0];
        messageApi.warning(firstError?.errors?.[0]?.message || "Vui lòng kiểm tra lại thông tin đã nhập");
      } else {
        const errorMessage = err?.message || err?.response?.data?.message || "Không thể kết nối tới máy chủ. Vui lòng thử lại!";
        messageApi.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={420}
      title={
        <div className={styles.modalTitleContainer}>
          <div className={styles.modalTitleIcon}>
            <SafetyOutlined />
          </div>
          <span className={styles.modalTitleText}>
            Xác thực Email
          </span>
        </div>
      }
      styles={{
        content: {
          borderRadius: 'var(--border-radius-lg)',
          padding: 'var(--spacing-xl)',
        },
        header: {
          borderBottom: '1px solid var(--color-border-light)',
          paddingBottom: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-xl)',
        },
        body: {
          padding: 'var(--spacing-xl) 0',
        },
      }}
    >
      <Form form={form} layout="vertical">
        <div className={styles.infoBox}>
          <Text className={styles.infoText}>
            <MailOutlined className={styles.infoIcon} />
            Vui lòng kiểm tra email của bạn để lấy mã xác thực và nhập vào bên dưới.
          </Text>
        </div>

        <Form.Item
          name="codeId"
          label={
            <span className={styles.formLabel}>
              Mã xác thực
            </span>
          }
          rules={[
            { required: true, message: "Vui lòng nhập mã xác thực!" },
            { 
              pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 
              message: "Mã xác thực không đúng định dạng!" 
            }
          ]}
        >
          <Input
            prefix={<SafetyOutlined className={styles.inputPrefix} />}
            placeholder="Nhập mã xác thực"
            maxLength={36}
            size="large"
            className={styles.formInput}
          />
        </Form.Item>

        <Space className={styles.buttonContainer}>
          <Button 
            onClick={onClose}
            className={styles.buttonCancel}
          >
            Hủy
          </Button>
          <Button 
            type="primary" 
            onClick={handleVerifyCode} 
            loading={loading} 
            size="large"
            className={styles.buttonSubmit}
          >
            Xác nhận
          </Button>
        </Space>
      </Form>
    </Modal>
  );
};

export default VerifyEmailModal;

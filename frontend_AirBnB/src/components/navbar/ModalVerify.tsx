"use client";

import React, { useState } from "react";
import { Modal, Form, Input, Button, Space, Typography } from "antd";
import { SafetyOutlined, MailOutlined } from "@ant-design/icons";
import { useMessageApi } from "@/components/providers/Message"; 
import Cookies from "js-cookie";
import { handleVerify } from "@/service/auth";

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
      messageApi.warning("Không tìm thấy email. Vui lòng đăng nhập lại!");
      return;
    }

    try {
      const value = await form.validateFields();
      setLoading(true);

      const data = { email, codeId: value.codeId };
      const res = await handleVerify(data);

      if (!res || (res.statusCode !== 200 && res.statusCode !== 201)) {
        messageApi.error("Mã xác thực không đúng hoặc đã hết hạn!");
        return;
      }

      Cookies.set("access_token", res.access_token);
      Cookies.remove("email");
      messageApi.success("Xác thực email thành công!");
      onClose();
    } catch (err) {
      console.error(err);
      messageApi.error("Không thể kết nối tới máy chủ. Vui lòng thử lại!");
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
      title="🔒 Xác thực Email"
    >
      <Form form={form} layout="vertical">
        <Text>
          Vui lòng kiểm tra email của bạn để lấy mã xác thực và nhập vào bên dưới.
        </Text>

        <Form.Item
          name="codeId"
          label="Mã xác thực"
          rules={[{ required: true, message: "Vui lòng nhập mã xác thực!" }]}
        >
          <Input
            prefix={<SafetyOutlined />}
            placeholder="Nhập mã xác thực "
          />
        </Form.Item>

        <Space style={{ width: "100%", justifyContent: "end" }}>
          <Button type="primary" onClick={handleVerifyCode} loading={loading} shape="round">
            Xác nhận
          </Button>
        </Space>
      </Form>
    </Modal>
  );
};

export default VerifyEmailModal;

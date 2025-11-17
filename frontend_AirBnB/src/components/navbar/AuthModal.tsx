"use client";

import React, { useState } from "react";
import { Modal, Tabs, Form, Input, Button } from "antd";
import { handleLogin, handleRegister } from "@/service/auth";
import { useMessageApi } from "../providers/Message";
import Cookies from "js-cookie";
import styles from "@/styles/authModal.module.css";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  onRegisterSuccess?: (email: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  visible, 
  onClose, 
  onLoginSuccess,
  onRegisterSuccess 
}) => {
  const messageApi = useMessageApi();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const currentForm = activeTab === 'login' ? loginForm : registerForm;
      const values = await currentForm.validateFields();
      setLoading(true);
      
      const data = activeTab === 'login' ? {
        email: values.email?.trim(),
        password: values.password
      } : {
        name: values.name?.trim(),
        email: values.email?.trim(),
        password: values.password,
        phone: values.phone?.trim()
      }
      
      try {
        const res = activeTab === 'login' 
          ? (await handleLogin(data)) 
          : (await handleRegister(data));
        
        // Check for errors
        if (!res) {
          messageApi.error('Không nhận được phản hồi từ server. Vui lòng thử lại sau.');
          setLoading(false);
          return;
        }

        // Network error (statusCode 0)
        if (res.statusCode === 0) {
          messageApi.error(res.message || 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
          setLoading(false);
          return;
        }

        // Server errors (4xx, 5xx)
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          const errorMessage = res.message || res.error || 'Đã xảy ra lỗi. Vui lòng thử lại.';
          messageApi.error(errorMessage);
          setLoading(false);
          return;
        }

        // Success cases
        if (activeTab === 'login') {
          if (!res.access_token) {
            messageApi.error('Đăng nhập thất bại. Không nhận được token.');
            setLoading(false);
            return;
          }
          Cookies.set('access_token', res.access_token);
          messageApi.success('Đăng nhập thành công');
          onClose();
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        } else {
          // Registration success
          Cookies.set('email', values.email);
          messageApi.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
          onClose();
          if (onRegisterSuccess) {
            onRegisterSuccess(values.email);
          }
        }
      } catch (e: any) {
        console.error('API call error:', e);
        const errorMessage = e?.message || e?.response?.data?.message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
        messageApi.error(errorMessage);
      } finally {
        setLoading(false);
      }
    } catch (error: any) {
      // Form validation errors
      if (error.errorFields) {
        const firstError = error.errorFields[0];
        messageApi.warning(firstError?.errors?.[0]?.message || 'Vui lòng kiểm tra lại thông tin đã nhập');
      } else {
        console.error('Validation Failed:', error);
        messageApi.error('Vui lòng điền đầy đủ thông tin');
      }
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'login',
      label: 'Đăng nhập',
      children: (
        <Form form={loginForm} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 1, message: 'Mật khẩu không được để trống!' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'register',
      label: 'Đăng ký',
      children: (
        <Form form={registerForm} layout="vertical">
          <Form.Item
            name="name"
            label="Tên"
            rules={[
              { required: true, message: 'Vui lòng nhập tên của bạn' },
              { min: 2, message: 'Tên phải có ít nhất 2 ký tự!' },
              { max: 50, message: 'Tên không được vượt quá 50 ký tự!' }
            ]}
          >
            <Input placeholder="Nhập tên của bạn" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              { max: 50, message: 'Mật khẩu không được vượt quá 50 ký tự!' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại của bạn' },
              { 
                pattern: /^[0-9]{10,11}$/, 
                message: 'Số điện thoại phải có 10-11 chữ số!' 
              },
            ]}
          >
            <Input placeholder="Nhập số điện thoại của bạn" maxLength={11} />
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      title={
        <div className={styles.modalTitle}>
          {activeTab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </div>
      }
      onCancel={onClose}
      footer={[
        <Button 
          key="cancel" 
          onClick={onClose}
          size="large"
          className={styles.buttonCancel}
        >
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleSubmit}
          size="large"
          className={styles.buttonSubmit}
        >
          {activeTab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </Button>,
      ]}
      centered
      width={480}
      styles={{
        content: {
          borderRadius: 'var(--border-radius-lg)',
          padding: 'var(--spacing-xl)',
        },
        header: {
          borderBottom: '1px solid var(--color-border-light)',
          paddingBottom: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)',
        },
        body: {
          padding: 'var(--spacing-xl) 0',
        },
      }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          if (key === 'login') loginForm.resetFields();
          else registerForm.resetFields();
          setActiveTab(key as 'login' | 'register');
        }}
        items={tabItems}
        className={styles.tabsContainer}
        tabBarStyle={{
          marginBottom: 'var(--spacing-xl)',
        }}
      />
    </Modal>
  );
};

export default AuthModal;

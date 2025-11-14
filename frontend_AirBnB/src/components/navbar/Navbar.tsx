"use client";

import { Avatar, Divider, Input, Row, Col, Button, Typography, Space, Dropdown, message, Modal, Tabs, Form } from "antd";
import { SearchOutlined, UserOutlined, HeartOutlined, CarOutlined, WechatOutlined,LogoutOutlined,UnorderedListOutlined, QuestionCircleOutlined  } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuProps } from 'antd';
import Cookies from "js-cookie";
import { handleLogin, handleRegister } from "@/service/auth";
import { useMessageApi } from "../providers/Message";
import VerifyEmailModal from "./ModalVerify"

const { Text } = Typography;


export default function Navbar() {
  const messageApi = useMessageApi();
  const [verify, setVerify] = useState(false)
  const AuthModal: React.FC<{ visible: boolean; onClose: () => void; onLoginSuccess?: () => void }> = ({ visible, onClose, onLoginSuccess }) => {
  
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
      email: values.email,
      password: values.password
    } : {
      name: values.name,
      email: values.email,
      password: values.password,
      phone: values.phone
    }
    console.log(data)
    try {
      const res = activeTab === 'login' ? (await handleLogin(data)) : (await handleRegister(data))
      console.log(res)
      if (res.statusCode !=200 && res.statusCode!=201){
        messageApi.error('Auth xảy ra lỗi ')
        console.log()
        return
      }
      if (activeTab === 'login') {
        Cookies.set('access_token', res.access_token)
      } else {
        Cookies.set('email', values.email)
        setOpen(false)
        setVerify(true)
      }
      
    } catch(e) {
      console.log(e)
    } finally {
      if (activeTab === 'login'){
        setLoading(false)
        setOpen(false)
        messageApi.success('Đăng nhập thành công')
      } else {
        setLoading(false)
      }
    }
      
    } catch (error) {
      console.log('Validation Failed:', error);
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
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
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
            label="Name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên của bạn' },
              // { type: 'text', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input placeholder="Nhập tên của bạn" />
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
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
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
            label="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại của bạn' },
              // { type: 'text', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input placeholder="Nhập số điện thoại của bạn" />
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      title={activeTab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {activeTab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </Button>,
      ]}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          if (key === 'login') loginForm.resetFields();
          else registerForm.resetFields();
          setActiveTab(key as 'login' | 'register');
        }}
        items={tabItems}
      />
    </Modal>
  );
};

  const router = useRouter()
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState(false) 
  // const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (Cookies.get('access_token')){
      setLogin(true)
    }
    else setLogin(false)
  }, [Cookies.get('access_token')])
  const onClick: MenuProps['onClick'] = ({ key }) => {
    if(login){
      switch (key) {
        case '1':
          messageApi.info('Danh sách yêu thích của bạn');
          break;
        case '2':
          messageApi.info('Chuyến đi của bạn');
          break;
        case '3':
          messageApi.info('Tin nhắn của bạn');
          break;
        case '4':
          messageApi.info('Hồ sơ của bạn');
          break;
        case '5': 
          messageApi.success('Đăng xuất thành công');
          Cookies.remove("access_token"); 
          setLogin(false);              
          break;
        default:
          break;
      }
    } else {
        switch(key) {
          case '1':
            break
          case '2':
            break
          case '3':
            break
          case '4':
            break
          case '5':
            setOpen(true)
            break;
          default:
            break;
        }
    }
  };
  const menuLogin: MenuProps['items'] = [
  {
    key: '1',
    label: 'Yêu thích',
    icon: <HeartOutlined />
  },
  {
    key: '2',
    label: 'Chuyến đi',
    // icon: <SmileOutlined />,
    // disabled: true,
    icon: <CarOutlined />
  },
  {
    key: '3',
    label: 'Tin nhắn',
    // disabled: true,
    icon: <WechatOutlined />
  },
  {
    key: '4',
    label: 'Hồ sơ',
    icon: <UserOutlined />
  },
  {
    key: '5',
    label: 'Đăng xuất',
    icon: <LogoutOutlined />
  }
];

const menuLogout: MenuProps['items'] = [
  {
    key: '1',
    label: 'Trung tâm trợ giúp',
    icon: <QuestionCircleOutlined />
  },
  {
    key: '2',
    label: 'Trở thành Host',
    // icon: <SmileOutlined />,
    // disabled: true,
    icon: <CarOutlined />
  },
  {
    key: '3',
    label: 'Giới thiệu Host',
    // disabled: true,
    icon: <WechatOutlined />
  },
  {
    key: '4',
    label: 'Tìm kiếm Host',
    icon: <UserOutlined />
  },
  {
    key: '5',
    label: 'Đăng nhập hoặc đăng ký',
    icon: <LogoutOutlined />
  }
];

 
  return (
    <div
      style={{
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "white",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}
    >
      <VerifyEmailModal open={verify} onClose={() => setVerify(false)}/>
       <AuthModal
        visible={open}
        onClose={() => setOpen(false)}
        onLoginSuccess={() => setLogin(true)}
      />
      {/* Logo */}
      <Space align="center">
        <img
          src="/AirBnB_Big.png"
          alt="logo"
          style={{ 
            height: 40,
            width:  'auto'
          }}
        />
      </Space>

      {/* Menu trung tâm */}
     <div style={{
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '16px'
     }}>
       <Space  size={40}>
        <Text strong>Nơi lưu trú</Text>
        <Text>Trải nghiệm</Text>
        <Text>Dịch vụ</Text>
      </Space>

      {/* Search Capsule */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 35px",
          borderRadius: 40,
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          background: "white",
          gap: 16,
          minWidth: 420,
          justifyContent: "space-between"
        }}
      >
        <div style={{ textAlign: "left" }}>
          <Text strong>Địa điểm</Text>
          <br />
          <Text type="secondary">Tìm kiếm điểm đến</Text>
        </div>

        <Divider type="vertical" />

        <div style={{ textAlign: "left" }}>
          <Text strong>Nhận phòng</Text>
          <br />
          <Text type="secondary">Thêm ngày</Text>
        </div>

        <Divider type="vertical" />

        <div style={{ textAlign: "left" }}>
          <Text strong>Trả phòng</Text>
          <br />
          <Text type="secondary">Thêm ngày</Text>
        </div>

        <Divider type="vertical" />

        <div style={{ textAlign: "left" }}>
          <Text strong>Khách</Text>
          <br />
          <Text type="secondary">Thêm khách</Text>
        </div>

        <Button
          type="primary"
          shape="circle"
          icon={<SearchOutlined />}
          size="large"
        />
      </div>
     </div>

      {/* User menu */}
      <Space align="center" size={20}>
        <Text strong>Đón tiếp khách</Text>
        <Dropdown menu={{ 
          items: login ? menuLogin : menuLogout, 
          onClick }}>
          {login ? (
            <Avatar style={{ backgroundColor: "#000", color: "#fff" }}>T</Avatar>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f5f5f5",
                padding: "8px",
                borderRadius: "50%", // sửa tên đúng
                cursor: "pointer", // bắt hover
              }}
            >
              <UnorderedListOutlined />
            </div>
          )}
        </Dropdown>
      </Space>
    </div>
  );
}

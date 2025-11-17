"use client";

import React from "react";
import { Avatar, Dropdown, Space, Typography } from "antd";
import type { MenuProps } from 'antd';
import { 
  UserOutlined, 
  HeartOutlined, 
  CarOutlined, 
  WechatOutlined,
  LogoutOutlined, 
  UnorderedListOutlined, 
  QuestionCircleOutlined 
} from "@ant-design/icons";
import styles from "@/styles/navbar.module.css";

const { Text } = Typography;

interface UserMenuProps {
  isLoggedIn: boolean;
  onMenuClick: MenuProps['onClick'];
}

const UserMenu: React.FC<UserMenuProps> = ({ isLoggedIn, onMenuClick }) => {
  const menuLogin: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HeartOutlined className={styles.menuItemIcon} />
          <span className={styles.menuItemText}>Yêu thích</span>
        </span>
      ),
    },
    {
      key: '2',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CarOutlined className={styles.menuItemIcon} />
          <span className={styles.menuItemText}>Chuyến đi</span>
        </span>
      ),
    },
    {
      key: '3',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WechatOutlined className={styles.menuItemIcon} />
          <span className={styles.menuItemText}>Tin nhắn</span>
        </span>
      ),
    },
    {
      key: '4',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined className={styles.menuItemIcon} />
          <span className={styles.menuItemText}>Hồ sơ</span>
        </span>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: '5',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogoutOutlined className={styles.menuItemIcon} />
          <span className={styles.menuItemText}>Đăng xuất</span>
        </span>
      ),
    }
  ];

  const menuLogout: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QuestionCircleOutlined className={styles.menuItemIcon} />
          <span className={styles.menuItemText}>Trung tâm trợ giúp</span>
        </span>
      ),
    },
    {
      key: '2',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CarOutlined className={styles.menuItemIcon} />
          <span className={styles.menuItemText}>Trở thành Host</span>
        </span>
      ),
    },
    {
      key: '3',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WechatOutlined className={styles.menuItemIcon} />
          <span className={styles.menuItemText}>Giới thiệu Host</span>
        </span>
      ),
    },
    {
      key: '4',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined className={styles.menuItemIcon} />
          <span className={styles.menuItemText}>Tìm kiếm Host</span>
        </span>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: '5',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogoutOutlined className={styles.menuItemIcon} />
          <span className={`${styles.menuItemText} ${styles.menuItemHighlight}`}>Đăng nhập hoặc đăng ký</span>
        </span>
      ),
    }
  ];

  return (
    <Space align="center" size={20} className={styles.userMenuContainer}>
      <Text strong className={styles.userMenuText}>Đón tiếp khách</Text>
      <Dropdown 
        menu={{ 
          items: isLoggedIn ? menuLogin : menuLogout, 
          onClick: onMenuClick,
        }}
        placement="bottomRight"
        overlayClassName="custom-user-dropdown"
      >
        {isLoggedIn ? (
          <div className={styles.avatarWrapper}>
            <Avatar 
              className={styles.avatar}
              size={40}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 600
              }}
            >
              T
            </Avatar>
          </div>
        ) : (
          <div className={styles.menuButton}>
            <UnorderedListOutlined className={styles.menuIcon} />
          </div>
        )}
      </Dropdown>
    </Space>
  );
};

export default UserMenu;

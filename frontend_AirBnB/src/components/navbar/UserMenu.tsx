"use client";

import React, { useEffect, useState } from "react";
import { Avatar, Dropdown, Space, Typography } from "antd";
import type { MenuProps } from 'antd';
import { useRouter } from "next/navigation";
import { 
  UserOutlined, 
  HeartOutlined, 
  CarOutlined, 
  WechatOutlined,
  LogoutOutlined, 
  UnorderedListOutlined, 
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { getUserProfile } from "@/service/user";
import NotificationBell from "@/components/notifications/NotificationBell";
import styles from "@/styles/navbar.module.css";

const { Text } = Typography;

interface UserMenuProps {
  isLoggedIn: boolean;
  onMenuClick: MenuProps['onClick'];
  onOpenAuthModal?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ isLoggedIn, onMenuClick, onOpenAuthModal }) => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<'guest' | 'host' | 'admin' | null>(null);
  const [userProfile, setUserProfile] = useState<{ avatar_url?: string; name?: string } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (isLoggedIn) {
        try {
          const user = await getUserProfile();
          setUserRole(user?.role?.type || 'guest');
          setUserProfile({
            avatar_url: user?.avatar_url,
            name: user?.name,
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserRole('guest');
          setUserProfile(null);
        }
      } else {
        setUserRole(null);
        setUserProfile(null);
      }
    };

    fetchUserData();
    
    // Listen for profile update events
    const handleProfileUpdate = () => {
      fetchUserData();
    };
    
    window.addEventListener('profile-updated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [isLoggedIn]);

  // Get first letter of name for avatar fallback
  const getAvatarInitial = () => {
    if (userProfile?.name) {
      return userProfile.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleBecomeHostClick = () => {
    if (!isLoggedIn) {
      // If not logged in, open auth modal
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
    } else {
      // If logged in and is host, open manage listings page in new tab
      // Otherwise, redirect to create listing page
      if (userRole === 'host') {
        window.open('/host/manage', '_blank', 'noopener,noreferrer');
      } else {
        router.push('/host/create');
      }
    }
  };
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
      <Text 
        strong 
        className={styles.userMenuText}
        onClick={handleBecomeHostClick}
        style={{ cursor: 'pointer' }}
      >
        {userRole === 'host' ? 'Quản lý phòng' : 'Trở thành Host'}
      </Text>
      {isLoggedIn && <NotificationBell />}
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
              src={userProfile?.avatar_url}
              icon={!userProfile?.avatar_url ? <UserOutlined /> : undefined}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 600
              }}
            >
              {!userProfile?.avatar_url && getAvatarInitial()}
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

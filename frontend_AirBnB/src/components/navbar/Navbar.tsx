"use client";

import { Space, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { MenuProps } from 'antd';
import Cookies from "js-cookie";
import { useMessageApi } from "../providers/Message";
import AuthModal from "./AuthModal";
import VerifyEmailModal from "./ModalVerify";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import styles from "@/styles/navbar.module.css";

const { Text } = Typography;

export default function Navbar() {
  const messageApi = useMessageApi();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState(false);
  const [verify, setVerify] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (Cookies.get('access_token')) {
      setLogin(true);
    } else {
      setLogin(false);
    }
  }, [Cookies.get('access_token')]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollThreshold = 50;
      
      if (scrollY > scrollThreshold) {
        setIsScrolled(true);
        // If expanded and scrolling, collapse it
        setIsExpanded((prev) => {
          if (prev) {
            return false;
          }
          return prev;
        });
      } else {
        // On home page, only set isScrolled to false if at top
        if (isHomePage) {
          setIsScrolled(false);
        }
      }
    };

    // Set initial state based on page
    if (!isHomePage) {
      setIsScrolled(true);
    } else {
      // Check initial scroll position on home page
      handleScroll();
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  // Reset expanded state when pathname changes
  useEffect(() => {
    setIsExpanded(false);
  }, [pathname]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (login) {
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
          break;
        case '2':
          break;
        case '3':
          break;
        case '4':
          break;
        case '5':
          setOpen(true);
          break;
        default:
          break;
      }
    }
  };

  const handleLoginSuccess = () => {
    setLogin(true);
  };

  const handleRegisterSuccess = (email: string) => {
    setVerify(true);
  };

  const handleExpandChange = (expanded: boolean) => {
    setIsExpanded(expanded);
  };

  // Determine if navbar should be collapsed
  const isCollapsed = isScrolled && !isExpanded;

  return (
    <div className={`${styles.navbarContainer} ${isCollapsed ? styles.navbarContainerCollapsed : ''} ${isExpanded ? styles.navbarContainerExpanded : ''}`}>
      <VerifyEmailModal 
        open={verify} 
        onClose={() => setVerify(false)}
      />
      <AuthModal
        visible={open}
        onClose={() => setOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
      />
      
      {/* Logo */}
      <div className={styles.logoContainer} onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
        <img
          src="/AirBnB_Big.png"
          alt="logo"
          className={styles.navbarLogo}
        />
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <SearchBar 
          isExpanded={isExpanded}
          isCollapsed={isCollapsed}
          onExpandChange={handleExpandChange}
        />
      </div>

      {/* User Menu */}
      <div className={styles.userMenuContainerWrapper}>
        <UserMenu 
          isLoggedIn={login} 
          onMenuClick={handleMenuClick}
        />
      </div>
    </div>
  );
}

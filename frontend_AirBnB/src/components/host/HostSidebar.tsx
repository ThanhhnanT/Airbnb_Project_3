"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Button, Avatar, Typography } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  HomeOutlined,
  BookOutlined,
  MessageOutlined,
  CalendarOutlined,
  CrownOutlined,
  CreditCardOutlined,
  DollarOutlined,
  BankOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import styles from "@/app/host/(dashboard)/manage/host-manage.module.css";

const { Text } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
): MenuItem {
  return {
    key,
    icon,
    label,
  } as MenuItem;
}

interface HostSidebarProps {
  collapsed: boolean;
  userInfo: any;
}

const items: MenuItem[] = [
  getItem("Bảng điều khiển", "/host/dashboard", <DashboardOutlined />),
  getItem("Chỗ ở của tôi", "/host/manage", <HomeOutlined />),
  getItem("Đơn đặt phòng", "/host/bookings", <BookOutlined />),
  getItem("Tin nhắn", "/host/messages", <MessageOutlined />),
  getItem("Lịch", "/host/calendar", <CalendarOutlined />),
  getItem("Hoàn tiền", "/host/refunds", <UndoOutlined />),
  getItem("Thanh toán", "/host/payouts", <DollarOutlined />),
  getItem("Thông tin ngân hàng", "/host/bank-account", <BankOutlined />),
];

export default function HostSidebar({ collapsed, userInfo }: HostSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!pathname) return;
    if (pathname === "/host" || pathname === "/host/" || pathname.startsWith("/host/dashboard")) {
      setSelectedKeys(["/host/dashboard"]);
    } else if (pathname.startsWith("/host/manage")) {
      setSelectedKeys(["/host/manage"]);
    } else if (pathname.startsWith("/host/bookings")) {
      setSelectedKeys(["/host/bookings"]);
    } else if (pathname.startsWith("/host/messages")) {
      setSelectedKeys(["/host/messages"]);
    } else if (pathname.startsWith("/host/calendar")) {
      setSelectedKeys(["/host/calendar"]);
    } else if (pathname.startsWith("/host/refunds")) {
      setSelectedKeys(["/host/refunds"]);
    } else if (pathname.startsWith("/host/payouts")) {
      setSelectedKeys(["/host/payouts"]);
    } else if (pathname.startsWith("/host/bank-account")) {
      setSelectedKeys(["/host/bank-account"]);
    }
  }, [pathname]);

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (typeof key === "string") {
      router.push(key);
    }
  };

  return (
    <div className={styles.sidebarContent}>
      <div className={styles.branding}>
        <div className={styles.brandIcon}>
          <HomeOutlined style={{ fontSize: 24, color: "#fff" }} />
        </div>
        {!collapsed && (
          <div className={styles.brandText}>
            <Text strong className={styles.brandTitle}>
              Quản lý Host
            </Text>
            <Text className={styles.brandSubtitle}>Airbnb Pro Dashboard</Text>
          </div>
        )}
      </div>

      <Menu
        mode="inline"
        items={items}
        selectedKeys={selectedKeys}
        onClick={handleMenuClick}
        className={styles.sidebarMenu}
      />

      <div className={styles.sidebarFooter}>
        {!collapsed && (
          <Button
            type="primary"
            icon={<CrownOutlined />}
            className={styles.upgradeButton}
            block
          >
            Nâng cấp Pro
          </Button>
        )}
        <div className={styles.userProfile}>
          <Avatar
            src={userInfo?.avatar_url}
            size={32}
            style={{ backgroundColor: "#111418", color: "#fff" }}
          >
            {userInfo?.name?.[0] || "U"}
          </Avatar>
          {!collapsed && userInfo && (
            <div className={styles.userInfo}>
              <Text strong className={styles.userName}>
                {userInfo.name || "User"}
              </Text>
              <Text className={styles.userRole}>Superhost</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


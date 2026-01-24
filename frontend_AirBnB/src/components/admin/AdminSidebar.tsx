"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Menu } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  HomeOutlined,
  BookOutlined,
  UserOutlined,
  DollarOutlined,
  SettingOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  LogoutOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import styles from "./AdminSidebar.module.css";

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group"
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    // Set selected key based on current pathname
    const path = pathname;
    if (path === "/admin" || path === "/admin/") {
      setSelectedKeys(["dashboard"]);
      setOpenKeys([]);
    } else if (path.startsWith("/admin/listings")) {
      setSelectedKeys([path]);
      setOpenKeys(["listings"]);
    } else if (path.startsWith("/admin/bookings")) {
      setSelectedKeys([path]);
      setOpenKeys(["bookings-popup"]);
    } else if (path.startsWith("/admin/users")) {
      setSelectedKeys(["users"]);
      setOpenKeys([]);
    } else if (path.startsWith("/admin/payments")) {
      setSelectedKeys(["payments"]);
      setOpenKeys([]);
    } else if (path.startsWith("/admin/settings")) {
      setSelectedKeys(["settings"]);
      setOpenKeys([]);
    }
  }, [pathname]);

  const items: MenuItem[] = [
    getItem("Dashboard", "dashboard", <DashboardOutlined />),
    getItem("Listings", "listings", <HomeOutlined />, [
      getItem("All Listings", "/admin/listings", <UnorderedListOutlined />),
      getItem("Create Listing", "/admin/listings/create", <PlusOutlined />),
    ]),
    getItem("Bookings", "bookings-popup", <BookOutlined />, [
      getItem("All Bookings", "/admin/bookings", <UnorderedListOutlined />),
      getItem("Statistics", "/admin/bookings/statistics", <BarChartOutlined />),
    ]),
    getItem("Users", "users", <UserOutlined />),
    getItem("Payments", "payments", <DollarOutlined />),
    getItem("Payouts", "payouts", <DollarOutlined />),
    getItem("Settings", "settings", <SettingOutlined />),
    { type: "divider" },
    getItem("Logout", "logout", <LogoutOutlined />),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      // Handle logout
      if (typeof window !== "undefined") {
        // Clear cookies/tokens
        Cookies.remove("access_token");
        router.push("/admin/login");
      }
    } else if (key === "dashboard") {
      router.push("/admin");
      setSelectedKeys(["dashboard"]);
    } else if (key === "users") {
      router.push("/admin/users");
      setSelectedKeys(["users"]);
    } else if (key === "payments") {
      router.push("/admin/payments");
      setSelectedKeys(["payments"]);
    } else if (key === "payouts") {
      router.push("/admin/payouts");
      setSelectedKeys(["payouts"]);
    } else if (key === "settings") {
      router.push("/admin/settings");
      setSelectedKeys(["settings"]);
    } else if (key.startsWith("/")) {
      router.push(key);
      setSelectedKeys([key]);
    }
  };

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <div className={styles.sidebarContainer}>
      <div className={styles.logo}>
        <Image
          src="/AirBnB_Big.png"
          alt="Airbnb Admin"
          width={140}
          height={36}
          className={`${styles.logoImage} ${styles.logoLarge}`}
          priority
        />
        <Image
          src="/AirBnB_Small.png"
          alt="Airbnb Icon"
          width={36}
          height={36}
          className={`${styles.logoImage} ${styles.logoSmall}`}
          priority
        />
      </div>
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        onClick={handleMenuClick}
        items={items}
        className={styles.menu}
        theme="dark"
      />
    </div>
  );
}


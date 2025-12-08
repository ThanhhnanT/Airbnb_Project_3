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
  ClockCircleOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
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
      setOpenKeys(["bookings"]);
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
    getItem("Bookings", "bookings", <BookOutlined />, [
      getItem("All Bookings", "/admin/bookings", <UnorderedListOutlined />),
      getItem("Pending Bookings", "/admin/bookings/pending", <ClockCircleOutlined />),
    ]),
    getItem("User s", "users", <UserOutlined />),
    getItem("Payments", "payments", <DollarOutlined />),
    getItem("Settings", "settings", <SettingOutlined />),
    { type: "divider" },
    getItem("Logout", "logout", <LogoutOutlined />),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      // Handle logout
      if (typeof window !== "undefined") {
        // Clear cookies/tokens
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/login");
      }
    } else if (key === "dashboard") {
      router.push("/admin");
      setSelectedKeys(["dashboard"]);
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


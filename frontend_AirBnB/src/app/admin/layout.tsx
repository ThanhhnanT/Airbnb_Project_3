"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Layout,
  Button,
  Breadcrumb,
  Input,
  Space,
  Badge,
  Avatar,
  Typography,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  MailOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import styles from "./admin-layout.module.css";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleCollapse = (state: boolean) => {
    setCollapsed(state);
  };

  const breadcrumbs = useMemo(() => {
    const segments =
      pathname
        ?.split("/")
        .filter(Boolean)
        .slice(1) || [];

    const cleaned = segments.map((segment) =>
      segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    );

    return [
      { title: "Home" },
      { title: "Admin" },
      { title: cleaned[cleaned.length - 1] || "Dashboard" },
    ];
  }, [pathname]);

  return (
    <Layout className={styles.adminLayout}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={handleCollapse}
        breakpoint="lg"
        collapsedWidth={isMobile ? 0 : 80}
        width={250}
        className={styles.sider}
        trigger={null}
      >
        <AdminSidebar />
      </Sider>
      <Layout className={styles.contentLayout}>
        {isMobile && !collapsed && (
          <div
            className={styles.overlay}
            onClick={() => setCollapsed(true)}
          />
        )}
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <Button
              type="text"
              className={styles.collapseTrigger}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <Breadcrumb items={breadcrumbs} className={styles.breadcrumb} />
          </div>
          <div className={styles.headerActions}>
            <Input
              allowClear
              placeholder="Search..."
              prefix={<SearchOutlined />}
              className={styles.search}
            />
            <Space size="large" align="center" className={styles.actionGroup}>
              <Badge count={3} size="small">
                <Button
                  type="text"
                  shape="circle"
                  icon={<MailOutlined />}
                  className={styles.iconButton}
                />
              </Badge>
              <Badge count={7} size="small">
                <Button
                  type="text"
                  shape="circle"
                  icon={<BellOutlined />}
                  className={styles.iconButton}
                />
              </Badge>
              <Space size={8} align="center">
                <Avatar icon={<UserOutlined />} />
                <div className={styles.profileMeta}>
                  <Text strong>Alexander Pierce</Text>
                  <Text type="secondary" className={styles.profileRole}>
                    Admin
                  </Text>
                </div>
              </Space>
            </Space>
          </div>
        </Header>
        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
}


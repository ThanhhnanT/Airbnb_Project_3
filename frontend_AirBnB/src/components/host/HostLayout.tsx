"use client";

import { useEffect, useState } from "react";
import { Layout } from "antd";
import HostSidebar from "./HostSidebar";
import HostHeader from "./HostHeader";
import { getUserProfile } from "@/service/user";
import styles from "@/app/host/(dashboard)/manage/host-manage.module.css";

const { Sider, Header, Content } = Layout;

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getUserProfile();
        setUserInfo(user);
      } catch (error) {
        console.error("Error fetching host profile:", error);
      }
    };
    fetchUser();
  }, []);

  return (
    <Layout className={styles.hostLayout}>
      <Sider
        width={256}
        className={styles.sider}
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
      >
        <HostSidebar collapsed={collapsed} userInfo={userInfo} />
      </Sider>
      <Layout className={styles.contentLayout}>
        <Header className={styles.header}>
          <HostHeader />
        </Header>
        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
}


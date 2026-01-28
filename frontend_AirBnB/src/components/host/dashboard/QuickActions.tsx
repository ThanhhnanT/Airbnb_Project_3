"use client";

import { Card, Button, Row, Col, Typography, Space } from "antd";
import {
  PlusOutlined,
  HomeOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

const { Title, Text } = Typography;

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "Tạo Chỗ Ở Mới",
      description: "Đăng ký một chỗ ở mới lên hệ thống",
      icon: <PlusOutlined style={{ fontSize: 24 }} />,
      onClick: () => router.push("/host/create"),
      color: "#1890ff",
    },
    {
      title: "Quản Lý Chỗ Ở",
      description: "Chỉnh sửa thông tin và cài đặt chỗ ở",
      icon: <HomeOutlined style={{ fontSize: 24 }} />,
      onClick: () => router.push("/host/manage"),
      color: "#52c41a",
    },
    {
      title: "Quản Lý Lịch",
      description: "Cập nhật tình trạng lấp đầy và khả dụng",
      icon: <CalendarOutlined style={{ fontSize: 24 }} />,
      onClick: () => router.push("/host/calendar"),
      color: "#faad14",
    },
    {
      title: "Xem Báo Cáo",
      description: "Xem chi tiết báo cáo tài chính và hiệu suất",
      icon: <FileTextOutlined style={{ fontSize: 24 }} />,
      onClick: () => router.push("/host/manage"),
      color: "#722ed1",
    },
  ];

  return (
    <Card className={styles.quickActionsCard}>
      <Title level={4} style={{ marginBottom: 20 }}>
        Hành Động Nhanh
      </Title>
      <Row gutter={[16, 16]}>
        {actions.map((action) => (
          <Col xs={24} sm={12} lg={6} key={action.title}>
            <div
              className={styles.actionButton}
              onClick={action.onClick}
              style={{
                borderLeft: `4px solid ${action.color}`,
              }}
            >
              <div className={styles.actionIcon} style={{ color: action.color }}>
                {action.icon}
              </div>
              <Text strong className={styles.actionTitle}>
                {action.title}
              </Text>
              <Text type="secondary" className={styles.actionDescription}>
                {action.description}
              </Text>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

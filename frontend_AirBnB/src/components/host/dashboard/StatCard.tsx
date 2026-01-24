"use client";

import { Card, Row, Col, Typography, Statistic } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  StarOutlined,
} from "@ant-design/icons";
import styles from "./dashboard.module.css";

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: string | number;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export default function StatCard({
  title,
  value,
  prefix,
  suffix,
  trend,
  trendValue,
  icon,
  color = "#1890ff",
}: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") {
      return <ArrowUpOutlined style={{ color: "#52c41a" }} />;
    } else if (trend === "down") {
      return <ArrowDownOutlined style={{ color: "#ff4d4f" }} />;
    }
    return null;
  };

  return (
    <Card
      className={styles.statCard}
      hoverable
      style={{
        borderLeft: `4px solid ${color}`,
      }}
    >
      <Row justify="space-between" align="middle">
        <Col flex="auto">
          <Text className={styles.statTitle}>{title}</Text>
          <div className={styles.statValue}>
            {prefix && <span>{prefix}</span>}
            <span style={{ fontSize: 28, fontWeight: "bold", color }}>
              {value}
            </span>
            {suffix && <span className={styles.statSuffix}>{suffix}</span>}
          </div>
          {trend && trendValue && (
            <div className={styles.statTrend}>
              {getTrendIcon()}
              <Text type="secondary" className={styles.trendText}>
                {trendValue}
              </Text>
            </div>
          )}
        </Col>
        {icon && <Col className={styles.statIcon}>{icon}</Col>}
      </Row>
    </Card>
  );
}

"use client";

import { Card, Typography, Row, Col, Progress, Spin } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import styles from "./dashboard.module.css";

const { Title, Text } = Typography;

interface OccupancyChartProps {
  occupancyRate: number;
  bookedDays: number;
  totalDays: number;
  loading?: boolean;
}

export default function OccupancyChart({
  occupancyRate,
  bookedDays,
  totalDays,
  loading = false,
}: OccupancyChartProps) {
  const getOccupancyColor = (rate: number) => {
    if (rate >= 70) return "#52c41a";
    if (rate >= 50) return "#faad14";
    return "#ff4d4f";
  };

  const getOccupancyStatus = (rate: number) => {
    if (rate >= 70) return "Xuất sắc";
    if (rate >= 50) return "Tốt";
    return "Cần cải thiện";
  };

  if (loading) {
    return (
      <Card className={styles.occupancyCard}>
        <div className={styles.chartLoader}>
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.occupancyCard}>
      <Title level={4} style={{ marginBottom: 20 }}>
        Tỷ Lệ Lấp Đầy
      </Title>
      <Row gutter={[20, 20]} align="middle">
        <Col xs={24} sm={12} className={styles.occupancyProgress}>
          <Progress
            type="circle"
            percent={occupancyRate}
            width={120}
            strokeColor={getOccupancyColor(occupancyRate)}
            format={() => (
              <div className={styles.progressText}>
                <div className={styles.percentValue}>{occupancyRate}%</div>
                <div className={styles.percentLabel}>Lấp đầy</div>
              </div>
            )}
          />
        </Col>
        <Col xs={24} sm={12}>
          <div className={styles.occupancyInfo}>
            <div className={styles.infoItem}>
              <Text className={styles.infoLabel}>Tình trạng</Text>
              <Text
                strong
                style={{
                  color: getOccupancyColor(occupancyRate),
                  fontSize: 16,
                }}
              >
                {getOccupancyStatus(occupancyRate)}
              </Text>
            </div>
            <div className={styles.infoItem}>
              <Text className={styles.infoLabel}>Đã đặt / Tổng ngày</Text>
              <Text strong style={{ fontSize: 16 }}>
                {bookedDays} / {totalDays} ngày
              </Text>
            </div>
            <div className={styles.infoItem}>
              <Text className={styles.infoLabel}>Ngày còn trống</Text>
              <Text strong style={{ fontSize: 16, color: "#faad14" }}>
                {totalDays - bookedDays} ngày
              </Text>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
}

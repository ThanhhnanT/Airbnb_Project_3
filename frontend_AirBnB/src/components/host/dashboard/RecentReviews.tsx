"use client";

import { Card, Table, Typography, Empty, Spin, Avatar, Rate, Space } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import styles from "./dashboard.module.css";

const { Title, Text } = Typography;

interface Review {
  _id: string;
  listing_id: string;
  rating: number;
  comment: string;
  reviewer_id: string;
  createdAt: Date;
}

interface RecentReviewsProps {
  reviews: Review[];
  loading?: boolean;
}

export default function RecentReviews({
  reviews,
  loading = false,
}: RecentReviewsProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const columns: ColumnsType<Review> = [
    {
      title: "Đánh giá",
      key: "rating",
      width: 100,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Rate
            disabled
            defaultValue={record.rating}
            count={5}
            style={{ fontSize: 14 }}
          />
          <Text type="secondary" className={styles.reviewDate}>
            {formatDate(record.createdAt)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Nhận xét",
      key: "comment",
      render: (_, record) => (
        <Text
          ellipsis={{ tooltip: record.comment }}
          className={styles.reviewComment}
        >
          {record.comment || "Không có nhận xét"}
        </Text>
      ),
    },
  ];

  if (loading) {
    return (
      <Card className={styles.reviewCard}>
        <div className={styles.chartLoader}>
          <Spin />
        </div>
      </Card>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card className={styles.reviewCard}>
        <Title level={4} style={{ marginBottom: 0 }}>
          Đánh Giá Gần Đây
        </Title>
        <Empty
          style={{ marginTop: 40 }}
          description="Chưa có đánh giá"
        />
      </Card>
    );
  }

  return (
    <Card className={styles.reviewCard}>
      <Title level={4} style={{ marginBottom: 16 }}>
        Đánh Giá Gần Đây
      </Title>
      <Table
        columns={columns}
        dataSource={reviews}
        rowKey="_id"
        pagination={false}
        className={styles.reviewTable}
      />
    </Card>
  );
}

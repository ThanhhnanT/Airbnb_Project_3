"use client";

import { Card, Empty, Spin, Typography, Rate, Row, Col, Divider } from "antd";
import { useEffect, useState } from "react";
import { getAccess } from "@/helper/api";

const { Text, Paragraph } = Typography;

interface Review {
  _id: string;
  reviewer_id: {
    _id: string;
    name: string;
    avatar_url?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewsTabProps {
  listingId: string;
}

export default function ReviewsTab({ listingId }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [listingId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getAccess(`reviews?listing_id=${listingId}`);
      setReviews(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return <Empty description="Chưa có reviews" />;
  }

  return (
    <>
      {reviews.map((review) => (
        <Card key={review._id} style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={16}>
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {review.reviewer_id.name}
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Rate disabled value={review.rating} />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8} style={{ textAlign: "right" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
              </Text>
            </Col>
          </Row>

          <Divider style={{ margin: "16px 0" }} />

          <Paragraph>{review.comment}</Paragraph>
        </Card>
      ))}
    </>
  );
}

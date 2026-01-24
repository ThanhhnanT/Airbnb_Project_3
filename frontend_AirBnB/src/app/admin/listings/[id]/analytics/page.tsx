"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, message, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { getAccess } from "@/helper/api";
import ListingAnalytics from "@/components/admin/ListingAnalytics";

interface AnalyticsData {
  listingId: string;
  title: string;
  totalBookings: number;
  currentMonthBookings: number;
  avgRating: number;
  reviewCount: number;
  occupancyRate: number;
  bookingTrend: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  ratingDistribution: Record<number, number>;
}

export default function ListingAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (listingId) {
      fetchAnalytics();
    }
  }, [listingId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const result = await getAccess(
        `admin/listings/${listingId}/analytics`,
        {},
        true
      );
      setAnalyticsData(result);
    } catch (error) {
      message.error("Không thể tải thống kê");
      router.push("/admin/listings");
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

  return (
    <div style={{ padding: "24px" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push(`/admin/listings/${listingId}`)}
        style={{ marginBottom: 16 }}
      >
        Quay lại
      </Button>

      <Card title="Phân Tích Listing" style={{ marginBottom: 16 }}>
        <ListingAnalytics data={analyticsData} loading={loading} />
      </Card>
    </div>
  );
}

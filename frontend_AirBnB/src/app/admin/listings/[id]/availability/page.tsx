"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, message, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { getAccess, patchAccess } from "@/helper/api";
import ListingCalendar from "@/components/admin/ListingCalendar";

interface CalendarEvent {
  date: string;
  status: "available" | "booked" | "blocked";
  price?: number;
}

export default function ListingAvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (listingId) {
      fetchCalendarData();
    }
  }, [listingId]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const result = await getAccess(
        `listings/${listingId}/details?checkInDate=${new Date().toISOString().split('T')[0]}&checkOutDate=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`,
        {},
        false
      );

      // Format calendar data - for now, create empty events
      // You would populate this from actual calendar data
      setCalendarEvents([]);
    } catch (error) {
      message.error("Không thể tải dữ liệu lịch");
      router.push("/admin/listings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDate = async (date: string, status: string, price?: number) => {
    try {
      await patchAccess(
        `admin/listings/${listingId}/calendar`,
        {
          date,
          status,
          price,
        },
        true
      );

      // Update local state
      setCalendarEvents((prev) => {
        const existing = prev.find((e) => e.date === date);
        if (existing) {
          existing.status = status as "available" | "booked" | "blocked";
          if (price) existing.price = price;
          return [...prev];
        }
        return [...prev, { date, status: status as "available" | "booked" | "blocked", price }];
      });

      message.success("Cập nhật ngày thành công");
    } catch (error) {
      message.error("Không thể cập nhật ngày");
      throw error;
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push(`/admin/listings/${listingId}`)}
        style={{ marginBottom: 16 }}
      >
        Quay lại
      </Button>

      <Card title="Quản Lý Tính Khả Dụng">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
            <Spin size="large" />
          </div>
        ) : (
          <ListingCalendar
            listingId={listingId}
            events={calendarEvents}
            onUpdate={handleUpdateDate}
            loading={loading}
          />
        )}
      </Card>
    </div>
  );
}

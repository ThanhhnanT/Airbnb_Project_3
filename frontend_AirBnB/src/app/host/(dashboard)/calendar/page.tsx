"use client";

import { useState, useEffect } from "react";
import { Calendar, Card, Tag, Typography, Spin, Empty, Badge, Tooltip, Space } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { getAccess } from "@/helper/api";
import styles from "./calendar.module.css";

const { Title, Text } = Typography;

interface Booking {
  _id: string;
  listing_id: string;
  listing_title: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  total_price: number;
  currency: string;
  status: string;
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getAccess("bookings/host/all");
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get all booked dates for current month
  const getBookedDates = (date: Dayjs) => {
    const currentMonth = date.format("YYYY-MM");
    const bookedDates: { [key: string]: Booking[] } = {};

    bookings.forEach((booking) => {
      const checkIn = dayjs(booking.check_in);
      const checkOut = dayjs(booking.check_out);

      let currentDate = checkIn;
      while (currentDate.isBefore(checkOut) || currentDate.isSame(checkOut)) {
        const dateKey = currentDate.format("YYYY-MM-DD");
        const dateMonth = currentDate.format("YYYY-MM");

        if (dateMonth === currentMonth) {
          if (!bookedDates[dateKey]) {
            bookedDates[dateKey] = [];
          }
          bookedDates[dateKey].push(booking);
        }

        currentDate = currentDate.add(1, "day");
      }
    });

    return bookedDates;
  };

  const onSelectDate = (date: Dayjs) => {
    setSelectedDate(date);
  };

  const dateCellRender = (date: Dayjs) => {
    const bookedDates = getBookedDates(dayjs());
    const dateKey = date.format("YYYY-MM-DD");
    const dateBookings = bookedDates[dateKey] || [];

    if (dateBookings.length === 0) {
      return null;
    }

    return (
      <div className={styles.dayCell}>
        <Badge
          count={dateBookings.length}
          style={{
            backgroundColor: "#ff4d4f",
            fontSize: "10px",
            height: "16px",
            lineHeight: "16px",
            minWidth: "16px",
          }}
        />
      </div>
    );
  };

  const selectedDateKey = selectedDate?.format("YYYY-MM-DD") || "";
  const bookedDates = getBookedDates(dayjs());
  const selectedBookings = bookedDates[selectedDateKey] || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2}>Lịch Đặt Phòng</Title>
        <Text type="secondary">Xem lịch đặt phòng cho tất cả chỗ ở của bạn</Text>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      ) : (
        <div className={styles.content}>
          <Card className={styles.calendarCard} title="Lịch Tháng">
            <Calendar
              fullscreen
              dateCellRender={dateCellRender}
              onSelect={onSelectDate}
            />
          </Card>

          <Card className={styles.detailsCard} title="Chi Tiết Ngày Được Chọn">
            {!selectedDate ? (
              <Empty description="Vui lòng chọn một ngày để xem chi tiết" />
            ) : selectedBookings.length === 0 ? (
              <Empty description={`${selectedDate.format("DD/MM/YYYY")} - Không có đặt phòng`} />
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                <div className={styles.selectedDate}>
                  <Text strong>Ngày: {selectedDate.format("DD/MM/YYYY")}</Text>
                </div>
                {selectedBookings.map((booking) => (
                  <Card
                    key={booking._id}
                    className={styles.bookingCard}
                    size="small"
                  >
                    <div className={styles.bookingRow}>
                      <div className={styles.bookingInfo}>
                        <Text strong className={styles.listingName}>
                          {booking.listing_title}
                        </Text>
                        <div className={styles.bookingDetails}>
                          <span>👤 {booking.guest_name}</span>
                          <span>💰 {booking.currency} {booking.total_price.toFixed(2)}</span>
                        </div>
                        <div className={styles.dateRange}>
                          📅 {dayjs(booking.check_in).format("DD/MM")} → {dayjs(booking.check_out).format("DD/MM/YYYY")}
                        </div>
                      </div>
                      <div className={styles.bookingStatus}>
                        <Tag color={booking.status === "completed" ? "green" : "blue"}>
                          {booking.status === "completed" ? "Hoàn Tất" : "Đã Xác Nhận"}
                        </Tag>
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

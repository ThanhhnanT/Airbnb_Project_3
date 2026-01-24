"use client";

import { useState, useEffect } from "react";
import { Calendar, Card, Tag, Typography, Spin, Empty, Badge, Tooltip, Space } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { getAccess } from "@/helper/api";
import styles from "./calendar.module.css";

const { Title, Text } = Typography;

interface Listing {
  _id: string;
  title: string;
}

interface Guest {
  _id: string;
  name: string;
}

interface Booking {
  _id: string;
  listing_id: string | Listing;
  guest_id: string | Guest;
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
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getAccess("bookings/host/my-bookings");
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

  const onMonthChange = (date: Dayjs) => {
    setCurrentMonth(date);
  };

  const getDateBookingStyle = (date: Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    const bookedDates = getBookedDates(currentMonth);
    const dateBookings = bookedDates[dateKey] || [];

    if (dateBookings.length > 0) {
      return {
        backgroundColor: "#ff4d4f",
        color: "white",
        fontWeight: "bold",
      };
    }
    return {};
  };

  const dateCellRender = (date: Dayjs) => {
    const bookedDates = getBookedDates(currentMonth);
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
            backgroundColor: "#fff",
            color: "#ff4d4f",
            fontSize: "10px",
            height: "16px",
            lineHeight: "16px",
            minWidth: "16px",
            fontWeight: "bold",
          }}
        />
      </div>
    );
  };

  const cellRender = (date: Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    const bookedDates = getBookedDates(currentMonth);
    const dateBookings = bookedDates[dateKey] || [];

    if (dateBookings.length > 0) {
      return (
        <div className={styles.bookedDay} style={getDateBookingStyle(date)}>
          <span>{date.format("D")}</span>
          <div className={styles.dayCell}>{dateCellRender(date)}</div>
        </div>
      );
    }

    return <div className={styles.normalDay}>{date.format("D")}</div>;
  };

  const selectedDateKey = selectedDate?.format("YYYY-MM-DD") || "";
  const bookedDates = getBookedDates(currentMonth);
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
              cellRender={cellRender}
              onSelect={onSelectDate}
              onPanelChange={onMonthChange}
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
                {selectedBookings.map((booking) => {
                  const listingTitle = typeof booking.listing_id === "object" && booking.listing_id?.title 
                    ? booking.listing_id.title 
                    : "Không xác định";
                  
                  const guestName = typeof booking.guest_id === "object" && booking.guest_id?.name
                    ? booking.guest_id.name
                    : "Không xác định";

                  return (
                    <Card
                      key={booking._id}
                      className={styles.bookingCard}
                      size="small"
                    >
                      <div className={styles.bookingRow}>
                        <div className={styles.bookingInfo}>
                          <Text strong className={styles.listingName}>
                            {listingTitle}
                          </Text>
                          <div className={styles.bookingDetails}>
                            <span>👤 {guestName}</span>
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
                  );
                })}
              </Space>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Typography,
  Space,
  Tag,
  Button,
  Tabs,
  Image,
  Empty,
  Spin,
  message,
  Modal,
  Rate,
  Input,
} from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  FileTextOutlined,
  EyeOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { getAccess } from "@/helper/api";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import dayjs from "dayjs";
import {
  createReview,
  deleteReview,
  getReviewByBooking,
  updateReview,
  type Review,
} from "@/service/reviews";
import styles from "./trips.module.css";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface Booking {
  _id: string;
  listing_id: {
    _id: string;
    title: string;
    images?: string[];
    city: string;
    country: string;
    address?: string;
  };
  host_id: {
    _id: string;
    name: string;
    email: string;
  };
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  total_price: number;
  currency: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  payment_id?: {
    _id: string;
    amount: number;
    currency: string;
    status: string;
  };
  createdAt: string;
}

interface ListingImage {
  _id: string;
  listing_id: string;
  image_url: string[];
  is_cover: boolean;
}

export default function TripsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listingImagesMap, setListingImagesMap] = useState<Record<string, ListingImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [reviewMap, setReviewMap] = useState<Record<string, Review | null>>({});
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [activeBookingForReview, setActiveBookingForReview] = useState<Booking | null>(null);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let status: string | undefined;
      if (activeTab === "upcoming") {
        status = undefined; // Get all upcoming (pending + confirmed)
      } else if (activeTab === "completed") {
        status = "completed";
      } else if (activeTab === "cancelled") {
        status = "cancelled";
      }

      console.log("[TripsPage] fetchBookings - activeTab:", activeTab, "status:", status);
      console.log("[TripsPage] fetchBookings - calling API: bookings/my-bookings");
      
      const data = await getAccess("bookings/my-bookings", status ? { status } : {});
      
      console.log("[TripsPage] fetchBookings - API response:", data);
      console.log("[TripsPage] fetchBookings - response type:", typeof data, "isArray:", Array.isArray(data));
      
      if (data && Array.isArray(data)) {
        console.log("[TripsPage] fetchBookings - bookings count:", data.length);
        if (data.length > 0) {
          console.log("[TripsPage] fetchBookings - first booking:", {
            _id: data[0]._id,
            guest_id: data[0].guest_id,
            check_in: data[0].check_in,
            check_out: data[0].check_out,
            status: data[0].status,
          });
        }
        setBookings(data);
        
        // Fetch images for all listings
        const uniqueListingIds = [...new Set(data.map((b) => b.listing_id?._id).filter(Boolean))];
        console.log("[TripsPage] fetchBookings - fetching images for listings:", uniqueListingIds);
        
        const imagesMap: Record<string, ListingImage[]> = {};
        await Promise.all(
          uniqueListingIds.map(async (listingId) => {
            try {
              // Use getAccess for public endpoint
              const images = await getAccess(`listing-images?listingId=${listingId}`);
              const imagesArray = Array.isArray(images) ? images : [];
              imagesMap[listingId] = imagesArray;
              console.log(`[TripsPage] fetchBookings - fetched ${imagesArray.length} images for listing ${listingId}`);
            } catch (error) {
              console.error(`[TripsPage] fetchBookings - error fetching images for listing ${listingId}:`, error);
              imagesMap[listingId] = [];
            }
          })
        );
        setListingImagesMap(imagesMap);

        // Fetch reviews per booking (best-effort)
        try {
          const reviewEntries = await Promise.all(
            data.map(async (b: Booking) => {
              try {
                const review = await getReviewByBooking(b._id);
                return [b._id, review] as const;
              } catch (e: any) {
                // 404 => no review yet
                if (e?.response?.status === 404) return [b._id, null] as const;
                return [b._id, null] as const;
              }
            })
          );
          const nextMap: Record<string, Review | null> = {};
          for (const [bookingId, review] of reviewEntries) {
            nextMap[bookingId] = review;
          }
          setReviewMap(nextMap);
        } catch (e) {
          // If fetching reviews fails, don't block trips UI
          setReviewMap({});
        }
      } else {
        console.warn("[TripsPage] fetchBookings - Unexpected response format:", data);
        setBookings([]);
        setListingImagesMap({});
        setReviewMap({});
      }
    } catch (error: any) {
      console.error("[TripsPage] fetchBookings - Error fetching bookings:", error);
      console.error("[TripsPage] fetchBookings - Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
        method: error?.config?.method,
      });
      
      if (error?.response?.status === 401) {
        message.error("Vui lòng đăng nhập để xem chuyến đi của bạn");
      } else if (error?.response?.status === 403) {
        message.error("Bạn không có quyền truy cập");
      } else {
        message.error(
          error?.response?.data?.message || 
          "Không thể tải danh sách chuyến đi. Vui lòng thử lại sau."
        );
      }
      setBookings([]);
      setListingImagesMap({});
      setReviewMap({});
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get first image URL for a listing
  const getListingImageUrl = (listingId: string): string | null => {
    const images = listingImagesMap[listingId];
    if (!images || images.length === 0) {
      return null;
    }
    
    // Try to find cover image first
    const coverImage = images.find((img) => img.is_cover);
    if (coverImage && coverImage.image_url && coverImage.image_url.length > 0) {
      return coverImage.image_url[0];
    }
    
    // Otherwise, get first image from first listing image record
    for (const img of images) {
      if (img.image_url && img.image_url.length > 0) {
        return img.image_url[0];
      }
    }
    
    return null;
  };

  const filteredBookings = useMemo(() => {
    if (activeTab === "upcoming") {
      return bookings.filter(
        (b) => b.status === "pending" || b.status === "confirmed"
      );
    }
    return bookings;
  }, [bookings, activeTab]);

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    if (paymentStatus === "paid") {
      return (
        <Tag
          icon={<CheckCircleOutlined />}
          color="success"
          style={{ borderRadius: "9999px", padding: "4px 12px" }}
        >
          Đã thanh toán
        </Tag>
      );
    }
    switch (status) {
      case "pending":
        return (
          <Tag
            icon={<ClockCircleOutlined />}
            color="warning"
            style={{ borderRadius: "9999px", padding: "4px 12px" }}
          >
            Chờ xác nhận
          </Tag>
        );
      case "confirmed":
        return (
          <Tag
            icon={<CheckCircleOutlined />}
            color="success"
            style={{ borderRadius: "9999px", padding: "4px 12px" }}
          >
            Đã xác nhận
          </Tag>
        );
      case "completed":
        return (
          <Tag
            icon={<CheckCircleOutlined />}
            color="default"
            style={{ borderRadius: "9999px", padding: "4px 12px" }}
          >
            Đã hoàn thành
          </Tag>
        );
      case "cancelled":
        return (
          <Tag
            icon={<CloseCircleOutlined />}
            color="error"
            style={{ borderRadius: "9999px", padding: "4px 12px" }}
          >
            Đã hủy
          </Tag>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return dayjs(dateStr).format("DD [Th]MM, YYYY");
  };

  const formatDateRange = (checkIn: string, checkOut: string) => {
    const checkInDate = dayjs(checkIn);
    const checkOutDate = dayjs(checkOut);
    return `${checkInDate.format("DD [Th]MM")} - ${checkOutDate.format("DD [Th]MM, YYYY")}`;
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return "";
    
    // Normalize the calendar date to start of day for accurate comparison
    const calendarDate = dayjs(date).startOf("day");
    const calendarDateStr = calendarDate.format("YYYY-MM-DD");
    
    // Check if this date falls within any booking's check_in to check_out range
    let isBooked = false;
    let isStart = false;
    let isEnd = false;
    let isMiddle = false;
    
    for (const booking of filteredBookings) {
      // Normalize check_in and check_out to start of day for accurate comparison
      const checkIn = dayjs(booking.check_in).startOf("day");
      const checkOut = dayjs(booking.check_out).startOf("day");
      const checkInStr = checkIn.format("YYYY-MM-DD");
      const checkOutStr = checkOut.format("YYYY-MM-DD");
      
      // Check if calendar date is within the booking range (inclusive of both check_in and check_out)
      if (calendarDateStr >= checkInStr && calendarDateStr <= checkOutStr) {
        isBooked = true;
        if (calendarDateStr === checkInStr) {
          isStart = true;
        } else if (calendarDateStr === checkOutStr) {
          isEnd = true;
        } else {
          isMiddle = true;
        }
      }
    }
    
    // Build class names
    const classes: string[] = [];
    
    if (isBooked) {
      if (isStart && isEnd) {
        // Single day booking
        classes.push(styles.calendarBookedSingle);
      } else if (isStart) {
        // Start of range
        classes.push(styles.calendarBookedStart);
      } else if (isEnd) {
        // End of range
        classes.push(styles.calendarBookedEnd);
      } else if (isMiddle) {
        // Middle of range
        classes.push(styles.calendarBookedMiddle);
      }
    }
    
    return classes.join(" ");
  };

  const handleViewDetails = (bookingId: string) => {
    router.push(`/bookings/${bookingId}`);
  };

  const handleContactHost = (hostId: string) => {
    router.push(`/messages?host=${hostId}`);
  };

  const canReviewBooking = (booking: Booking) => {
    const paid = booking.payment_id?.status === "paid";
    const statusOk = booking.status === "confirmed" || booking.status === "completed";
    const afterCheckout = dayjs().isAfter(dayjs(booking.check_out));
    return paid && statusOk && afterCheckout;
  };

  const openReviewModal = (booking: Booking) => {
    const existing = reviewMap[booking._id];
    setActiveBookingForReview(booking);
    setActiveReviewId(existing?._id || null);
    setReviewRating(existing?.rating ?? 5);
    setReviewComment(existing?.comment ?? "");
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!activeBookingForReview) return;
    if (!canReviewBooking(activeBookingForReview)) {
      message.warning("Bạn chỉ có thể đánh giá sau ngày check-out và khi đã thanh toán.");
      return;
    }
    try {
      setReviewSubmitting(true);
      if (activeReviewId) {
        const updated = await updateReview(activeReviewId, {
          rating: reviewRating,
          comment: reviewComment,
        });
        setReviewMap((prev) => ({ ...prev, [activeBookingForReview._id]: updated }));
        message.success("Đã cập nhật đánh giá");
      } else {
        const created = await createReview({
          booking_id: activeBookingForReview._id,
          rating: reviewRating,
          comment: reviewComment,
        });
        setReviewMap((prev) => ({ ...prev, [activeBookingForReview._id]: created }));
        setActiveReviewId(created._id);
        message.success("Đã gửi đánh giá");
      }
      setReviewModalOpen(false);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const confirmDeleteReview = (booking: Booking) => {
    const existing = reviewMap[booking._id];
    if (!existing) return;
    Modal.confirm({
      title: "Xoá đánh giá?",
      content: "Bạn có chắc muốn xoá đánh giá cho chuyến đi này không?",
      okText: "Xoá",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteReview(existing._id);
          setReviewMap((prev) => ({ ...prev, [booking._id]: null }));
          message.success("Đã xoá đánh giá");
        } catch (e: any) {
          message.error(e?.response?.data?.message || "Không thể xoá đánh giá");
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title level={1} className={styles.title}>
            Chuyến đi của tôi
          </Title>
          <Text type="secondary" className={styles.subtitle}>
            Xem lịch trình và quản lý các lượt đặt phòng của bạn.
          </Text>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.bookingsSection}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className={styles.tabs}
            items={[
              {
                key: "upcoming",
                label: "Sắp tới",
              },
              {
                key: "completed",
                label: "Đã hoàn thành",
              },
              {
                key: "cancelled",
                label: "Đã hủy",
              },
            ]}
          />

          <div className={styles.bookingsList}>
            {filteredBookings.length === 0 ? (
              <Empty
                description="Chưa có chuyến đi nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              filteredBookings.map((booking) => (
                <Card
                  key={booking._id}
                  className={styles.bookingCard}
                  hoverable
                >
                  <div className={styles.bookingContent}>
                    <div className={styles.bookingImage}>
                      <Image
                        src={
                          getListingImageUrl(booking.listing_id?._id) ||
                          booking.listing_id?.images?.[0] ||
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Crect fill='%23f0f0f0' width='280' height='280'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3EChưa có ảnh%3C/text%3E%3C/svg%3E"
                        }
                        alt={booking.listing_id?.title || "Room image"}
                        width={280}
                        height={280}
                        style={{
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                        preview={false}
                        fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Crect fill='%23f0f0f0' width='280' height='280'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3EChưa có ảnh%3C/text%3E%3C/svg%3E"
                        onError={(e) => {
                          // Fallback to inline SVG if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Crect fill='%23f0f0f0' width='280' height='280'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3EChưa có ảnh%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>

                    <div className={styles.bookingDetails}>
                      <div className={styles.bookingHeader}>
                        <div className={styles.bookingInfo}>
                          <Space direction="vertical" size={4}>
                            <Text type="secondary" className={styles.dateText}>
                              <CalendarOutlined /> {formatDateRange(booking.check_in, booking.check_out)}
                            </Text>
                            <Title level={4} className={styles.bookingTitle}>
                              {booking.listing_id?.title}
                            </Title>
                            <Text type="secondary" className={styles.locationText}>
                              <EnvironmentOutlined />{" "}
                              {booking.listing_id?.address ||
                                `${booking.listing_id?.city}, ${booking.listing_id?.country}`}
                            </Text>
                          </Space>
                        </div>
                        {getStatusBadge(booking.status, booking.payment_id?.status)}
                      </div>

                      <div className={styles.bookingMeta}>
                        <Space size="large">
                          <Text type="secondary">
                            <UserOutlined /> {booking.guests} người lớn
                            {booking.guests > 1 ? "" : ""}
                          </Text>
                          <Text type="secondary">
                            <FileTextOutlined /> Mã đặt: {booking._id.slice(-8).toUpperCase()}
                          </Text>
                        </Space>
                      </div>

                      <div className={styles.bookingActions}>
                        <Button
                          type="primary"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewDetails(booking._id)}
                        >
                          Xem chi tiết
                        </Button>
                        <Button
                          icon={<MessageOutlined />}
                          onClick={() => handleContactHost(booking.host_id._id)}
                        >
                          Liên hệ chủ nhà
                        </Button>
                        {canReviewBooking(booking) && (
                          <>
                            <Button
                              icon={<FileTextOutlined />}
                              onClick={() => openReviewModal(booking)}
                            >
                              {reviewMap[booking._id] ? "Sửa đánh giá" : "Viết đánh giá"}
                            </Button>
                            {reviewMap[booking._id] && (
                              <Button danger onClick={() => confirmDeleteReview(booking)}>
                                Xoá đánh giá
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className={styles.calendarSection}>
          <Card className={styles.calendarCard} title="Lịch trình của bạn">
            <Calendar
              value={selectedDate}
              onChange={setSelectedDate}
              tileClassName={tileClassName}
              locale="vi"
              className={styles.calendar}
            />
            <div className={styles.calendarLegend}>
              <Space size="large">
                <div className={styles.legendItem}>
                  <div className={`${styles.legendDot} ${styles.bookedDot}`}></div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Đã đặt phòng
                  </Text>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendDot} ${styles.emptyDot}`}></div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Ngày trống
                  </Text>
                </div>
              </Space>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={reviewModalOpen}
        title={activeReviewId ? "Sửa đánh giá" : "Viết đánh giá"}
        onCancel={() => setReviewModalOpen(false)}
        onOk={submitReview}
        okText={reviewSubmitting ? "Đang lưu..." : "Lưu"}
        cancelText="Hủy"
        confirmLoading={reviewSubmitting}
        destroyOnClose
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Điểm đánh giá</div>
            <Rate value={reviewRating} onChange={setReviewRating} />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Nhận xét</div>
            <Input.TextArea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </div>
          {activeBookingForReview && !canReviewBooking(activeBookingForReview) && (
            <div style={{ color: "#ff4d4f" }}>
              Bạn chỉ có thể đánh giá sau ngày check-out và khi đã thanh toán.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

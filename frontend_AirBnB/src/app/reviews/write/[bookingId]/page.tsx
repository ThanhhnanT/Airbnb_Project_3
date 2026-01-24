import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Typography,
  Space,
  Button,
  Rate,
  Input,
  message,
  Spin,
  Result,
  Divider,
  Tag,
  Image,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getAccess } from "@/helper/api";
import { createReview, getReviewByBooking } from "@/service/reviews";
import dayjs from "dayjs";
import styles from "../../review-write.module.css";

const { Title, Text, Paragraph } = Typography;

interface Booking {
  _id: string;
  listing_id: {
    _id: string;
    title: string;
    images?: string[];
    city: string;
    country: string;
  };
  guest_id: {
    _id: string;
    name: string;
    avatar?: string;
  };
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
}

interface Review {
  _id: string;
  booking_id: string;
  rating: number;
  comment: string;
  createdAt?: string;
  created_at?: string;
}

export default function WriteReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = Array.isArray(params?.bookingId) 
    ? params.bookingId[0] 
    : (params?.bookingId as string);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch booking details
      const bookingData = await getAccess(`bookings/${bookingId}`);
      setBooking(bookingData);

      // Fetch existing review if any
      try {
        const existingReviewData = await getReviewByBooking(bookingId);
        if (existingReviewData) {
          setExistingReview(existingReviewData);
          setRating(existingReviewData.rating);
          setComment(existingReviewData.comment);
        }
      } catch {
        // No existing review, that's fine
        console.log("No existing review found");
      }
    } catch (error: any) {
      console.error("Error fetching booking details:", error);
      message.error(error?.response?.data?.message || "Không thể tải thông tin chuyến đi");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      message.warning("Vui lòng nhập nhận xét");
      return;
    }

    try {
      setSubmitting(true);
      
      await createReview({
        booking_id: bookingId,
        rating,
        comment: comment.trim(),
      });

      message.success(existingReview ? "Cập nhật đánh giá thành công" : "Gửi đánh giá thành công");
      
      // Redirect back to trips
      setTimeout(() => {
        router.push("/trips");
      }, 1500);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      message.error(error?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Spin size="large" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className={styles.container}>
        <Result
          status="404"
          title="Chuyến đi không tìm thấy"
          subTitle="Vui lòng kiểm tra lại link hoặc quay về trang chuyến đi"
          extra={
            <Button type="primary" onClick={() => router.push("/trips")}>
              Quay lại chuyến đi
            </Button>
          }
        />
      </div>
    );
  }

  const coverImage = booking.listing_id.images?.[0];
  const checkInDate = dayjs(booking.check_in).format("DD/MM/YYYY");
  const checkOutDate = dayjs(booking.check_out).format("DD/MM/YYYY");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          className={styles.backButton}
        >
          Quay lại
        </Button>
        <Title level={2} className={styles.title}>
          {existingReview ? "Chỉnh sửa đánh giá" : "Để lại đánh giá"}
        </Title>
      </div>

      <div className={styles.content}>
        {/* Booking Info Card */}
        <Card className={styles.infoCard}>
          <div className={styles.bookingInfo}>
            {coverImage && (
              <div className={styles.imageContainer}>
                <Image
                  src={coverImage}
                  alt={booking.listing_id.title}
                  preview={false}
                  className={styles.image}
                />
              </div>
            )}
            
            <div className={styles.details}>
              <Title level={4}>{booking.listing_id.title}</Title>
              <Paragraph className={styles.address}>
                <Text type="secondary">
                  {booking.listing_id.city}, {booking.listing_id.country}
                </Text>
              </Paragraph>

              <Space direction="vertical" size={8} className={styles.dates}>
                <Text>
                  📅 <strong>Ngày check-in:</strong> {checkInDate}
                </Text>
                <Text>
                  📅 <strong>Ngày check-out:</strong> {checkOutDate}
                </Text>
                <Text>
                  🏠 <strong>Số đêm:</strong> {booking.nights}
                </Text>
              </Space>

              {/* Guest Info */}
              <Divider style={{ margin: "16px 0" }} />
              <div className={styles.guestInfo}>
                <Space>
                  {booking.guest_id.avatar ? (
                    <Image
                      src={booking.guest_id.avatar}
                      alt={booking.guest_id.name}
                      preview={false}
                      width={40}
                      height={40}
                      style={{ borderRadius: "50%" }}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      <UserOutlined />
                    </div>
                  )}
                  <div>
                    <Text strong>Khách hàng</Text>
                    <Paragraph className={styles.guestName}>
                      {booking.guest_id.name}
                    </Paragraph>
                  </div>
                </Space>
              </div>
            </div>
          </div>
        </Card>

        {/* Review Form Card */}
        <Card className={styles.reviewCard}>
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            <div>
              <Text className={styles.label}>Đánh giá sao</Text>
              <div className={styles.ratingContainer}>
                <Rate
                  value={rating}
                  onChange={setRating}
                  tooltips={["Tệ", "Không tốt", "Bình thường", "Tốt", "Tuyệt vời"]}
                  style={{ fontSize: 28 }}
                />
                <Text className={styles.ratingText}>{rating}/5 sao</Text>
              </div>
            </div>

            <div>
              <Text className={styles.label}>Nhận xét của bạn</Text>
              <Input.TextArea
                placeholder="Chia sẻ trải nghiệm của bạn về khách hàng này. Những feedback chi tiết và tích cực sẽ giúp khách khác hiểu rõ hơn về chất lượng dịch vụ."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
                maxLength={500}
                showCount
                style={{ resize: "none" }}
              />
            </div>

            {existingReview && (
              <Tag color="blue" style={{ width: "fit-content" }}>
                Đánh giá được cập nhật lúc {dayjs(existingReview.createdAt || existingReview.created_at).format("DD/MM/YYYY HH:mm")}
              </Tag>
            )}

            <div className={styles.actions}>
              <Button onClick={() => router.push("/trips")}>
                Hủy
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmitReview}
                loading={submitting}
              >
                {existingReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
              </Button>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
}

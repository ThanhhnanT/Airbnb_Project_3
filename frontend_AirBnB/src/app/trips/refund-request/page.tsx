"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  Form,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Spin,
  Alert,
  Divider,
  Tag,
  Modal,
  Image,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import styles from "./refund-request.module.css";

const { Title, Text } = Typography;

interface Booking {
  _id: string;
  listing_id: {
    _id: string;
    title: string;
    cover_image?: string;
    images?: string[];
    city: string;
    country: string;
  };
  check_in: string;
  check_out: string;
  total_price: number;
  currency: string;
  guests: number;
  nights: number;
  status: string;
  payment_id?: {
    _id: string;
    amount: number;
    status: string;
  };
  guest_id: {
    _id: string;
    name: string;
  };
  host_id: {
    _id: string;
    name: string;
  };
}

interface ListingImage {
  _id: string;
  listing_id: string;
  image_url: string[];
  is_cover: boolean;
}

const REFUND_REASONS = [
  { value: "guest_request", label: "Yêu cầu hủy (lý do cá nhân)" },
  { value: "safety_issue", label: "Vấn đề an toàn/sạch sẽ" },
  { value: "not_as_described", label: "Phòng không như mô tả" },
  { value: "host_unresponsive", label: "Chủ nhà không phản hồi" },
  { value: "other", label: "Lý do khác" },
];

export default function RefundRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [form] = Form.useForm();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [listingImage, setListingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (bookingId) {
      console.log("Fetching booking with ID:", bookingId);
      fetchBooking();
    } else {
      console.log("No booking ID provided");
      setError("Không có ID booking");
      setLoading(false);
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!bookingId) {
        setError("Không có ID booking");
        setLoading(false);
        return;
      }

      console.log("Fetching booking details for ID:", bookingId);
      
      const API_DOMAIN = process.env.NEXT_PUBLIC_API || process.env.API || 'http://localhost:9000/';
      const token = Cookies.get('access_token') || '';
      
      const result = await axios.get(`${API_DOMAIN}bookings/${bookingId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Booking result:", result.data);
      
      if (result.data && result.data._id) {
        const bookingData = result.data;
        
        // Validate refund eligibility
        if (bookingData.status !== "confirmed") {
          setError("Chỉ có thể yêu cầu hoàn tiền cho các booking đã xác nhận");
          setLoading(false);
          return;
        }

        const checkInDate = new Date(bookingData.check_in);
        if (new Date() >= checkInDate) {
          setError("Chỉ có thể yêu cầu hoàn tiền trước thời gian check-in");
          setLoading(false);
          return;
        }

        setBooking(bookingData);

        // Fetch listing images
        try {
          const listingId = typeof bookingData.listing_id === 'string' 
            ? bookingData.listing_id 
            : bookingData.listing_id._id;
          
          console.log("Fetching listing images for listing ID:", listingId);
          
          const imagesResult = await axios.get(`${API_DOMAIN}listing-images?listingId=${listingId}`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          console.log("Listing images result:", imagesResult.data);

          if (imagesResult.data && Array.isArray(imagesResult.data)) {
            // Find cover image
            const coverImageData = imagesResult.data.find((img: ListingImage) => img.is_cover);
            if (coverImageData && coverImageData.image_url && coverImageData.image_url.length > 0) {
              setListingImage(coverImageData.image_url[0]);
              console.log("Set cover image:", coverImageData.image_url[0]);
            }
          }
        } catch (imgErr) {
          console.error("Error fetching listing images:", imgErr);
          // Continue without images, not critical
        }
      } else {
        console.error("Invalid booking data:", result.data);
        setError("Không thể tải thông tin booking - dữ liệu không hợp lệ");
      }
    } catch (err: any) {
      console.error("Fetch booking error:", err);
      if (err.response?.status === 404) {
        setError("Booking không tồn tại");
      } else if (err.response?.status === 401) {
        setError("Bạn cần đăng nhập để xem booking này");
      } else {
        setError(err?.response?.data?.message || err?.message || "Lỗi khi tải booking");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!booking || !termsAccepted) {
      Modal.error({
        title: "Lỗi",
        content: "Vui lòng đồng ý với các điều khoản trước khi tiếp tục",
      });
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmRefund = async () => {
    try {
      const values = await form.validateFields();
      setShowConfirm(false);
      setSubmitting(true);
      setError(null);

      console.log("Submitting refund request:", {
        booking_id: bookingId,
        reason: values.reason,
        description: values.description,
      });

      const API_DOMAIN = process.env.NEXT_PUBLIC_API || process.env.API || 'http://localhost:9000/';
      const token = Cookies.get('access_token') || '';

      const result = await axios.post(
        `${API_DOMAIN}refunds`,
        {
          booking_id: bookingId,
          reason: values.reason,
          description: values.description,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("Refund result:", result.data);

      if (result.data && result.data._id) {
        setSuccess(true);
        form.resetFields();
        
        // Redirect to trips after 3 seconds
        setTimeout(() => {
          router.push("/trips");
        }, 3000);
      } else {
        setError("Lỗi khi gửi yêu cầu hoàn tiền");
      }
    } catch (err: any) {
      console.error("Refund submission error:", err);
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.");
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || "Yêu cầu không hợp lệ");
      } else {
        setError(err.response?.data?.message || err?.message || "Lỗi khi gửi yêu cầu hoàn tiền");
      }
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

  if (error && !booking) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Title level={2}>Yêu cầu hoàn tiền</Title>
            </div>
            <Alert
              message="Lỗi"
              description={error}
              type="error"
              showIcon
            />
            <Button 
              type="primary" 
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/trips")}
            >
              Quay lại các chuyến đi
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <Space direction="vertical" size="large" style={{ width: "100%" }} align="center">
            <CheckCircleOutlined style={{ fontSize: "48px", color: "#52c41a" }} />
            <div style={{ textAlign: "center" }}>
              <Title level={3}>Yêu cầu hoàn tiền được gửi thành công!</Title>
              <Text type="secondary">
                Yêu cầu hoàn tiền của bạn đã được gửi và đang chờ phê duyệt từ đội ngũ quản lý.
                Bạn sẽ nhận được email thông báo kết quả sớm nhất.
              </Text>
            </div>
            <Text type="secondary">Đang chuyển hướng...</Text>
          </Space>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const checkInDate = new Date(booking.check_in);
  const daysUntilCheckIn = Math.ceil(
    (checkInDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={styles.container}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/trips")}
        style={{ marginBottom: "16px" }}
      >
        Quay lại các chuyến đi
      </Button>

      <div className={styles.mainContent}>
        {/* Booking Summary */}
        <Card className={styles.bookingSummary}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Title level={2}>Yêu cầu hoàn tiền</Title>

            <div className={styles.bookingCard}>
              <div className={styles.imageSection}>
                <Image
                  src={
                    listingImage ||
                    booking.listing_id.cover_image ||
                    booking.listing_id.images?.[0] ||
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='200'%3E%3Crect fill='%23f0f0f0' width='280' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3EChưa có ảnh%3C/text%3E%3C/svg%3E"
                  }
                  alt={booking.listing_id.title}
                  style={{ borderRadius: "8px" }}
                  preview={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='200'%3E%3Crect fill='%23f0f0f0' width='280' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3EChưa có ảnh%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>

              <div className={styles.bookingDetails}>
                <Title level={4} style={{ margin: 0 }}>
                  {booking.listing_id.title}
                </Title>
                <Text type="secondary">
                  {booking.listing_id.city}, {booking.listing_id.country}
                </Text>

                <Divider />

                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <Text type="secondary">Check-in</Text>
                    <div className={styles.detailValue}>
                      {dayjs(booking.check_in).format("DD/MM/YYYY - HH:mm")}
                    </div>
                    <div className={styles.daysInfo}>
                      ({daysUntilCheckIn} ngày nữa)
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <Text type="secondary">Check-out</Text>
                    <div className={styles.detailValue}>
                      {dayjs(booking.check_out).format("DD/MM/YYYY - HH:mm")}
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <Text type="secondary">Số đêm</Text>
                    <div className={styles.detailValue}>{booking.nights} đêm</div>
                  </div>

                  <div className={styles.detailItem}>
                    <Text type="secondary">Số khách</Text>
                    <div className={styles.detailValue}>{booking.guests} khách</div>
                  </div>
                </div>

                <Divider />

                <div className={styles.priceSection}>
                  <div className={styles.priceRow}>
                    <Text>Giá cơ bản x {booking.nights} đêm</Text>
                    <Text>{(booking.total_price / booking.nights).toFixed(2)} {booking.currency}</Text>
                  </div>
                  <div className={styles.totalPrice}>
                    <Text strong>Tổng cộng</Text>
                    <Text strong style={{ fontSize: "18px", color: "#FF5A5F" }}>
                      {booking.total_price.toFixed(2)} {booking.currency}
                    </Text>
                  </div>
                </div>

                {daysUntilCheckIn <= 7 && (
                  <Alert
                    message="Lưu ý"
                    description={`Bạn chỉ còn ${daysUntilCheckIn} ngày trước khi check-in. Vui lòng hành động nhanh chóng.`}
                    type="warning"
                    showIcon
                    style={{ marginTop: "16px" }}
                  />
                )}
              </div>
            </div>
          </Space>
        </Card>

        {/* Refund Form */}
        <Card className={styles.formCard}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Title level={3}>Chi tiết hoàn tiền</Title>

            <Alert
              message="Hoàn tiền 100%"
              description="Nếu yêu cầu của bạn được chấp thuận, bạn sẽ nhận được hoàn lại toàn bộ số tiền booking."
              type="info"
              showIcon
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                label="Lý do hoàn tiền"
                name="reason"
                rules={[
                  { required: true, message: "Vui lòng chọn lý do hoàn tiền" },
                ]}
              >
                <Select
                  placeholder="Chọn lý do hoàn tiền..."
                  options={REFUND_REASONS}
                />
              </Form.Item>

              <Form.Item
                label="Mô tả chi tiết"
                name="description"
                rules={[
                  { required: true, message: "Vui lòng nhập mô tả chi tiết" },
                  {
                    min: 20,
                    message: "Mô tả phải có ít nhất 20 ký tự",
                  },
                  {
                    max: 1000,
                    message: "Mô tả không được vượt quá 1000 ký tự",
                  },
                ]}
              >
                <Input.TextArea
                  placeholder="Vui lòng mô tả chi tiết lý do bạn muốn hoàn tiền..."
                  rows={6}
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              <Alert
                message="Chính sách hoàn tiền"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: "20px" }}>
                    <li>Yêu cầu phải được gửi trước ngày check-in</li>
                    <li>Đội ngũ quản lý sẽ xem xét và phê duyệt trong vòng 24-48 giờ</li>
                    <li>Nếu được chấp thuận, tiền sẽ được hoàn lại trong 5-10 ngày làm việc</li>
                    <li>Chủ nhà sẽ được thông báo về yêu cầu của bạn</li>
                  </ul>
                }
                type="warning"
                style={{ marginBottom: "16px" }}
              />

              <Form.Item
                valuePropName="checked"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng đồng ý với các điều khoản",
                  },
                ]}
              >
                <div className={styles.termsCheckbox}>
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <label htmlFor="terms" style={{ marginLeft: "8px" }}>
                    Tôi đã đọc và đồng ý với chính sách hoàn tiền
                  </label>
                </div>
              </Form.Item>

              {error && (
                <Alert
                  message="Lỗi"
                  description={error}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError(null)}
                />
              )}

              <Space style={{ width: "100%", marginTop: "24px" }}>
                <Button
                  block
                  onClick={() => router.push("/trips")}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  block
                  htmlType="submit"
                  loading={submitting}
                  disabled={!termsAccepted}
                >
                  Gửi yêu cầu hoàn tiền
                </Button>
              </Space>
            </Form>
          </Space>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Modal
        title="Xác nhận yêu cầu hoàn tiền"
        open={showConfirm}
        onOk={handleConfirmRefund}
        onCancel={() => setShowConfirm(false)}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        icon={<ExclamationCircleOutlined />}
      >
        <p>Bạn có chắc chắn muốn gửi yêu cầu hoàn tiền cho booking này?</p>
        <p>
          <strong>Số tiền:</strong> {booking.total_price} {booking.currency}
        </p>
        <p>
          Yêu cầu sẽ được gửi tới đội ngũ quản lý và chủ nhà sẽ được thông báo.
        </p>
      </Modal>
    </div>
  );
}

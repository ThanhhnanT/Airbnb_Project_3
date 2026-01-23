"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Spin,
  Typography,
  Checkbox,
  Rate,
} from "antd";
import dayjs from "dayjs";
import styles from "./payment.module.css";
import { getAccess, postAccess } from "@/helper/api";
import { useMessageApi } from "@/components/providers/Message";
import { getUserProfile } from "@/service/user";

const { Title, Text } = Typography;

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface PaymentFormProps {
  bookingId: string;
  listingId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  listingSummary: {
    title: string;
    city: string;
    country: string;
    imageUrl?: string | null;
    avgRating?: number;
    reviewCount?: number;
    pricePerNight: number;
    currency: string;
    cleaningFee?: number;
  };
  userProfile?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

function formatCurrency(amount: number, currency: string) {
  if (!amount) return "0";
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency || ""}`;
  }
}

function PaymentForm({
  bookingId,
  listingId,
  checkInDate,
  checkOutDate,
  guests,
  totalPrice,
  listingSummary,
  userProfile,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const messageApi = useMessageApi();
  const [loading, setLoading] = useState(false);
  const [userForm] = Form.useForm();

  const nights = useMemo(() => {
    const start = dayjs(checkInDate);
    const end = dayjs(checkOutDate);
    const diff = end.diff(start, "day");
    return diff > 0 ? diff : 1;
  }, [checkInDate, checkOutDate]);

  const basePrice = listingSummary.pricePerNight * nights;
  const cleaningFee = listingSummary.cleaningFee || 0;
  const serviceFee = Math.max(
    0,
    Math.round(totalPrice - basePrice - cleaningFee)
  );

  // Prefill user info form from profile
  useEffect(() => {
    if (userProfile) {
      userForm.setFieldsValue({
        fullName: userProfile.name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
      });
    }
  }, [userProfile, userForm]);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        messageApi.error("Không tìm thấy thông tin thẻ");
        setLoading(false);
        return;
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod(
        {
          type: "card",
          card: cardElement,
        }
      );

      if (pmError || !paymentMethod) {
        messageApi.error(pmError?.message || "Không thể tạo phương thức thanh toán");
        setLoading(false);
        return;
      }

      const paymentInit = await postAccess("payments/process", {
        paymentMethodId: paymentMethod.id,
        amount: Math.round(totalPrice * 100), // cents
        currency: "usd",
        bookingDetails: {
          bookingId,
          listingId,
          checkInDate,
          checkOutDate,
          numberOfGuests: guests,
          totalPrice,
        },
      });

      if (!paymentInit || !paymentInit.clientSecret) {
        messageApi.error("Không thể khởi tạo thanh toán");
        setLoading(false);
        return;
      }

      const { clientSecret } = paymentInit;

      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret);

      if (confirmError) {
        messageApi.error(confirmError.message || "Thanh toán thất bại");
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        messageApi.success("Thanh toán thành công!");
        router.push(`/bookings/${bookingId}`);
      } else {
        messageApi.warning("Thanh toán chưa hoàn tất, vui lòng thử lại");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      messageApi.error(error?.message || "Đã xảy ra lỗi khi thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.paymentPage}>
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumbs}>
          <Breadcrumb
            items={[
              { title: "Tìm kiếm" },
              { title: "Chi tiết chỗ ở" },
              { title: "Đặt phòng" },
            ]}
          />
        </div>
        <Title level={2} className={styles.pageTitle}>
          Xác nhận và Thanh toán
        </Title>
      </div>

      <div className={styles.contentGrid}>
        {/* Left column: forms */}
        <div className={styles.leftColumn}>
          <Card className={styles.sectionCard} bordered={false}>
            <Title level={4}>Thông tin của bạn</Title>
            <Form layout="vertical" form={userForm}>
              <Form.Item
                label="Họ và Tên"
                name="fullName"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input placeholder="email@example.com" />
              </Form.Item>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
              >
                <Input placeholder="090 xxx xxxx" />
              </Form.Item>
            </Form>
          </Card>

          <Card className={styles.sectionCard} bordered={false}>
            <div className={styles.paymentMethodHeader}>
              <Title level={4} style={{ marginBottom: 0 }}>
                Chọn phương thức thanh toán
              </Title>
            </div>
            <Divider />
            <Card
              type="inner"
              size="small"
              title={
                <div className={styles.paymentMethodHeader}>
                  <span>Thẻ tín dụng hoặc ghi nợ (Stripe)</span>
                  <div className={styles.paymentMethodLogos}>
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
                      alt="Visa"
                      style={{ height: 20 }}
                    />
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png"
                      alt="Mastercard"
                      style={{ height: 20 }}
                    />
                  </div>
                </div>
              }
              bordered
            >
              <Form layout="vertical" onFinish={handleSubmit}>
                <Form.Item label="Thông tin thẻ" required>
                  <div className={styles.cardElementWrapper}>
                    <CardElement />
                  </div>
                </Form.Item>

                <Divider />

                <Title level={4} style={{ marginTop: 8 }}>
                  Chính sách hủy
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Miễn phí hủy trước 3:00 PM ngày nhận phòng. Sau thời điểm đó, bạn
                  có thể không được hoàn lại một phần hoặc toàn bộ chi phí đặt
                  phòng tùy theo chính sách của chủ nhà.
                </Text>

                <div style={{ marginTop: 16 }}>
                  <Form.Item
                    name="terms"
                    valuePropName="checked"
                    rules={[
                      {
                        validator: (_, value) =>
                          value
                            ? Promise.resolve()
                            : Promise.reject(
                                new Error("Bạn cần đồng ý với các điều khoản.")
                              ),
                      },
                    ]}
                  >
                    <div className={styles.termsRow}>
                      <Checkbox />
                      <Text style={{ fontSize: 12 }}>
                        Tôi đồng ý với các{" "}
                        <a>Điều khoản dịch vụ</a> và{" "}
                        <a>Chính sách hoàn tiền cho khách</a>.
                      </Text>
                    </div>
                  </Form.Item>
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  disabled={!stripe || !elements}
                >
                  Xác nhận và Thanh toán
                </Button>
              </Form>
            </Card>
          </Card>
        </div>

        {/* Right column: summary */}
        <div className={styles.summaryRight}>
          <Card bordered>
            <Row gutter={16}>
              <Col flex="auto">
                <Text strong>{listingSummary.title}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Toàn bộ chỗ ở tại {listingSummary.city},{" "}
                  {listingSummary.country}
                </Text>
                {typeof listingSummary.avgRating === "number" && (
                  <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                    <Rate
                      disabled
                      allowHalf
                      value={listingSummary.avgRating}
                      style={{ fontSize: 14 }}
                    />
                    <Text strong>
                      {listingSummary.avgRating.toFixed(2)}
                    </Text>
                    {listingSummary.reviewCount !== undefined && (
                      <Text type="secondary">
                        ({listingSummary.reviewCount} đánh giá)
                      </Text>
                    )}
                  </div>
                )}
              </Col>
              <Col>
                {listingSummary.imageUrl && (
                  <img
                    src={listingSummary.imageUrl}
                    alt={listingSummary.title}
                    className={styles.summaryImage}
                  />
                )}
              </Col>
            </Row>

            <Divider />

            <div>
              <Title level={5}>Chi tiết chuyến đi của bạn</Title>
              <div className={styles.summaryRow}>
                <div>
                  <Text strong>Ngày</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(checkInDate).format("DD/MM/YYYY")} -{" "}
                    {dayjs(checkOutDate).format("DD/MM/YYYY")}
                  </Text>
                </div>
                {/* Có thể thêm nút sửa sau */}
              </div>
              <div className={styles.summaryRow}>
                <div>
                  <Text strong>Khách</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {guests} khách
                  </Text>
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <Title level={5}>Chi tiết giá</Title>
              <div className={styles.priceRow}>
                <span>
                  {formatCurrency(listingSummary.pricePerNight, listingSummary.currency)} x{" "}
                  {nights} đêm
                </span>
                <span>
                  {formatCurrency(basePrice, listingSummary.currency)}
                </span>
              </div>
              {cleaningFee > 0 && (
                <div className={styles.priceRow}>
                  <span>Phí dọn dẹp</span>
                  <span>
                    {formatCurrency(cleaningFee, listingSummary.currency)}
                  </span>
                </div>
              )}
              {serviceFee > 0 && (
                <div className={styles.priceRow}>
                  <span>Phí dịch vụ</span>
                  <span>
                    {formatCurrency(serviceFee, listingSummary.currency)}
                  </span>
                </div>
              )}
              <Divider />
              <div className={styles.priceTotalRow}>
                <span>Tổng cộng</span>
                <span>
                  {formatCurrency(totalPrice, listingSummary.currency)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(null);
  const [guests, setGuests] = useState<number | null>(null);
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const [listingSummary, setListingSummary] = useState<PaymentFormProps["listingSummary"] | null>(null);
  const [userProfile, setUserProfile] = useState<PaymentFormProps["userProfile"] | null>(null);
  const messageApi = useMessageApi();

  useEffect(() => {
    const init = async () => {
      try {
        const listingIdParam = searchParams.get("listingId");
        const checkIn = searchParams.get("checkInDate");
        const checkOut = searchParams.get("checkOutDate");
        const guestsParam = searchParams.get("guests");
        const totalPriceParam = searchParams.get("totalPrice");

        if (
          !listingIdParam ||
          !checkIn ||
          !checkOut ||
          !guestsParam ||
          !totalPriceParam
        ) {
          messageApi.error("Thiếu thông tin đặt phòng");
          router.push("/");
          return;
        }

        const guestsNumber = parseInt(guestsParam, 10);
        const totalPriceNumber = parseFloat(totalPriceParam);

        let booking;
        try {
          booking = await postAccess("bookings", {
            listing_id: listingIdParam,
            check_in: checkIn,
            check_out: checkOut,
            guests: guestsNumber,
          });
        } catch (err: any) {
          // Nếu tạo booking thất bại (ví dụ: trùng lịch), báo lỗi và đưa về trang listing thay vì về home
          const errorMessage =
            err?.response?.data?.message ||
            "Không thể tạo đặt phòng. Vui lòng chọn khoảng ngày khác.";
          messageApi.error(errorMessage);
          router.push(`/listings/${listingIdParam}`);
          return;
        }

        if (!booking || !booking._id) {
          messageApi.error("Không thể tạo đặt phòng");
          router.push(`/listings/${listingIdParam}`);
          return;
        }

        const details = await getAccess(
          `listings/${listingIdParam}/details`,
          {
            checkInDate: checkIn,
            checkOutDate: checkOut,
            guests: guestsNumber,
          }
        );

        const listing = details?.listing;
        const firstImage =
          Array.isArray(details?.images) &&
          details.images.length > 0 &&
          Array.isArray(details.images[0].image_url)
            ? details.images[0].image_url[0]
            : undefined;

        setListingSummary({
          title: listing?.title || "Chỗ ở của bạn",
          city: listing?.city || "",
          country: listing?.country || "",
          imageUrl: firstImage,
          avgRating: listing?.avg_rating,
          reviewCount: listing?.review_count,
          pricePerNight: listing?.price_base || totalPriceNumber,
          currency: listing?.currency || "USD",
          cleaningFee: listing?.cleaning_fee || 0,
        });

        // Lấy thông tin user để prefill form (nếu có token hợp lệ)
        try {
          const profile = await getUserProfile();
          setUserProfile({
            name: profile?.name,
            email: profile?.email,
            phone: profile?.phone,
          });
        } catch (profileError) {
          console.warn("Không thể lấy thông tin user cho trang thanh toán:", profileError);
        }

        setBookingId(booking._id);
        setListingId(listingIdParam);
        setCheckInDate(checkIn);
        setCheckOutDate(checkOut);
        setGuests(guestsNumber);
        setTotalPrice(totalPriceNumber);
      } catch (error: any) {
        console.error("Init payment error:", error);
        const listingIdParam = searchParams.get("listingId");
        const errorMessage =
          error?.response?.data?.message || "Không thể khởi tạo thanh toán";
        messageApi.error(errorMessage);
        if (listingIdParam) {
          router.push(`/listings/${listingIdParam}`);
        } else {
          router.push("/");
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [searchParams, router]);

  if (!stripePromise) {
    return (
      <div className={styles.loadingContainer}>
        <Spin />
      </div>
    );
  }

  if (
    loading ||
    !bookingId ||
    !listingId ||
    !checkInDate ||
    !checkOutDate ||
    !guests ||
    !totalPrice ||
    !listingSummary
  ) {
    return (
      <div className={styles.loadingContainer}>
        <Spin />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        bookingId={bookingId}
        listingId={listingId}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        guests={guests}
        totalPrice={totalPrice}
        listingSummary={listingSummary}
        userProfile={userProfile || undefined}
      />
    </Elements>
  );
}


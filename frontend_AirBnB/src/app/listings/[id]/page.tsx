"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Spin, Empty, Button, Carousel, Rate, Tag, Divider, message, DatePicker } from "antd";
import { 
  HeartOutlined, 
  ShareAltOutlined, 
  WifiOutlined, 
  CarOutlined,
  HomeOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined
} from "@ant-design/icons";
import { getAccess } from "@/helper/api";
import dayjs, { Dayjs } from "dayjs";
import styles from "./listing-detail.module.css";

const { RangePicker } = DatePicker;

interface ListingDetail {
  listing: {
    _id: string;
    title: string;
    description?: string;
    city: string;
    country: string;
    street?: string;
    latitude?: number;
    longitude?: number;
    price_base: number;
    currency: string;
    guests: number;
    bedrooms?: number;
    beds?: number;
    bathrooms?: number;
    amenities?: string[];
    house_rules?: string;
    cancellation_policy?: string;
    avg_rating: number;
    review_count: number;
    host_id?: {
      _id: string;
      name: string;
      avatar_url?: string;
      bio?: string;
    };
  };
  images: Array<{
    _id: string;
    listing_id: string | { toString(): string };
    image_url: string[];
    is_cover?: boolean;
  }>;
  reviews: Array<{
    _id: string;
    rating: number;
    comment?: string;
    reviewer_id?: {
      _id: string;
      name: string;
      avatar_url?: string;
    };
    createdAt: string;
  }>;
  availability?: {
    isAvailable: boolean;
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    totalPrice: number;
    currency: string;
  };
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = params.id as string;
  
  const [listingDetail, setListingDetail] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        setLoading(true);
        const checkInDate = searchParams.get("checkInDate");
        const checkOutDate = searchParams.get("checkOutDate");
        const guestsParam = searchParams.get("guests");

        let url = `listings/${listingId}/details`;
        if (checkInDate && checkOutDate) {
          url += `?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`;
          if (guestsParam) {
            url += `&guests=${guestsParam}`;
            setGuests(parseInt(guestsParam));
          }
          setDateRange([
            dayjs(checkInDate),
            dayjs(checkOutDate)
          ]);
        }

        const result = await getAccess(url);
        setListingDetail(result);
      } catch (error: any) {
        console.error("Error fetching listing details:", error);
        message.error("Không thể tải thông tin chi tiết");
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListingDetails();
    }
  }, [listingId, searchParams]);

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
      // Update URL with new dates
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("checkInDate", dates[0].format("YYYY-MM-DD"));
      newParams.set("checkOutDate", dates[1].format("YYYY-MM-DD"));
      newParams.set("guests", guests.toString());
      router.push(`/listings/${listingId}?${newParams.toString()}`);
    }
  };

  const handleReserve = () => {
    if (!dateRange[0] || !dateRange[1]) {
      message.warning("Vui lòng chọn ngày check-in và check-out");
      return;
    }
    
    const bookingData = {
      listingId: listingId,
      checkInDate: dateRange[0].format("YYYY-MM-DD"),
      checkOutDate: dateRange[1].format("YYYY-MM-DD"),
      guests: guests,
    };
    
    router.push(`/payment?${new URLSearchParams(bookingData as any).toString()}`);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  if (!listingDetail) {
    return (
      <div className={styles.emptyContainer}>
        <Empty description="Không tìm thấy thông tin listing" />
      </div>
    );
  }

  const { listing, images, reviews, availability } = listingDetail;

  return (
    <div className={styles.listingDetailContainer}>
      {/* Image Gallery */}
      <div className={styles.imageSection}>
        {images && images.length > 0 ? (
          <Carousel autoplay>
            {images.flatMap((img) => 
              img.image_url && Array.isArray(img.image_url) 
                ? img.image_url.map((url, index) => (
                    <div key={`${img._id}-${index}`} className={styles.imageSlide}>
                      <img src={url} alt={listing.title} />
                    </div>
                  ))
                : []
            )}
          </Carousel>
        ) : (
          <div className={styles.placeholderImage}>
            <HomeOutlined style={{ fontSize: 64, color: "#ccc" }} />
          </div>
        )}
      </div>

      <div className={styles.contentSection}>
        <div className={styles.mainContent}>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>{listing.title}</h1>
              <div className={styles.location}>
                <span>{listing.city}, {listing.country}</span>
                {listing.street && <span> • {listing.street}</span>}
              </div>
              <div className={styles.rating}>
                <Rate disabled value={listing.avg_rating} allowHalf />
                <span>({listing.review_count} đánh giá)</span>
              </div>
            </div>
            <div className={styles.actions}>
              <Button icon={<ShareAltOutlined />} shape="circle" />
              <Button icon={<HeartOutlined />} shape="circle" />
            </div>
          </div>

          <Divider />

          {/* Host Info */}
          {listing.host_id && (
            <div className={styles.hostSection}>
              <div className={styles.hostInfo}>
                <img 
                  src={listing.host_id.avatar_url || "/default-avatar.png"} 
                  alt={listing.host_id.name}
                  className={styles.hostAvatar}
                />
                <div>
                  <h3>Chủ nhà: {listing.host_id.name}</h3>
                  {listing.host_id.bio && <p>{listing.host_id.bio}</p>}
                </div>
              </div>
            </div>
          )}

          <Divider />

          {/* Description */}
          {listing.description && (
            <div className={styles.descriptionSection}>
              <h2>Mô tả</h2>
              <p>{listing.description}</p>
            </div>
          )}

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className={styles.amenitiesSection}>
              <h2>Tiện nghi</h2>
              <div className={styles.amenitiesGrid}>
                {listing.amenities.map((amenity, index) => (
                  <Tag key={index} icon={<WifiOutlined />}>{amenity}</Tag>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div className={styles.detailsSection}>
            <h2>Chi tiết</h2>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <UserOutlined /> <span>{listing.guests} khách</span>
              </div>
              {listing.bedrooms && (
                <div className={styles.detailItem}>
                  <HomeOutlined /> <span>{listing.bedrooms} phòng ngủ</span>
                </div>
              )}
              {listing.beds && (
                <div className={styles.detailItem}>
                  <HomeOutlined /> <span>{listing.beds} giường</span>
                </div>
              )}
              {listing.bathrooms && (
                <div className={styles.detailItem}>
                  <HomeOutlined /> <span>{listing.bathrooms} phòng tắm</span>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <div className={styles.reviewsSection}>
              <h2>Đánh giá ({reviews.length})</h2>
              {reviews.map((review) => (
                <div key={review._id} className={styles.reviewItem}>
                  <div className={styles.reviewHeader}>
                    <img 
                      src={review.reviewer_id?.avatar_url || "/default-avatar.png"} 
                      alt={review.reviewer_id?.name}
                      className={styles.reviewerAvatar}
                    />
                    <div>
                      <h4>{review.reviewer_id?.name || "Anonymous"}</h4>
                      <Rate disabled value={review.rating} />
                      <span className={styles.reviewDate}>
                        {dayjs(review.createdAt).format("DD/MM/YYYY")}
                      </span>
                    </div>
                  </div>
                  {review.comment && <p>{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Card */}
        <div className={styles.bookingCard}>
          <div className={styles.priceSection}>
            <span className={styles.price}>
              <DollarOutlined /> {listing.price_base.toLocaleString()} {listing.currency}
            </span>
            <span className={styles.priceUnit}>/ đêm</span>
          </div>

          <div className={styles.bookingForm}>
            <div className={styles.datePickerSection}>
              <label>Ngày</label>
              <RangePicker
                value={dateRange}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                className={styles.datePicker}
              />
            </div>

            <div className={styles.guestsSection}>
              <label>Số khách</label>
              <input
                type="number"
                min={1}
                max={listing.guests}
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                className={styles.guestsInput}
              />
            </div>

            {availability && (
              <div className={styles.availabilityInfo}>
                <p>
                  {availability.isAvailable ? (
                    <span style={{ color: "green" }}>✓ Còn phòng</span>
                  ) : (
                    <span style={{ color: "red" }}>✗ Hết phòng</span>
                  )}
                </p>
                {availability.isAvailable && (
                  <p className={styles.totalPrice}>
                    Tổng: {availability.totalPrice.toLocaleString()} {availability.currency}
                    <span> ({availability.nights} đêm)</span>
                  </p>
                )}
              </div>
            )}

            <Button
              type="primary"
              size="large"
              block
              onClick={handleReserve}
              disabled={!dateRange[0] || !dateRange[1] || (availability && !availability.isAvailable)}
              className={styles.reserveButton}
            >
              Đặt phòng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


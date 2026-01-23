"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Spin, Empty, Button, Rate, Tag, Divider, message, Typography } from "antd";
import { 
  HeartOutlined, 
  ShareAltOutlined, 
  WifiOutlined, 
  CarOutlined,
  HomeOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  RightOutlined,
  LeftOutlined,
  CloseOutlined
} from "@ant-design/icons";
import { getAccess } from "@/helper/api";
import dayjs, { Dayjs } from "dayjs";
import DatePickerModal from "@/components/search/DatePickerModal";
import GuestSelector, { GuestCounts } from "@/components/search/GuestSelector";
import styles from "./listing-detail.module.css";

const { Text } = Typography;

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
  const [guestCounts, setGuestCounts] = useState<GuestCounts>({
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0,
  });
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [bookingCardStopped, setBookingCardStopped] = useState(false);
  const bookingFormRef = useRef<HTMLDivElement>(null);
  const reviewsSectionRef = useRef<HTMLDivElement>(null);
  const bookingCardRef = useRef<HTMLDivElement>(null);
  
  // Flatten all image URLs - calculate early to avoid hook order issues
  const allImages = listingDetail?.images && listingDetail.images.length > 0
    ? listingDetail.images.flatMap((img) => 
        img.image_url && Array.isArray(img.image_url) ? img.image_url : []
      )
    : [];

  // Create a stable key from search params for dependency array
  const searchParamsKey = `${searchParams.get("checkInDate") || searchParams.get("check_in") || ""}_${searchParams.get("checkOutDate") || searchParams.get("check_out") || ""}_${searchParams.get("guests") || ""}`;

  // Keyboard navigation for image modal - must be called before conditional returns
  useEffect(() => {
    if (!imageModalOpen || allImages.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : allImages.length - 1;
          return newIndex;
        });
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => {
          const newIndex = prev < allImages.length - 1 ? prev + 1 : 0;
          return newIndex;
        });
      } else if (e.key === 'Escape') {
        setImageModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageModalOpen, allImages.length]);

  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        setLoading(true);
        
        // Check both formats: check_in/check_out (from search) and checkInDate/checkOutDate
        const checkInDate = searchParams.get("checkInDate") || searchParams.get("check_in");
        const checkOutDate = searchParams.get("checkOutDate") || searchParams.get("check_out");
        const guestsParam = searchParams.get("guests");

        let url = `listings/${listingId}/details`;
        if (checkInDate && checkOutDate) {
          url += `?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`;
          if (guestsParam) {
            url += `&guests=${guestsParam}`;
            const totalGuests = parseInt(guestsParam);
            // Convert total guests to GuestCounts format
            setGuestCounts({
              adults: Math.max(1, totalGuests),
              children: 0,
              infants: 0,
              pets: 0,
            });
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
    // Only run on initial load or when listingId changes, not when searchParams change from form updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  // Handle scroll to stop booking card when it reaches reviews section
  useEffect(() => {
    const handleScroll = () => {
      if (!reviewsSectionRef.current || !bookingCardRef.current) {
        setBookingCardStopped(false);
        return;
      }
      
      const reviewsTop = reviewsSectionRef.current.offsetTop;
      const bookingCardRect = bookingCardRef.current.getBoundingClientRect();
      const bookingCardHeight = bookingCardRef.current.offsetHeight;
      const scrollY = window.scrollY;
      const bookingCardTop = bookingCardRect.top + scrollY;
      
      // Stop when booking card bottom would reach reviews section top (with 20px offset)
      const stopPosition = reviewsTop - bookingCardHeight - 20;
      
      if (bookingCardTop >= stopPosition) {
        setBookingCardStopped(true);
      } else {
        setBookingCardStopped(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [listingDetail]);

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
      const totalGuests = guestCounts.adults + guestCounts.children;
      
      // Update URL without reloading page
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("checkInDate", dates[0].format("YYYY-MM-DD"));
      newParams.set("checkOutDate", dates[1].format("YYYY-MM-DD"));
      newParams.set("guests", totalGuests.toString());
      
      // Use replace with shallow routing to avoid page reload
      window.history.replaceState(
        {},
        '',
        `/listings/${listingId}?${newParams.toString()}`
      );
      
      // Refetch listing details with new dates
      const url = `listings/${listingId}/details?checkInDate=${dates[0].format("YYYY-MM-DD")}&checkOutDate=${dates[1].format("YYYY-MM-DD")}&guests=${totalGuests}`;
      getAccess(url).then(setListingDetail).catch(console.error);
    }
  };

  const handleGuestChange = (guests: GuestCounts) => {
    setGuestCounts(guests);
    // Update URL with new guest count
    if (dateRange[0] && dateRange[1]) {
      const totalGuests = guests.adults + guests.children;
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("checkInDate", dateRange[0].format("YYYY-MM-DD"));
      newParams.set("checkOutDate", dateRange[1].format("YYYY-MM-DD"));
      newParams.set("guests", totalGuests.toString());
      
      // Use replace with shallow routing to avoid page reload
      window.history.replaceState(
        {},
        '',
        `/listings/${listingId}?${newParams.toString()}`
      );
      
      // Refetch listing details with new guest count
      const url = `listings/${listingId}/details?checkInDate=${dateRange[0].format("YYYY-MM-DD")}&checkOutDate=${dateRange[1].format("YYYY-MM-DD")}&guests=${totalGuests}`;
      getAccess(url).then(setListingDetail).catch(console.error);
    }
  };

  const formatDateRange = (): string => {
    if (!dateRange[0] || !dateRange[1]) {
      return "Thêm ngày";
    }
    return `${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format("DD/MM/YYYY")}`;
  };

  const formatGuests = (): string => {
    const total = guestCounts.adults + guestCounts.children + guestCounts.infants;
    if (total === 0) return "Thêm khách";
    return `${total} ${total === 1 ? "khách" : "khách"}`;
  };

  const handleReserve = () => {
    if (!dateRange[0] || !dateRange[1]) {
      message.warning("Vui lòng chọn ngày check-in và check-out");
      return;
    }
    if (!availability || !availability.isAvailable) {
      message.warning("Khoảng thời gian này không còn phòng trống");
      return;
    }

    const totalGuests = guestCounts.adults + guestCounts.children;
    if (totalGuests === 0) {
      message.warning("Vui lòng chọn số lượng khách");
      return;
    }
    
    const bookingData = {
      listingId: listingId,
      checkInDate: dateRange[0].format("YYYY-MM-DD"),
      checkOutDate: dateRange[1].format("YYYY-MM-DD"),
      guests: totalGuests.toString(),
      totalPrice: availability?.totalPrice?.toString() || "",
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

  // Get first 5 images for grid display
  const displayImages = allImages.slice(0, 5);
  const remainingCount = allImages.length - 5;

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setImageModalOpen(true);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Format date in Vietnamese: "tháng X năm YYYY"
  const formatVietnameseDate = (date: string): string => {
    const d = dayjs(date);
    const month = d.month() + 1; // dayjs months are 0-indexed
    const year = d.year();
    return `tháng ${month} năm ${year}`;
  };

  // Calculate activity on Airbnb (placeholder - requires backend update)
  const getActivityText = (reviewerId?: { _id: string; name: string; avatar_url?: string }): string => {
    // Placeholder: randomly assign activity for demo
    // In production, this should come from reviewer's createdAt field
    const activities = ["1 năm hoạt động trên Airbnb", "4 tháng hoạt động trên Airbnb", "2 năm hoạt động trên Airbnb"];
    if (!reviewerId) return activities[0];
    // Use reviewer ID to get consistent activity per reviewer
    const hash = reviewerId._id.charCodeAt(0) % activities.length;
    return activities[hash];
  };

  // Calculate top percentage based on rating and review count
  const calculateTopPercentage = (avgRating: number, reviewCount: number): number => {
    // Simplified logic: higher rating and more reviews = higher percentage
    if (avgRating >= 4.8 && reviewCount >= 10) return 5;
    if (avgRating >= 4.5 && reviewCount >= 5) return 10;
    if (avgRating >= 4.0) return 20;
    return 30;
  };

  // Toggle review expansion
  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  // Check if review comment should be truncated
  const shouldTruncate = (comment: string): boolean => {
    return comment && comment.length > 200;
  };

  // Get truncated comment
  const getTruncatedComment = (comment: string): string => {
    if (!comment) return "";
    return comment.substring(0, 200) + "...";
  };

  return (
    <div className={styles.listingDetailContainer}>
      {/* Image Gallery */}
      <div className={styles.imageSection}>
        {displayImages.length > 0 ? (
          <div className={styles.imageGrid}>
            {/* Main large image */}
            <div 
              className={styles.mainImage}
              onClick={() => handleImageClick(0)}
            >
              <img src={displayImages[0]} alt={listing.title} />
            </div>
            
            {/* 4 smaller images */}
            <div className={styles.sideImages}>
              {displayImages.slice(1, 5).map((url, index) => (
                <div
                  key={index + 1}
                  className={styles.sideImage}
                  onClick={() => handleImageClick(index + 1)}
                >
                  <img src={url} alt={`${listing.title} - ${index + 2}`} />
                  {index === 3 && remainingCount > 0 && (
                    <div 
                      className={styles.viewAllOverlay}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(4);
                      }}
                    >
                      <Button type="primary" className={styles.viewAllButton}>
                        Hiển thị tất cả ảnh
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.placeholderImage}>
            <HomeOutlined style={{ fontSize: 64, color: "#ccc" }} />
          </div>
        )}
      </div>

      {/* Image Modal Slider */}
      {imageModalOpen && allImages.length > 0 && (
        <div className={styles.imageModal}>
          <div className={styles.imageModalBackdrop} onClick={() => setImageModalOpen(false)} />
          <Button
            className={styles.imageModalClose}
            icon={<CloseOutlined />}
            onClick={() => setImageModalOpen(false)}
          />
          <div className={styles.imageModalContent}>
            <div className={styles.imageModalImageContainer}>
              <Button
                className={styles.imageModalPrev}
                icon={<LeftOutlined />}
                onClick={handlePrevImage}
              />
              <div className={styles.imageModalImageWrapper}>
                <img 
                  src={allImages[currentImageIndex]} 
                  alt={`${listing.title} - ${currentImageIndex + 1}`}
                  className={styles.imageModalImage}
                />
                <div className={styles.imageModalCounter}>
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              </div>
              <Button
                className={styles.imageModalNext}
                icon={<RightOutlined />}
                onClick={handleNextImage}
              />
            </div>
          </div>
        </div>
      )}

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
        </div>

        {/* Booking Card */}
        <div 
          className={`${styles.bookingCard} ${bookingCardStopped ? styles.bookingCardStopped : ''}`}
          ref={bookingCardRef}
          style={bookingCardStopped && reviewsSectionRef.current ? {
            top: `${reviewsSectionRef.current.offsetTop - (bookingCardRef.current?.offsetHeight || 0) - 20}px`
          } : undefined}
        >
          <div className={styles.priceSection}>
            <span className={styles.price}>
              <DollarOutlined /> {listing.price_base.toLocaleString()} {listing.currency}
            </span>
            <span className={styles.priceUnit}>/ đêm</span>
          </div>

          <div className={styles.bookingForm} ref={bookingFormRef}>
            <div 
              className={styles.datePickerSection}
              onClick={() => {
                setDateModalOpen(true);
                setGuestModalOpen(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              <label>Ngày</label>
              <div className={styles.dateDisplay}>
                <Text>{formatDateRange()}</Text>
                <CalendarOutlined />
              </div>
            </div>
            {dateModalOpen && (
              <>
                <div 
                  className={styles.modalBackdrop} 
                  onClick={() => setDateModalOpen(false)}
                />
                <div style={{ position: 'relative', zIndex: 10000 }}>
                  <DatePickerModal
                    visible={dateModalOpen}
                    onClose={() => setDateModalOpen(false)}
                    onSelect={handleDateChange}
                    initialDates={dateRange}
                  />
                </div>
              </>
            )}

            <div 
              className={styles.guestsSection}
              style={{ cursor: 'pointer' }}
            >
              <label>Số khách</label>
              <div 
                className={styles.guestsDisplay}
                onClick={() => {
                  setGuestModalOpen(true);
                  setDateModalOpen(false);
                }}
              >
                <Text>{formatGuests()}</Text>
                <UserOutlined />
              </div>
              {guestModalOpen && (
                <>
                  <div 
                    className={styles.modalBackdrop} 
                    onClick={() => setGuestModalOpen(false)}
                  />
                  <GuestSelector
                    visible={guestModalOpen}
                    onClose={() => setGuestModalOpen(false)}
                    onConfirm={handleGuestChange}
                    initialGuests={guestCounts}
                    maxGuests={listing.guests}
                    allowPets={false}
                  />
                </>
              )}
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

      {/* Reviews Section - Outside grid to span full width */}
      {reviews && reviews.length > 0 && (
        <div className={styles.reviewsSection} ref={reviewsSectionRef}>
          <h2>—</h2>
          
          {/* Overall Rating Summary */}
          <div className={styles.ratingSummary}>
            <div className={styles.ratingDisplay}>
              <div className={styles.ratingNumber}>
                <span className={styles.leafIcon}>🌿</span>
                <span className={styles.ratingValue}>{listing.avg_rating.toFixed(1).replace('.', ',')}</span>
                <span className={styles.leafIcon}>🌿</span>
              </div>
              <p className={styles.lovedByGuests}>Được khách yêu thích</p>
              <p className={styles.topPercentage}>
                Trong số các chỗ ở cho thuê đủ điều kiện dựa trên điểm xếp hạng, lượt đánh giá và độ tin cậy, nhà này nằm trong nhóm <strong>{calculateTopPercentage(listing.avg_rating, listing.review_count)}% chỗ ở hàng đầu</strong>
              </p>
            </div>
          </div>

          {/* Individual Reviews Grid */}
          <div className={styles.reviewsGrid}>
            {reviews.map((review) => {
              const isExpanded = expandedReviews.has(review._id);
              const reviewerName = review.reviewer_id?.name || "Anonymous";
              const hasAvatar = review.reviewer_id?.avatar_url;
              const comment = review.comment || "";
              const shouldShowMore = shouldTruncate(comment);
              const displayComment = shouldShowMore && !isExpanded ? getTruncatedComment(comment) : comment;

              return (
                <div key={review._id} className={styles.reviewItem}>
                  <div className={styles.reviewHeader}>
                    {hasAvatar ? (
                      <img 
                        src={review.reviewer_id?.avatar_url} 
                        alt={reviewerName}
                        className={styles.reviewerAvatar}
                      />
                    ) : (
                      <div className={styles.reviewerAvatarInitials}>
                        {getInitials(reviewerName)}
                      </div>
                    )}
                    <div className={styles.reviewerInfo}>
                      <h4 className={styles.reviewerName}>{reviewerName}</h4>
                      <p className={styles.reviewerActivity}>{getActivityText(review.reviewer_id)}</p>
                    </div>
                  </div>
                  <div className={styles.reviewContent}>
                    <div className={styles.reviewRating}>
                      <Rate disabled value={review.rating} allowHalf />
                      <span className={styles.reviewDate}>
                        {formatVietnameseDate(review.createdAt)}
                      </span>
                    </div>
                    {comment && (
                      <div className={styles.reviewComment}>
                        <p>{displayComment}</p>
                        {shouldShowMore && (
                          <button
                            className={styles.showMoreButton}
                            onClick={() => toggleReviewExpansion(review._id)}
                          >
                            {isExpanded ? "Hiển thị ít hơn" : "Hiển thị thêm"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


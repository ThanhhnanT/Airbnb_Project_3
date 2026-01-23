"use client";

import React, { useState, useEffect, useRef } from "react";
import { Typography, Rate, Space, Tag } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { getListingImages, ListingImage } from "@/service/listings";
import styles from "@/styles/listing-card.module.css";

const { Text, Title } = Typography;

interface Listing {
  _id: string;
  host_id?: {
    _id: string;
    name: string;
    avatar_url?: string;
  };
  title: string;
  description?: string;
  city: string;
  country: string;
  price_base: number;
  currency: string;
  guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  avg_rating: number;
  review_count: number;
  amenities?: string[];
  cover_image?: string | null;
}

interface ListingCardProps {
  listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setImageLoading(true);
        
        // Fetch all images
        const listingImages = await getListingImages(listing._id);
        if (listingImages && listingImages.length > 0) {
          const allImageUrls: string[] = [];
          
          listingImages.forEach((img: ListingImage) => {
            if (img.image_url && Array.isArray(img.image_url)) {
              allImageUrls.push(...img.image_url);
            }
          });

          if (allImageUrls.length > 0) {
            setImages(allImageUrls);
          } else if (listing.cover_image) {
            // Fallback to cover_image if no images from API
            setImages([listing.cover_image]);
          }
        } else if (listing.cover_image) {
          // Use cover_image if API returns no images
          setImages([listing.cover_image]);
        }
      } catch (error) {
        console.error("Error fetching listing images:", error);
        // Fallback to cover_image if available
        if (listing.cover_image) {
          setImages([listing.cover_image]);
        }
      } finally {
        setImageLoading(false);
      }
    };

    fetchImages();
  }, [listing._id, listing.cover_image]);

  // Auto-play carousel when hovered
  useEffect(() => {
    if (isHovered && images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 2000); // Change image every 2 seconds
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isHovered, images.length]);

  const handleCardClick = () => {
    const checkIn = searchParams.get("check_in");
    const checkOut = searchParams.get("check_out");
    const guests = searchParams.get("guests");

    // Nếu không có thông tin tìm kiếm, giữ behavior cũ
    if (!checkIn || !checkOut || !guests) {
      router.push(`/listings/${listing._id}`);
      return;
    }

    const query = new URLSearchParams();
    query.set("checkInDate", checkIn);
    query.set("checkOutDate", checkOut);
    query.set("guests", guests);

    router.push(`/listings/${listing._id}?${query.toString()}`);
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handleDotClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const hasImages = images.length > 0 && !imageLoading;

  return (
    <div
      className={styles.listingCard}
      onClick={handleCardClick}
    >
      <div 
        className={styles.cardImageContainer}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={imageContainerRef}
      >
        {imageLoading ? (
          <div className={styles.cardImagePlaceholder}>
            <HomeOutlined className={styles.cardImageIcon} />
          </div>
        ) : hasImages ? (
          <>
            <div className={styles.imageSlider}>
              {images.map((imageUrl, index) => (
                <div
                  key={index}
                  className={`${styles.slide} ${
                    index === currentImageIndex ? styles.slideActive : ""
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`${listing.title} - Image ${index + 1}`}
                    className={styles.cardImage}
                    onError={(e) => {
                      // Hide broken images
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  className={`${styles.navButton} ${styles.navButtonPrev}`}
                  onClick={handlePrevious}
                  aria-label="Previous image"
                >
                  <LeftOutlined />
                </button>
                <button
                  className={`${styles.navButton} ${styles.navButtonNext}`}
                  onClick={handleNext}
                  aria-label="Next image"
                >
                  <RightOutlined />
                </button>
              </>
            )}

            {/* Dots indicator */}
            {images.length > 1 && (
              <div className={styles.dotsContainer}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.dot} ${
                      index === currentImageIndex ? styles.dotActive : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDotClick(index);
                    }}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className={styles.cardImagePlaceholder}>
            <HomeOutlined className={styles.cardImageIcon} />
          </div>
        )}

        <div 
          className={styles.favoriteButton}
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Handle favorite toggle
          }}
        >
          <svg viewBox="0 0 24 24" className={styles.heartIcon} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <Title level={5} className={styles.cardTitle}>
            {listing.title}
          </Title>
          <div className={styles.cardLocation}>
            <EnvironmentOutlined className={styles.locationIcon} />
            <Text type="secondary" className={styles.locationText}>
              {listing.city}, {listing.country}
            </Text>
          </div>
        </div>

        <div className={styles.cardDetails}>
          <Space size="middle" wrap>
            {listing.guests && (
              <div className={styles.detailItem}>
                <UserOutlined />
                <Text>{listing.guests} khách</Text>
              </div>
            )}
            {listing.bedrooms && (
              <div className={styles.detailItem}>
                <Text>{listing.bedrooms} phòng ngủ</Text>
              </div>
            )}
            {listing.beds && (
              <div className={styles.detailItem}>
                <Text>{listing.beds} giường</Text>
              </div>
            )}
            {listing.bathrooms && (
              <div className={styles.detailItem}>
                <Text>{listing.bathrooms} phòng tắm</Text>
              </div>
            )}
          </Space>
        </div>

        {listing.amenities && listing.amenities.length > 0 && (
          <div className={styles.cardAmenities}>
            <Space size={[4, 8]} wrap>
              {listing.amenities.slice(0, 3).map((amenity, index) => (
                <Tag key={index} className={styles.amenityTag}>
                  {amenity}
                </Tag>
              ))}
              {listing.amenities.length > 3 && (
                <Tag className={styles.amenityTag}>
                  +{listing.amenities.length - 3}
                </Tag>
              )}
            </Space>
          </div>
        )}

        <div className={styles.cardFooter}>
          <div className={styles.cardRating}>
            {listing.avg_rating > 0 ? (
              <>
                <Rate
                  disabled
                  defaultValue={listing.avg_rating}
                  allowHalf
                  className={styles.ratingStars}
                />
                <Text className={styles.ratingText}>
                  {listing.avg_rating.toFixed(1)} ({listing.review_count})
                </Text>
              </>
            ) : (
              <Text type="secondary" className={styles.noRatingText}>
                Mới
              </Text>
            )}
          </div>
          <div className={styles.cardPrice}>
            <Text strong className={styles.priceAmount}>
              {formatPrice(listing.price_base, listing.currency)}
            </Text>
            <Text type="secondary" className={styles.priceUnit}>
              / đêm
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;


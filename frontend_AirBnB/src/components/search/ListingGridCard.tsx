"use client";

import React, { useState, useEffect, useRef } from "react";
import { Typography, Rate, Tag, message } from "antd";
import {
  HomeOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  RightOutlined,
  HeartOutlined,
  HeartFilled,
  StarFilled,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { getListingImages, ListingImage } from "@/service/listings";
import { checkIsFavorite, toggleFavorite } from "@/service/favorites";
import Cookies from "js-cookie";
import styles from "@/styles/listing-grid-card.module.css";

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

interface ListingGridCardProps {
  listing: Listing;
}

const ListingGridCard: React.FC<ListingGridCardProps> = ({ listing }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const isLoggedIn = !!Cookies.get('access_token');

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setImageLoading(true);
        
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
            setImages([listing.cover_image]);
          }
        } else if (listing.cover_image) {
          setImages([listing.cover_image]);
        }
      } catch (error) {
        console.error("Error fetching listing images:", error);
        if (listing.cover_image) {
          setImages([listing.cover_image]);
        }
      } finally {
        setImageLoading(false);
      }
    };

    fetchImages();
  }, [listing._id, listing.cover_image]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isLoggedIn) {
        setIsFavorite(false);
        return;
      }
      try {
        const favoriteStatus = await checkIsFavorite(listing._id);
        setIsFavorite(favoriteStatus);
      } catch (error) {
        setIsFavorite(false);
      }
    };
    checkFavoriteStatus();
  }, [listing._id, isLoggedIn]);

  useEffect(() => {
    if (isHovered && images.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 2000);
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
      className={styles.gridCard}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div 
        className={styles.imageContainer}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={imageContainerRef}
      >
        {imageLoading ? (
          <div className={styles.imagePlaceholder}>
            <HomeOutlined className={styles.imageIcon} />
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
                    className={styles.image}
                    onError={(e) => {
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
          <div className={styles.imagePlaceholder}>
            <HomeOutlined className={styles.imageIcon} />
          </div>
        )}

        {/* Favorite Button */}
        <div 
          className={styles.favoriteButton}
          onClick={async (e) => {
            e.stopPropagation();
            if (!isLoggedIn) {
              message.warning('Vui lòng đăng nhập để thêm vào yêu thích');
              return;
            }
            if (favoriteLoading) return;
            
            setFavoriteLoading(true);
            const previousState = isFavorite;
            
            setIsFavorite(!isFavorite);
            
            try {
              const result = await toggleFavorite(listing._id);
              setIsFavorite(result.isFavorite);
              if (result.isFavorite) {
                message.success('Đã thêm vào yêu thích');
              } else {
                message.success('Đã xóa khỏi yêu thích');
              }
            } catch (error: any) {
              console.error("Error toggling favorite:", error);
              setIsFavorite(previousState);
              const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
              message.error(errorMessage);
            } finally {
              setFavoriteLoading(false);
            }
          }}
        >
          {isFavorite ? (
            <HeartFilled className={styles.heartIcon} style={{ color: '#ff385c', fill: '#ff385c' }} />
          ) : (
            <HeartOutlined className={styles.heartIcon} style={{ color: '#fff' }} />
          )}
        </div>

        {/* Rating Badge */}
        {listing.avg_rating > 0 && (
          <div className={styles.ratingBadge}>
            <StarFilled className={styles.starIcon} />
            <span className={styles.ratingValue}>
              {listing.avg_rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Location */}
        <div className={styles.header}>
          <Title level={5} className={styles.title}>
            {listing.title}
          </Title>
          <div className={styles.location}>
            <EnvironmentOutlined className={styles.locationIcon} />
            <Text type="secondary" className={styles.locationText}>
              {listing.city}
            </Text>
          </div>
        </div>

        {/* Details */}
        <div className={styles.details}>
          {listing.bedrooms && (
            <Text className={styles.detailItem}>
              {listing.bedrooms} phòng ngủ
            </Text>
          )}
          {listing.beds && (
            <Text className={styles.detailItem}>
              {listing.beds} giường
            </Text>
          )}
          {listing.bathrooms && (
            <Text className={styles.detailItem}>
              {listing.bathrooms} phòng tắm
            </Text>
          )}
        </div>

        {/* Price */}
        <div className={styles.footer}>
          <div>
            <Text strong className={styles.priceAmount}>
              {formatPrice(listing.price_base, listing.currency)}
            </Text>
            <Text type="secondary" className={styles.priceUnit}>
              /đêm
            </Text>
          </div>
          {listing.review_count > 0 && (
            <Text className={styles.reviewText}>
              <StarFilled className={styles.reviewStar} />
              {listing.avg_rating.toFixed(1)} ({listing.review_count})
            </Text>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingGridCard;

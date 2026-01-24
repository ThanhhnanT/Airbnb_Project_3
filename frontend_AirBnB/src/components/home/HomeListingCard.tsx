"use client";

import React, { useState, useEffect } from "react";
import { Card, Rate, Typography, message } from "antd";
import { HeartOutlined, HeartFilled, HomeOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { getListingFirstImage } from "@/service/listings";
import { checkIsFavorite, toggleFavorite } from "@/service/favorites";
import Cookies from "js-cookie";
import styles from "@/styles/home-listing-card.module.css";

const { Text } = Typography;

interface HomeListingCardProps {
  listing: {
    _id: string;
    title: string;
    city: string;
    country: string;
    price_base: number;
    currency: string;
    avg_rating: number;
    review_count: number;
    cover_image?: string | null;
  };
}

const HomeListingCard: React.FC<HomeListingCardProps> = ({ listing }) => {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const isLoggedIn = !!Cookies.get('access_token');

  useEffect(() => {
    const fetchImage = async () => {
      try {
        if (listing.cover_image) {
          setImageUrl(listing.cover_image);
          return;
        }
        const url = await getListingFirstImage(listing._id);
        setImageUrl(url);
      } catch (error) {
        console.error("Error fetching image:", error);
      } finally {
        setImageLoading(false);
      }
    };
    fetchImage();
  }, [listing._id]);

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
        // Silently fail if user is not authenticated
        setIsFavorite(false);
      }
    };
    checkFavoriteStatus();
  }, [listing._id, isLoggedIn]);

  const handleCardClick = () => {
    router.push(`/listings/${listing._id}`);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      message.warning('Vui lòng đăng nhập để thêm vào yêu thích');
      return;
    }

    if (favoriteLoading) {
      return; // Prevent multiple clicks
    }

    setFavoriteLoading(true);
    const previousState = isFavorite; // Store previous state for rollback
    
    // Optimistic update
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
      // Rollback on error
      setIsFavorite(previousState);
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
      message.error(errorMessage);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card
      hoverable
      className={styles.listingCard}
      onClick={handleCardClick}
      cover={
        <div className={styles.imageContainer}>
          {imageLoading ? (
            <div className={styles.imagePlaceholder}>
              <HomeOutlined className={styles.placeholderIcon} />
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={listing.title}
              className={styles.listingImage}
              onError={() => {
                setImageUrl(null);
                setImageLoading(false);
              }}
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              <HomeOutlined className={styles.placeholderIcon} />
            </div>
          )}
          <button
            className={styles.favoriteButton}
            onClick={handleFavoriteClick}
            aria-label="Favorite"
            disabled={favoriteLoading}
          >
            {isFavorite ? (
              <HeartFilled className={styles.heartIcon} style={{ color: '#ff385c', fill: '#ff385c' }} />
            ) : (
              <HeartOutlined className={styles.heartIcon} style={{ color: '#222' }} />
            )}
          </button>
        </div>
      }
    >
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <Text strong className={styles.listingTitle}>
            {listing.title}
          </Text>
          <Text type="secondary" className={styles.listingLocation}>
            {listing.city}, {listing.country}
          </Text>
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.ratingSection}>
            {listing.avg_rating > 0 ? (
              <>
                <Rate
                  disabled
                  value={listing.avg_rating}
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
          <div className={styles.priceSection}>
            <Text strong className={styles.priceAmount}>
              {formatPrice(listing.price_base, listing.currency)}
            </Text>
            <Text type="secondary" className={styles.priceUnit}>
              / đêm
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HomeListingCard;


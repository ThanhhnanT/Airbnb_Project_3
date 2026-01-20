"use client";

import React, { useState, useEffect } from "react";
import { Card, Rate, Typography } from "antd";
import { HeartOutlined, HeartFilled, HomeOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { getListingFirstImage } from "@/service/listings";
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

  const handleCardClick = () => {
    router.push(`/listings/${listing._id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // TODO: Implement favorite API call
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
          >
            {isFavorite ? (
              <HeartFilled className={styles.heartIcon} />
            ) : (
              <HeartOutlined className={styles.heartIcon} />
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


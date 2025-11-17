"use client";

import React from "react";
import { Typography, Rate, Space, Tag } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
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
}

interface ListingCardProps {
  listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/listings/${listing._id}`);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div
      className={styles.listingCard}
      onClick={handleCardClick}
    >
      <div className={styles.cardImageContainer}>
        <div className={styles.cardImagePlaceholder}>
          <HomeOutlined className={styles.cardImageIcon} />
        </div>
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


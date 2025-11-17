"use client";

import React, { useCallback, useMemo } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Card } from "antd";
import styles from "@/styles/map-view.module.css";

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
  latitude?: number;
  longitude?: number;
  guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  avg_rating: number;
  review_count: number;
  amenities?: string[];
}

interface MapViewProps {
  listings: Listing[];
  center?: { lat: number; lng: number };
  onMarkerClick?: (listing: Listing) => void;
  selectedListingId?: string;
}

const MapView: React.FC<MapViewProps> = ({
  listings,
  center,
  onMarkerClick,
  selectedListingId,
}) => {
  const [selectedMarker, setSelectedMarker] = React.useState<Listing | null>(null);

  // Default center (Ho Chi Minh City)
  const defaultCenter = useMemo(
    () => center || { lat: 10.7769, lng: 106.7009 },
    [center]
  );

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      clickableIcons: true,
      scrollwheel: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    }),
    []
  );

  const handleMarkerClick = useCallback(
    (listing: Listing) => {
      setSelectedMarker(listing);
      if (onMarkerClick) {
        onMarkerClick(listing);
      }
    },
    [onMarkerClick]
  );

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get Google Maps API key from environment variable
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!apiKey) {
    return (
      <div className={styles.mapContainer}>
        <Card className={styles.mapPlaceholder}>
          <p>Vui lòng cấu hình NEXT_PUBLIC_GOOGLE_MAPS_API_KEY trong file .env</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerClassName={styles.map}
          center={defaultCenter}
          zoom={listings.length > 0 ? 12 : 10}
          options={mapOptions}
        >
          {listings.map((listing) => {
            if (!listing.latitude || !listing.longitude) return null;

            const iconUrl = selectedListingId === listing._id
              ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
              : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";

            return (
              <Marker
                key={listing._id}
                position={{ lat: listing.latitude, lng: listing.longitude }}
                onClick={() => handleMarkerClick(listing)}
                icon={iconUrl}
              >
                {selectedMarker?._id === listing._id && (
                  <InfoWindow
                    onCloseClick={() => setSelectedMarker(null)}
                    position={{ lat: listing.latitude, lng: listing.longitude }}
                  >
                    <div className={styles.infoWindow}>
                      <h3 className={styles.infoTitle}>{listing.title}</h3>
                      <p className={styles.infoLocation}>
                        {listing.city}, {listing.country}
                      </p>
                      {listing.avg_rating > 0 && (
                        <p className={styles.infoRating}>
                          ⭐ {listing.avg_rating.toFixed(1)} ({listing.review_count})
                        </p>
                      )}
                      <p className={styles.infoPrice}>
                        {formatPrice(listing.price_base, listing.currency)} / đêm
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            );
          })}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default MapView;


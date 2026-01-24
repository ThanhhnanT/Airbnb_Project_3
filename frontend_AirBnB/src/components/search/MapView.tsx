"use client";

import React, { useCallback, useMemo, useState } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, Alert } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
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
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Filter listings with valid coordinates
  const listingsWithCoords = useMemo(() => {
    console.log('=== MAPVIEW DEBUG ===');
    console.log('Total listings received:', listings.length);
    console.log('Listings data:', listings);
    
    const filtered = listings.filter((listing) => {
      const hasLat = listing.latitude !== undefined && listing.latitude !== null;
      const hasLng = listing.longitude !== undefined && listing.longitude !== null;
      const isValidLat = hasLat && !isNaN(Number(listing.latitude));
      const isValidLng = hasLng && !isNaN(Number(listing.longitude));
      
      const isValid = isValidLat && isValidLng;
      
      if (!isValid) {
        console.warn('Invalid listing coordinates:', {
          id: listing._id,
          title: listing.title,
          latitude: listing.latitude,
          longitude: listing.longitude,
          hasLat,
          hasLng,
          isValidLat,
          isValidLng
        });
      }
      
      return isValid;
    });
    
    // Debug log
    console.log(`MapView: ${filtered.length}/${listings.length} listings có tọa độ hợp lệ`);
    if (filtered.length > 0) {
      console.log('Listings với tọa độ hợp lệ:', filtered.map(l => ({
        id: l._id,
        title: l.title,
        lat: l.latitude,
        lng: l.longitude
      })));
    } else {
      console.warn('MapView: Không có listings nào có tọa độ hợp lệ');
      console.log('Tất cả listings:', listings.map(l => ({
        id: l._id,
        title: l.title,
        latitude: l.latitude,
        longitude: l.longitude,
        latType: typeof l.latitude,
        lngType: typeof l.longitude
      })));
    }
    console.log('=== END MAPVIEW DEBUG ===');
    
    return filtered;
  }, [listings]);

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

  // Create custom marker icon with label background
  const createMarkerIcon = useCallback((title: string, isSelected: boolean) => {
    // Don't check for google.maps here - just create SVG icon
    // The icon will work regardless of Google Maps API status

    // Truncate title for display
    const displayTitle = title.length > 18 ? title.substring(0, 18) + '...' : title;
    
    // Create SVG for marker with text
    const bgColor = isSelected ? '#FF385C' : '#008489';
    const svg = `
      <svg width="120" height="50" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        <!-- Rounded rectangle background -->
        <rect x="5" y="5" width="110" height="35" rx="8" fill="${bgColor}" filter="url(#shadow)"/>
        <!-- Triangle pointer -->
        <polygon points="55,40 45,50 65,50" fill="${bgColor}"/>
        <!-- Text -->
        <text x="60" y="28" font-family="Arial, sans-serif" font-size="11" font-weight="bold" 
              fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">
          ${displayTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </text>
      </svg>
    `;

    // Use object literal format - works with both old and new Google Maps API
    // Google Maps API accepts object literals with width/height for Size
    // and x/y for Point
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: {
        width: 120,
        height: 50,
      },
      anchor: {
        x: 60,
        y: 50,
      },
    };
  }, []);

  const fitMapBounds = useCallback(() => {
    if (!mapRef.current || listingsWithCoords.length === 0) return;
    
    // Check if Google Maps API is available
    if (typeof window === 'undefined' || typeof google === 'undefined' || !google.maps) {
      console.warn('Cannot fit bounds: Google Maps API not loaded yet');
      return;
    }

    try {
      // If only one marker, set zoom to 15
      if (listingsWithCoords.length === 1) {
        const listing = listingsWithCoords[0];
        if (listing.latitude && listing.longitude) {
          mapRef.current.setCenter({
            lat: listing.latitude,
            lng: listing.longitude,
          });
          mapRef.current.setZoom(15);
        }
      } else {
        // Fit bounds for multiple markers
        const bounds = new google.maps.LatLngBounds();
        listingsWithCoords.forEach((listing) => {
          if (listing.latitude && listing.longitude) {
            bounds.extend({
              lat: listing.latitude,
              lng: listing.longitude,
            });
          }
        });
        // Add padding to bounds
        mapRef.current.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      console.error('Error fitting map bounds:', error);
    }
  }, [listingsWithCoords]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    console.log('Map loaded successfully');
    mapRef.current = map;
    setIsMapLoaded(true);
    setMapError(null);

    // Trigger resize to fix positioning issues
    setTimeout(() => {
      if (map && typeof google !== 'undefined' && google.maps) {
        try {
          google.maps.event.trigger(map, 'resize');
        } catch (error) {
          console.warn('Error triggering resize:', error);
        }
      }
    }, 100);

    // Fit bounds to show all markers
    if (listingsWithCoords.length > 0) {
      setTimeout(() => {
        fitMapBounds();
      }, 200);
    } else if (center) {
      // Use provided center if no bounds
      setTimeout(() => {
        try {
          map.setCenter(center);
          map.setZoom(12);
        } catch (error) {
          console.warn('Error setting map center:', error);
        }
      }, 200);
    }
  }, [listingsWithCoords, center, fitMapBounds]);

  // Update map bounds when listings change
  React.useEffect(() => {
    if (isMapLoaded && listingsWithCoords.length > 0) {
      // Small delay to ensure markers are rendered
      const timer = setTimeout(() => {
        fitMapBounds();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [listingsWithCoords, isMapLoaded, fitMapBounds]);

  const handleMapError = useCallback((error: Error) => {
    console.error("Google Maps error:", error);
    setMapError("Unknown");
  }, []);

  // Show error message if map failed to load
  if (mapError) {
    return (
      <div className={styles.mapContainer}>
        <Card className={styles.mapPlaceholder}>
          <Alert
            message="Lỗi tải Google Maps"
            description="Đã xảy ra lỗi khi tải Google Maps. Vui lòng thử lại sau."
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
          />
        </Card>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.mapContainer}>
      <GoogleMap
        mapContainerClassName={styles.map}
        center={defaultCenter}
        zoom={listingsWithCoords.length > 0 ? 12 : 10}
        options={mapOptions}
        onLoad={handleMapLoad}
        onUnmount={() => {
          if (mapRef.current) {
            mapRef.current = null;
          }
          setIsMapLoaded(false);
        }}
      >
        {listingsWithCoords.map((listing) => {
          if (!listing.latitude || !listing.longitude) return null;

          const isSelected = selectedListingId === listing._id;
          const markerIcon = createMarkerIcon(listing.title, isSelected);

          return (
            <Marker
              key={listing._id}
              position={{ lat: listing.latitude, lng: listing.longitude }}
              onClick={() => handleMarkerClick(listing)}
              icon={markerIcon}
              title={listing.title}
              animation={isSelected && typeof google !== 'undefined' && google.maps ? google.maps.Animation.BOUNCE : undefined}
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
    </div>
  );
};

export default MapView;


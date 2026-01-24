"use client";

import React, { useCallback, useMemo, useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, Alert, Button, Spin } from "antd";
import { ReloadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
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
  const [isScriptLoading, setIsScriptLoading] = useState(true);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const hasInitializedRef = React.useRef(false);
  const remountKeyRef = React.useRef(0);

  // Reset state when component mounts (e.g., when coming back from detail page)
  React.useEffect(() => {
    // Reset refs
    scriptLoadCheckedRef.current = false;
    mapLoadProcessedRef.current = false;
    if (scriptCheckTimerRef.current) {
      clearTimeout(scriptCheckTimerRef.current);
      scriptCheckTimerRef.current = null;
    }
    
    // Reset map states
    setIsMapLoaded(false);
    setMapError(null);
    setSelectedMarker(null);
    mapRef.current = null;
    
    // Check if Google Maps script is already loaded (with safe check)
    try {
      if (typeof window !== 'undefined' && 
          typeof google !== 'undefined' && 
          google && 
          google.maps) {
        console.log('Google Maps already loaded, skipping script reload');
        setIsScriptLoading(false);
        scriptLoadCheckedRef.current = true;
      } else {
        console.log('Google Maps not loaded, will load script');
        setIsScriptLoading(true);
      }
    } catch (error) {
      console.log('Error checking Google Maps:', error);
      console.log('Will load script');
      setIsScriptLoading(true);
    }
    
    // Increment remount key only once on mount
    if (remountKeyRef.current === 0) {
      remountKeyRef.current = 1;
    }
    
    // Cleanup on unmount
    return () => {
      if (scriptCheckTimerRef.current) {
        clearTimeout(scriptCheckTimerRef.current);
        scriptCheckTimerRef.current = null;
      }
      scriptLoadCheckedRef.current = false;
    };
  }, []); // Only run on mount/unmount

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

  const scriptLoadCheckedRef = React.useRef(false);
  const scriptCheckTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const handleScriptLoad = useCallback(() => {
    // Prevent multiple calls
    if (scriptLoadCheckedRef.current) {
      console.log('LoadScript onLoad already processed, skipping');
      return;
    }
    
    console.log('LoadScript onLoad callback triggered');
    scriptLoadCheckedRef.current = true;
    setIsScriptLoading(false);
    
    // Clear any existing timer
    if (scriptCheckTimerRef.current) {
      clearTimeout(scriptCheckTimerRef.current);
      scriptCheckTimerRef.current = null;
    }
    
    // Check if script is actually loaded (with safe check)
    const checkAPIReady = () => {
      try {
        if (typeof window !== 'undefined' && 
            typeof google !== 'undefined' && 
            google && 
            google.maps) {
          console.log('Google Maps API is ready');
          return true;
        }
      } catch (error) {
        console.warn('Error checking Google Maps API:', error);
      }
      return false;
    };
    
    // Check immediately
    if (checkAPIReady()) {
      return;
    }
    
    // Try again after a delay (script might load asynchronously)
    scriptCheckTimerRef.current = setTimeout(() => {
      if (checkAPIReady()) {
        return;
      }
      console.error('Google Maps API still not available after delay');
      setMapError("Unknown");
      scriptCheckTimerRef.current = null;
    }, 1000);
  }, []);

  const mapLoadProcessedRef = React.useRef(false);
  
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    // Prevent multiple calls
    if (mapLoadProcessedRef.current && mapRef.current === map) {
      console.log('Map already loaded, skipping');
      return;
    }
    
    console.log('Map loaded successfully');
    mapLoadProcessedRef.current = true;
    mapRef.current = map;
    setIsMapLoaded(true);
    setMapError(null);
    setIsScriptLoading(false);

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

  // Fix map resize when component remounts (e.g., coming back from detail page)
  React.useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    // Trigger resize after a short delay to ensure container is fully rendered
    const resizeTimer = setTimeout(() => {
      if (mapRef.current && typeof google !== 'undefined' && google.maps) {
        google.maps.event.trigger(mapRef.current, 'resize');
        // Re-center map after resize
        if (listingsWithCoords.length > 0) {
          fitMapBounds();
        } else if (center) {
          mapRef.current.setCenter(center);
        }
      }
    }, 300);

    return () => clearTimeout(resizeTimer);
  }, [isMapLoaded, listingsWithCoords, center, fitMapBounds]);

  // Handle window resize and container resize
  React.useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;

    const handleResize = () => {
      if (mapRef.current && typeof google !== 'undefined' && google.maps) {
        google.maps.event.trigger(mapRef.current, 'resize');
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver to watch container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [isMapLoaded]);

  const handleMapError = useCallback((error: Error) => {
    console.error("Google Maps error:", error);
    setIsMapLoaded(false);
    setIsScriptLoading(false);
    
    // Check for specific error types
    if (error.message?.includes("BillingNotEnabled") || error.message?.includes("billing")) {
      setMapError("BillingNotEnabled");
    } else if (error.message?.includes("InvalidKey") || error.message?.includes("API key")) {
      setMapError("InvalidKey");
    } else {
      setMapError("Unknown");
    }
  }, []);

  const handleScriptError = useCallback((error: Error) => {
    console.error("Google Maps script error:", error);
    setIsScriptLoading(false);
    setMapError("Unknown");
  }, []);

  // Get Google Maps API key from environment variable
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // Timeout for script loading (10 seconds) - MUST be before any early returns
  React.useEffect(() => {
    // Skip if already loaded or has error
    if (!isScriptLoading || isMapLoaded || mapError) {
      return;
    }

    // Check if script is already loaded (with safe check)
    const checkScriptLoaded = () => {
      try {
        if (typeof window !== 'undefined' && 
            typeof google !== 'undefined' && 
            google && 
            google.maps) {
          console.log('Google Maps script already loaded, setting loading to false');
          setIsScriptLoading(false);
          return true;
        }
      } catch (error) {
        console.warn('Error checking Google Maps script:', error);
      }
      return false;
    };

    // Check immediately
    if (checkScriptLoaded()) {
      return;
    }

    // Set up timeout and periodic check
    let checkInterval: NodeJS.Timeout | null = null;
    let timeout: NodeJS.Timeout | null = null;

    // Check periodically in case script loads asynchronously
    checkInterval = setInterval(() => {
      if (checkScriptLoaded()) {
        if (checkInterval) clearInterval(checkInterval);
        if (timeout) clearTimeout(timeout);
      }
    }, 500);

    timeout = setTimeout(() => {
      console.warn('Google Maps script loading timeout after 10 seconds');
      if (checkInterval) clearInterval(checkInterval);
      setIsScriptLoading(false);
      setMapError("Unknown");
    }, 10000); // 10 seconds timeout

    return () => {
      if (timeout) clearTimeout(timeout);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isScriptLoading, isMapLoaded, mapError]);

  // Early returns MUST be after all hooks
  if (!apiKey) {
    return (
      <div className={styles.mapContainer}>
        <Card className={styles.mapPlaceholder}>
          <Alert
            message="Thiếu API Key"
            description={
              <div>
                <p>Vui lòng cấu hình NEXT_PUBLIC_GOOGLE_MAPS_API_KEY trong file .env</p>
                <p style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  Ví dụ: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
                </p>
              </div>
            }
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
          />
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isScriptLoading) {
    return (
      <div className={styles.mapContainer}>
        <Card className={styles.mapPlaceholder}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: '#666' }}>Đang tải Google Maps...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Show error message if map failed to load
  if (mapError) {
    return (
      <div className={styles.mapContainer}>
        <Card className={styles.mapPlaceholder}>
          <Alert
            message={
              mapError === "BillingNotEnabled"
                ? "Google Maps API cần bật Billing"
                : mapError === "InvalidKey"
                ? "API Key không hợp lệ"
                : "Lỗi tải Google Maps"
            }
            description={
              <div>
                {mapError === "BillingNotEnabled" && (
                  <div>
                    <p>Google Maps API yêu cầu bật Billing trong Google Cloud Console.</p>
                    <ol style={{ marginTop: 8, paddingLeft: 20 }}>
                      <li>Truy cập <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
                      <li>Chọn project của bạn</li>
                      <li>Vào "Billing" và bật billing account</li>
                      <li>Đảm bảo "Maps JavaScript API" đã được enable</li>
                    </ol>
                  </div>
                )}
                {mapError === "InvalidKey" && (
                  <div>
                    <p>API Key không hợp lệ hoặc chưa được kích hoạt.</p>
                    <ol style={{ marginTop: 8, paddingLeft: 20 }}>
                      <li>Kiểm tra API Key trong file .env</li>
                      <li>Đảm bảo "Maps JavaScript API" đã được enable trong Google Cloud Console</li>
                      <li>Kiểm tra API Key restrictions (nếu có)</li>
                    </ol>
                  </div>
                )}
                {mapError === "Unknown" && (
                  <p>Đã xảy ra lỗi khi tải Google Maps. Vui lòng thử lại sau.</p>
                )}
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setMapError(null);
                    setIsMapLoaded(false);
                    window.location.reload();
                  }}
                  style={{ marginTop: 12 }}
                >
                  Thử lại
                </Button>
              </div>
            }
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
          />
        </Card>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={styles.mapContainer}
      key={`map-container-${remountKeyRef.current}`}
    >
      {!isScriptLoading && !mapError && apiKey ? (
        <LoadScript 
          key={`loadscript-${remountKeyRef.current}-${apiKey?.substring(0, 10)}`}
          googleMapsApiKey={apiKey}
          onLoad={handleScriptLoad}
          onError={handleScriptError}
          loadingElement={
            <div className={styles.mapContainer}>
              <Card className={styles.mapPlaceholder}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                  <p style={{ marginTop: 16, color: '#666' }}>Đang tải Google Maps...</p>
                </div>
              </Card>
            </div>
          }
        >
          <GoogleMap
            key={`google-map-${remountKeyRef.current}`}
            mapContainerClassName={styles.map}
            center={defaultCenter}
            zoom={listingsWithCoords.length > 0 ? 12 : 10}
            options={mapOptions}
            onLoad={handleMapLoad}
            onUnmount={() => {
              // Cleanup when unmounting
              console.log('GoogleMap unmounting, cleaning up');
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
        </LoadScript>
      ) : null}
    </div>
  );
};

export default MapView;


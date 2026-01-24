"use client";

import React, { useCallback, useState, useEffect } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Card, Alert, Spin } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import styles from "./listing-map.module.css";

interface ListingMapProps {
  latitude: number;
  longitude: number;
  title: string;
  address?: string;
}

const ListingMap: React.FC<ListingMapProps> = ({
  latitude,
  longitude,
  title,
  address,
}) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = React.useRef<google.maps.Map | null>(null);

  // Check if Google Maps is already loaded and ready
  useEffect(() => {
    const checkGoogleMapsReady = () => {
      if (typeof window !== "undefined" && typeof google !== "undefined" && google.maps) {
        setIsMapReady(true);
      }
    };

    // Check immediately
    checkGoogleMapsReady();

    // Also check after a short delay in case it's loading
    const timer = setTimeout(checkGoogleMapsReady, 100);

    // Listen for when Google Maps becomes available
    const interval = setInterval(checkGoogleMapsReady, 100);
    const clearTimer = setTimeout(() => clearInterval(interval), 5000); // Stop checking after 5 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      clearTimeout(clearTimer);
    };
  }, []);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapError(null);
  }, []);

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  };

  const center = { lat: latitude, lng: longitude };

  return (
    <div className={styles.mapContainer}>
      <h2 className={styles.mapTitle}>Nơi bạn sẽ đến</h2>
      {address && (
        <p className={styles.mapAddress}>
          <EnvironmentOutlined /> {address}
        </p>
      )}
      <Card className={styles.mapCard}>
        {mapError ? (
          <Alert message={mapError} type="error" />
        ) : !isMapReady ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
            <Spin tip="Đang tải bản đồ..." />
          </div>
        ) : (
          <GoogleMap
            mapContainerClassName={styles.map}
            center={center}
            zoom={15}
            options={mapOptions}
            onLoad={handleMapLoad}
          >
            <Marker
              position={center}
              title={title}
              animation={typeof google !== "undefined" && google.maps ? google.maps.Animation.DROP : undefined}
            />
          </GoogleMap>
        )}
      </Card>
    </div>
  );
};

export default ListingMap;

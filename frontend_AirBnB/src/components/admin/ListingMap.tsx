"use client";

import { useCallback, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { Alert } from "antd";

interface ListingMapProps {
  latitude?: number;
  longitude?: number;
  apiKey: string;
}

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

export default function ListingMapComponent({ latitude, longitude, apiKey }: ListingMapProps) {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setIsMapLoaded(true);
    setMapError(null);
  }, []);

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  };

  if (!latitude || !longitude) {
    return (
      <div
        style={{
          width: "100%",
          height: "300px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <span style={{ color: "#999" }}>Không có tọa độ</span>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div style={{ padding: "16px" }}>
        <Alert
          message="Google Maps API Key không được cấu hình"
          description="Vui lòng cấu hình NEXT_PUBLIC_GOOGLE_MAPS_API_KEY trong file .env"
          type="warning"
        />
      </div>
    );
  }

  const center = { lat: latitude, lng: longitude };

  return (
    <div style={{ width: "100%", marginTop: 16 }}>
      {mapError ? (
        <Alert message={mapError} type="error" />
      ) : (
        <LoadScript
          googleMapsApiKey={apiKey}
          libraries={GOOGLE_MAPS_LIBRARIES}
          onLoad={() => setIsMapLoaded(true)}
          onError={(error) => {
            console.error("Google Maps script error:", error);
            setMapError("Không thể tải Google Maps. Vui lòng kiểm tra API key.");
          }}
        >
          <div style={{ width: "100%", height: "300px", borderRadius: "4px", overflow: "hidden" }}>
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={center}
              zoom={15}
              options={mapOptions}
              onLoad={handleMapLoad}
            >
              <Marker position={center} />
            </GoogleMap>
          </div>
        </LoadScript>
      )}
    </div>
  );
}

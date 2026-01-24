"use client";

import { useMemo, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { Spin } from "antd";

interface ListingMapProps {
  latitude?: number;
  longitude?: number;
  apiKey: string;
}

export default function ListingMapComponent({ latitude, longitude, apiKey }: ListingMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const defaultCenter = useMemo(() => ({ lat: latitude || 40.7128, lng: longitude || -74.006 }), [latitude, longitude]);

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
        <span style={{ color: "#999" }}>Google Maps API key chưa được cấu hình</span>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} onLoad={() => setMapLoaded(true)}>
      <div style={{ position: "relative", width: "100%", height: "300px" }}>
        {!mapLoaded && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f5f5f5",
              zIndex: 1,
            }}
          >
            <Spin />
          </div>
        )}
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={defaultCenter}
          zoom={15}
          onLoad={() => setMapLoaded(true)}
        >
          <Marker position={{ lat: latitude, lng: longitude }} />
        </GoogleMap>
      </div>
    </LoadScript>
  );
}

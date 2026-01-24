"use client";

import { useMemo } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

interface ListingMapProps {
  latitude?: number;
  longitude?: number;
  apiKey: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

export default function ListingMapComponent({ latitude, longitude, apiKey }: ListingMapProps) {
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
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultCenter} zoom={15}>
        <Marker position={{ lat: latitude, lng: longitude }} />
      </GoogleMap>
    </LoadScript>
  );
}

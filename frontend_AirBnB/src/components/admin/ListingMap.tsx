"use client";

import { useMemo } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

interface ListingMapProps {
  latitude?: number;
  longitude?: number;
  apiKey: string;
}

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
        <span style={{ color: "#999" }}>No coordinates available</span>
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
        <span style={{ color: "#999" }}>Google Maps API key not configured</span>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "300px" }}
        center={defaultCenter}
        zoom={15}
      >
        <Marker position={{ lat: latitude, lng: longitude }} />
      </GoogleMap>
    </LoadScript>
  );
}

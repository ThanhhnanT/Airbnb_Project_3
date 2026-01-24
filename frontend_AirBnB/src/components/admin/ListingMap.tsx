"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";

interface ListingMapProps {
  latitude?: number;
  longitude?: number;
}

export default function ListingMapComponent({ latitude, longitude }: ListingMapProps) {
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

  const center = { lat: latitude, lng: longitude };

  return (
    <div style={{ width: "100%", height: "300px", borderRadius: "4px", overflow: "hidden" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={15}
      >
        <Marker position={center} />
      </GoogleMap>
    </div>
  );
}

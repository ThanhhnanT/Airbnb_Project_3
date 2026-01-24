"use client";

import React from "react";
import { LoadScript } from "@react-google-maps/api";

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // If no API key, skip LoadScript
  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      {children}
    </LoadScript>
  );
};

export default GoogleMapsProvider;

"use client";

import React from "react";
import { LoadScript } from "@react-google-maps/api";
import { Spin, Card } from "antd";

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
    <LoadScript
      googleMapsApiKey={apiKey}
      loadingElement={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <Card style={{ padding: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <Spin size="large" />
              <p style={{ marginTop: 16, color: '#666' }}>Đang tải Google Maps...</p>
            </div>
          </Card>
        </div>
      }
    >
      {children}
    </LoadScript>
  );
};

export default GoogleMapsProvider;

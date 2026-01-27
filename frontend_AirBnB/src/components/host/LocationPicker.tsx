"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Card, Alert, Input, Spin } from "antd";
import { EnvironmentOutlined, SearchOutlined } from "@ant-design/icons";

// Define libraries as a constant outside component to avoid re-renders
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: {
    street?: string;
    city: string;
    country: string;
    postal_code?: string;
  }) => void;
  initialLat?: number;
  initialLng?: number;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLat,
  initialLng,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [address, setAddress] = useState<{
    street?: string;
    city: string;
    country: string;
    postal_code?: string;
  }>({ city: "", country: "" });

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isScriptLoading, setIsScriptLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchAddress, setSearchAddress] = useState("");
  const [placesLoaded, setPlacesLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);

  // Check if Google Maps is already loaded (from GoogleMapsProvider)
  useEffect(() => {
    const checkGoogleMapsReady = () => {
      if (typeof window !== "undefined" && typeof google !== "undefined" && google.maps) {
        console.log("Google Maps already loaded, setting states");
        setIsMapLoaded(true);
        setIsScriptLoading(false);
        
        // Check for places library (loaded by GoogleMapsProvider)
        if (google.maps.places) {
          console.log("Places library found");
          setPlacesLoaded(true);
        } else {
          console.warn("Places library not available yet, will check again");
          // Check again after a short delay
          setTimeout(() => {
            if (google.maps.places) {
              console.log("Places library found on retry");
              setPlacesLoaded(true);
            }
          }, 500);
        }
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkGoogleMapsReady()) {
      return; // Already loaded, no need to check periodically
    }

    // Check periodically if not ready yet (GoogleMapsProvider might still be loading)
    const interval = setInterval(() => {
      if (checkGoogleMapsReady()) {
        clearInterval(interval);
      }
    }, 100);
    
    // Stop checking after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isMapLoaded) {
        console.error("Google Maps failed to load after 10 seconds");
        setMapError("Không thể tải Google Maps. Vui lòng kiểm tra API key.");
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isMapLoaded]);

  // Update selectedLocation when initialLat/initialLng change
  useEffect(() => {
    if (initialLat && initialLng) {
      const location = { lat: initialLat, lng: initialLng };
      setSelectedLocation(location);
      // Reverse geocode to get address
      reverseGeocode(initialLat, initialLng);
    }
  }, [initialLat, initialLng]);

  const defaultCenter = selectedLocation || { lat: 10.7769, lng: 106.7009 }; // Ho Chi Minh City default

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=vi`,
        {
          headers: {
            'User-Agent': 'AirBnB-App'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      const addr = data.address || {};

      const addressData = {
        street: addr.road ? `${addr.house_number || ''} ${addr.road}`.trim() : addr.address29 || '',
        city: addr.city || addr.town || addr.municipality || addr.county || addr.state_district || '',
        country: addr.country || '',
        postal_code: addr.postcode || '',
      };

      // Update search address display
      const formattedAddress = `${addressData.street ? addressData.street + ', ' : ''}${addressData.city}, ${addressData.country}`;
      setSearchAddress(formattedAddress);

      setAddress(addressData);
      onLocationSelect(lat, lng, addressData);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setAddress({ city: "", country: "" });
    }
  };

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const location = { lat, lng };
      setSelectedLocation(location);
      reverseGeocode(lat, lng);
    }
  }, []);

  // Initialize Autocomplete when places library is loaded (using legacy API for compatibility)
  useEffect(() => {
    console.log("Autocomplete useEffect triggered", {
      placesLoaded,
      hasInputRef: !!autocompleteInputRef.current,
      hasGoogle: typeof google !== "undefined",
      hasMaps: typeof google !== "undefined" && !!google.maps,
      hasPlaces: typeof google !== "undefined" && !!google.maps?.places,
    });

    if (placesLoaded && autocompleteInputRef.current && typeof google !== "undefined" && google.maps && google.maps.places) {
      console.log("Initializing Autocomplete...");
      
      // Cleanup previous autocomplete if exists
      if (autocompleteRef.current) {
        console.log("Cleaning up previous autocomplete");
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }

      try {
        const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
          types: ["geocode", "establishment"],
          componentRestrictions: { country: [] },
          fields: ["geometry", "address_components", "formatted_address", "name"],
        });
        
        console.log("Autocomplete created successfully", autocomplete);

        autocomplete.addListener("place_changed", () => {
          console.log("Place changed event triggered");
          const place = autocomplete.getPlace();
          console.log("Selected place:", place);
          
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const location = { lat, lng };

            setSelectedLocation(location);
            
            // Pan map to selected location
            if (mapRef.current) {
              mapRef.current.panTo(location);
              mapRef.current.setZoom(15);
            }

            // Extract address components
            const addressComponents = place.address_components || [];
            const addressData: {
              street?: string;
              city: string;
              country: string;
              postal_code?: string;
            } = {
              city: "",
              country: "",
            };

            let streetNumber = "";
            let route = "";

            addressComponents.forEach((component) => {
              const types = component.types;
              if (types.includes("street_number")) {
                streetNumber = component.long_name;
              } else if (types.includes("route")) {
                route = component.long_name;
              } else if (types.includes("locality") || types.includes("administrative_area_level_2")) {
                addressData.city = component.long_name;
              } else if (types.includes("country")) {
                addressData.country = component.long_name;
              } else if (types.includes("postal_code")) {
                addressData.postal_code = component.long_name;
              }
            });

            // Combine street number and route
            if (streetNumber && route) {
              addressData.street = `${streetNumber} ${route}`;
            } else if (route) {
              addressData.street = route;
            } else if (streetNumber) {
              addressData.street = streetNumber;
            }

            // Fallback to formatted address if components are missing
            if (!addressData.city && place.formatted_address) {
              const parts = place.formatted_address.split(",");
              if (parts.length > 0) {
                addressData.city = parts[parts.length - 2]?.trim() || "";
                addressData.country = parts[parts.length - 1]?.trim() || "";
              }
            }

            setAddress(addressData);
            setSearchAddress(place.formatted_address || "");
            onLocationSelect(lat, lng, addressData);
          } else {
            console.warn("Place has no geometry:", place);
          }
        });

        autocompleteRef.current = autocomplete;
        console.log("Autocomplete initialized and stored in ref");
      } catch (error) {
        console.error("Error creating Autocomplete:", error);
      }

      // Cleanup on unmount
      return () => {
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    }
  }, [placesLoaded, onLocationSelect]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setIsMapLoaded(true);
    setIsScriptLoading(false);
  }, []);

  const handleAddressChange = (field: string, value: string) => {
    const newAddress = { ...address, [field]: value };
    setAddress(newAddress);
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng, newAddress);
    }
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!apiKey) {
    return (
      <Card>
        <Alert
          message="Google Maps API Key Missing"
          description="Vui lòng cấu hình NEXT_PUBLIC_GOOGLE_MAPS_API_KEY trong file .env"
          type="error"
        />
      </Card>
    );
  }

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  };

  return (
    <div style={{ width: "100%" }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 8 }}>
            <EnvironmentOutlined /> Chọn vị trí trên bản đồ
          </h3>
        </div>

        {/* Search Input with Google Places Autocomplete */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <SearchOutlined 
                style={{ 
                  position: "absolute", 
                  left: "12px", 
                  zIndex: 2,
                  color: "#bfbfbf",
                  fontSize: "16px",
                  pointerEvents: "none"
                }} 
              />
              {/* Native HTML input for Autocomplete */}
              <input
                ref={autocompleteInputRef}
                type="text"
                placeholder="Tìm kiếm địa chỉ (ví dụ: 123 Nguyễn Huệ, Quận 1, TP.HCM)"
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 40px",
                  fontSize: "16px",
                  border: "1px solid #d9d9d9",
                  borderRadius: "6px",
                  outline: "none",
                  transition: "all 0.3s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#40a9ff";
                  e.target.style.boxShadow = "0 0 0 2px rgba(24, 144, 255, 0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d9d9d9";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16, height: "400px", position: "relative" }}>
          {mapError ? (
            <Alert message={mapError} type="error" />
          ) : (() => {
            // Check if Google Maps is available (should be loaded by GoogleMapsProvider)
            const isGoogleMapsReady = typeof window !== "undefined" && 
                                     typeof google !== "undefined" && 
                                     google.maps;
            
            console.log("Map render check:", {
              isScriptLoading,
              isMapLoaded,
              isGoogleMapsReady,
              hasGoogle: typeof google !== "undefined",
              hasMaps: typeof google !== "undefined" && !!google.maps,
            });

            // Show map if Google Maps is ready (don't wait for Places library)
            if (isGoogleMapsReady || isMapLoaded) {
              return (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={defaultCenter}
                  zoom={selectedLocation ? 15 : 10}
                  options={mapOptions}
                  onLoad={handleMapLoad}
                  onClick={handleMapClick}
                >
                  {selectedLocation && (
                    <Marker
                      position={selectedLocation}
                      title="Vị trí đã chọn"
                    />
                  )}
                </GoogleMap>
              );
            }

            // Show loading indicator
            return (
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                height: "100%",
                flexDirection: "column",
                gap: "16px"
              }}>
                <Spin size="large" />
                <div style={{ color: "#666", fontSize: "14px" }}>Đang tải bản đồ...</div>
              </div>
            );
          })()}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            placeholder="Địa chỉ đường"
            value={address.street || ""}
            onChange={(e) => handleAddressChange("street", e.target.value)}
            prefix={<EnvironmentOutlined />}
          />
          <div style={{ display: "flex", gap: 16 }}>
            <Input
              placeholder="Thành phố *"
              value={address.city}
              onChange={(e) => handleAddressChange("city", e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <Input
              placeholder="Quốc gia *"
              value={address.country}
              onChange={(e) => handleAddressChange("country", e.target.value)}
              required
              style={{ flex: 1 }}
            />
          </div>
          <Input
            placeholder="Mã bưu điện (tùy chọn)"
            value={address.postal_code || ""}
            onChange={(e) => handleAddressChange("postal_code", e.target.value)}
          />
        </div>

        {selectedLocation && (
          <div style={{ marginTop: 16, padding: 12, background: "#f0f0f0", borderRadius: 4 }}>
            <strong>Vị trí đã chọn:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </div>
        )}
      </Card>
    </div>
  );
};

export default LocationPicker;

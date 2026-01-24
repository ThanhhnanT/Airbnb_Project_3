"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input, Typography, Button, Spin, InputRef } from "antd";
import { 
  AimOutlined, 
  EnvironmentOutlined, 
  HomeOutlined,
  GlobalOutlined,
  BankOutlined,
  ThunderboltOutlined,
  CloseOutlined
} from "@ant-design/icons";
import styles from "@/styles/search.module.css";

const { Text } = Typography;
const { Search } = Input;

interface LocationDropdownProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
}

const suggestedDestinations = [
  {
    icon: <AimOutlined />,
    title: "Lân cận",
    description: "Tìm xung quanh bạn",
    value: "nearby"
  },
  {
    icon: <EnvironmentOutlined />,
    title: "Thành phố Hồ Chí Minh, Thành phố Hồ Chí Minh",
    description: "Có các thắng cảnh như Chợ Bến Thành",
    value: "ho-chi-minh"
  },
  {
    icon: <HomeOutlined />,
    title: "Đà Lạt, Lâm Đồng",
    description: "Phù hợp cho người yêu thiên nhiên",
    value: "da-lat"
  },
  {
    icon: <GlobalOutlined />,
    title: "Bangkok, Thái Lan",
    description: "Có cuộc sống về đêm náo nhiệt",
    value: "bangkok"
  },
  {
    icon: <ThunderboltOutlined />,
    title: "Hạ Long, Quảng Ninh",
    description: "Phù hợp cho người yêu thiên nhiên",
    value: "ha-long"
  },
  {
    icon: <BankOutlined />,
    title: "Thành phố Huế, Thừa Thiên-Huế",
    description: "Có kiến trúc ấn tượng",
    value: "hue"
  },
  {
    icon: <HomeOutlined />,
    title: "Vũng Tàu, Bà Rịa - Vũng Tàu",
    description: "Có đường bờ biển tuyệt đẹp",
    value: "vung-tau"
  }
];

type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText?: string;
  description: string;
};

const LocationDropdown: React.FC<LocationDropdownProps> = ({ 
  visible, 
  onClose, 
  onSelect 
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isPlacesLoading, setIsPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const searchInputRef = useRef<InputRef | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // Helper: load Google Maps JS with Places library
  const loadGoogleMapsPlaces = async (): Promise<typeof google | null> => {
    if (typeof window === "undefined") return null;

    // If already loaded with Places, reuse
    try {
      if (typeof google !== "undefined" && google.maps && google.maps.places) {
        return google;
      }
    } catch {
      // ignore, will try to inject script
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("Google Maps API key is missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.");
      setPlacesError("MISSING_API_KEY");
      return null;
    }

    // Avoid injecting script multiple times
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src^="https://maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      // Wait a bit for it to finish loading if needed
      return new Promise((resolve) => {
        existingScript.addEventListener("load", () => {
          try {
            if (typeof google !== "undefined" && google.maps && google.maps.places) {
              resolve(google);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      });
    }

    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=vi`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        try {
          if (typeof google !== "undefined" && google.maps && google.maps.places) {
            resolve(google);
          } else {
            setPlacesError("LOAD_FAILED");
            resolve(null);
          }
        } catch {
          setPlacesError("LOAD_FAILED");
          resolve(null);
        }
      };

      script.onerror = () => {
        console.error("Failed to load Google Maps Places script");
        setPlacesError("LOAD_FAILED");
        resolve(null);
      };

      document.head.appendChild(script);
    });
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Use OpenStreetMap Nominatim API for reverse geocoding (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=vi`,
        {
          headers: {
            'User-Agent': 'AirBnB-App' // Required by Nominatim
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }
      
      const data = await response.json();
      
      // Extract city/province name from address
      const address = data.address || {};
      // Try different fields for city name (varies by country)
      const cityName = 
        address.city || 
        address.town || 
        address.municipality || 
        address.county || 
        address.state_district ||
        address.state ||
        address.province ||
        '';
      
      const provinceName = 
        address.state || 
        address.province || 
        address.region ||
        '';
      
      // Format: "City, Province" or just "City"
      if (cityName && provinceName && cityName !== provinceName) {
        return `${cityName}, ${provinceName}`;
      } else if (cityName) {
        return cityName;
      } else if (provinceName) {
        return provinceName;
      } else {
        // Fallback to formatted coordinates
        return `Vị trí hiện tại (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      // Fallback to formatted coordinates
      return `Vị trí hiện tại (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    }
  };

  // Initialize Google Places services when dropdown is visible
  useEffect(() => {
    let cancelled = false;

    const initPlacesServices = async () => {
      if (!visible) return;

      setPlacesError(null);
      setIsPlacesLoading(true);

      const g = await loadGoogleMapsPlaces();
      if (!g || cancelled) {
        setIsPlacesLoading(false);
        return;
      }

      try {
        if (!autocompleteServiceRef.current) {
          autocompleteServiceRef.current = new g.maps.places.AutocompleteService();
        }
        if (!placesServiceRef.current) {
          // PlacesService needs a DOM element, can be a dummy div
          const dummy = document.createElement("div");
          placesServiceRef.current = new g.maps.places.PlacesService(dummy);
        }
      } catch (error) {
        console.error("Error initializing Google Places services:", error);
        setPlacesError("INIT_FAILED");
      } finally {
        if (!cancelled) {
          setIsPlacesLoading(false);
        }
      }
    };

    initPlacesServices();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  // Debounced search for predictions
  useEffect(() => {
    if (!visible) return;

    // Clear suggestions when input empty
    if (!searchValue.trim()) {
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(() => {
      const service = autocompleteServiceRef.current;
      if (!service) return;

      setLoadingSuggestions(true);
      setPlacesError(null);

      try {
        service.getPlacePredictions(
          {
            input: searchValue,
            types: ["(cities)"],
            language: "vi",
          },
          (
            predictions: google.maps.places.AutocompletePrediction[] | null, 
            status: google.maps.places.PlacesServiceStatus
          ) => {
            setLoadingSuggestions(false);

            try {
              const okStatus =
                (typeof google !== "undefined" &&
                  google.maps &&
                  google.maps.places &&
                  google.maps.places.PlacesServiceStatus &&
                  google.maps.places.PlacesServiceStatus.OK) ||
                "OK";

              if (status !== okStatus || !predictions || predictions.length === 0) {
                setSuggestions([]);
                return;
              }

              const mapped: PlaceSuggestion[] = predictions.map((p) => {
                const mainText = p.structured_formatting?.main_text || p.description || "";
                const secondaryText = p.structured_formatting?.secondary_text || "";
                return {
                  placeId: p.place_id,
                  mainText,
                  secondaryText,
                  description: p.description || `${mainText}${secondaryText ? ", " + secondaryText : ""}`,
                };
              });

              setSuggestions(mapped);
            } catch (e) {
              console.error("Error processing predictions:", e);
              setSuggestions([]);
            }
          }
        );
      } catch (error) {
        console.error("Error calling AutocompleteService:", error);
        setLoadingSuggestions(false);
        setPlacesError("PREDICT_FAILED");
        setSuggestions([]);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchValue, visible]);

  const handlePlaceSelect = (suggestion: PlaceSuggestion) => {
    const service = placesServiceRef.current;
    if (!service || !suggestion.placeId) {
      // Fallback to text only
      onSelect(suggestion.description);
      onClose();
      return;
    }

    setLoadingSuggestions(true);
    setPlacesError(null);

    try {
      service.getDetails(
        {
          placeId: suggestion.placeId,
          fields: ["geometry", "formatted_address", "name", "address_components"],
        },
        (
          place: google.maps.places.PlaceResult | null, 
          status: google.maps.places.PlacesServiceStatus
        ) => {
          setLoadingSuggestions(false);

          try {
            const okStatus =
              (typeof google !== "undefined" &&
                google.maps &&
                google.maps.places &&
                google.maps.places.PlacesServiceStatus &&
                google.maps.places.PlacesServiceStatus.OK) ||
              "OK";

            if (status !== okStatus || !place) {
              console.warn("Places details failed, fallback to description");
              onSelect(suggestion.description);
              onClose();
              return;
            }

            const location = place.geometry?.location;
            const components: google.maps.GeocoderAddressComponent[] = place.address_components || [];

            const getComponent = (types: string[]) => {
              const comp = components.find((c) =>
                types.every((t) => c.types.includes(t))
              );
              return comp ? comp.long_name : "";
            };

            const city =
              getComponent(["locality", "political"]) ||
              getComponent(["administrative_area_level_1", "political"]) ||
              getComponent(["administrative_area_level_2", "political"]);

            const country = getComponent(["country", "political"]);

            let displayName =
              (city && country ? `${city}, ${country}` : place.formatted_address) ||
              place.name ||
              suggestion.description;

            if (!displayName && location) {
              displayName = `Vị trí (${location.lat().toFixed(4)}, ${location
                .lng()
                .toFixed(4)})`;
            }

            if (displayName) {
              setSearchValue(displayName);
            }

            if (location) {
              const lat = location.lat();
              const lng = location.lng();
              const encoded = `nearby:${lat},${lng}|${displayName || `${lat.toFixed(
                4
              )},${lng.toFixed(4)}`}`;
              onSelect(encoded);
            } else if (displayName) {
              onSelect(displayName);
            } else {
              onSelect(suggestion.description);
            }

            onClose();
          } catch (e) {
            console.error("Error processing place details:", e);
            onSelect(suggestion.description);
            onClose();
          }
        }
      );
    } catch (error) {
      console.error("Error calling PlacesService.getDetails:", error);
      setLoadingSuggestions(false);
      onSelect(suggestion.description);
      onClose();
    }
  };

  const handleNearbyClick = async () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get city name from coordinates
          const cityName = await reverseGeocode(latitude, longitude);
          
          // Pass both city name and coordinates: "nearby:lat,lng|cityName"
          onSelect(`nearby:${latitude},${longitude}|${cityName}`);
        } catch (error) {
          console.error("Error in reverse geocoding:", error);
          // Fallback: just pass coordinates
          onSelect(`nearby:${latitude},${longitude}`);
        } finally {
          setGettingLocation(false);
          onClose();
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Không thể lấy vị trí của bạn. Vui lòng cho phép truy cập vị trí.");
        setGettingLocation(false);
      }
    );
  };

  const filteredDestinations = suggestedDestinations.filter(dest =>
    dest.title.toLowerCase().includes(searchValue.toLowerCase()) ||
    dest.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (!visible) return null;

  return (
    <div 
      className={styles.locationDropdown} 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ display: visible ? 'block' : 'none' }}
    >
      <div className={styles.locationHeader}>
        <Text strong className={styles.locationTitle}>Điểm đến được đề xuất</Text>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Đóng"
        />
      </div>
      <div className={styles.locationSearch}>
        <Search
          placeholder="Tìm kiếm điểm đến"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          allowClear
          ref={searchInputRef}
        />
        {placesError && (
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
            Không thể tải Google Places, bạn vẫn có thể chọn từ danh sách gợi ý bên dưới.
          </Text>
        )}
      </div>
      <div className={styles.locationList}>
        {/* Nearby item always on top */}
        {suggestedDestinations
          .filter((dest) => dest.value === "nearby")
          .map((dest, index) => (
          <div
            key={`nearby-${index}`}
            className={styles.locationItem}
            onClick={() => {
              if (dest.value === "nearby") {
                handleNearbyClick();
              } else {
                onSelect(dest.title);
                onClose();
              }
            }}
          >
            <div className={styles.locationIcon}>
              {gettingLocation && dest.value === "nearby" ? (
                <Spin size="small" />
              ) : (
                dest.icon
              )}
            </div>
            <div className={styles.locationContent}>
              <Text strong className={styles.locationItemTitle}>{dest.title}</Text>
              <Text type="secondary" className={styles.locationItemDesc}>
                {dest.description}
              </Text>
            </div>
          </div>
        ))}

        {/* Google Places suggestions */}
        {loadingSuggestions && (
          <div className={styles.locationItem}>
            <div className={styles.locationIcon}>
              <Spin size="small" />
            </div>
            <div className={styles.locationContent}>
              <Text type="secondary" className={styles.locationItemDesc}>
                Đang gợi ý địa điểm...
              </Text>
            </div>
          </div>
        )}

        {!loadingSuggestions && suggestions.length > 0 && suggestions.map((sugg) => (
          <div
            key={sugg.placeId}
            className={styles.locationItem}
            onClick={() => handlePlaceSelect(sugg)}
          >
            <div className={styles.locationIcon}>
              <EnvironmentOutlined />
            </div>
            <div className={styles.locationContent}>
              <Text strong className={styles.locationItemTitle}>{sugg.mainText}</Text>
              <Text type="secondary" className={styles.locationItemDesc}>
                {sugg.secondaryText || sugg.description}
              </Text>
            </div>
          </div>
        ))}

        {/* Fallback static destinations (excluding nearby which is already rendered) */}
        {!loadingSuggestions && suggestions.length === 0 &&
          filteredDestinations
            .filter((dest) => dest.value !== "nearby")
            .map((dest, index) => (
              <div
                key={`static-${index}`}
                className={styles.locationItem}
                onClick={() => {
                  onSelect(dest.title);
                  onClose();
                }}
              >
                <div className={styles.locationIcon}>
                  {dest.icon}
                </div>
                <div className={styles.locationContent}>
                  <Text strong className={styles.locationItemTitle}>{dest.title}</Text>
                  <Text type="secondary" className={styles.locationItemDesc}>
                    {dest.description}
                  </Text>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default LocationDropdown;


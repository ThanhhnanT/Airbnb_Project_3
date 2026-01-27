"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, InputNumber, Button, Select, message, Card, Steps, Space, Typography, Row, Col } from "antd";
import { useMessageApi } from "@/components/providers/Message";
import { 
  ArrowLeftOutlined, 
  ArrowRightOutlined,
  WifiOutlined,
  DesktopOutlined,
  HomeOutlined,
  CarOutlined,
  DollarOutlined,
  CloudOutlined,
  LaptopOutlined,
  ThunderboltOutlined,
  FireOutlined,
  TableOutlined,
  CoffeeOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  ApiOutlined,
  SettingOutlined,
  GlobalOutlined,
  BankOutlined,
  ToolOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { postAccess } from "@/helper/api";
import LocationPicker from "@/components/host/LocationPicker";
import ImageUploader from "@/components/host/ImageUploader";
import Counter from "@/components/host/Counter";
import AmenityCard from "@/components/host/AmenityCard";
import styles from "./create-listing.module.css";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

export default function CreateListingPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const messageApi = useMessageApi() || message;
  const [imageFiles, setImageFiles] = useState<Array<{ file: File; preview: string }>>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [priceBase, setPriceBase] = useState<number | null>(null);
  const [cleaningFee, setCleaningFee] = useState<number | null>(null);
  const [extraGuestFee, setExtraGuestFee] = useState<number | null>(null);
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    street?: string;
    city: string;
    country: string;
    postal_code?: string;
  } | null>(null);

  // Currency conversion rates (to USD)
  const currencyRates: { [key: string]: number } = {
    USD: 1,
    VND: 0.000041, // 1 VND = 0.000041 USD (approximately 24,000 VND = 1 USD)
    EUR: 1.09, // 1 EUR = 1.09 USD (approximately)
  };

  // Convert amount from selected currency to USD
  const convertToUSD = (amount: number | null | undefined, currency: string): number => {
    console.log("convertToUSD called with:", { amount, currency, type: typeof amount });
    // Handle null, undefined
    if (amount === null || amount === undefined) {
      console.log("convertToUSD: amount is null/undefined, returning 0");
      return 0;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      console.log("convertToUSD: amount is NaN, returning 0");
      return 0;
    }
    if (!currency || currency === "USD") {
      console.log("convertToUSD: currency is USD or empty, returning", numAmount);
      return numAmount;
    }
    const rate = currencyRates[currency] || 1;
    const result = numAmount * rate;
    console.log("convertToUSD: converting", numAmount, currency, "to USD:", result, "(rate:", rate, ")");
    return result;
  };

  const steps = [
    { title: "1" },
    { title: "2" },
    { title: "3" },
    { title: "4" },
    { title: "5" },
    { title: "6" },
    { title: "7" },
  ];

  // Sync state with form values when step changes to 0
  useEffect(() => {
    if (currentStep === 0) {
      const formTitle = form.getFieldValue("title");
      const formDescription = form.getFieldValue("description");
      if (formTitle) setTitle(formTitle);
      if (formDescription) setDescription(formDescription);
    }
  }, [currentStep, form]);

  const handleNext = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      // Validate current step
      if (currentStep === 0) {
        await form.validateFields(["title", "description"]);
        // Save values to state before moving to next step
        const formTitle = form.getFieldValue("title");
        const formDescription = form.getFieldValue("description");
        if (formTitle) setTitle(formTitle);
        if (formDescription) setDescription(formDescription);
      } else if (currentStep === 1) {
        if (!locationData) {
          messageApi.error("Vui lòng chọn vị trí trên bản đồ");
          return;
        }
        if (!locationData.city || !locationData.country) {
          messageApi.error("Vui lòng điền đầy đủ thông tin địa điểm");
          return;
        }
        await form.validateFields(["country", "city"]);
      } else if (currentStep === 2) {
        await form.validateFields(["guests"]);
      } else if (currentStep === 3) {
        console.log("Checking images:", imageFiles.length);
        if (imageFiles.length < 5) {
          const remaining = 5 - imageFiles.length;
          messageApi.error({
            content: `Bạn cần upload thêm ${remaining} ảnh nữa. Hiện tại bạn đã upload ${imageFiles.length}/5 ảnh.`,
            duration: 4,
          });
          return;
        }
      } else if (currentStep === 4) {
        // Amenities step - save amenities to form before moving to next step
        const currentAmenities = form.getFieldValue("amenities") || selectedAmenities || [];
        form.setFieldsValue({ amenities: currentAmenities });
      } else if (currentStep === 5) {
        await form.validateFields(["price_base"]);
        // Save price values to state before moving to next step
        const priceBaseValue = form.getFieldValue("price_base");
        const cleaningFeeValue = form.getFieldValue("cleaning_fee");
        const extraGuestFeeValue = form.getFieldValue("extra_guest_fee");
        setPriceBase(priceBaseValue ?? null);
        setCleaningFee(cleaningFeeValue ?? null);
        setExtraGuestFee(extraGuestFeeValue ?? null);
        console.log("Step 5 - Price values:", { priceBase: priceBaseValue, cleaningFee: cleaningFeeValue, extraGuestFee: extraGuestFeeValue });
      } else if (currentStep === 6) {
        // House rules and cancellation policy - no validation needed
      }

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error("Validation error:", error);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Sync state with form values when going back
      if (currentStep === 1) {
        const formTitle = form.getFieldValue("title");
        const formDescription = form.getFieldValue("description");
        if (formTitle) setTitle(formTitle);
        if (formDescription) setDescription(formDescription);
      }
    }
  };

  const handleLocationSelect = (
    lat: number,
    lng: number,
    address: { street?: string; city: string; country: string; postal_code?: string }
  ) => {
    setLocationData({ latitude: lat, longitude: lng, ...address });
    form.setFieldsValue({
      latitude: lat,
      longitude: lng,
      street: address.street,
      city: address.city,
      country: address.country,
      postal_code: address.postal_code,
    });
  };

  const handleImagesChange = (newImageFiles: Array<{ file: File; preview: string }>) => {
    console.log("Images changed:", newImageFiles.length, "files:", newImageFiles.map(f => f.file.name));
    // Only update if the new array has more or equal files (to avoid overwriting with smaller array)
    // This prevents race conditions where an old notification arrives after a new one
    setImageFiles((prev) => {
      if (newImageFiles.length >= prev.length) {
        console.log("Updating imageFiles from", prev.length, "to", newImageFiles.length);
        return newImageFiles;
      } else {
        console.log("Ignoring update - new array is smaller:", newImageFiles.length, "vs", prev.length);
        return prev;
      }
    });
  };

  const handleSubmit = async (values: any) => {
    let listingData: any = null;
    
    try {
      setLoading(true);

      // Validate all required fields first
      if (!locationData) {
        messageApi.error("Vui lòng chọn vị trí trên bản đồ");
        setCurrentStep(1);
        return;
      }

      if (imageFiles.length < 5) {
        messageApi.error("Vui lòng upload ít nhất 5 ảnh");
        setCurrentStep(3);
        return;
      }

      // Validate form fields before getting values
      try {
        await form.validateFields(['title', 'description', 'guests', 'price_base']);
      } catch (error) {
        messageApi.error("Vui lòng điền đầy đủ các trường bắt buộc");
        return;
      }

      // Get all form values after validation
      // Prioritize values from onFinish (which are validated) over form.getFieldsValue()
      const formValues = form.getFieldsValue();
      console.log("Form values:", formValues);
      console.log("Submit values:", values);

      // Get selected currency
      const currency = values.currency || formValues.currency || selectedCurrency || "USD";

      // Get price values - prioritize state, then values from onFinish, then formValues
      const priceBaseValue = priceBase ?? values.price_base ?? formValues.price_base ?? null;
      const cleaningFeeValue = cleaningFee ?? values.cleaning_fee ?? formValues.cleaning_fee ?? null;
      const extraGuestFeeValue = extraGuestFee ?? values.extra_guest_fee ?? formValues.extra_guest_fee ?? null;

      console.log("Price values before conversion:", { 
        priceBaseValue, 
        cleaningFeeValue, 
        extraGuestFeeValue, 
        currency,
        priceBaseType: typeof priceBaseValue,
        "state.priceBase": priceBase,
        "state.cleaningFee": cleaningFee,
        "state.extraGuestFee": extraGuestFee,
        formValuesPriceBase: formValues.price_base,
        valuesPriceBase: values.price_base
      });

      // Convert all prices to USD before saving
      const priceBaseUSD = convertToUSD(priceBaseValue, currency);
      const cleaningFeeUSD = convertToUSD(cleaningFeeValue, currency);
      const extraGuestFeeUSD = convertToUSD(extraGuestFeeValue, currency);

      console.log("Price values after conversion to USD:", { priceBaseUSD, cleaningFeeUSD, extraGuestFeeUSD });

      // Create listing - prioritize state values, then onFinish values, then form values
      listingData = {
        title: title || values.title || formValues.title || "",
        description: description || values.description || formValues.description || "",
        city: locationData.city,
        country: locationData.country,
        latitude: Number(locationData.latitude),
        longitude: Number(locationData.longitude),
        price_base: Number(priceBaseUSD) ?? 0,
        currency: "USD", // Always save as USD in database
        cleaning_fee: Number(cleaningFeeUSD) ?? 0,
        extra_guest_fee: Number(extraGuestFeeUSD) ?? 0,
        guests: Number(values.guests || formValues.guests || 4), // Default to 4 if not changed
        amenities: values.amenities || formValues.amenities || selectedAmenities || [],
        cancellation_policy: values.cancellation_policy || formValues.cancellation_policy || "moderate",
      };

      // Only include optional fields if they have values
      if (locationData.street) listingData.street = locationData.street;
      if (locationData.postal_code) listingData.postal_code = locationData.postal_code;
      
      // Get bedrooms, beds, bathrooms with defaults from initialValues (1)
      const bedrooms = values.bedrooms ?? formValues.bedrooms ?? 1;
      const beds = values.beds ?? formValues.beds ?? 1;
      const bathrooms = values.bathrooms ?? formValues.bathrooms ?? 1;
      listingData.bedrooms = Number(bedrooms);
      listingData.beds = Number(beds);
      listingData.bathrooms = Number(bathrooms);
      if (values.house_rules || formValues.house_rules) listingData.house_rules = values.house_rules || formValues.house_rules;

      console.log("Submitting listing data:", listingData);
      
      // Step 1: Upload images to Cloudinary first (sequentially to avoid 413 error)
      const uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        try {
          messageApi.loading({ content: `Đang upload ảnh (0/${imageFiles.length})...`, key: "upload" });
          
          // Upload sequentially instead of parallel to avoid 413 error
          for (let i = 0; i < imageFiles.length; i++) {
            const imageFile = imageFiles[i];
            messageApi.loading({ 
              content: `Đang upload ảnh (${i + 1}/${imageFiles.length})...`, 
              key: "upload" 
            });
            
            const result = await postAccess("upload/image", {
              image: imageFile.preview,
              folder: "airbnb-listings",
            });
            
            uploadedImageUrls.push(result.url);
          }
          
          messageApi.success({ content: "Upload ảnh thành công!", key: "upload" });
        } catch (imageError: any) {
          console.error("Error uploading images:", imageError);
          messageApi.error({ 
            content: imageError?.response?.status === 413 
              ? "Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn hoặc thử lại." 
              : "Lỗi khi upload ảnh. Vui lòng thử lại.", 
            key: "upload" 
          });
          return;
        }
      }
      
      // Step 2: Create listing
      const listingResult = await postAccess("listings", listingData);

      // Step 3: Save image URLs to listing
      if (listingResult._id && uploadedImageUrls.length > 0) {
        try {
          await postAccess("listing-images", {
            listing_id: listingResult._id,
            image_url: uploadedImageUrls,
            is_cover: true, // First image is cover
          });
        } catch (imageError: any) {
          console.error("Error saving images to listing:", imageError);
          // Listing is already created, so we still show success but warn about images
          messageApi.warning("Listing đã được tạo nhưng có lỗi khi lưu ảnh. Vui lòng thử upload lại sau.");
          if (typeof window !== "undefined") {
            window.open("/host/manage", "_blank", "noopener,noreferrer");
          }
          // Quay về trang home ở tab hiện tại
          router.push("/");
          return;
        }
      }
      
      messageApi.success("Listing đã được tạo và đang chờ duyệt từ admin!");
      if (typeof window !== "undefined") {
        window.open("/host/manage", "_blank", "noopener,noreferrer");
      }
      // Quay về trang home ở tab hiện tại
      router.push("/");
    } catch (error: any) {
      console.error("Error creating listing:", error);
      console.error("Error response:", error?.response?.data);
      if (listingData) {
        console.error("Request data:", listingData);
      }
      
      // Handle error message (can be array or string)
      let errorMessage = "Có lỗi xảy ra khi tạo listing";
      if (error?.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(", ");
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.createListingContainer}>
      <Card>
        <div className={styles.header}>
          <Title level={2}>Tạo listing mới</Title>
          <Text type="secondary">Hoàn thành các bước sau để tạo listing của bạn</Text>
        </div>

        <Steps current={currentStep} items={steps} className={styles.steps} />

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          className={styles.form}
          initialValues={{
            currency: "USD",
            cancellation_policy: "moderate",
            guests: 4,
            bedrooms: 1,
            beds: 1,
            bathrooms: 1,
            amenities: [],
          }}
          onValuesChange={(changedValues, allValues) => {
            if (changedValues.currency) {
              setSelectedCurrency(changedValues.currency);
            }
            if (changedValues.title !== undefined) {
              setTitle(changedValues.title);
            }
            if (changedValues.description !== undefined) {
              setDescription(changedValues.description);
            }
            if (changedValues.amenities !== undefined) {
              setSelectedAmenities(changedValues.amenities || []);
            }
          }}
        >
          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <div className={styles.stepContent}>
              <Title level={4}>Thông tin cơ bản</Title>
              <Form.Item
                name="title"
                label="* Tên căn hộ"
                rules={[{ required: true, message: "Vui lòng nhập tên căn hộ" }]}
                preserve={true}
              >
                <Input 
                  placeholder="Ví dụ: Căn hộ đẹp ở trung tâm" 
                  size="large"
                  onChange={(e) => {
                    const value = e.target.value;
                    setTitle(value);
                  }}
                />
              </Form.Item>

              <Form.Item
                name="description"
                label="* Mô tả"
                rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
                preserve={true}
              >
                <TextArea
                  rows={6}
                  placeholder="Mô tả chi tiết về chỗ ở của bạn..."
                  showCount
                  maxLength={1000}
                  style={{ borderRadius: 0 }}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDescription(value);
                  }}
                />
              </Form.Item>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 1 && (
            <div className={styles.stepContent}>
              <Title level={4}>Địa điểm</Title>
              <LocationPicker
                key={`location-picker-${locationData?.latitude}-${locationData?.longitude}`}
                onLocationSelect={handleLocationSelect}
                initialLat={locationData?.latitude || form.getFieldValue("latitude")}
                initialLng={locationData?.longitude || form.getFieldValue("longitude")}
              />
              <Form.Item name="latitude" hidden>
                <InputNumber />
              </Form.Item>
              <Form.Item name="longitude" hidden>
                <InputNumber />
              </Form.Item>
              <Form.Item name="street" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="city" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="country" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="postal_code" hidden>
                <Input />
              </Form.Item>
            </div>
          )}

          {/* Step 3: Accommodation Details */}
          {currentStep === 2 && (
            <div className={styles.stepContent} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ marginBottom: 24, textAlign: "center", maxWidth: "600px" }}>
                <Title level={3} style={{ marginBottom: 8, fontSize: "22px", fontWeight: 600 }}>
                  Chia sẻ một số thông tin cơ bản về chỗ ở của bạn
                </Title>
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  Sau này, bạn sẽ bổ sung những thông tin khác, như loại giường chẳng hạn.
                </Text>
              </div>
              
              <div style={{ maxWidth: "600px", width: "100%" }}>
                <Form.Item
                  name="guests"
                  rules={[{ required: true, message: "Vui lòng chọn số khách" }]}
                  style={{ marginBottom: 0 }}
                >
                  <Counter
                    label="Khách"
                    value={form.getFieldValue("guests") ?? 4}
                    onChange={(value) => {
                      form.setFieldsValue({ guests: value });
                      form.validateFields(["guests"]);
                    }}
                    min={1}
                  />
                </Form.Item>

                <Form.Item
                  name="bedrooms"
                  style={{ marginBottom: 0 }}
                >
                  <Counter
                    label="Phòng ngủ"
                    value={form.getFieldValue("bedrooms") ?? 1}
                    onChange={(value) => form.setFieldsValue({ bedrooms: value })}
                    min={1}
                  />
                </Form.Item>

                <Form.Item
                  name="beds"
                  style={{ marginBottom: 0 }}
                >
                  <Counter
                    label="Giường"
                    value={form.getFieldValue("beds") ?? 1}
                    onChange={(value) => form.setFieldsValue({ beds: value })}
                    min={1}
                  />
                </Form.Item>

                <Form.Item
                  name="bathrooms"
                  style={{ marginBottom: 0 }}
                >
                  <Counter
                    label="Phòng tắm"
                    value={form.getFieldValue("bathrooms") ?? 1}
                    onChange={(value) => form.setFieldsValue({ bathrooms: value })}
                    min={1}
                  />
                </Form.Item>
              </div>
            </div>
          )}

          {/* Step 4: Images */}
          {currentStep === 3 && (
            <div className={styles.stepContent}>
              <Title level={4}>Upload ảnh</Title>
              <ImageUploader
                onImagesChange={handleImagesChange}
                minImages={5}
                maxImages={20}
                initialImages={imageFiles.map(img => img.preview)}
              />
            </div>
          )}

          {/* Step 5: Amenities */}
          {currentStep === 4 && (
            <div className={styles.stepContent} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ marginBottom: 32, textAlign: "center", maxWidth: "800px" }}>
                <Title level={3} style={{ marginBottom: 8, fontSize: "22px", fontWeight: 600 }}>
                  Cho khách biết chỗ ở của bạn có những gì
                </Title>
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  Bạn có thể bổ sung thêm tiện nghi sau khi đăng bài đăng.
                </Text>
              </div>

              <Form.Item name="amenities" style={{ width: "100%", maxWidth: "800px", margin: 0 }}>
                <div style={{ marginBottom: 48, width: "100%" }}>
                  <Title level={4} style={{ marginBottom: 24, fontSize: "18px", fontWeight: 600 }}>
                    Còn những tiện nghi yêu thích của khách sau đây thì sao?
                  </Title>
                  <Row gutter={[16, 16]} style={{ margin: 0, width: "100%" }}>
                    {[
                      { key: "wifi", label: "Wi-fi", icon: <WifiOutlined /> },
                      { key: "tv", label: "TV", icon: <DesktopOutlined /> },
                      { key: "kitchen", label: "Bếp", icon: <HomeOutlined /> },
                      { key: "washer", label: "Máy giặt", icon: <SettingOutlined /> },
                      { key: "free_parking", label: "Chỗ đỗ xe miễn phí tại nơi ở", icon: <CarOutlined /> },
                      { key: "paid_parking", label: "Chỗ đỗ xe có thu phí", icon: <DollarOutlined /> },
                      { key: "air_conditioning", label: "Điều hòa nhiệt độ", icon: <CloudOutlined /> },
                      { key: "workspace", label: "Không gian riêng để làm việc", icon: <LaptopOutlined /> },
                    ].map((amenity) => {
                      const currentAmenities = form.getFieldValue("amenities") || selectedAmenities || [];
                      const isSelected = currentAmenities.includes(amenity.key);
                      return (
                        <Col xs={12} sm={8} md={8} key={amenity.key} style={{ marginBottom: 0, padding: "0 8px" }}>
                          <AmenityCard
                            icon={amenity.icon}
                            label={amenity.label}
                            selected={isSelected}
                            onClick={() => {
                              const current = form.getFieldValue("amenities") || selectedAmenities || [];
                              const updated = isSelected
                                ? current.filter((a: string) => a !== amenity.key)
                                : [...current, amenity.key];
                              setSelectedAmenities(updated);
                              form.setFieldsValue({ amenities: updated });
                            }}
                          />
                        </Col>
                      );
                    })}
                  </Row>
                </div>

                <div style={{ width: "100%" }}>
                  <Title level={4} style={{ marginBottom: 24, fontSize: "18px", fontWeight: 600 }}>
                    Bạn có tiện nghi nào nổi bật không?
                  </Title>
                  <Row gutter={[16, 16]} style={{ margin: 0, width: "100%" }}>
                    {[
                      { key: "pool", label: "Bể bơi", icon: <GlobalOutlined /> },
                      { key: "hot_tub", label: "Bồn tắm nước nóng", icon: <FireOutlined /> },
                      { key: "patio", label: "Sân", icon: <HomeOutlined /> },
                      { key: "bbq", label: "Lò nướng BBQ", icon: <FireOutlined /> },
                      { key: "outdoor_dining", label: "Khu vực ăn uống ngoài trời", icon: <TableOutlined /> },
                      { key: "fire_pit", label: "Bếp đốt lửa trại", icon: <FireOutlined /> },
                      { key: "pool_table", label: "Bàn bi-da", icon: <TrophyOutlined /> },
                      { key: "fireplace", label: "Lò sưởi trong nhà", icon: <FireOutlined /> },
                      { key: "piano", label: "Đàn piano", icon: <BankOutlined /> },
                    ].map((amenity) => {
                      const currentAmenities = form.getFieldValue("amenities") || selectedAmenities || [];
                      const isSelected = currentAmenities.includes(amenity.key);
                      return (
                        <Col xs={12} sm={8} md={8} key={amenity.key} style={{ marginBottom: 0, padding: "0 8px" }}>
                          <AmenityCard
                            icon={amenity.icon}
                            label={amenity.label}
                            selected={isSelected}
                            onClick={() => {
                              const current = form.getFieldValue("amenities") || selectedAmenities || [];
                              const updated = isSelected
                                ? current.filter((a: string) => a !== amenity.key)
                                : [...current, amenity.key];
                              setSelectedAmenities(updated);
                              form.setFieldsValue({ amenities: updated });
                            }}
                          />
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              </Form.Item>
            </div>
          )}

          {/* Step 6: Pricing */}
          {currentStep === 5 && (
            <div className={styles.stepContent}>
              <Title level={4}>Giá cả</Title>

              <div className={styles.formRow}>
                <Form.Item
                  name="price_base"
                  label="Giá mỗi đêm"
                  rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                  style={{ flex: 1 }}
                  preserve={true}
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    addonBefore={<DollarOutlined />}
                    addonAfter={selectedCurrency}
                    size="large"
                    onChange={(value) => {
                      const numValue = value ?? null;
                      setPriceBase(numValue);
                      form.setFieldsValue({ price_base: numValue });
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="currency"
                  label="Loại tiền tệ"
                  style={{ flex: 1 }}
                >
                  <Select
                    size="large"
                    value={selectedCurrency}
                    onChange={(value) => {
                      setSelectedCurrency(value);
                      form.setFieldsValue({ currency: value });
                    }}
                  >
                    <Option value="USD">USD - Đô la Mỹ</Option>
                    <Option value="VND">VND - Đồng Việt Nam</Option>
                    <Option value="EUR">EUR - Euro</Option>
                  </Select>
                </Form.Item>
              </div>

              <div className={styles.formRow}>
                <Form.Item name="cleaning_fee" label="Phí dọn dẹp" style={{ flex: 1 }} preserve={true}>
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    addonBefore={<ToolOutlined />}
                    addonAfter={selectedCurrency}
                    size="large"
                    onChange={(value) => {
                      const numValue = value ?? null;
                      setCleaningFee(numValue);
                      form.setFieldsValue({ cleaning_fee: numValue });
                    }}
                  />
                </Form.Item>

                <Form.Item name="extra_guest_fee" label="Phí khách thêm" style={{ flex: 1 }} preserve={true}>
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    addonBefore={<UsergroupAddOutlined />}
                    addonAfter={selectedCurrency}
                    size="large"
                    onChange={(value) => {
                      const numValue = value ?? null;
                      setExtraGuestFee(numValue);
                      form.setFieldsValue({ extra_guest_fee: numValue });
                    }}
                  />
                </Form.Item>
              </div>
            </div>
          )}

          {/* Step 7: House Rules & Cancellation Policy */}
          {currentStep === 6 && (
            <div className={styles.stepContent}>
              <Title level={4}>Nội quy nhà & Chính sách hủy</Title>

              <Form.Item name="house_rules" label="Nội quy nhà">
                <TextArea rows={4} placeholder="Các quy tắc của bạn..." />
              </Form.Item>

              <Form.Item
                name="cancellation_policy"
                label="Chính sách hủy"
              >
                <Select size="large">
                  <Option value="flexible">Linh hoạt - Hoàn tiền đầy đủ 1 ngày trước</Option>
                  <Option value="moderate">Vừa phải - Hoàn tiền đầy đủ 5 ngày trước</Option>
                  <Option value="strict">Nghiêm ngặt - Hoàn tiền 50% 1 tuần trước</Option>
                </Select>
              </Form.Item>
            </div>
          )}

          <div className={styles.formActions}>
            <Space>
              {currentStep > 0 && (
                <Button icon={<ArrowLeftOutlined />} onClick={handlePrev} size="large">
                  Quay lại
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button
                  type="primary"
                  htmlType="button"
                  icon={<ArrowRightOutlined />}
                  onClick={handleNext}
                  size="large"
                >
                  Tiếp theo
                </Button>
              ) : (
                <Button type="primary" htmlType="submit" loading={loading} size="large">
                  Tạo listing
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
}

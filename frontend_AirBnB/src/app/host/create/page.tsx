"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, InputNumber, Button, Select, message, Card, Steps, Space, Typography } from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { postAccess } from "@/helper/api";
import LocationPicker from "@/components/host/LocationPicker";
import ImageUploader from "@/components/host/ImageUploader";
import styles from "./create-listing.module.css";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

export default function CreateListingPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    street?: string;
    city: string;
    country: string;
    postal_code?: string;
  } | null>(null);

  const steps = [
    { title: "Thông tin cơ bản", description: "Tiêu đề, mô tả, số khách" },
    { title: "Địa điểm", description: "Chọn vị trí trên bản đồ" },
    { title: "Upload ảnh", description: "Tối thiểu 5 ảnh" },
    { title: "Giá cả & Tiện nghi", description: "Giá, tiện nghi, nội quy" },
  ];

  const handleNext = async () => {
    try {
      // Validate current step
      if (currentStep === 0) {
        await form.validateFields(["title", "description", "guests"]);
      } else if (currentStep === 1) {
        if (!locationData) {
          message.error("Vui lòng chọn vị trí trên bản đồ");
          return;
        }
        if (!locationData.city || !locationData.country) {
          message.error("Vui lòng điền đầy đủ thông tin địa điểm");
          return;
        }
        await form.validateFields(["country", "city"]);
      } else if (currentStep === 2) {
        if (images.length < 5) {
          message.error("Vui lòng upload ít nhất 5 ảnh");
          return;
        }
      } else if (currentStep === 3) {
        await form.validateFields(["price_base"]);
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

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Validate all required fields
      if (!locationData) {
        message.error("Vui lòng chọn vị trí trên bản đồ");
        setCurrentStep(1);
        return;
      }

      if (images.length < 5) {
        message.error("Vui lòng upload ít nhất 5 ảnh");
        setCurrentStep(2);
        return;
      }

      // Create listing with status 'inactive'
      const listingData: any = {
        title: values.title,
        description: values.description,
        city: locationData.city,
        country: locationData.country,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        price_base: values.price_base,
        currency: values.currency || "USD",
        cleaning_fee: values.cleaning_fee || 0,
        extra_guest_fee: values.extra_guest_fee || 0,
        guests: values.guests,
        amenities: values.amenities || [],
        cancellation_policy: values.cancellation_policy || "moderate",
        status: "inactive", // Set status to inactive for admin approval
      };

      // Only include optional fields if they have values
      if (locationData.street) listingData.street = locationData.street;
      if (locationData.postal_code) listingData.postal_code = locationData.postal_code;
      if (values.bedrooms !== undefined && values.bedrooms !== null) listingData.bedrooms = values.bedrooms;
      if (values.beds !== undefined && values.beds !== null) listingData.beds = values.beds;
      if (values.bathrooms !== undefined && values.bathrooms !== null) listingData.bathrooms = values.bathrooms;
      if (values.house_rules) listingData.house_rules = values.house_rules;

      const listingResult = await postAccess("listings", listingData);

      // Create listing images
      if (listingResult._id && images.length > 0) {
        await postAccess("listing-images", {
          listing_id: listingResult._id,
          image_url: images,
          is_cover: true, // First image is cover
        });
      }

      message.success("Listing đã được tạo và đang chờ duyệt từ admin!");
      router.push(`/listings/${listingResult._id}`);
    } catch (error: any) {
      console.error("Error creating listing:", error);
      message.error(error?.response?.data?.message || "Có lỗi xảy ra khi tạo listing");
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
          }}
        >
          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <div className={styles.stepContent}>
              <Title level={4}>Thông tin cơ bản</Title>
              <Form.Item
                name="title"
                label="Tiêu đề"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
              >
                <Input placeholder="Ví dụ: Căn hộ đẹp ở trung tâm" size="large" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Mô tả"
                rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
              >
                <TextArea
                  rows={6}
                  placeholder="Mô tả chi tiết về chỗ ở của bạn..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              <div className={styles.formRow}>
                <Form.Item
                  name="guests"
                  label="Số khách tối đa"
                  rules={[{ required: true, message: "Vui lòng nhập số khách" }]}
                  style={{ flex: 1 }}
                >
                  <InputNumber min={1} style={{ width: "100%" }} size="large" />
                </Form.Item>

                <Form.Item name="bedrooms" label="Số phòng ngủ" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: "100%" }} size="large" />
                </Form.Item>
              </div>

              <div className={styles.formRow}>
                <Form.Item name="beds" label="Số giường" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: "100%" }} size="large" />
                </Form.Item>

                <Form.Item name="bathrooms" label="Số phòng tắm" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: "100%" }} size="large" />
                </Form.Item>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 1 && (
            <div className={styles.stepContent}>
              <Title level={4}>Địa điểm</Title>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialLat={locationData?.latitude}
                initialLng={locationData?.longitude}
              />
              <Form.Item name="latitude" hidden>
                <InputNumber />
              </Form.Item>
              <Form.Item name="longitude" hidden>
                <InputNumber />
              </Form.Item>
            </div>
          )}

          {/* Step 3: Images */}
          {currentStep === 2 && (
            <div className={styles.stepContent}>
              <Title level={4}>Upload ảnh</Title>
              <ImageUploader
                onImagesChange={handleImagesChange}
                minImages={5}
                maxImages={20}
              />
            </div>
          )}

          {/* Step 4: Pricing & Amenities */}
          {currentStep === 3 && (
            <div className={styles.stepContent}>
              <Title level={4}>Giá cả & Tiện nghi</Title>

              <div className={styles.formRow}>
                <Form.Item
                  name="price_base"
                  label="Giá mỗi đêm"
                  rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                  style={{ flex: 1 }}
                >
                  <InputNumber min={0} style={{ width: "100%" }} addonAfter="USD" size="large" />
                </Form.Item>

                <Form.Item name="currency" label="Loại tiền tệ" style={{ flex: 1 }}>
                  <Select size="large">
                    <Option value="USD">USD</Option>
                    <Option value="VND">VND</Option>
                    <Option value="EUR">EUR</Option>
                  </Select>
                </Form.Item>
              </div>

              <div className={styles.formRow}>
                <Form.Item name="cleaning_fee" label="Phí dọn dẹp" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: "100%" }} addonAfter="USD" size="large" />
                </Form.Item>

                <Form.Item name="extra_guest_fee" label="Phí khách thêm" style={{ flex: 1 }}>
                  <InputNumber min={0} style={{ width: "100%" }} addonAfter="USD" size="large" />
                </Form.Item>
              </div>

              <Form.Item name="amenities" label="Tiện nghi">
                <Select
                  mode="tags"
                  placeholder="Nhập tiện nghi và nhấn Enter"
                  size="large"
                  tokenSeparators={[","]}
                >
                  <Option value="wifi">WiFi</Option>
                  <Option value="parking">Bãi đỗ xe</Option>
                  <Option value="kitchen">Bếp</Option>
                  <Option value="air-conditioning">Điều hòa</Option>
                  <Option value="tv">TV</Option>
                  <Option value="washer">Máy giặt</Option>
                  <Option value="pool">Hồ bơi</Option>
                  <Option value="gym">Phòng gym</Option>
                </Select>
              </Form.Item>

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

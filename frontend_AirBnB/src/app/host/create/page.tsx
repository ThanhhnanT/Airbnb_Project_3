"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, InputNumber, Button, Select, Upload, message, Card, Steps } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { postAccess, upImage } from "@/helper/api";
import styles from "./create-listing.module.css";

const { TextArea } = Input;
const { Option } = Select;

export default function CreateListingPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // Create listing
      const listingResult = await postAccess("listings", {
        title: values.title,
        description: values.description,
        city: values.city,
        country: values.country,
        street: values.street,
        latitude: values.latitude,
        longitude: values.longitude,
        price_base: values.price_base,
        currency: values.currency || "USD",
        cleaning_fee: values.cleaning_fee || 0,
        extra_guest_fee: values.extra_guest_fee || 0,
        guests: values.guests,
        bedrooms: values.bedrooms,
        beds: values.beds,
        bathrooms: values.bathrooms,
        amenities: values.amenities || [],
        house_rules: values.house_rules,
        cancellation_policy: values.cancellation_policy || "moderate",
      });

      message.success("Tạo listing thành công!");
      router.push(`/listings/${listingResult._id}`);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Có lỗi xảy ra khi tạo listing");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: "Thông tin cơ bản" },
    { title: "Địa điểm" },
    { title: "Giá và tiện nghi" },
  ];

  return (
    <div className={styles.createListingContainer}>
      <Card>
        <Steps current={currentStep} items={steps} className={styles.steps} />
        
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          className={styles.form}
        >
          {currentStep === 0 && (
            <>
              <Form.Item
                name="title"
                label="Tiêu đề"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
              >
                <Input placeholder="Ví dụ: Căn hộ đẹp ở trung tâm" />
              </Form.Item>

              <Form.Item name="description" label="Mô tả">
                <TextArea rows={4} placeholder="Mô tả về chỗ ở của bạn..." />
              </Form.Item>

              <Form.Item
                name="guests"
                label="Số khách tối đa"
                rules={[{ required: true, message: "Vui lòng nhập số khách" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item name="bedrooms" label="Số phòng ngủ">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item name="beds" label="Số giường">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item name="bathrooms" label="Số phòng tắm">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </>
          )}

          {currentStep === 1 && (
            <>
              <Form.Item
                name="country"
                label="Quốc gia"
                rules={[{ required: true, message: "Vui lòng nhập quốc gia" }]}
              >
                <Input placeholder="Việt Nam" />
              </Form.Item>

              <Form.Item
                name="city"
                label="Thành phố"
                rules={[{ required: true, message: "Vui lòng nhập thành phố" }]}
              >
                <Input placeholder="Hà Nội" />
              </Form.Item>

              <Form.Item name="street" label="Địa chỉ">
                <Input placeholder="Số nhà, tên đường" />
              </Form.Item>

              <Form.Item
                name="latitude"
                label="Vĩ độ"
                rules={[{ required: true, message: "Vui lòng nhập vĩ độ" }]}
              >
                <InputNumber style={{ width: "100%" }} step={0.000001} />
              </Form.Item>

              <Form.Item
                name="longitude"
                label="Kinh độ"
                rules={[{ required: true, message: "Vui lòng nhập kinh độ" }]}
              >
                <InputNumber style={{ width: "100%" }} step={0.000001} />
              </Form.Item>
            </>
          )}

          {currentStep === 2 && (
            <>
              <Form.Item
                name="price_base"
                label="Giá mỗi đêm"
                rules={[{ required: true, message: "Vui lòng nhập giá" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} addonAfter="USD" />
              </Form.Item>

              <Form.Item name="cleaning_fee" label="Phí dọn dẹp">
                <InputNumber min={0} style={{ width: "100%" }} addonAfter="USD" />
              </Form.Item>

              <Form.Item name="extra_guest_fee" label="Phí khách thêm">
                <InputNumber min={0} style={{ width: "100%" }} addonAfter="USD" />
              </Form.Item>

              <Form.Item name="amenities" label="Tiện nghi">
                <Select mode="tags" placeholder="Nhập và nhấn Enter">
                  <Option value="wifi">WiFi</Option>
                  <Option value="parking">Bãi đỗ xe</Option>
                  <Option value="kitchen">Bếp</Option>
                  <Option value="air-conditioning">Điều hòa</Option>
                </Select>
              </Form.Item>

              <Form.Item name="house_rules" label="Nội quy nhà">
                <TextArea rows={3} placeholder="Các quy tắc của bạn..." />
              </Form.Item>

              <Form.Item
                name="cancellation_policy"
                label="Chính sách hủy"
                initialValue="moderate"
              >
                <Select>
                  <Option value="flexible">Linh hoạt</Option>
                  <Option value="moderate">Vừa phải</Option>
                  <Option value="strict">Nghiêm ngặt</Option>
                </Select>
              </Form.Item>
            </>
          )}

          <div className={styles.formActions}>
            {currentStep > 0 && (
              <Button onClick={() => setCurrentStep(currentStep - 1)}>
                Quay lại
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                Tiếp theo
              </Button>
            ) : (
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo listing
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}


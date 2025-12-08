"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, InputNumber, Button, Select, message, Card } from "antd";
import { postAccess } from "@/helper/api";

const { TextArea } = Input;
const { Option } = Select;

export default function CreateListingPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const result = await postAccess("listings", values);
      message.success("Tạo listing thành công!");
      router.push("/admin/listings");
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Có lỗi xảy ra khi tạo listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Tạo Listing Mới">
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input placeholder="Ví dụ: Căn hộ đẹp ở trung tâm" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <TextArea rows={4} placeholder="Mô tả về chỗ ở..." />
        </Form.Item>

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

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Tạo Listing
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => router.back()}>
            Hủy
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}


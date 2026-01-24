"use client";

import { Card, Row, Col, Input, Select, Slider, DatePicker, Button, Space, Form } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface ListingFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  onReset: () => void;
}

export interface FilterValues {
  searchText?: string;
  status?: string;
  priceRange?: [number, number];
  ratingRange?: [number, number];
  city?: string;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null;
}

const DEFAULT_PRICE_RANGE = [0, 10000];
const DEFAULT_RATING_RANGE = [0, 5];

const CITIES = [
  "Hà Nội",
  "Hồ Chí Minh",
  "Đà Nẵng",
  "Nha Trang",
  "Hội An",
  "Huế",
  "Cần Thơ",
  "Hải Phòng",
];

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "all" },
  { label: "Đã duyệt", value: "active" },
  { label: "Chờ duyệt", value: "inactive" },
];

export default function ListingFilters({
  onFilterChange,
  onReset,
}: ListingFiltersProps) {
  const [form] = Form.useForm();

  const handleFilterChange = () => {
    const values = form.getFieldsValue();
    onFilterChange({
      searchText: values.searchText,
      status: values.status,
      priceRange: values.priceRange,
      ratingRange: values.ratingRange,
      city: values.city,
      dateRange: values.dateRange,
    });
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: "all",
          priceRange: DEFAULT_PRICE_RANGE,
          ratingRange: DEFAULT_RATING_RANGE,
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item label="Tìm kiếm" name="searchText">
              <Input
                placeholder="Tiêu đề hoặc thành phố..."
                prefix={<SearchOutlined />}
                onChange={handleFilterChange}
                allowClear
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item label="Trạng thái" name="status">
              <Select
                options={STATUS_OPTIONS}
                onChange={handleFilterChange}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item label="Thành phố" name="city">
              <Select
                placeholder="Chọn thành phố"
                options={CITIES.map((c) => ({ label: c, value: c }))}
                allowClear
                onChange={handleFilterChange}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item label="Ngày tạo" name="dateRange">
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                onChange={handleFilterChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Khoảng giá (USD)"
              name="priceRange"
            >
              <Slider
                range
                min={0}
                max={10000}
                step={100}
                marks={{
                  0: "$0",
                  10000: "$10k",
                }}
                onChange={handleFilterChange}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Đánh giá (sao)"
              name="ratingRange"
            >
              <Slider
                range
                min={0}
                max={5}
                step={0.5}
                marks={{
                  0: "0",
                  5: "5",
                }}
                onChange={handleFilterChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row justify="end">
          <Space>
            <Button
              icon={<ClearOutlined />}
              onClick={handleReset}
            >
              Reset
            </Button>
          </Space>
        </Row>
      </Form>
    </Card>
  );
}

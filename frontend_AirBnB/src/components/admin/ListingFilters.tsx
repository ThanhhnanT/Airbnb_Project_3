"use client";

import { Card, Row, Col, Input, Select, Slider, DatePicker, Button, Space, Form, Divider } from "antd";
import { SearchOutlined, ClearOutlined, RefreshOutlined } from "@ant-design/icons";
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
    <Card style={{ marginBottom: 0, width: "100%", border: "none", boxShadow: "none" }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: "all",
          priceRange: DEFAULT_PRICE_RANGE,
          ratingRange: DEFAULT_RATING_RANGE,
        }}
      >
        {/* Row 1: Search, Status, City, Date */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Form.Item label="TÌM KIẾM" name="searchText" style={{ marginBottom: 0 }}>
              <Input
                placeholder="Tiêu đề hoặc thành phố..."
                prefix={<SearchOutlined />}
                onChange={handleFilterChange}
                allowClear
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={5}>
            <Form.Item label="TRẠNG THÁI" name="status" style={{ marginBottom: 0 }}>
              <Select
                options={STATUS_OPTIONS}
                onChange={handleFilterChange}
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={5}>
            <Form.Item label="THÀNH PHỐ" name="city" style={{ marginBottom: 0 }}>
              <Select
                placeholder="Chọn thành phố"
                options={CITIES.map((c) => ({ label: c, value: c }))}
                allowClear
                onChange={handleFilterChange}
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item label="NGÀY TẠO" name="dateRange" style={{ marginBottom: 0 }}>
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                onChange={handleFilterChange}
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 2: Price Range & Rating */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Form.Item
              label="KHOẢNG GIÁ (USD)"
              name="priceRange"
              style={{ marginBottom: 0 }}
            >
              <Slider
                range
                min={0}
                max={10000}
                step={100}
                marks={{
                  0: "$0 -",
                  10000: "$10k",
                }}
                onChange={handleFilterChange}
              />
            </Form.Item>
          </Col>

          <Col xs={24} lg={12}>
            <Form.Item
              label="ĐÁNH GIÁ (SAO)"
              name="ratingRange"
              style={{ marginBottom: 0 }}
            >
              <Slider
                range
                min={0}
                max={5}
                step={0.5}
                marks={{
                  0: "0 -",
                  5: "★",
                }}
                onChange={handleFilterChange}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Reset Button - Right aligned */}
        <Row justify="space-between" align="middle" style={{ marginTop: 24 }}>
          <Col>
            <Space>
              <Button
                type="primary"
                size="large"
                style={{ backgroundColor: "#1890ff", borderRadius: "8px" }}
                onClick={() => {/* Export */}}
              >
                Áp dụng bộ lọc
              </Button>
              <Button
                type="default"
                size="large"
                style={{ borderRadius: "8px" }}
                onClick={() => {/* CSV */}}
              >
                Xuất CSV
              </Button>
            </Space>
          </Col>
          <Col>
            <Button
              type="text"
              icon={<RefreshOutlined />}
              onClick={handleReset}
              size="large"
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </Form>

      <Divider style={{ margin: "24px 0" }} />
    </Card>
  );
}

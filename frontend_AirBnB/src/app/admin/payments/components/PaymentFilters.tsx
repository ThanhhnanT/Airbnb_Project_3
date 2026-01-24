"use client";

import { Card, Form, Input, Button, Space, DatePicker, Select, Row, Col } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";

interface PaymentFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  search?: string;
  dateRange?: [string, string];
  status?: string;
  provider?: string;
  minAmount?: number;
  maxAmount?: number;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({ onFilterChange }) => {
  const [form] = Form.useForm();

  const handleApplyFilters = () => {
    const values = form.getFieldsValue();
    const filters: FilterValues = {
      search: values.search || undefined,
      status: values.status || undefined,
      provider: values.provider || undefined,
      minAmount: values.minAmount || undefined,
      maxAmount: values.maxAmount || undefined,
    };

    if (values.dateRange?.[0] && values.dateRange?.[1]) {
      filters.dateRange = [
        dayjs(values.dateRange[0]).format("YYYY-MM-DD"),
        dayjs(values.dateRange[1]).format("YYYY-MM-DD"),
      ];
    }

    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    form.resetFields();
    onFilterChange({});
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Form form={form} layout="vertical">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={8}>
            <Form.Item name="search" label="Tìm kiếm" noStyle>
              <Input
                placeholder="Tên user, email, booking ID..."
                prefix={<SearchOutlined />}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={24} md={12} lg={8}>
            <Form.Item name="dateRange" label="Khoảng ngày" noStyle>
              <DatePicker.RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={24} md={12} lg={8}>
            <Form.Item name="status" label="Trạng thái" noStyle>
              <Select
                placeholder="Chọn trạng thái"
                allowClear
                options={[
                  { label: "Chờ xử lý", value: "pending" },
                  { label: "Đã thanh toán", value: "paid" },
                  { label: "Thất bại", value: "failed" },
                  { label: "Hoàn tiền", value: "refunded" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={24} md={12} lg={8}>
            <Form.Item name="provider" label="Provider" noStyle>
              <Select
                placeholder="Chọn provider"
                allowClear
                options={[
                  { label: "Stripe", value: "stripe" },
                  { label: "PayPal", value: "paypal" },
                  { label: "Khác", value: "other" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={4}>
            <Form.Item name="minAmount" label="Từ tiền" noStyle>
              <Input type="number" placeholder="Min" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={4}>
            <Form.Item name="maxAmount" label="Đến tiền" noStyle>
              <Input type="number" placeholder="Max" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={24} md={12} lg={4}>
            <Form.Item noStyle>
              <Space style={{ width: "100%" }}>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleApplyFilters}
                  style={{ flex: 1 }}
                >
                  Lọc
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  onClick={handleClearFilters}
                  style={{ flex: 1 }}
                >
                  Xóa
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default PaymentFilters;

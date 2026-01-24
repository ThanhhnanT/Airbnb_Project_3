"use client";

import { useState, useEffect } from "react";
import { Card, Calendar, Badge, Button, Modal, Form, Input, InputNumber, Space, Row, Col, Empty, message, Spin } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

interface CalendarEvent {
  date: string;
  status: "available" | "booked" | "blocked";
  price?: number;
}

interface ListingCalendarProps {
  listingId: string;
  events?: CalendarEvent[];
  onUpdate?: (date: string, status: string, price?: number) => Promise<void>;
  loading?: boolean;
}

export default function ListingCalendar({
  listingId,
  events = [],
  onUpdate,
  loading = false,
}: ListingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [isUpdating, setIsUpdating] = useState(false);

  // Create a map of events by date for quick lookup
  const eventMap = new Map<string, CalendarEvent>();
  events.forEach((event) => {
    eventMap.set(event.date, event);
  });

  const getDateStatus = (date: string): "available" | "booked" | "blocked" | null => {
    const event = eventMap.get(date);
    return event?.status || null;
  };

  const getStatusColor = (status: string | null): string => {
    switch (status) {
      case "booked":
        return "red";
      case "blocked":
        return "gray";
      case "available":
        return "green";
      default:
        return "default";
    }
  };

  const getStatusBadge = (status: string | null): string => {
    switch (status) {
      case "booked":
        return "Đã đặt";
      case "blocked":
        return "Khóa";
      case "available":
        return "Có sẵn";
      default:
        return "—";
    }
  };

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
    const dateStr = date.format("YYYY-MM-DD");
    const event = eventMap.get(dateStr);
    form.setFieldsValue({
      status: event?.status || "available",
      price: event?.price,
    });
    setIsModalVisible(true);
  };

  const handleUpdateDate = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedDate || !onUpdate) return;

      setIsUpdating(true);
      const dateStr = selectedDate.format("YYYY-MM-DD");
      await onUpdate(dateStr, values.status, values.price);
      message.success("Cập nhật ngày thành công");
      setIsModalVisible(false);
    } catch (error) {
      message.error("Có lỗi xảy ra");
    } finally {
      setIsUpdating(false);
    }
  };

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format("YYYY-MM-DD");
    const status = getDateStatus(dateStr);

    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Badge
          color={getStatusColor(status)}
          text={
            <span style={{ fontSize: "12px" }}>
              {getStatusBadge(status)}
            </span>
          }
        />
      </div>
    );
  };

  return (
    <div>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Calendar
              fullscreen
              dateCellRender={dateCellRender}
              onSelect={handleDateSelect}
            />
          </Card>

          {/* Legend */}
          <Card title="Chú Thích">
            <Row gutter={24}>
              <Col xs={24} sm={8}>
                <Badge color="green" text="Có sẵn" />
              </Col>
              <Col xs={24} sm={8}>
                <Badge color="red" text="Đã đặt" />
              </Col>
              <Col xs={24} sm={8}>
                <Badge color="gray" text="Khóa" />
              </Col>
            </Row>
          </Card>

          {/* Date Editor Modal */}
          <Modal
            title={`Cập nhật ngày ${selectedDate?.format("DD/MM/YYYY")}`}
            open={isModalVisible}
            onOk={handleUpdateDate}
            onCancel={() => setIsModalVisible(false)}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={isUpdating}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                status: "available",
              }}
            >
              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
              >
                <select style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #d9d9d9" }}>
                  <option value="available">Có sẵn</option>
                  <option value="booked">Đã đặt (Không chỉnh được)</option>
                  <option value="blocked">Khóa</option>
                </select>
              </Form.Item>

              <Form.Item
                label="Giá mỗi đêm (USD)"
                name="price"
              >
                <InputNumber
                  min={0}
                  step={10}
                  placeholder="Để trống để sử dụng giá cơ bản"
                />
              </Form.Item>

              <div style={{ color: "#999", fontSize: "12px" }}>
                <p>Lưu ý: Bạn không thể thay đổi trạng thái của ngày đã đặt. Chỉ có thể chỉnh sửa giá hoặc khóa ngày.</p>
              </div>
            </Form>
          </Modal>
        </>
      )}
    </div>
  );
}

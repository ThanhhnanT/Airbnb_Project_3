"use client";

import React, { useState, useEffect } from "react";
import { DatePicker, Tabs, Typography, Space, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import styles from "@/styles/search.module.css";
import { start } from "repl";

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dates: [Dayjs | null, Dayjs | null] | null, flexible?: number) => void;
  initialDates?: [Dayjs | null, Dayjs | null] | null;
}

const flexibleOptions = [
  { label: "Ngày chính xác", value: 0 },
  { label: "± 1 ngày", value: 1 },
  { label: "± 2 ngày", value: 2 },
  { label: "± 3 ngày", value: 3 },
  { label: "± 7 ngày", value: 7 },
  { label: "± 14 ngày", value: 14 },
];

const DatePickerModal: React.FC<DatePickerModalProps> = ({ 
  visible, 
  onClose, 
  onSelect,
  initialDates
}) => {
  const [activeTab, setActiveTab] = useState<string>("day");
  const [selectedDates, setSelectedDates] = useState<[Dayjs | null, Dayjs | null] | null>(initialDates || null);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(null);
  const [flexibleDays, setFlexibleDays] = useState<number>(0);

  // Update selectedDates when initialDates change
  useEffect(() => {
    if (!initialDates?.[0] || !initialDates?.[1]) return;
    const today = dayjs().startOf("day");
    let startDate = initialDates[0];
    const endDate = initialDates[1];    

    if (startDate.isBefore(today)) startDate = today;
    
    if (endDate.isBefore(startDate)) {
      setSelectedDates(null);
      return;
    }

    setSelectedDates([startDate, endDate]);
    
    if (
      startDate.isSame(startDate.startOf("month"), "day") &&
      endDate.isSame(endDate.endOf("month"), "day")
    ){
      setActiveTab("month");
      setSelectedMonth(startDate);
    }

  }, [initialDates]);

const normalizeMonthToDateRange = (month: Dayjs) : [Dayjs, Dayjs] => {
  const today = dayjs().startOf("day");
  const startOfMonth = month.startOf("month");
  const endOfMonth = month.endOf("month");

  const checkIn = startOfMonth.isBefore(today)
    ? today
    : startOfMonth;

  return [checkIn, endOfMonth];
};


  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setSelectedDates(dates);
  };

  const handleMonthChange = (month: Dayjs | null) => {
    setSelectedMonth(month);
  }

  const handleConfirm = () => {
    if (activeTab === "day" && selectedDates && selectedDates[0] && selectedDates[1]) {
      onSelect(selectedDates, flexibleDays);
      onClose();
      return;
    }

    if (activeTab === "month" && selectedMonth) {
      const [checkIn, checkOut] = normalizeMonthToDateRange(selectedMonth);
      onSelect([checkIn, checkOut], flexibleDays);
      onClose();
      return;
    }

    if (activeTab === "flexible") {
      onSelect(null, flexibleDays);
      onClose();
    }
  };

  const handleFlexibleSelect = (days: number) => {
    setFlexibleDays(days);
  };

  const FlexibleDateSection = (
    <Space wrap className={styles.flexibleButtons}>
      {flexibleOptions.map((option) => (
        <Button
          key={option.value}
          type={flexibleDays === option.value ? "primary" : "default"}
          className={styles.flexibleButton}
          onClick={() => handleFlexibleSelect(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </Space>
  );

  const tabItems = [
    {
      key: "day",
      label: "Ngày",
      children: (
        <div className={styles.datePickerContent}>
          <RangePicker
            value={selectedDates}
            onChange={handleDateChange}
            format="DD/MM/YYYY"
            className={styles.rangePicker}
            placeholder={["Nhận phòng", "Trả phòng"]}
            disabledDate={(current) => current && current < dayjs().startOf("day")}
            size="large"
            style={{ width: "100%" }}
          />
          <div className={styles.flexibleOptions}>
            <Text className={styles.flexibleLabel}>Linh hoạt về ngày:</Text>
            {FlexibleDateSection}
          </div>
        </div>
      ),
    },
    {
      key: "month",
      label: "Tháng",
      children: (
        <div className={styles.datePickerContent}>
          <DatePicker
            value={selectedMonth}
            onChange={handleMonthChange}
            picker="month"
            format="MM/YYYY"
            disabledDate={(current) => current && current.endOf("month").isBefore(dayjs().startOf("month"))}
            className={styles.monthPicker}
            placeholder="Chọn tháng"
          />
          <div className={styles.flexibleOptions}>
            <Text className={styles.flexibleLabel}>Linh hoạt về ngày:</Text>
            {FlexibleDateSection}
          </div>
        </div>
      ),
    },
    {
      key: "flexible",
      label: "Linh hoạt",
      children: (
        <div className={styles.datePickerContent}>
          <Text className={styles.flexibleLabel}>Chọn khoảng thời gian linh hoạt: </Text>
            {FlexibleDateSection}
        </div>
      ),
    },
  ];

  if (!visible) return null;

  return (
    <div 
      className={styles.datePickerModal} 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={styles.modalHeader}>
        <Typography.Title level={4} className={styles.modalTitle}>
          Chọn ngày
        </Typography.Title>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Đóng"
        />
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className={styles.dateTabs}
      />
      <div className={styles.datePickerFooter}>
        <Button onClick={onClose}>Hủy</Button>
        <Button type="primary" onClick={handleConfirm}>
          Xác nhận
        </Button>
      </div>
    </div>
  );
};

export default DatePickerModal;


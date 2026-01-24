"use client";

import { Modal, Form, DatePicker, Button, Space, Select, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface ComplianceReportModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (filters: {
    startDate: string;
    endDate: string;
    status?: string;
  }) => Promise<void>;
  loading?: boolean;
}

export const ComplianceReportModal: React.FC<ComplianceReportModalProps> = ({
  visible,
  onClose,
  onGenerate,
  loading,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    if (!values.dateRange || values.dateRange.length < 2) {
      message.error("Vui lòng chọn khoảng ngày");
      return;
    }

    try {
      await onGenerate({
        startDate: dayjs(values.dateRange[0]).format("YYYY-MM-DD"),
        endDate: dayjs(values.dateRange[1]).format("YYYY-MM-DD"),
        status: values.status || undefined,
      });
      form.resetFields();
    } catch (error) {
      console.error("Generate report error:", error);
    }
  };

  return (
    <Modal
      title="Báo cáo Tuân thủ & Thuế"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          label="Khoảng ngày"
          name="dateRange"
          rules={[
            {
              required: true,
              message: "Vui lòng chọn khoảng ngày",
            },
          ]}
        >
          <DatePicker.RangePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Trạng thái Payout (tùy chọn)"
          name="status"
        >
          <Select
            placeholder="Tất cả trạng thái"
            allowClear
            options={[
              { label: "Chờ xử lý", value: "pending" },
              { label: "Đã chuyển", value: "paid" },
              { label: "Thất bại", value: "failed" },
            ]}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<DownloadOutlined />}
              loading={loading}
            >
              Tạo báo cáo CSV
            </Button>
            <Button onClick={onClose}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>

      <div style={{ marginTop: 16, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
        <strong>Báo cáo sẽ bao gồm:</strong>
        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
          <li>Tên Host & ID</li>
          <li>Tổng Payout (Toàn bộ & Chỉ đã thanh toán)</li>
          <li>Phí nền tảng</li>
          <li>Khoảng ngày booking</li>
          <li>Trạng thái & Ngày xử lý</li>
        </ul>
      </div>
    </Modal>
  );
};

export default ComplianceReportModal;

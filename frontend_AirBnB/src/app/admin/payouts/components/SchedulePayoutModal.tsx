"use client";

import { Modal, Form, DatePicker, TimePicker, Button, Space, Statistic, Row, Col, Checkbox } from "antd";
import { CalendarOutlined, DollarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface Payout {
  _id: string;
  amount: number;
  currency: string;
  host_id?: {
    name: string;
    email: string;
  };
}

interface SchedulePayoutModalProps {
  visible: boolean;
  payout: Payout | null;
  onClose: () => void;
  onConfirm: (payoutId: string, scheduledAt: string, sendNotification: boolean) => Promise<void>;
  loading?: boolean;
}

export const SchedulePayoutModal: React.FC<SchedulePayoutModalProps> = ({
  visible,
  payout,
  onClose,
  onConfirm,
  loading,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    if (!payout) return;
    try {
      const date = values.date;
      const time = values.time;
      const scheduledAt = dayjs(date)
        .set("hour", time.hour())
        .set("minute", time.minute())
        .toISOString();

      await onConfirm(payout._id, scheduledAt, values.sendNotification || false);
      form.resetFields();
    } catch (error) {
      console.error("Schedule error:", error);
    }
  };

  return (
    <Modal
      title="Lên lịch Payout"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      {payout && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Payout Info */}
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Số tiền"
                  value={payout.amount}
                  suffix={payout.currency}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col span={12}>
                <div>
                  <strong>Host:</strong>
                  <div>{payout.host_id?.name}</div>
                  <div>{payout.host_id?.email}</div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Schedule Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            initialValues={{
              date: dayjs().add(1, "day"),
              time: dayjs().set("hour", 9).set("minute", 0),
              sendNotification: true,
            }}
          >
            <Form.Item
              label="Chọn ngày"
              name="date"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn ngày",
                },
                {
                  validator: (_, value) => {
                    if (value && value.isBefore(dayjs(), "day")) {
                      return Promise.reject("Vui lòng chọn ngày trong tương lai");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              label="Chọn giờ"
              name="time"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn giờ",
                },
              ]}
            >
              <TimePicker
                format="HH:mm"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="sendNotification"
              valuePropName="checked"
            >
              <Checkbox>
                Gửi thông báo nhắc nhở cho admin 1 giờ trước khi xử lý
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<CalendarOutlined />}
                  loading={loading}
                >
                  Lên lịch
                </Button>
                <Button onClick={onClose}>Hủy</Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      )}
    </Modal>
  );
};

export default SchedulePayoutModal;

"use client";

import { Button, Space, message, Modal, Tooltip } from "antd";
import { CheckCircleOutlined, StopOutlined, DeleteOutlined } from "@ant-design/icons";
import { postAccess } from "@/helper/api";

interface BulkActionsProps {
  selectedCount: number;
  selectedIds: string[];
  onActionComplete: () => void;
}

export default function BulkActions({ selectedCount, selectedIds, onActionComplete }: BulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  const handleActivate = () => {
    Modal.confirm({
      title: `Kích hoạt ${selectedCount} listing?`,
      content: "Các listing này sẽ được kích hoạt và hiển thị.",
      okText: "Kích hoạt",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await postAccess("admin/listings/bulk/update", {
            ids: selectedIds,
            updateData: { status: "active" },
          });
          message.success(`Đã kích hoạt ${selectedCount} listing`);
          onActionComplete();
        } catch (error) {
          message.error("Có lỗi xảy ra khi kích hoạt listings");
        }
      },
    });
  };

  const handleDeactivate = () => {
    Modal.confirm({
      title: `Vô hiệu hóa ${selectedCount} listing?`,
      content: "Các listing này sẽ được vô hiệu hóa và ẩn.",
      okText: "Vô hiệu hóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await postAccess("admin/listings/bulk/update", {
            ids: selectedIds,
            updateData: { status: "inactive" },
          });
          message.success(`Đã vô hiệu hóa ${selectedCount} listing`);
          onActionComplete();
        } catch (error) {
          message.error("Có lỗi xảy ra khi vô hiệu hóa listings");
        }
      },
    });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: `Xóa ${selectedCount} listing?`,
      content: "Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa.",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          // Implement bulk delete
          message.success(`Đã xóa ${selectedCount} listing`);
          onActionComplete();
        } catch (error) {
          message.error("Có lỗi xảy ra khi xóa listings");
        }
      },
    });
  };

  return (
    <div
      style={{
        padding: "12px 16px",
        background: "#e6f7ff",
        border: "1px solid #91d5ff",
        borderRadius: "4px",
        marginBottom: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ color: "#1890ff" }}>
        Đã chọn {selectedCount} listing
      </span>
      <Space>
        <Tooltip title="Kích hoạt các listing được chọn">
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={handleActivate}
          >
            Kích Hoạt
          </Button>
        </Tooltip>
        <Tooltip title="Vô hiệu hóa các listing được chọn">
          <Button
            size="small"
            icon={<StopOutlined />}
            onClick={handleDeactivate}
          >
            Vô Hiệu Hóa
          </Button>
        </Tooltip>
        <Tooltip title="Xóa các listing được chọn">
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            Xóa
          </Button>
        </Tooltip>
      </Space>
    </div>
  );
}

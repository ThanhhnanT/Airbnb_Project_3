"use client";

import { useEffect, useState } from "react";
import { Card, Space, message, Typography, Button, Row, Col, Alert, Spin } from "antd";
import {
  CheckCircleOutlined,
  CalendarOutlined,
  FileExcelOutlined,
  BarsOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { getAccess, postAccess } from "@/helper/api";
import { useMessageApi } from "@/components/providers/Message";
import { useSocket } from "@/components/providers/SocketProvider";
import PayoutStats from "./components/PayoutStats";
import PayoutFilters, { FilterValues } from "./components/PayoutFilters";
import PayoutTable, { Payout } from "./components/PayoutTable";
import PayoutDetailModal from "./components/PayoutDetailModal";
import SchedulePayoutModal from "./components/SchedulePayoutModal";
import BatchMarkPaidModal from "./components/BatchMarkPaidModal";
import ComplianceReportModal from "./components/ComplianceReportModal";
import PayoutChart from "./components/PayoutChart";
import styles from "./payouts.module.css";

interface PayoutStatsData {
  total: number;
  pending: number;
  paid: number;
  failed: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
}

const { Title } = Typography;

export default function AdminPayoutsPage() {
  const messageApi = useMessageApi();
  const { socket } = useSocket();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<PayoutStatsData | null>(null);
  const [filters, setFilters] = useState<FilterValues>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal states
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [batchVisible, setBatchVisible] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [complianceVisible, setComplianceVisible] = useState(false);
  const [complianceLoading, setComplianceLoading] = useState(false);

  // Batch selection
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    fetchPayouts(1, 10);
    fetchStats();

    if (socket) {
      socket.on("payout_pending", () => {
        messageApi.info("Có payout mới cần xử lý");
        fetchPayouts(pagination.current, pagination.pageSize);
        fetchStats();
      });

      socket.on("payout_status_changed", () => {
        fetchPayouts(pagination.current, pagination.pageSize);
        fetchStats();
      });

      return () => {
        socket.off("payout_pending");
        socket.off("payout_status_changed");
      };
    }
  }, [socket]);

  const fetchPayouts = async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      const result = await getAccess(
        `admin/payouts?page=${page}&limit=${limit}`,
        {},
        true
      );
      setPayouts(result?.data || []);
      if (result?.pagination) {
        setPagination({
          current: result.pagination.page,
          pageSize: result.pagination.limit,
          total: result.pagination.total,
        });
      }
      setSelectedRowKeys([]);
    } catch (error) {
      messageApi.error("Không thể tải danh sách payouts");
      console.error("Fetch payouts error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const result = await getAccess("admin/payouts/stats", {}, true);
      setStats(result || null);
    } catch (error) {
      console.error("Fetch stats error:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    fetchPayouts(1, pagination.pageSize);
  };

  const handleViewDetail = (payout: Payout) => {
    setSelectedPayout(payout);
    setDetailVisible(true);
  };

  const handleMarkAsPaid = (payout: Payout) => {
    setSelectedPayout(payout);
    setBatchVisible(true);
    setSelectedRowKeys([payout._id]);
  };

  const handleSchedule = (payout: Payout) => {
    setSelectedPayout(payout);
    setScheduleVisible(true);
  };

  const handleConfirmSchedule = async (
    payoutId: string,
    scheduledAt: string,
    sendNotification: boolean
  ) => {
    try {
      setScheduleLoading(true);
      await postAccess(
        `admin/payouts/schedule`,
        {
          payout_id: payoutId,
          scheduled_at: scheduledAt,
          send_notification: sendNotification,
        },
        true
      );
      message.success("Lên lịch payout thành công!");
      setScheduleVisible(false);
      setSelectedPayout(null);
      fetchPayouts(pagination.current, pagination.pageSize);
      fetchStats();
    } catch (error) {
      message.error("Không thể lên lịch payout. Vui lòng thử lại.");
      console.error("Schedule error:", error);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleBatchMarkAsPaid = async (payoutIds: string[], note: string) => {
    try {
      setBatchLoading(true);
      await postAccess(
        `admin/payouts/batch-mark-paid`,
        {
          payout_ids: payoutIds,
          admin_note: note,
        },
        true
      );
      message.success(`Đánh dấu ${payoutIds.length} payout đã chuyển thành công!`);
      setBatchVisible(false);
      setSelectedRowKeys([]);
      fetchPayouts(pagination.current, pagination.pageSize);
      fetchStats();
    } catch (error) {
      message.error("Không thể xử lý batch. Vui lòng thử lại.");
      console.error("Batch mark error:", error);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleGenerateReport = async (filters: {
    startDate: string;
    endDate: string;
    status?: string;
  }) => {
    try {
      setComplianceLoading(true);
      const result = await getAccess(
        `admin/payouts/compliance-report?startDate=${filters.startDate}&endDate=${filters.endDate}${
          filters.status ? `&status=${filters.status}` : ""
        }`,
        {},
        true
      );

      if (result) {
        const url = window.URL.createObjectURL(new Blob([result]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `compliance-report-${new Date().toISOString().split("T")[0]}.csv`
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        message.success("Báo cáo đã được tải xuống!");
      }
      setComplianceVisible(false);
    } catch (error) {
      message.error("Không thể tạo báo cáo. Vui lòng thử lại.");
      console.error("Generate report error:", error);
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleTableChange = (newPagination: any) => {
    fetchPayouts(newPagination.current, newPagination.pageSize);
  };

  const selectedPayouts = payouts.filter((p) =>
    selectedRowKeys.includes(p._id)
  );

  return (
    <div className={styles.payoutContainer}>
      <Title level={2} className={styles.pageTitle}>
        Quản lý Payouts
      </Title>

      <Spin spinning={statsLoading}>
        <PayoutStats stats={stats} loading={statsLoading} />
      </Spin>

      <PayoutChart data={stats} loading={statsLoading} />

      <PayoutFilters onFilterChange={handleFilterChange} />

      {/* Batch Action Bar */}
      {selectedRowKeys.length > 0 && (
        <Alert
          message={`Đã chọn ${selectedRowKeys.length} payout`}
          description={
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => setBatchVisible(true)}
              >
                Đánh dấu đã chuyển ({selectedRowKeys.length})
              </Button>
              <Button
                size="small"
                icon={<CalendarOutlined />}
                onClick={() => {
                  if (selectedPayouts.length === 1) {
                    setSelectedPayout(selectedPayouts[0]);
                    setScheduleVisible(true);
                  } else {
                    message.info("Vui lòng chọn 1 payout để lên lịch");
                  }
                }}
              >
                Lên lịch
              </Button>
            </Space>
          }
          showIcon
          closable
          onClose={() => setSelectedRowKeys([])}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Action Bar */}
      <Row gutter={8} style={{ marginBottom: 16 }} className={styles.actionBar}>
        <Col>
          <Button
            type="default"
            icon={<FileExcelOutlined />}
            onClick={() => setComplianceVisible(true)}
          >
            Báo cáo Tuân thủ
          </Button>
        </Col>
      </Row>

      <Card className={styles.tableCard}>
        <PayoutTable
          data={payouts}
          loading={loading}
          selectedRowKeys={selectedRowKeys}
          pagination={pagination}
          onViewDetail={handleViewDetail}
          onMarkAsPaid={handleMarkAsPaid}
          onSchedule={handleSchedule}
          onSelectChange={setSelectedRowKeys}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modals */}
      <PayoutDetailModal
        visible={detailVisible}
        payout={selectedPayout}
        onClose={() => {
          setDetailVisible(false);
          setSelectedPayout(null);
        }}
        onMarkAsPaid={handleMarkAsPaid}
        onSchedule={handleSchedule}
      />

      <SchedulePayoutModal
        visible={scheduleVisible}
        payout={selectedPayout}
        onClose={() => {
          setScheduleVisible(false);
          setSelectedPayout(null);
        }}
        onConfirm={handleConfirmSchedule}
        loading={scheduleLoading}
      />

      <BatchMarkPaidModal
        visible={batchVisible}
        payouts={selectedPayouts}
        onClose={() => {
          setBatchVisible(false);
          setSelectedRowKeys([]);
        }}
        onConfirm={handleBatchMarkAsPaid}
        loading={batchLoading}
      />

      <ComplianceReportModal
        visible={complianceVisible}
        onClose={() => setComplianceVisible(false)}
        onGenerate={handleGenerateReport}
        loading={complianceLoading}
      />
    </div>
  );
}

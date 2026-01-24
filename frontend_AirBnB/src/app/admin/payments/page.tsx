"use client";

import { useEffect, useState } from "react";
import { Card, Space, message, Typography, Spin } from "antd";
import { getAccess, postAccess } from "@/helper/api";
import { useSocket } from "@/components/providers/SocketProvider";
import PaymentStats from "./components/PaymentStats";
import PaymentFilters, { FilterValues } from "./components/PaymentFilters";
import PaymentTable, { Payment } from "./components/PaymentTable";
import PaymentDetailModal from "./components/PaymentDetailModal";
import RefundModal from "./components/RefundModal";
import DisputeModal from "./components/DisputeModal";
import PaymentCharts from "@/components/admin/PaymentCharts";
import styles from "./payments.module.css";

interface PaymentStatsData {
  total: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
}

interface Dispute {
  _id: string;
  status: string;
  reason: string;
  createdAt: string;
  resolved_at?: string;
}

const { Title } = Typography;

export default function PaymentsPage() {
  const { socket } = useSocket();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStatsData | null>(null);
  const [filters, setFilters] = useState<FilterValues>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal states
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundVisible, setRefundVisible] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [disputeVisible, setDisputeVisible] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputeLoading, setDisputeLoading] = useState(false);

  useEffect(() => {
    fetchPayments(1, 10);
    fetchStats();

    // Listen for real-time updates
    if (socket) {
      socket.on("payment_status_changed", () => {
        fetchPayments(pagination.current, pagination.pageSize);
        fetchStats();
      });

      socket.on("refund_completed", () => {
        fetchPayments(pagination.current, pagination.pageSize);
        fetchStats();
        message.success("Hoàn tiền đã hoàn thành!");
      });

      return () => {
        socket.off("payment_status_changed");
        socket.off("refund_completed");
      };
    }
  }, [socket]);

  const fetchPayments = async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      const result = await getAccess(
        `admin/payments?page=${page}&limit=${limit}`,
        {},
        true
      );
      setPayments(result?.data || []);
      if (result?.pagination) {
        setPagination({
          current: result.pagination.page,
          pageSize: result.pagination.limit,
          total: result.pagination.total,
        });
      }
    } catch (error) {
      message.error("Không thể tải danh sách payments");
      console.error("Fetch payments error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const result = await getAccess("admin/payments/stats", {}, true);
      setStats(result || null);
    } catch (error) {
      console.error("Fetch stats error:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    // Implement advanced filtering with backend
    fetchPayments(1, pagination.pageSize);
  };

  const handleViewDetail = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailVisible(true);
  };

  const handleRefund = (payment: Payment) => {
    setSelectedPayment(payment);
    setRefundVisible(true);
  };

  const handleConfirmRefund = async (paymentId: string, reason: string) => {
    try {
      setRefundLoading(true);
      await postAccess(
        `admin/refunds`,
        {
          payment_id: paymentId,
          reason,
        },
        true
      );
      message.success("Hoàn tiền thành công!");
      setRefundVisible(false);
      setDetailVisible(false);
      fetchPayments(pagination.current, pagination.pageSize);
      fetchStats();
    } catch (error) {
      message.error("Không thể hoàn tiền. Vui lòng thử lại.");
      console.error("Refund error:", error);
    } finally {
      setRefundLoading(false);
    }
  };

  const handleViewDispute = async (payment: Payment) => {
    setSelectedPayment(payment);
    try {
      const result = await getAccess(
        `disputes?payment_id=${payment._id}`,
        {},
        true
      );
      setDisputes(result || []);
    } catch (error) {
      console.error("Fetch disputes error:", error);
      setDisputes([]);
    }
    setDisputeVisible(true);
  };

  const handleCreateDispute = async (paymentId: string, reason: string) => {
    try {
      setDisputeLoading(true);
      await postAccess(
        `disputes`,
        {
          payment_id: paymentId,
          reason,
        },
        true
      );
      // Refresh disputes list
      const result = await getAccess(
        `disputes?payment_id=${paymentId}`,
        {},
        true
      );
      setDisputes(result || []);
      message.success("Tạo tranh chấp thành công!");
    } catch (error) {
      message.error("Không thể tạo tranh chấp. Vui lòng thử lại.");
      console.error("Create dispute error:", error);
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const result = await getAccess("admin/payments/export", {}, true);
      // Handle CSV download
      if (result) {
        const url = window.URL.createObjectURL(new Blob([result]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "payments.csv");
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      }
    } catch (error) {
      message.error("Không thể xuất dữ liệu. Vui lòng thử lại.");
      console.error("Export error:", error);
    }
  };

  const handleTableChange = (newPagination: any) => {
    fetchPayments(newPagination.current, newPagination.pageSize);
  };

  return (
    <div className={styles.paymentContainer}>
      <Title level={2} className={styles.pageTitle}>
        Quản lý Thanh toán
      </Title>

      <Spin spinning={statsLoading}>
        <PaymentStats stats={stats} loading={statsLoading} />
      </Spin>

      <PaymentCharts data={stats} loading={statsLoading} />

      <PaymentFilters onFilterChange={handleFilterChange} />

      <Card className={styles.tableCard}>
        <PaymentTable
          data={payments}
          loading={loading}
          pagination={pagination}
          onViewDetail={handleViewDetail}
          onRefund={handleRefund}
          onExportCSV={handleExportCSV}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modals */}
      <PaymentDetailModal
        visible={detailVisible}
        payment={selectedPayment}
        onClose={() => {
          setDetailVisible(false);
          setSelectedPayment(null);
        }}
        onRefund={handleRefund}
        loading={refundLoading}
      />

      <RefundModal
        visible={refundVisible}
        payment={selectedPayment}
        onClose={() => {
          setRefundVisible(false);
          setSelectedPayment(null);
        }}
        onConfirm={handleConfirmRefund}
        loading={refundLoading}
      />

      <DisputeModal
        visible={disputeVisible}
        payment={selectedPayment}
        disputes={disputes}
        onClose={() => {
          setDisputeVisible(false);
          setSelectedPayment(null);
        }}
        onCreateDispute={handleCreateDispute}
        loading={disputeLoading}
      />
    </div>
  );
}


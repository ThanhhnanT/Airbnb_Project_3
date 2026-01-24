'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Spin,
  Tag,
  Statistic,
  Row,
  Col,
  message,
  Modal,
  Drawer,
  Empty,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import Cookies from 'js-cookie';
import dayjs from 'dayjs';
import styles from './refunds.module.css';

interface RefundRecord {
  _id: string;
  booking_id: {
    _id: string;
    check_in: string;
    check_out: string;
    listing_id: {
      title: string;
    };
  };
  guest_id: {
    name: string;
    email: string;
  };
  amount: number;
  currency: string;
  reason: string;
  description: string;
  status: string;
  host_confirmation_status: string;
  approved_at: string;
  host_confirmed_at: string;
  requested_at: string;
}

interface RefundStats {
  total_pending: number;
  total_confirmed: number;
  total_amount: number;
  average_amount: number;
}

export default function HostRefundsPage() {
  const [pendingRefunds, setPendingRefunds] = useState<RefundRecord[]>([]);
  const [confirmedRefunds, setConfirmedRefunds] = useState<RefundRecord[]>([]);
  const [stats, setStats] = useState<RefundStats>({
    total_pending: 0,
    total_confirmed: 0,
    total_amount: 0,
    average_amount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingRefundId, setPendingRefundId] = useState<string | null>(null);

  const API_DOMAIN =
    process.env.NEXT_PUBLIC_API || process.env.API || 'http://localhost:9000/';
  const token = Cookies.get('access_token') || '';

  // Fetch refunds
  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);

      // Fetch pending refunds
      const pendingResult = await axios.get(
        `${API_DOMAIN}refunds?status=pending_host_confirmation`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Pending refunds result:', pendingResult.data);

      const pendingData = Array.isArray(pendingResult.data)
        ? pendingResult.data
        : pendingResult.data?.data || [];

      setPendingRefunds(pendingData);

      // Fetch confirmed refunds
      const confirmedResult = await axios.get(
        `${API_DOMAIN}refunds?status=confirmed_by_host`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Confirmed refunds result:', confirmedResult.data);

      const confirmedData = Array.isArray(confirmedResult.data)
        ? confirmedResult.data
        : confirmedResult.data?.data || [];

      setConfirmedRefunds(confirmedData);

      // Calculate stats
      const totalPending = pendingData.length;
      const totalConfirmed = confirmedData.length;
      const allRefunds = [...pendingData, ...confirmedData];
      const totalAmount = allRefunds.reduce((sum, r) => sum + r.amount, 0);
      const averageAmount = allRefunds.length > 0 ? totalAmount / allRefunds.length : 0;

      setStats({
        total_pending: totalPending,
        total_confirmed: totalConfirmed,
        total_amount: totalAmount,
        average_amount: averageAmount,
      });
    } catch (error) {
      console.error('Error fetching refunds:', error);
      message.error('Lỗi khi tải danh sách hoàn tiền');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRefund = (refundId: string) => {
    setPendingRefundId(refundId);
    setConfirmModalVisible(true);
  };

  const handleConfirmOk = async () => {
    if (!pendingRefundId) return;

    try {
      setConfirming(true);

      const response = await axios.patch(
        `${API_DOMAIN}refunds/${pendingRefundId}/confirm-by-host`,
        {},
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Refund confirmed:', response.data);

      message.success('Hoàn tiền được xác nhận thành công');
      setDrawerVisible(false);
      setSelectedRefund(null);
      setConfirmModalVisible(false);
      setPendingRefundId(null);

      // Refresh refunds
      fetchRefunds();
    } catch (error: any) {
      console.error('Error confirming refund:', error);
      const errorMsg =
        error.response?.data?.message ||
        'Lỗi khi xác nhận hoàn tiền';
      message.error(errorMsg);
    } finally {
      setConfirming(false);
    }
  };

  const handleShowDetails = (refund: RefundRecord) => {
    setSelectedRefund(refund);
    setDrawerVisible(true);
  };

  const pendingColumns = [
    {
      title: 'Phòng',
      dataIndex: ['booking_id', 'listing_id', 'title'],
      key: 'listing_title',
      render: (text: string) => <span>{text || 'N/A'}</span>,
    },
    {
      title: 'Khách',
      dataIndex: ['guest_id', 'name'],
      key: 'guest_name',
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: RefundRecord) => (
        <strong>
          {amount} {record.currency}
        </strong>
      ),
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => {
        const reasonMap: { [key: string]: string } = {
          guest_request: 'Yêu cầu của khách',
          safety_issue: 'Vấn đề an toàn',
          not_as_described: 'Không như mô tả',
          host_unresponsive: 'Host không phản hồi',
          other: 'Khác',
        };
        return reasonMap[reason] || reason;
      },
    },
    {
      title: 'Yêu cầu lúc',
      dataIndex: 'requested_at',
      key: 'requested_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: RefundRecord) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleShowDetails(record)}
          >
            Chi tiết
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            size="small"
            onClick={() => handleConfirmRefund(record._id)}
            loading={confirming}
          >
            Xác nhận
          </Button>
        </Space>
      ),
    },
  ];

  const confirmedColumns = [
    {
      title: 'Phòng',
      dataIndex: ['booking_id', 'listing_id', 'title'],
      key: 'listing_title',
      render: (text: string) => <span>{text || 'N/A'}</span>,
    },
    {
      title: 'Khách',
      dataIndex: ['guest_id', 'name'],
      key: 'guest_name',
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: RefundRecord) => (
        <strong>
          {amount} {record.currency}
        </strong>
      ),
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => {
        const reasonMap: { [key: string]: string } = {
          guest_request: 'Yêu cầu của khách',
          safety_issue: 'Vấn đề an toàn',
          not_as_described: 'Không như mô tả',
          host_unresponsive: 'Host không phản hồi',
          other: 'Khác',
        };
        return reasonMap[reason] || reason;
      },
    },
    {
      title: 'Xác nhận lúc',
      dataIndex: 'host_confirmed_at',
      key: 'host_confirmed_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: RefundRecord) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleShowDetails(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card>
        <h2>Quản lý Hoàn tiền</h2>
        <p>Quản lý tất cả các yêu cầu hoàn tiền từ khách hàng</p>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '30px' }}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Chờ xác nhận"
              value={stats.total_pending}
              valueStyle={{ color: '#ff5a5f' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Đã xác nhận"
              value={stats.total_confirmed}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Tổng hoàn"
              value={stats.total_amount}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Trung bình"
              value={stats.average_amount}
              prefix="$"
              precision={2}
            />
          </Col>
        </Row>

        {/* Tabs */}
        <Spin spinning={loading}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'pending',
                label: `Chờ xác nhận (${stats.total_pending})`,
                children: (
                  <>
                    {pendingRefunds.length > 0 ? (
                      <Table
                        columns={pendingColumns}
                        dataSource={pendingRefunds}
                        rowKey="_id"
                        pagination={{ pageSize: 10 }}
                      />
                    ) : (
                      <Empty description="Không có hoàn tiền chờ xác nhận" />
                    )}
                  </>
                ),
              },
              {
                key: 'confirmed',
                label: `Đã xác nhận (${stats.total_confirmed})`,
                children: (
                  <>
                    {confirmedRefunds.length > 0 ? (
                      <Table
                        columns={confirmedColumns}
                        dataSource={confirmedRefunds}
                        rowKey="_id"
                        pagination={{ pageSize: 10 }}
                      />
                    ) : (
                      <Empty description="Không có hoàn tiền đã xác nhận" />
                    )}
                  </>
                ),
              },
            ]}
          />
        </Spin>
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title="Chi tiết hoàn tiền"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedRefund && (
          <Spin spinning={confirming}>
            <div className={styles.drawerContent}>
              <div className={styles.section}>
                <h3>Thông tin phòng</h3>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Tiêu đề:</span>
                  <span>
                    {selectedRefund.booking_id?.listing_id?.title || 'N/A'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Check-in:</span>
                  <span>
                    {dayjs(selectedRefund.booking_id?.check_in).format(
                      'DD/MM/YYYY'
                    )}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Check-out:</span>
                  <span>
                    {dayjs(selectedRefund.booking_id?.check_out).format(
                      'DD/MM/YYYY'
                    )}
                  </span>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Thông tin khách</h3>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Tên:</span>
                  <span>{selectedRefund.guest_id?.name || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Email:</span>
                  <span>{selectedRefund.guest_id?.email || 'N/A'}</span>
                </div>
              </div>

              <div className={styles.section}>
                <h3>Thông tin hoàn tiền</h3>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Số tiền:</span>
                  <span className={styles.amount}>
                    {selectedRefund.amount} {selectedRefund.currency}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Lý do:</span>
                  <span>{selectedRefund.reason}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Mô tả:</span>
                  <span>{selectedRefund.description}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Trạng thái:</span>
                  <Tag color={selectedRefund.status === 'confirmed_by_host' ? 'green' : 'orange'}>
                    {selectedRefund.status === 'confirmed_by_host'
                      ? 'Đã xác nhận'
                      : 'Chờ xác nhận'}
                  </Tag>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Yêu cầu lúc:</span>
                  <span>
                    {dayjs(selectedRefund.requested_at).format(
                      'DD/MM/YYYY HH:mm'
                    )}
                  </span>
                </div>
                {selectedRefund.approved_at && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Phê duyệt lúc:</span>
                    <span>
                      {dayjs(selectedRefund.approved_at).format('DD/MM/YYYY HH:mm')}
                    </span>
                  </div>
                )}
                {selectedRefund.host_confirmed_at && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Xác nhận lúc:</span>
                    <span>
                      {dayjs(selectedRefund.host_confirmed_at).format(
                        'DD/MM/YYYY HH:mm'
                      )}
                    </span>
                  </div>
                )}
              </div>

              {selectedRefund.status === 'pending_host_confirmation' && (
                <div className={styles.actionButtons}>
                  <Button
                    type="primary"
                    block
                    onClick={() => handleConfirmRefund(selectedRefund._id)}
                    loading={confirming}
                  >
                    Xác nhận hoàn tiền
                  </Button>
                </div>
              )}
            </div>
          </Spin>
        )}
      </Drawer>

      <Modal
        title="Xác nhận hoàn tiền"
        open={confirmModalVisible}
        onOk={handleConfirmOk}
        onCancel={() => setConfirmModalVisible(false)}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={confirming}
      >
        <p>Bạn có chắc chắn muốn xác nhận hoàn tiền này? Thao tác không thể hoàn tác.</p>
      </Modal>
    </div>
  );
}

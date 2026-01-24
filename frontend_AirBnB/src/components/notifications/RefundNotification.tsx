'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Space, Drawer, Spin } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import Cookies from 'js-cookie';
import { io, Socket } from 'socket.io-client';
import styles from './refund-notification.module.css';

interface RefundNotificationData {
  refund_id: string;
  booking_id: string;
  guest_name: string;
  amount: number;
  currency: string;
  listing_title: string;
  message: string;
}

interface RefundNotificationProps {
  userId?: string;
  onRefundConfirmed?: () => void;
}

export const RefundNotification: React.FC<RefundNotificationProps> = ({
  userId,
  onRefundConfirmed,
}) => {
  const [notifications, setNotifications] = useState<RefundNotificationData[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<RefundNotificationData | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Connect to socket.io
  useEffect(() => {
    const API_DOMAIN = process.env.NEXT_PUBLIC_API || process.env.API || 'http://localhost:9000/';
    const socketUrl = API_DOMAIN.replace('/api/', '').replace(/\/$/, '');

    const newSocket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('[RefundNotification] Connected to socket');
    });

    newSocket.on('refund_approved_waiting_host_confirmation', (data: RefundNotificationData) => {
      console.log('[RefundNotification] Received refund notification:', data);
      setNotifications((prev) => [...prev, data]);
    });

    newSocket.on('disconnect', () => {
      console.log('[RefundNotification] Disconnected from socket');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleConfirmRefund = async () => {
    if (!selectedRefund) return;

    try {
      setConfirming(true);
      const API_DOMAIN = process.env.NEXT_PUBLIC_API || process.env.API || 'http://localhost:9000/';
      const token = Cookies.get('access_token') || '';

      const response = await axios.patch(
        `${API_DOMAIN}refunds/${selectedRefund.refund_id}/confirm-by-host`,
        {},
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[RefundNotification] Refund confirmed:', response.data);

      // Remove from notifications
      setNotifications((prev) =>
        prev.filter((n) => n.refund_id !== selectedRefund.refund_id)
      );

      // Close drawer and reset
      setDrawerVisible(false);
      setSelectedRefund(null);

      // Call callback if provided
      if (onRefundConfirmed) {
        onRefundConfirmed();
      }
    } catch (error) {
      console.error('[RefundNotification] Error confirming refund:', error);
      alert('Lỗi khi xác nhận hoàn tiền. Vui lòng thử lại.');
    } finally {
      setConfirming(false);
    }
  };

  const handleDismiss = (refundId: string) => {
    setNotifications((prev) => prev.filter((n) => n.refund_id !== refundId));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      <div className={styles.notificationContainer}>
        {notifications.map((notification) => (
          <Alert
            key={notification.refund_id}
            message={notification.message}
            description={
              <div className={styles.notificationContent}>
                <p>
                  <strong>Phòng:</strong> {notification.listing_title}
                </p>
                <p>
                  <strong>Khách:</strong> {notification.guest_name}
                </p>
                <p>
                  <strong>Số tiền hoàn:</strong> {notification.amount} {notification.currency}
                </p>
                <Space style={{ marginTop: '10px' }}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => {
                      setSelectedRefund(notification);
                      setDrawerVisible(true);
                    }}
                  >
                    Xác nhận
                  </Button>
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handleDismiss(notification.refund_id)}
                  >
                    Đóng
                  </Button>
                </Space>
              </div>
            }
            type="warning"
            closable
            onClose={() => handleDismiss(notification.refund_id)}
            style={{ marginBottom: '10px' }}
          />
        ))}
      </div>

      <Drawer
        title="Xác nhận Hoàn tiền"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedRefund && (
          <div>
            <Spin spinning={confirming}>
              <div className={styles.drawerContent}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Phòng:</span>
                  <span>{selectedRefund.listing_title}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Khách:</span>
                  <span>{selectedRefund.guest_name}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Số tiền hoàn:</span>
                  <span className={styles.amount}>
                    {selectedRefund.amount} {selectedRefund.currency}
                  </span>
                </div>

                <div className={styles.warningBox}>
                  <p>
                    Khi bạn xác nhận, số tiền hoàn sẽ được xử lý ngay lập tức đến tài khoản
                    thanh toán của khách hàng trong vòng 3-5 ngày làm việc.
                  </p>
                </div>

                <Space style={{ width: '100%', marginTop: '20px' }}>
                  <Button
                    type="primary"
                    onClick={handleConfirmRefund}
                    disabled={confirming}
                    block
                  >
                    Xác nhận Hoàn tiền
                  </Button>
                  <Button onClick={() => setDrawerVisible(false)} block>
                    Hủy
                  </Button>
                </Space>
              </div>
            </Spin>
          </div>
        )}
      </Drawer>
    </>
  );
};

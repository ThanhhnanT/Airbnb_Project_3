"use client";

import { useState, useEffect } from "react";
import { Badge, Button, Dropdown, Typography, Space, Empty } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useSocket } from "@/components/providers/SocketProvider";
import { useRouter, usePathname } from "next/navigation";
import { getUserProfile } from "@/service/user";
import Cookies from "js-cookie";
import type { MenuProps } from "antd";

const { Text } = Typography;

interface Notification {
  id: string;
  type: "payout_pending" | "payout_paid" | "bank_account_required" | "payment_new" | "booking_new" | "checkout_completed";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
  link_action?: string;
}

export default function NotificationBell() {
  const { socket, connected } = useSocket();
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState<'admin' | 'host' | 'guest' | null>(null);

  // Fetch user role on mount and when pathname changes
  useEffect(() => {
    const fetchUserRole = async () => {
      const accessToken = Cookies.get("access_token");
      const adminToken = Cookies.get("admin_token");
      
      if (!accessToken && !adminToken) {
        setUserRole(null);
        console.log('[NotificationBell] No tokens found, setting role to null');
        return;
      }

      try {
        // Check if admin (use admin_token if in admin routes)
        const isAdminRoute = pathname?.startsWith("/admin");
        const user = await getUserProfile(isAdminRoute);
        const role = user?.role?.type || 'guest';
        setUserRole(role);
        console.log(`[NotificationBell] User role detected: ${role} (isAdminRoute: ${isAdminRoute}, userId: ${user?._id || user?.id})`);
      } catch (error) {
        console.error('Error fetching user role for notifications:', error);
        setUserRole('guest');
      }
    };

    fetchUserRole();
  }, [pathname]);

  useEffect(() => {
    if (!socket || !connected || !userRole) {
      console.log(`[NotificationBell] Not setting up listeners - socket: ${!!socket}, connected: ${connected}, userRole: ${userRole}`);
      return;
    }

    console.log(`[NotificationBell] Setting up listeners for role: ${userRole}`);

    // Admin notifications: payout_pending, payment_new, booking_new
    if (userRole === 'admin') {
      console.log('[NotificationBell] Registering admin listeners: payout_pending, payment_new, booking_new');
      
      // Listen for payout_pending notifications (for admin only)
      socket.on("payout_pending", (data: any) => {
        console.log('[NotificationBell] Received payout_pending notification:', data);
        const newNotification: Notification = {
          id: `payout_${data.payout_id}_${Date.now()}`,
          type: "payout_pending",
          title: "Payout mới cần xử lý",
          message: data.message || `Có payout mới: ${data.amount} ${data.currency}`,
          timestamp: new Date(),
          read: false,
          data: data,
        };
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      // Listen for payment_new notifications (for admin only)
      socket.on("payment_new", (data: any) => {
        console.log('[NotificationBell] Received payment_new notification:', data);
        const newNotification: Notification = {
          id: `payment_${data.payment_id}_${Date.now()}`,
          type: "payment_new",
          title: "Thanh toán mới",
          message: data.message || `Có thanh toán mới: ${data.amount} ${data.currency}`,
          timestamp: new Date(),
          read: false,
          data: data,
        };
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      // Listen for booking_new notifications (for admin only)
      socket.on("booking_new", (data: any) => {
        console.log('[NotificationBell] Received booking_new notification:', data);
        const newNotification: Notification = {
          id: `booking_${data.booking_id}_${Date.now()}`,
          type: "booking_new",
          title: "Đặt phòng mới",
          message: data.message || `Có đặt phòng mới từ ${data.guest_name || 'Guest'}`,
          timestamp: new Date(),
          read: false,
          data: data,
        };
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    }

    // Host notifications: bank_account_required, checkout_completed
    if (userRole === 'host') {
      console.log('[NotificationBell] Registering host listeners: bank_account_required, checkout_completed');
      
      // Listen for bank_account_required notifications (for host only)
      socket.on("bank_account_required", (data: any) => {
        console.log('[NotificationBell] Received bank_account_required notification:', data);
        const newNotification: Notification = {
          id: `bank_account_${data.booking_id}_${Date.now()}`,
          type: "bank_account_required",
          title: "Yêu cầu thông tin ngân hàng",
          message: data.message || "Có khách đặt phòng của bạn, vui lòng cung cấp tài khoản ngân hàng",
          timestamp: new Date(),
          read: false,
          data: data,
        };
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      // Listen for checkout_completed notifications (for host)
      socket.on("checkout_completed", (data: any) => {
        console.log('[NotificationBell] Received checkout_completed notification:', data);
        const newNotification: Notification = {
          id: `checkout_${data.booking_id}_${Date.now()}`,
          type: "checkout_completed",
          title: "Chuyến đi hoàn thành",
          message: data.message || "Chuyến đi của khách đã hoàn thành, vui lòng để lại đánh giá",
          timestamp: new Date(),
          read: false,
          data: data,
          link_action: data.link_action || `/reviews/write/${data.booking_id}`,
        };
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    }

    // Guest: không lắng nghe notification nào (có thể thêm booking confirmation sau)
    if (userRole === 'guest') {
      console.log('[NotificationBell] Guest role - no notifications to listen for');
    }

    return () => {
      console.log(`[NotificationBell] Cleaning up listeners for role: ${userRole}`);
      // Clean up all listeners
      socket.off("payout_pending");
      socket.off("payment_new");
      socket.off("booking_new");
      socket.off("bank_account_required");
      socket.off("checkout_completed");
    };
  }, [socket, connected, userRole]);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Navigate based on link_action if available
    if (notification.link_action) {
      router.push(notification.link_action);
    } 
    // Fallback to type-based navigation for backward compatibility
    else if (notification.type === "payout_pending" && notification.data?.payout_id) {
      router.push("/admin/payouts");
    } else if (notification.type === "payment_new" && notification.data?.payment_id) {
      router.push("/admin/payments");
    } else if (notification.type === "booking_new" && notification.data?.booking_id) {
      router.push("/admin/bookings");
    } else if (notification.type === "bank_account_required" && notification.data?.action_url) {
      router.push(notification.data.action_url);
    } else if (notification.type === "checkout_completed" && notification.data?.booking_id) {
      router.push(`/reviews/write/${notification.data.booking_id}`);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const notificationItems: MenuProps["items"] = [
    {
      key: "header",
      label: (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
          <Text strong>Thông báo</Text>
          {unreadCount > 0 && (
            <Button type="link" size="small" onClick={markAllAsRead}>
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
      ),
      type: "group",
    },
    {
      type: "divider",
    },
    ...(notifications.length === 0
      ? [
          {
            key: "empty",
            label: (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Không có thông báo mới"
                />
              </div>
            ),
          },
        ]
      : notifications.map((notification) => ({
          key: notification.id,
          label: (
            <div
              onClick={() => handleNotificationClick(notification)}
              style={{
                padding: "12px",
                cursor: "pointer",
                backgroundColor: notification.read ? "transparent" : "#f0f7ff",
                borderRadius: "4px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e6f4ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = notification.read ? "transparent" : "#f0f7ff";
              }}
            >
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Text strong style={{ fontSize: 14 }}>
                    {notification.title}
                  </Text>
                  {!notification.read && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#1890ff",
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {notification.message}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {notification.timestamp.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Space>
            </div>
          ),
        }))),
  ];

  return (
    <Dropdown
      menu={{ items: notificationItems }}
      placement="bottomRight"
      trigger={["click"]}
      overlayStyle={{ width: 360, maxHeight: 500 }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          shape="circle"
          icon={<BellOutlined style={{ color: pathname?.startsWith("/admin") ? "#fff" : undefined }} />}
          style={{
            fontSize: 18,
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: pathname?.startsWith("/admin") ? "1px solid #fff" : undefined,
            backgroundColor: "transparent",
            color: pathname?.startsWith("/admin") ? "#fff" : undefined,
          }}
        />
      </Badge>
    </Dropdown>
  );
}

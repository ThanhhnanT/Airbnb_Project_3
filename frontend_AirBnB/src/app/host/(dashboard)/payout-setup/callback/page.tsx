"use client";

import { useEffect } from "react";
import { Spin, Result } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

export default function StripeCallbackPage() {
  useEffect(() => {
    // Thông báo cho parent window rằng onboarding đã hoàn tất
    if (window.opener) {
      window.opener.postMessage('stripe-onboarding-complete', '*');
      // Đóng popup sau 2 giây
      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      // Nếu không phải popup, redirect về trang setup
      setTimeout(() => {
        window.location.href = '/host/payout-setup?success=true';
      }, 2000);
    }
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title="Đăng ký thành công!"
        subTitle="Đang đóng cửa sổ và cập nhật trạng thái..."
        extra={<Spin size="large" />}
      />
    </div>
  );
}

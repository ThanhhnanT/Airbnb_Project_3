"use client";

import { ConfigProvider } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { usePathname } from "next/navigation";
import { commonStyle } from "@/styles/common";
import Navbar from "@/components/navbar/Navbar";
// import {message } from "antd"
import { MessageProvider } from "./Message";
import { SocketProvider } from "./SocketProvider";

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  const style = commonStyle();
  const pathname = usePathname();
  const showNavbar =
    !pathname?.startsWith("/admin") && !pathname?.startsWith("/host");
  // const [messageApi, contextHolder] = message.useMessage();
  return (
   
    <AntdRegistry>
      <ConfigProvider
        theme={{
          token: {
            borderRadius: 50,
            colorPrimary: style.primaryColor,
            fontSize: 14,
            padding: 12,
          },
          components: {
            Button: {
              colorPrimary: style.btnColor,
              colorPrimaryHover: style.btnHoverColor,
              colorPrimaryActive: style.btnActiveColor,
              borderRadius: 50,
            },
          },
        }}
      >
        <MessageProvider>
          <SocketProvider>
            {showNavbar && <Navbar />}
            {children}
          </SocketProvider>
        </MessageProvider>
      
      </ConfigProvider>
    </AntdRegistry>
  );
}

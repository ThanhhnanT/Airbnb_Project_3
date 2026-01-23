"use client";

import React, { createContext, useContext } from "react";
import { message } from "antd";
import type { MessageInstance } from "antd/es/message/interface";

const MessageContext = createContext<MessageInstance | null>(null);

export const MessageProvider = ({ children }: { children: React.ReactNode }) => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <MessageContext.Provider value={messageApi}>
      {contextHolder}
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageApi = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessageApi must be used within a MessageProvider");
  }
  return context;
};
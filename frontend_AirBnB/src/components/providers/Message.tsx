"use client";

import React, { createContext, useContext } from "react";
import { message } from "antd";

const MessageContext = createContext<any>(null);

export const MessageProvider = ({ children }: { children: React.ReactNode }) => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <MessageContext.Provider value={messageApi}>
      {contextHolder}
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageApi = () => useContext(MessageContext);

"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { usePathname } from "next/navigation";

interface ChatSocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const ChatSocketContext = createContext<ChatSocketContextType>({
  socket: null,
  connected: false,
});

export const useChatSocket = () => useContext(ChatSocketContext);

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const apiDomain = useMemo(() => {
    const raw = process.env.API || process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
    return raw.replace(/\/$/, "");
  }, []);

  useEffect(() => {
    // For chat we only support non-admin users (access_token)
    if (pathname?.startsWith("/admin")) {
      setToken(null);
      return;
    }
    const accessToken = Cookies.get("access_token") || null;
    setToken(accessToken);

    let lastToken = accessToken;
    const id = window.setInterval(() => {
      const next = Cookies.get("access_token") || null;
      if (next !== lastToken) {
        lastToken = next;
        setToken(next);
      }
    }, 2000);

    return () => window.clearInterval(id);
  }, [pathname]);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setConnected(false);
      return;
    }

    const newSocket = io(`${apiDomain}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => setConnected(true));
    newSocket.on("disconnect", () => setConnected(false));
    newSocket.on("connect_error", () => setConnected(false));

    setSocket(newSocket);
    return () => {
      newSocket.close();
      setSocket(null);
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, apiDomain]);

  return (
    <ChatSocketContext.Provider value={{ socket, connected }}>
      {children}
    </ChatSocketContext.Provider>
  );
}


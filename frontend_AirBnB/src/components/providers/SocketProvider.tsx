"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Poll cookies to support login without full refresh (admin_token / access_token)
    const readToken = () => {
      const adminToken = Cookies.get("admin_token");
      const accessToken = Cookies.get("access_token");
      // Priority: admin_token > access_token
      return adminToken || accessToken || null;
    };
    
    const initialToken = readToken();
    setToken(initialToken);
    
    let lastToken = initialToken;
    const id = window.setInterval(() => {
      const nextToken = readToken();
      // Only update if token actually changed (null -> token, token -> null, or different token value)
      // Compare both null/undefined cases and actual token strings
      const hasChanged = (lastToken === null) !== (nextToken === null) || 
                         (lastToken !== null && nextToken !== null && lastToken !== nextToken);
      
      if (hasChanged) {
        console.log("[SocketProvider] Token changed:", {
          from: lastToken ? "Present" : "Missing",
          to: nextToken ? "Present" : "Missing",
          reconnecting: true
        });
        lastToken = nextToken;
        setToken(nextToken);
      }
    }, 2000); // Poll every 2 seconds to reduce frequency
    
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!token) {
      // If token removed, close existing socket
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Connect to Socket.IO server - use same domain as API
    const apiDomain = process.env.API || process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
    // Remove trailing slash if present
    const socketUrl = apiDomain.replace(/\/$/, "");
    console.log("[SocketProvider] Connecting to:", `${socketUrl}/notifications`, "with token:", token ? "Present" : "Missing");
    const newSocket = io(`${socketUrl}/notifications`, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("[SocketProvider] Socket.IO connected, socket ID:", newSocket.id);
      setConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[SocketProvider] Socket.IO disconnected, reason:", reason);
      setConnected(false);
    });

    newSocket.on("connected", (data) => {
      console.log("[SocketProvider] Socket.IO connection confirmed:", data);
    });

    newSocket.on("connect_error", (error) => {
      console.error("[SocketProvider] Socket.IO connection error:", error);
      console.error("[SocketProvider] Token used:", token ? "Present" : "Missing");
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  useEffect(() => {
    // Determine which token to use based on current route
    const readToken = (shouldLog = false) => {
      const adminToken = Cookies.get("admin_token");
      const accessToken = Cookies.get("access_token");
      
      // If in admin route, use admin_token; otherwise use access_token
      if (pathname?.startsWith("/admin")) {
        // Admin route - use admin_token
        if (shouldLog) {
          console.log("[SocketProvider] Admin route detected, using admin_token");
        }
        return adminToken || null;
      } else {
        // Non-admin route (host/user) - use access_token
        if (shouldLog) {
          console.log("[SocketProvider] Non-admin route, using access_token");
        }
        return accessToken || null;
      }
    };
    
    const initialToken = readToken(true); // Log on initial read
    setToken(initialToken);
    
    // Update token when pathname changes
    const newToken = readToken(true); // Log on pathname change
    setToken((prev) => {
      if (prev !== newToken) {
        console.log("[SocketProvider] Token changed due to route change:", {
          from: prev ? "Present" : "Missing",
          to: newToken ? "Present" : "Missing",
          pathname: pathname
        });
        return newToken;
      }
      return prev;
    });
    
    // Also poll cookies in case tokens change without route change (no logging)
    let lastToken = initialToken;
    const id = window.setInterval(() => {
      const nextToken = readToken(false); // Don't log on polling
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
    }, 2000);
    
    return () => window.clearInterval(id);
  }, [pathname]);

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

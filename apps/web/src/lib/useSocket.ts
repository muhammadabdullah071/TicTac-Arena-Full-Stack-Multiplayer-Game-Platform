import { useEffect, useRef, useCallback, useState } from "react";
import type { Socket } from "socket.io-client";

type SocketEventCallback = (...args: unknown[]) => void;

let socketInstance: Socket | null = null;

async function getSocket(): Promise<typeof import("socket.io-client")> {
  return import("socket.io-client");
}

export function useSocket(token?: string) {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<SocketEventCallback>>>(new Map());
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    if (!token) return;

    let destroyed = false;

    (async () => {
      const { io } = await getSocket();
      const SOCKET_URL = process.env.NODE_ENV === "production"
        ? (typeof window !== "undefined" ? window.location.origin.replace(/^http/, "ws") : "")
        : "http://localhost:3001";

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      socket.on("connect", () => {
        setConnected(true);
        setReconnecting(false);
      });

      socket.on("disconnect", () => {
        setConnected(false);
      });

      socket.on("reconnecting", () => {
        setReconnecting(true);
      });

      socket.on("connect_error", () => {
        setConnected(false);
      });

      listenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach((cb) => socket.on(event, cb));
      });

      if (!destroyed) {
        socketRef.current = socket;
        socketInstance = socket;
      }
    })();

    return () => {
      destroyed = true;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        socketInstance = null;
      }
    };
  }, [token]);

  const emit = useCallback((event: string, ...args: unknown[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, ...args);
    }
  }, []);

  const emitWithAck = useCallback(<T = unknown>(event: string, data?: unknown): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }
      socketRef.current.emit(event, data, (response: T) => {
        resolve(response);
      });
    });
  }, []);

  const on = useCallback((event: string, callback: SocketEventCallback) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
    return () => {
      listenersRef.current.get(event)?.delete(callback);
      socketRef.current?.off(event, callback);
    };
  }, []);

  const off = useCallback((event: string, callback: SocketEventCallback) => {
    listenersRef.current.get(event)?.delete(callback);
    socketRef.current?.off(event, callback);
  }, []);

  return {
    socket: socketRef.current,
    connected,
    reconnecting,
    emit,
    emitWithAck,
    on,
    off,
  };
}

export function getSocketInstance(): Socket | null {
  return socketInstance;
}

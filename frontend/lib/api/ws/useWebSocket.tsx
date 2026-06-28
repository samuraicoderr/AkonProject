/**
 * WebSocket React Hooks
 * Provides easy-to-use React hooks for WebSocket functionality
 */

"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useAuth } from "../auth/authContext";
import {
  getWebSocketManager,
  destroyWebSocketManager,
  useWebSocketStore,
  WebSocketState,
  type WebSocketMessage,
} from "./WebSocketManager";

// Configuration
const WS_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:9000",
  RECONNECT: true,
  MAX_RECONNECT_ATTEMPTS: 10,
  RECONNECT_INTERVAL: 1000,
  RECONNECT_DECAY: 1.5,
  HEARTBEAT_INTERVAL: 30000,
  DEBUG: process.env.NODE_ENV === "development",
};

/**
 * Main WebSocket Hook
 * Manages WebSocket connection lifecycle tied to authentication
 */
export function useWebSocket(endpoint?: string) {
  const { isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const managerRef = useRef<ReturnType<typeof getWebSocketManager> | null>(
    null
  ); // WebSocketManger ref

  // Subscribe to WebSocket state
  const state = useWebSocketStore((state) => state.state);
  const error = useWebSocketStore((state) => state.error);
  const isConnected = state === WebSocketState.CONNECTED;

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect if not authenticated
      if (managerRef.current) {
        managerRef.current.disconnect();
        destroyWebSocketManager();
        managerRef.current = null;
      }
      setIsInitialized(false);
      return;
    }

    // Initialize WebSocket manager
    if (!isInitialized) {
      const wsUrl = endpoint
        ? `${WS_CONFIG.BASE_URL}${endpoint}`
        : WS_CONFIG.BASE_URL;

      try {
        managerRef.current = getWebSocketManager({
          url: wsUrl,
          reconnect: WS_CONFIG.RECONNECT,
          maxReconnectAttempts: WS_CONFIG.MAX_RECONNECT_ATTEMPTS,
          reconnectInterval: WS_CONFIG.RECONNECT_INTERVAL,
          reconnectDecay: WS_CONFIG.RECONNECT_DECAY,
          heartbeatInterval: WS_CONFIG.HEARTBEAT_INTERVAL,
          debug: WS_CONFIG.DEBUG,
        });

        // Connect to WebSocket
        managerRef.current.connect().catch((error) => {
          console.error("[useWebSocket] Connection failed:", error);
        });

        setIsInitialized(true);
      } catch (error) {
        console.error("[useWebSocket] Initialization failed:", error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (managerRef.current && !isAuthenticated) {
        managerRef.current.disconnect();
        destroyWebSocketManager();
        managerRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [isAuthenticated, endpoint, isInitialized]);

  /**
   * Send message
   */
  const send = useCallback(<T = any,>(type: string, data: T): boolean => {
    if (!managerRef.current) {
      console.warn("[useWebSocket] Cannot send message: not connected");
      return false;
    }

    return managerRef.current.send(type, data);
  }, []);

  /**
   * Subscribe to messages
   */
  const subscribe = useCallback(
    <T = any,>(type: string, handler: (data: T) => void): (() => void) => {
      if (!managerRef.current) {
        console.warn("[useWebSocket] Cannot subscribe: not initialized");
        return () => {};
      }

      return managerRef.current.on(type, handler);
    },
    []
  );

  /**
   * Manually connect
   */
  const connect = useCallback(async () => {
    if (!managerRef.current) {
      console.warn("[useWebSocket] Cannot connect: not initialized");
      return;
    }

    try {
      await managerRef.current.connect();
    } catch (error) {
      console.error("[useWebSocket] Connection failed:", error);
    }
  }, []);

  /**
   * Manually disconnect
   */
  const disconnect = useCallback(() => {
    if (!managerRef.current) {
      return;
    }

    managerRef.current.disconnect();
  }, []);

  return {
    isConnected,
    state,
    error,
    send,
    subscribe,
    connect,
    disconnect,
  };
}

/**
 * Hook to subscribe to specific message types
 */
export function useWebSocketSubscription<T = any>(
  messageType: string,
  handler: (data: T) => void,
  deps: React.DependencyList = []
) {
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const unsubscribe = subscribe<T>(messageType, handler);

    return () => {
      unsubscribe();
    };
  }, [messageType, isConnected, ...deps]);
}

/**
 * Hook for sending messages with optimistic updates
 */
export function useWebSocketSend<T = any>() {
  const { send, isConnected } = useWebSocket();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (type: string, data: T): Promise<boolean> => {
      setIsSending(true);
      setError(null);

      try {
        const success = send(type, data);

        if (!success) {
          setError("Failed to send message");
        }

        return success;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [send]
  );

  return {
    send: sendMessage,
    isSending,
    error,
    isConnected,
  };
}

/**
 * Hook to get WebSocket connection status
 */
export function useWebSocketStatus() {
  const state = useWebSocketStore((state) => state.state);
  const error = useWebSocketStore((state) => state.error);
  const reconnectAttempts = useWebSocketStore(
    (state) => state.reconnectAttempts
  );
  const lastConnectedAt = useWebSocketStore((state) => state.lastConnectedAt);
  const isAuthenticated = useWebSocketStore((state) => state.isAuthenticated);

  return {
    state,
    error,
    reconnectAttempts,
    lastConnectedAt,
    isAuthenticated,
    isConnected: state === WebSocketState.CONNECTED,
    isConnecting: state === WebSocketState.CONNECTING,
    isReconnecting: state === WebSocketState.RECONNECTING,
    isDisconnected: state === WebSocketState.DISCONNECTED,
    hasError: state === WebSocketState.ERROR,
  };
}

/**
 * Hook for request-response pattern over WebSocket
 */
export function useWebSocketRequest<TRequest = any, TResponse = any>() {
  const { send, subscribe } = useWebSocket();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRequests = useRef<
    Map<
      string,
      {
        resolve: (data: TResponse) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
      }
    >
  >(new Map());

  // Subscribe to responses
  useEffect(() => {
    const unsubscribe = subscribe<{
      id: string;
      data: TResponse;
      error?: string;
    }>("response", (response) => {
      const pending = pendingRequests.current.get(response.id);

      if (pending) {
        clearTimeout(pending.timeout);
        pendingRequests.current.delete(response.id);

        if (response.error) {
          pending.reject(new Error(response.error));
        } else {
          pending.resolve(response.data);
        }
      }
    });

    return () => {
      unsubscribe();
      // Clear all pending requests
      pendingRequests.current.forEach((pending) => {
        clearTimeout(pending.timeout);
        pending.reject(new Error("Component unmounted"));
      });
      pendingRequests.current.clear();
    };
  }, [subscribe]);

  const request = useCallback(
    async (
      type: string,
      data: TRequest,
      timeout: number = 10000
    ): Promise<TResponse> => {
      setIsLoading(true);
      setError(null);

      return new Promise((resolve, reject) => {
        const requestId = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Set up timeout
        const timeoutTimer = setTimeout(() => {
          pendingRequests.current.delete(requestId);
          setIsLoading(false);
          setError("Request timeout");
          reject(new Error("Request timeout"));
        }, timeout);

        // Store pending request
        pendingRequests.current.set(requestId, {
          resolve: (data) => {
            setIsLoading(false);
            resolve(data);
          },
          reject: (error) => {
            setIsLoading(false);
            setError(error.message);
            reject(error);
          },
          timeout: timeoutTimer,
        });

        // Send request
        const success = send(type, { id: requestId, data });

        if (!success) {
          clearTimeout(timeoutTimer);
          pendingRequests.current.delete(requestId);
          setIsLoading(false);
          const error = new Error("Failed to send request");
          setError(error.message);
          reject(error);
        }
      });
    },
    [send]
  );

  return {
    request,
    isLoading,
    error,
  };
}

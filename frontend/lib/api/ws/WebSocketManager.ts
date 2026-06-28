/**
 * Production-Grade WebSocket Manager
 * Handles WebSocket connections with automatic reconnection, authentication, and state management
 */

import { create } from "zustand";
import { tokenManager } from "../auth/TokenManager";
import { DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS } from "react";

// Types
export enum WebSocketState {
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  DISCONNECTING = "DISCONNECTING",
  DISCONNECTED = "DISCONNECTED",
  RECONNECTING = "RECONNECTING",
  ERROR = "ERROR",
}

export enum WebSocketCloseCode {
  NORMAL_CLOSURE = 1000,
  GOING_AWAY = 1001,
  PROTOCOL_ERROR = 1002,
  UNSUPPORTED_DATA = 1003,
  INVALID_FRAME = 1007,
  POLICY_VIOLATION = 1008,
  MESSAGE_TOO_BIG = 1009,
  INTERNAL_ERROR = 1011,
  SERVICE_RESTART = 1012,
  TRY_AGAIN_LATER = 1013,
  BAD_GATEWAY = 1014,
  // Custom codes
  UNAUTHORIZED = 4001,
  FORBIDDEN = 4003,
  INVALID_TOKEN = 4004,
}

export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp?: string;
  id?: string;
}

export interface WebSocketError {
  code: number;
  reason: string;
  timestamp: string;
}

interface WebSocketConfig {
  url: string;
  protocols?: string | string[] | undefined;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  reconnectDecay?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  debug?: boolean;
}

interface WebSocketConfigInternal {
  url: string;
  protocols: string | string[] | undefined;
  reconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  reconnectDecay: number;
  heartbeatInterval: number;
  heartbeatTimeout: number;
  debug: boolean;
}

interface WebSocketStoreState {
  state: WebSocketState;
  error: WebSocketError | null;
  reconnectAttempts: number;
  lastConnectedAt: string | null;
  isAuthenticated: boolean;

  setState: (state: WebSocketState) => void;
  setError: (error: WebSocketError | null) => void;
  setReconnectAttempts: (attempts: number) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  setLastConnectedAt: (timestamp: string | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  reset: () => void;
}


// Create Zustand store for WebSocket state
export const useWebSocketStore = create<WebSocketStoreState>((set) => ({
  state: WebSocketState.DISCONNECTED,
  error: null,
  reconnectAttempts: 0,
  lastConnectedAt: null,
  isAuthenticated: false,

  setState: (state) => set({ state }),
  setError: (error) => set({ error }),
  setReconnectAttempts: (attempts) => set({ reconnectAttempts: attempts }),
  incrementReconnectAttempts: () =>
    set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
  setLastConnectedAt: (timestamp) => set({ lastConnectedAt: timestamp }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  reset: () =>
    set({
      state: WebSocketState.DISCONNECTED,
      error: null,
      reconnectAttempts: 0,
      lastConnectedAt: null,
      isAuthenticated: false,
    }),
}));

/**
 * WebSocket Manager Class
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfigInternal;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private heartbeatTimeoutTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private connectionPromise: Promise<void> | null = null;
  private isManualClose: boolean = false;
  private messageQueue: WebSocketMessage[] = [];
  private readonly MAX_QUEUE_SIZE = 100;

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      protocols: config.protocols ?? undefined,
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval ?? 1000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      reconnectDecay: config.reconnectDecay ?? 1.5,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      heartbeatTimeout: config.heartbeatTimeout ?? 5000,
      debug: config.debug ?? false,
    };

    this.log("WebSocket Manager initialized", this.config);
  }

  /**
   * Connect to WebSocket server with authentication
   */
  async connect(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.performConnect();

    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * Perform the actual connection
   */
  private async performConnect(): Promise<void> {
    const store = useWebSocketStore.getState();

    // Check if already connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log("Already connected");
      return;
    }

    // Check if connecting
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      this.log("Connection already in progress");
      return;
    }

    this.isManualClose = false;

    try {
      // Get authentication token
      const token = await tokenManager.getAccessToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      // Build WebSocket URL with token
      const wsUrl = this.buildWebSocketUrl(token);

      this.log("Connecting to WebSocket...", wsUrl);
      store.setState(WebSocketState.CONNECTING);

      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl, this.config.protocols);

      // Set up event handlers
      this.setupEventHandlers();

      // Wait for connection to open
      await this.waitForConnection();

      this.log("WebSocket connected successfully");
      store.setState(WebSocketState.CONNECTED);
      store.setLastConnectedAt(new Date().toISOString());
      store.resetReconnectAttempts();
      store.setIsAuthenticated(true);
      store.setError(null);

      // Start heartbeat
      this.startHeartbeat();

      // Send queued messages
      this.flushMessageQueue();
    } catch (error) {
      this.log("Connection failed:", error);
      store.setState(WebSocketState.ERROR);
      store.setError({
        code: 0,
        reason: error instanceof Error ? error.message : "Connection failed",
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Wait for WebSocket connection to open
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error("WebSocket not initialized"));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10000); // 10 second timeout

      this.ws.addEventListener("open", () => {
        clearTimeout(timeout);
        resolve();
      });

      this.ws.addEventListener("error", (event) => {
        clearTimeout(timeout);
        reject(new Error("WebSocket error during connection"));
      });
    });
  }

  /**
   * Build WebSocket URL with authentication token
   */
  private buildWebSocketUrl(token: string): string {
    const url = new URL(this.config.url);
    url.searchParams.set("token", token);
    return url.toString();
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    this.log("WebSocket opened", event);
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.log("WebSocket closed", { code: event.code, reason: event.reason });

    const store = useWebSocketStore.getState();
    store.setState(WebSocketState.DISCONNECTED);
    store.setIsAuthenticated(false);

    // Stop heartbeat
    this.stopHeartbeat();

    // Handle reconnection
    if (!this.isManualClose && this.config.reconnect) {
      this.handleReconnect(event.code, event.reason);
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    this.log("WebSocket error", event);

    const store = useWebSocketStore.getState();
    store.setState(WebSocketState.ERROR);
    store.setError({
      code: 0,
      reason: "WebSocket error occurred",
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.log("Message received:", message);

      // Reset heartbeat timeout
      this.resetHeartbeatTimeout();

      // Handle heartbeat responses
      if (message.type === "pong") {
        this.log("Heartbeat pong received");
        return;
      }

      // Dispatch to registered handlers
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message.data);
          } catch (error) {
            this.log("Error in message handler:", error);
          }
        });
      }

      // Dispatch to wildcard handlers
      const wildcardHandlers = this.messageHandlers.get("*");
      if (wildcardHandlers) {
        wildcardHandlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            this.log("Error in wildcard message handler:", error);
          }
        });
      }
    } catch (error) {
      this.log("Error parsing message:", error);
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(closeCode: number, reason: string): void {
    const store = useWebSocketStore.getState();

    // Don't reconnect on certain close codes
    const noReconnectCodes = [
      WebSocketCloseCode.NORMAL_CLOSURE,
      WebSocketCloseCode.UNAUTHORIZED,
      WebSocketCloseCode.FORBIDDEN,
      WebSocketCloseCode.INVALID_TOKEN,
    ];

    if (noReconnectCodes.includes(closeCode)) {
      this.log("Not reconnecting due to close code:", closeCode);
      store.setError({
        code: closeCode,
        reason: reason || "Connection closed",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check max reconnect attempts
    if (store.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log("Max reconnect attempts reached");
      store.setError({
        code: closeCode,
        reason: "Max reconnection attempts exceeded",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Calculate reconnect delay with exponential backoff
    const delay =
      this.config.reconnectInterval *
      Math.pow(this.config.reconnectDecay, store.reconnectAttempts);

    this.log(
      `Reconnecting in ${delay}ms (attempt ${store.reconnectAttempts + 1})`
    );
    store.setState(WebSocketState.RECONNECTING);
    store.incrementReconnectAttempts();

    // Schedule reconnection
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.log("Reconnection failed:", error);
      });
    }, delay);
  }

  /**
   * Send message through WebSocket
   */
  send<T = any>(type: string, data: T): boolean {
    const message: WebSocketMessage<T> = {
      type,
      data,
      timestamp: new Date().toISOString(),
      id: this.generateMessageId(),
    };

    // Check if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.log("Message sent:", message);
        return true;
      } catch (error) {
        this.log("Error sending message:", error);
        this.queueMessage(message);
        return false;
      }
    }

    // Queue message if not connected
    this.queueMessage(message);
    return false;
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= this.MAX_QUEUE_SIZE) {
      this.log("Message queue full, dropping oldest message");
      this.messageQueue.shift();
    }

    this.messageQueue.push(message);
    this.log("Message queued:", message);
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    this.log(`Flushing ${this.messageQueue.length} queued messages`);

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(message));
        } catch (error) {
          this.log("Error sending queued message:", error);
          // Re-queue if failed
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
  }

  /**
   * Register message handler
   */
  on<T = any>(type: string, handler: (data: T) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    this.messageHandlers.get(type)!.add(handler);
    this.log(`Handler registered for type: ${type}`);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
      this.log(`Handler unregistered for type: ${type}`);
    };
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send("ping", { timestamp: Date.now() });
        this.log("Heartbeat ping sent");

        // Set timeout for pong response
        this.heartbeatTimeoutTimer = setTimeout(() => {
          this.log("Heartbeat timeout - closing connection");
          this.ws?.close(1000, "Heartbeat timeout");
        }, this.config.heartbeatTimeout);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  /**
   * Reset heartbeat timeout
   */
  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(
    code: number = WebSocketCloseCode.NORMAL_CLOSURE,
    reason: string = "Manual disconnect"
  ): void {
    this.log("Disconnecting WebSocket", { code, reason });

    this.isManualClose = true;

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Stop heartbeat
    this.stopHeartbeat();

    // Close WebSocket
    if (this.ws) {
      try {
        if (
          this.ws.readyState === WebSocket.OPEN ||
          this.ws.readyState === WebSocket.CONNECTING
        ) {
          this.ws.close(code, reason);
        }
      } catch (error) {
        this.log("Error closing WebSocket:", error);
      }
      this.ws = null;
    }

    // Update state
    const store = useWebSocketStore.getState();
    store.setState(WebSocketState.DISCONNECTED);
    store.setIsAuthenticated(false);

    // Clear message queue
    this.messageQueue = [];
  }

  /**
   * Get current WebSocket state
   */
  getState(): WebSocketState {
    return useWebSocketStore.getState().state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return (
      this.ws?.readyState === WebSocket.OPEN &&
      useWebSocketStore.getState().isAuthenticated
    );
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log helper
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug || process.env.NODE_ENV === "development") {
      console.log(`[WebSocketManager] ${message}`, ...args);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.log("Destroying WebSocket Manager");
    this.disconnect();
    this.messageHandlers.clear();
    useWebSocketStore.getState().reset();
  }
}

// Singleton instance
let wsManagerInstance: WebSocketManager | null = null;

/**
 * Get WebSocket Manager instance
 */
export function getWebSocketManager(
  config?: WebSocketConfig
): WebSocketManager {
  if (!wsManagerInstance && config) {
    wsManagerInstance = new WebSocketManager(config);
  }

  if (!wsManagerInstance) {
    throw new Error(
      "WebSocket Manager not initialized. Provide config on first call."
    );
  }

  return wsManagerInstance;
}

/**
 * Destroy WebSocket Manager instance
 */
export function destroyWebSocketManager(): void {
  if (wsManagerInstance) {
    wsManagerInstance.destroy();
    wsManagerInstance = null;
  }
}

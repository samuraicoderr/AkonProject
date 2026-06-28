/**
 * Chat WebSocket Integration
 * Specialized hooks and utilities for chat functionality
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useWebSocket,
  useWebSocketSubscription,
  useWebSocketStatus,
} from "./useWebSocket";

// Types
export interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
  timestamp: string;
  room_id: string;
  seen?: boolean;
}

export interface TypingIndicator {
  user_id: string;
  username: string;
  room_id: string;
  is_typing: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  members: string[];
  last_message?: ChatMessage;
  unread_count?: number;
}

export interface MessageDeliveryStatus {
  message_id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
}

/**
 * Chat WebSocket Hook
 * Manages chat-specific WebSocket functionality
 */
export function useChatWebSocket(roomId: string) {
  const { isConnected, send, subscribe, state, error } = useWebSocket(
    `/ws/chat/${roomId}/`
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Subscribe to chat messages
   */
  useWebSocketSubscription<ChatMessage>(
    "chat_message",
    (message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      // Scroll to bottom
      scrollToBottom();

      // Send read receipt if not own message
      // if (message.sender.id !== currentUserId) {
      //   sendReadReceipt(message.id);
      // }
    },
    [roomId]
  );

  /**
   * Subscribe to typing indicators
   */
  useWebSocketSubscription<TypingIndicator>(
    "typing_indicator",
    (indicator) => {
      if (indicator.room_id !== roomId) return;

      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (indicator.is_typing) {
          newSet.add(indicator.username);
        } else {
          newSet.delete(indicator.username);
        }
        return newSet;
      });
    },
    [roomId]
  );

  /**
   * Subscribe to message delivery status
   */
  useWebSocketSubscription<MessageDeliveryStatus>(
    "message_status",
    (status) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === status.message_id
            ? { ...msg, seen: status.status === "read" }
            : msg
        )
      );
    },
    [roomId]
  );

  /**
   * Subscribe to connection events
   */
  useWebSocketSubscription<{ type: string; message: string }>(
    "connection_established",
    (data) => {
      console.log("[Chat] Connection established:", data);
    },
    [roomId]
  );

  /**
   * Subscribe to error events
   */
  useWebSocketSubscription<{ error: string }>(
    "error",
    (data) => {
      console.error("[Chat] Error:", data.error);
      setSendError(data.error);
    },
    [roomId]
  );

  /**
   * Send message
   */
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!content.trim() || !isConnected) {
        return false;
      }

      setIsSending(true);
      setSendError(null);

      try {
        const success = send("chat_message", {
          message: content.trim(),
          room_id: roomId,
        });

        if (!success) {
          setSendError("Failed to send message");
          return false;
        }

        return true;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to send message";
        setSendError(errorMsg);
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [isConnected, send, roomId]
  );

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (!isConnected) return;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      send("typing_indicator", {
        room_id: roomId,
        is_typing: isTyping,
      });

      // Auto-clear typing indicator after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          send("typing_indicator", {
            room_id: roomId,
            is_typing: false,
          });
        }, 3000);
      }
    },
    [isConnected, send, roomId]
  );

  /**
   * Send read receipt
   */
  const sendReadReceipt = useCallback(
    (messageId: string) => {
      if (!isConnected) return;

      send("read_receipt", {
        message_id: messageId,
        room_id: roomId,
      });
    },
    [isConnected, send, roomId]
  );

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /**
   * Load message history
   */
  const loadHistory = useCallback(
    async (before?: string, limit: number = 50) => {
      if (!isConnected) return;

      send("load_history", {
        room_id: roomId,
        before,
        limit,
      });
    },
    [isConnected, send, roomId]
  );

  /**
   * Clear messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    messages,
    typingUsers: Array.from(typingUsers),
    isConnected,
    isSending,
    error: error || sendError,
    connectionState: state,

    // Actions
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    loadHistory,
    clearMessages,
    scrollToBottom,

    // Refs
    messagesEndRef,
  };
}

/**
 * Hook for managing multiple chat rooms
 */
export function useChatRooms() {
  const { isConnected, send, subscribe } = useWebSocket("/ws/rooms/");

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  /**
   * Subscribe to room list updates
   */
  useWebSocketSubscription<{ rooms: ChatRoom[] }>(
    "rooms_list",
    (data) => {
      setRooms(data.rooms);
    },
    []
  );

  /**
   * Subscribe to room updates
   */
  useWebSocketSubscription<ChatRoom>(
    "room_updated",
    (room) => {
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
    },
    []
  );

  /**
   * Subscribe to new messages in other rooms
   */
  useWebSocketSubscription<ChatMessage>(
    "new_message",
    (message) => {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === message.room_id
            ? {
                ...r,
                last_message: message,
                unread_count:
                  r.id === activeRoomId ? 0 : (r.unread_count || 0) + 1,
              }
            : r
        )
      );
    },
    [activeRoomId]
  );

  /**
   * Load rooms
   */
  const loadRooms = useCallback(() => {
    if (!isConnected) return;

    send("load_rooms", {});
  }, [isConnected, send]);

  /**
   * Join room
   */
  const joinRoom = useCallback(
    (roomId: string) => {
      if (!isConnected) return;

      send("join_room", { room_id: roomId });
      setActiveRoomId(roomId);
    },
    [isConnected, send]
  );

  /**
   * Leave room
   */
  const leaveRoom = useCallback(
    (roomId: string) => {
      if (!isConnected) return;

      send("leave_room", { room_id: roomId });
      if (activeRoomId === roomId) {
        setActiveRoomId(null);
      }
    },
    [isConnected, send, activeRoomId]
  );

  /**
   * Mark room as read
   */
  const markRoomAsRead = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, unread_count: 0 } : r))
    );
  }, []);

  // Load rooms on connect
  useEffect(() => {
    if (isConnected) {
      loadRooms();
    }
  }, [isConnected, loadRooms]);

  return {
    rooms,
    activeRoomId,
    isConnected,
    loadRooms,
    joinRoom,
    leaveRoom,
    markRoomAsRead,
  };
}

/**
 * Hook for WebSocket connection indicator
 */
export function useConnectionIndicator() {
  const status = useWebSocketStatus();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Show indicator when not connected or reconnecting
    const shouldShow = !status.isConnected || status.isReconnecting;
    setShowIndicator(shouldShow);
  }, [status.isConnected, status.isReconnecting]);

  return {
    showIndicator,
    status,
  };
}

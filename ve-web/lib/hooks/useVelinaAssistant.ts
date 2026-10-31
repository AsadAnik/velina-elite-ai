"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Product } from "@/types/product";
import { streamAiChat, sendAiChatFallback, ChatHistoryItem } from "@/lib/sse";

export interface AssistantMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  products?: Product[];
  timestamp: string;
}

export interface UseVelinaAssistantOptions {
  isOpen?: boolean;
}

const CONNECTION_ERROR_MESSAGE =
  "I apologize, but I am unable to connect to our store assistant at the moment. Please try again in a few moments or connect with our human team on WhatsApp!";

/**
 * Lightweight custom hook managing AI assistant conversation state and SSE streaming.
 * All store intelligence, catalog searching, and fallback responses are handled entirely on the server.
 */
export function useVelinaAssistant(options?: UseVelinaAssistantOptions) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "Hello! Welcome to Velina Elite. 🌸 I am Velina AI Assistant, your personal beauty & luxury shopping guide. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string>("");

  // Holds active stream abort callback
  const abortStreamRef = useRef<(() => void) | null>(null);

  // Cleanup active SSE stream on unmount
  useEffect(() => {
    return () => {
      if (abortStreamRef.current) {
        abortStreamRef.current();
        abortStreamRef.current = null;
      }
    };
  }, []);

  // region CLEAR HISTORY
  const clearHistory = useCallback(() => {
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
    }
    setIsTyping(false);
    setStreamingStatus("");
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        text: "Conversation reset! Feel free to ask me anything about our products, routines, or orders.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, []);

  // region SEND MESSAGE
  const sendMessage = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || input).trim();
      if (!query) return;

      // Abort any ongoing stream
      if (abortStreamRef.current) {
        abortStreamRef.current();
        abortStreamRef.current = null;
      }

      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      // Add user message to conversation
      const userMsg: AssistantMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: query,
        timestamp,
      };

      setMessages((prev) => [...prev, userMsg]);
      if (!textToSend) setInput("");
      setIsTyping(true);
      setStreamingStatus("Velina Assistant is thinking...");

      // Prepare multi-turn conversation history
      const historyPayload: ChatHistoryItem[] = messages
        .filter((m) => !m.id.startsWith("welcome"))
        .slice(-6)
        .map((m) => ({
          role: m.sender,
          content: m.text,
        }));

      // Stream via Server-Sent Events (SSE)
      if (typeof window !== "undefined" && "EventSource" in window) {
        const aiMsgId = `ai-${Date.now()}`;
        let hasReceivedFirstToken = false;

        const cleanup = streamAiChat({
          message: query,
          history: historyPayload,
          onStatus: (statusText) => {
            setStreamingStatus(statusText);
          },
          onToken: (token) => {
            if (!hasReceivedFirstToken) {
              hasReceivedFirstToken = true;
              setIsTyping(false);
              setStreamingStatus("");
              setMessages((prev) => [
                ...prev,
                {
                  id: aiMsgId,
                  sender: "assistant",
                  text: token,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ]);
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, text: m.text + token } : m
                )
              );
            }
          },
          onProducts: (products) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, products } : m
              )
            );
          },
          onDone: () => {
            abortStreamRef.current = null;
            setIsTyping(false);
            setStreamingStatus("");
          },
          onError: (err) => {
            console.warn("SSE stream interrupted or failed:", err);
            abortStreamRef.current = null;
            setIsTyping(false);
            setStreamingStatus("");

            if (!hasReceivedFirstToken) {
              setMessages((prev) => [
                ...prev,
                {
                  id: `ai-${Date.now()}`,
                  sender: "assistant",
                  text: CONNECTION_ERROR_MESSAGE,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ]);
            }
          },
        });

        abortStreamRef.current = cleanup;
        return;
      }

      // Fallback for environments where EventSource is not supported
      try {
        const response = await sendAiChatFallback(query, historyPayload);

        if (response && response.reply) {
          const aiMsg: AssistantMessage = {
            id: `ai-${Date.now()}`,
            sender: "assistant",
            text: response.reply,
            products: response.products && response.products.length > 0 ? response.products : undefined,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, aiMsg]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: "assistant",
              text: CONNECTION_ERROR_MESSAGE,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }
      } catch (err) {
        console.warn("AI Backend call failed:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "assistant",
            text: CONNECTION_ERROR_MESSAGE,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } finally {
        setIsTyping(false);
        setStreamingStatus("");
      }
    },
    [input, messages]
  );

  return {
    messages,
    input,
    setInput,
    isTyping,
    streamingStatus,
    sendMessage,
    clearHistory,
  };
}

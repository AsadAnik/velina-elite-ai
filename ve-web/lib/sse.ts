import { API_BASE_URL, fetchApi } from "./api";
import { Product } from "@/types/product";

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export type SseAiEventType = "status" | "token" | "products" | "done";

export interface SseAiEvent {
  type: SseAiEventType;
  message?: string;
  token?: string;
  products?: Product[];
  productIds?: number[];
}

export interface StreamAiChatOptions {
  message: string;
  history?: ChatHistoryItem[];
  onStatus?: (statusMessage: string) => void;
  onToken?: (token: string) => void;
  onProducts?: (products: Product[], productIds: number[]) => void;
  onDone?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * Initiates an SSE connection to stream Velina AI Assistant responses.
 * Returns a cancel/cleanup callback function.
 */
export function streamAiChat(options: StreamAiChatOptions): () => void {
  const { message, history, onStatus, onToken, onProducts, onDone, onError } = options;

  if (typeof window === "undefined" || !("EventSource" in window)) {
    onError?.(new Error("EventSource is not supported in this environment"));
    return () => {};
  }

  const params = new URLSearchParams({ message });
  if (history && history.length > 0) {
    params.set("history", JSON.stringify(history));
  }

  const sseUrl = `${API_BASE_URL}/ai/chat-stream?${params.toString()}`;
  const eventSource = new EventSource(sseUrl);
  let isDone = false;

  eventSource.onmessage = (event: MessageEvent) => {
    try {
      const payload: SseAiEvent = JSON.parse(event.data);

      switch (payload.type) {
        case "status":
          if (payload.message) {
            onStatus?.(payload.message);
          }
          break;

        case "token":
          if (payload.token) {
            onToken?.(payload.token);
          }
          break;

        case "products":
          if (payload.products && payload.products.length > 0) {
            onProducts?.(payload.products, payload.productIds || []);
          }
          break;

        case "done":
          isDone = true;
          eventSource.close();
          onDone?.();
          break;

        default:
          break;
      }
    } catch (parseError) {
      console.error("Failed to parse SSE event data:", parseError);
    }
  };

  eventSource.onerror = (err) => {
    // If the stream was already cleanly completed by "done", ignore the transport close
    if (isDone) return;
    eventSource.close();
    onError?.(err);
  };

  // Return unsubscribe/abort callback
  return () => {
    eventSource.close();
  };
}

/**
 * Fallback non-streaming API call for environments where SSE is blocked or unavailable
 */
export async function sendAiChatFallback(message: string, history: ChatHistoryItem[] = []) {
  return fetchApi<{
    reply: string;
    productIds: number[];
    products: Product[];
  }>("/ai/chat", {
    method: "POST",
    data: { message, history },
  });
}


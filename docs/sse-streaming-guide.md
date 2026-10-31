# Server-Sent Events (SSE) & AI Streaming Guide

> **Document Version:** 1.0  
> **Target Framework:** NestJS (`@nestjs/common`, RxJS)  
> **Use Case:** Typewriter-style streaming responses for AI Chatbot (*Velina Assistant*)

---

## 1. What is Server-Sent Events (SSE)?

Server-Sent Events (SSE) is a web standard enabling a server to stream real-time data to a client over a single, long-lived HTTP connection.

### The Problem with Traditional HTTP (Request-Response)
In typical REST APIs, the client sends a request and waits in silence until the entire response is generated:
```
Client: "Recommend a serum for dry skin" ───────► Server
Client: [Thinking spinner... 4-8 seconds] ◄───── Server: "Here is the complete 500-word response..."
```
This results in high **Time-To-First-Token (TTFT)** and a sluggish user experience.

### The SSE Solution (Streamed Typewriter Effect)
With SSE, the server opens the connection and pushes small chunks (words or tokens) as soon as they become available:
```
Client: "Recommend a serum for dry skin" ───────► Server
Client: ◄─── "Here" ──────────────────────────── Server (at 300ms)
Client: ◄─── " are" ──────────────────────────── Server (at 350ms)
Client: ◄─── " our top" ──────────────────────── Server (at 400ms)
Client: ◄─── " hydrating serums:" ────────────── Server (at 450ms)
Client: ◄─── [RECOMMENDED_PRODUCTS payload] ──── Server (at 900ms)
Client: ◄─── [STREAM COMPLETED] ──────────────── Server (connection closes)
```
The user sees words appearing immediately, just like in ChatGPT or Claude.

---

## 2. SSE vs. WebSockets vs. Polling

| Feature | SSE (Server-Sent Events) | WebSockets | Long Polling |
| :--- | :--- | :--- | :--- |
| **Direction** | **One-way** (Server $\rightarrow$ Client) | **Two-way** (Full-Duplex) | One-way (Repeated requests) |
| **Protocol** | Standard HTTP/1.1 or HTTP/2 | `ws://` / `wss://` protocol switch | Standard HTTP |
| **Proxy / Firewall** | Works seamlessly with standard proxies | Requires special proxy & ingress configs | Standard HTTP |
| **Reconnection** | Native automatic reconnection built-in | Must be coded manually | Not applicable |
| **Best Used For** | **AI text streams, notifications, stock tickers** | **Multiplayer games, collaborative canvases, p2p chat** | Legacy fallbacks |

> [!NOTE]
> Since an AI assistant only needs the server to continuously push tokens back to the user after the initial prompt, **SSE is simpler, lighter, and more firewall-friendly than WebSockets**.

---

## 3. How SSE Works on the Wire (Protocol Level)

SSE is regular HTTP with three specific response headers:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Wire Format Syntax
The server sends plain UTF-8 text formatted into distinct fields separated by single newlines (`\n`), ending every event with a **double newline (`\n\n`)**:

```http
event: token
data: {"token": "Hydration "}

event: token
data: {"token": "is essential "}

event: products
data: {"productIds": [12, 18]}

event: done
data: {}
```

* `event`: (Optional) Specifies custom event name (e.g. `token`, `status`, `products`, `done`).
* `data`: (Required) The payload content (plain string or serialized JSON).
* `id`: (Optional) Message identifier for automatic reconnect resume.
* `retry`: (Optional) Milliseconds the client should wait before attempting reconnection if dropped.

---

## 4. NestJS Implementation (`@Sse`)

NestJS provides native SSE support via the `@Sse()` decorator in `@nestjs/common`.

Instead of returning a Promise or plain object, an `@Sse()` method must return an **RxJS `Observable<MessageEvent>`**.

### Step 1: Define the Event Contract
Define structured event interfaces so frontend and backend share an exact type contract (`ve-server/src/ai/interfaces/llm-provider.interface.ts`):

```typescript
export interface SseStatusEvent {
  type: 'status';
  message: string;
}

export interface SseTokenEvent {
  type: 'token';
  token: string;
}

export interface SseProductsEvent {
  type: 'products';
  productIds: number[];
  products: any[];
}

export interface SseDoneEvent {
  type: 'done';
}

export type SseAiEvent = SseStatusEvent | SseTokenEvent | SseProductsEvent | SseDoneEvent;
```

---

### Step 2: Implement Streaming Logic in `AiService`
Use RxJS `Observable` to emit steps over time (`ve-server/src/ai/ai.service.ts`):

```typescript
import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatRequestDto } from './dto/chat-request.dto';

@Injectable()
export class AiService {
  /**
   * Streams chat response chunk-by-chunk using Server-Sent Events (SSE)
   */
  streamChat(dto: ChatRequestDto): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          const userQuery = dto.message.trim();

          // 1. Notify client that search is starting
          subscriber.next({
            data: { type: 'status', message: 'Checking inventory & store policies...' },
          });

          // 2. Fetch full completion & matched products
          const { cleanReply, productIds, products } = await this.processChat(dto);

          // 3. Emit tokens word-by-word with natural typewriter pacing
          const words = cleanReply.split(' ');
          for (let i = 0; i < words.length; i++) {
            const wordWithSpace = i === words.length - 1 ? words[i] : words[i] + ' ';

            subscriber.next({
              data: { type: 'token', token: wordWithSpace },
            });

            // 30-40ms delay gives smooth human-like typing speed
            await new Promise((res) => setTimeout(res, 35));
          }

          // 4. Send matched product entities for UI cards
          if (products && products.length > 0) {
            subscriber.next({
              data: { type: 'products', products, productIds },
            });
          }

          // 5. Send completion event
          subscriber.next({
            data: { type: 'done' },
          });

          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();
    });
  }
}
```

---

### Step 3: Expose the Endpoint in `AiController`
Add the `@Sse()` route handler (`ve-server/src/ai/ai.controller.ts`):

```typescript
import { Controller, Sse, Query, MessageEvent, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { AiService, ChatResponse } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // 1. Existing traditional blocking endpoint (kept for backward compatibility)
  @Post('chat')
  @ApiOperation({ summary: 'Standard blocking chat response' })
  async chat(@Body() dto: ChatRequestDto): Promise<ChatResponse> {
    return this.aiService.processChat(dto);
  }

  // 2. New SSE streaming endpoint
  @Sse('chat-stream')
  @ApiOperation({ summary: 'Stream AI assistant response with typewriter effect via SSE' })
  chatStream(@Query('message') message: string): Observable<MessageEvent> {
    return this.aiService.streamChat({ message });
  }
}
```

---

## 5. Client-Side Integration (Next.js / React)

There are two primary ways to consume an SSE stream in the browser:

### Option A: Native `EventSource` (Simple GET requests)
Built into all modern browsers:

```typescript
const startStreaming = (query: string) => {
  const url = `/api/ai/chat-stream?message=${encodeURIComponent(query)}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    const payload = JSON.parse(event.data);

    switch (payload.type) {
      case 'status':
        console.log('Status:', payload.message);
        break;

      case 'token':
        // Append incoming token to typewriter text buffer
        setDisplayedText((prev) => prev + payload.token);
        break;

      case 'products':
        setRecommendedProducts(payload.products);
        break;

      case 'done':
        eventSource.close();
        setIsStreaming(false);
        break;
    }
  };

  eventSource.onerror = (err) => {
    console.error('SSE Error:', err);
    eventSource.close();
    setIsStreaming(false);
  };
};
```

### Option B: Modern `fetch` + `ReadableStream` (Supports POST with Chat History)
Native `EventSource` only supports `GET`. When you need to send a multi-turn `history: []` payload in the request body, use the Fetch API with `response.body.getReader()`:

```typescript
const response = await fetch('/api/ai/chat-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: query, history: chatHistory }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (reader) {
  const { value, done } = await reader.read();
  if (done) break;

  const rawChunk = decoder.decode(value, { stream: true });
  // Parse lines starting with "data: "
  const lines = rawChunk.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const payload = JSON.parse(line.replace('data: ', '').trim());
      if (payload.type === 'token') {
        setDisplayedText((prev) => prev + payload.token);
      }
    }
  }
}
```

---

## 6. Production Gotchas & Checklist

1. **Reverse Proxy Buffering (Nginx / Cloudflare):**
   * Proxies like Nginx buffer HTTP responses by default. If buffering is enabled, Nginx collects all tokens and sends them all at once at the end, ruining the typewriter effect.
   * **Fix in Nginx:**
     ```nginx
     location /api/ai/chat-stream {
         proxy_pass http://localhost:5000;
         proxy_buffering off;
         proxy_cache off;
         proxy_set_header Connection '';
         proxy_http_version 1.1;
         chunked_transfer_encoding off;
     }
     ```
   * Or return the header `X-Accel-Buffering: no` directly from NestJS.

2. **Compression Middleware:**
   * Global Gzip or Brotli compression can buffer small chunks until minimum block size (e.g. 1KB) is reached.
   * Ensure compression middleware ignores routes where `Content-Type === 'text/event-stream'`.

3. **Client Disconnect Cleanup:**
   * Always handle client unsubscription in RxJS so the server stops generating tokens if a user closes the modal or navigates away:
     ```typescript
     return new Observable<MessageEvent>((subscriber) => {
       // logic...
       return () => {
         // Cleanup code executed when connection closes
         console.log('Client closed SSE connection');
       };
     });
     ```



---

## 7. Mobile App Integration Guide (Flutter, React Native, iOS/Android)

The backend provides two consumption modes designed to work across all platforms:

### 1. Streaming Mode (`GET /ai/chat-stream`)

#### Flutter (Dart):
Using standard HTTP client with byte stream:
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> streamChat(String message) async {
  final url = Uri.parse('https://api.velinaelite.com/ai/chat-stream?message=${Uri.encodeComponent(message)}');
  final request = http.Request('GET', url);
  final response = await request.send();

  response.stream
      .transform(utf8.decoder)
      .transform(const LineSplitter())
      .listen((line) {
    if (line.startsWith('data: ')) {
      final jsonStr = line.replaceFirst('data: ', '').trim();
      final data = jsonDecode(jsonStr);

      if (data['type'] == 'token') {
        // Update UI with incoming token
        print(data['token']);
      } else if (data['type'] == 'products') {
        // Render product cards in carousel
        print(data['products']);
      }
    }
  });
}
```

#### React Native:
Using `react-native-sse` or `fetch` with streaming:
```typescript
import EventSource from 'react-native-sse';

const es = new EventSource(`https://api.velinaelite.com/ai/chat-stream?message=${encodeURIComponent(query)}`);

es.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'token') {
    appendToken(data.token);
  } else if (data.type === 'products') {
    setProducts(data.products);
  } else if (data.type === 'done') {
    es.close();
  }
});
```

---

### 2. Standard Blocking Mode (`POST /ai/chat`)
For simple implementations or fallback in mobile apps where streaming is not required:

```http
POST /ai/chat
Content-Type: application/json

{
  "message": "Do you have vitamin C serums?",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help you today?" }
  ]
}
```

**Response:**
```json
{
  "reply": "Yes! We have several Vitamin C serums for bright, radiant skin...",
  "productIds": [12, 18],
  "products": [
    {
      "id": 12,
      "title": "Jumiso All Day Vitamin Brightening Serum",
      "price": 1450,
      "images_url": ["https://..."]
    }
  ]
}
```

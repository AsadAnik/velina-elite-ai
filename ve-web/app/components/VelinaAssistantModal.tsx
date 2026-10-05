"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShoppingBag,
  RefreshCw,
  Loader2,
  Check,
  ExternalLink,
  MessageSquare,
  SparkleIcon
} from "lucide-react";
import { useStore } from "@/lib/store";
import { fetchApi } from "@/lib/api";
import { Product } from "@/types/product";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MarkdownContent from "./MarkdownContent";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  products?: Product[];
  timestamp: string;
}

const QUICK_PROMPTS = [
  { label: "✨ Skincare for glowing skin", query: "Recommend products for glowing skin and hydration" },
  { label: "💄 Trending makeup items", query: "What are your top trending makeup products?" },
  { label: "🚚 Order & Delivery info", query: "How long does shipping take and how do I track my order?" },
  { label: "🎁 Gift ideas under ৳2000", query: "Give me gift recommendations under 2000 BDT" },
];

export default function VelinaAssistantModal({
  isOpen,
  onClose,
  onOpenWhatsApp,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenWhatsApp?: () => void;
}) {
  const router = useRouter();
  const { addToCart, showToast } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [addedProductIds, setAddedProductIds] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-1",
          sender: "assistant",
          text: "Hello! Welcome to Velina Elite. 🌸 I am Velina AI Assistant, your personal beauty & luxury shopping guide. How can I help you today?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [messages.length]);

  // Fetch catalog products for AI recommendations
  useEffect(() => {
    fetchApi<Product[]>("/products?status=active&limit=50")
      .then((data) => {
        if (Array.isArray(data)) setAllProducts(data);
      })
      .catch((err) => {
        console.error("Failed to load products for AI assistant:", err);
      });
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  if (!isOpen) return null;

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        text: "Conversation reset! Feel free to ask me anything about our products, routines, or orders.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const generateAIResponse = (userQuery: string): { replyText: string; matchedProducts?: Product[] } => {
    const q = userQuery.toLowerCase();
    let matchedProducts: Product[] = [];

    // Filter products matching query keywords
    if (q.includes("skin") || q.includes("glow") || q.includes("serum") || q.includes("moisturiz") || q.includes("acne")) {
      matchedProducts = allProducts.filter(
        (p) =>
          p.category?.name?.toLowerCase().includes("skin") ||
          p.title.toLowerCase().includes("serum") ||
          p.title.toLowerCase().includes("cream") ||
          p.title.toLowerCase().includes("skin") ||
          p.description?.toLowerCase().includes("glow")
      ).slice(0, 3);

      if (matchedProducts.length === 0) matchedProducts = allProducts.slice(0, 3);

      return {
        replyText:
          "Here are our top skincare recommendations for radiant and healthy skin! These authentic products help hydrate, repair skin barriers, and boost natural glow:",
        matchedProducts,
      };
    }

    if (q.includes("makeup") || q.includes("lipstick") || q.includes("foundation") || q.includes("shade") || q.includes("face")) {
      matchedProducts = allProducts.filter(
        (p) =>
          p.category?.name?.toLowerCase().includes("makeup") ||
          p.title.toLowerCase().includes("lipstick") ||
          p.title.toLowerCase().includes("foundation") ||
          p.title.toLowerCase().includes("palette") ||
          p.title.toLowerCase().includes("blush")
      ).slice(0, 3);

      if (matchedProducts.length === 0) matchedProducts = allProducts.slice(0, 3);

      return {
        replyText:
          "Transform your look with our premium makeup selection! Here are some customer favorites:",
        matchedProducts,
      };
    }

    if (q.includes("gift") || q.includes("2000") || q.includes("budget") || q.includes("offer")) {
      matchedProducts = allProducts
        .filter((p) => (p.price || 0) <= 2500)
        .slice(0, 3);

      return {
        replyText:
          "Looking for wonderful gifts or budget-friendly luxury? Check out these gorgeous picks:",
        matchedProducts,
      };
    }

    if (q.includes("delivery") || q.includes("shipping") || q.includes("track") || q.includes("order") || q.includes("courier")) {
      return {
        replyText:
          "📦 **Velina Elite Shipping Policy**:\n• Inside Dhaka: Delivered within 24–48 hours (৳70)\n• Outside Dhaka: Delivered in 2–3 business days (৳130)\n• Cash on Delivery is available nationwide!\n\nIf you have an existing order number, you can view it under your profile or connect with our human support team on WhatsApp!",
      };
    }

    if (q.includes("authentic") || q.includes("original") || q.includes("real")) {
      return {
        replyText:
          "💯 **100% Original Guarantee**: All cosmetics and skincare at Velina Elite are directly imported from authorized global brand distributors. We guarantee 100% authenticity on every purchase.",
      };
    }

    // Default response with top general products
    matchedProducts = allProducts.slice(0, 3);
    return {
      replyText:
        "Thank you for asking! Velina Elite offers top authentic skincare, cosmetics, and haircare products. Take a look at these popular options or let me know if you are looking for something specific:",
      matchedProducts: matchedProducts.length > 0 ? matchedProducts : undefined,
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    // Build context history for multi-turn AI reasoning
    const historyPayload = messages
      .filter((m) => !m.id.startsWith("welcome"))
      .slice(-6)
      .map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      }));

    try {
      const response = await fetchApi<{
        reply: string;
        productIds: number[];
        products: Product[];
      }>("/ai/chat", {
        method: "POST",
        data: {
          message: query,
          history: historyPayload,
        },
      });

      if (response && response.reply) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "assistant",
          text: response.reply,
          products: response.products && response.products.length > 0 ? response.products : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        // Fallback to local heuristic
        const { replyText, matchedProducts } = generateAIResponse(query);
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "assistant",
          text: replyText,
          products: matchedProducts,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.warn("AI Backend call failed or offline, falling back to local heuristic:", err);
      const { replyText, matchedProducts } = generateAIResponse(query);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: replyText,
        products: matchedProducts,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    // Map API product to standard store product structure
    const p = {
      id: product.id,
      title: product.title,
      name: product.title,
      price: product.price,
      regular_price: product.regular_price,
      image: product.images_url?.[0] || "/placeholder-beauty.jpg",
      images_url: product.images_url || ["/placeholder-beauty.jpg"],
      rating: product.ratings?.[0]?.stars || 4.8,
      reviewsCount: 12,
      inStock: product.stock_quantity > 0,
      stock_quantity: product.stock_quantity,
      description: product.description || "",
      category_id: product.category_id,
      sub_category_id: product.sub_category_id,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };

    addToCart(p as any, true);
    setAddedProductIds((prev) => [...prev, product.id]);
    showToast(`Added ${product.title} to bag!`, "success");
  };

  return (
    <div className="fixed inset-0 lg:inset-auto lg:bottom-24 lg:right-6 z-[10000] w-full h-full lg:w-[420px] lg:h-[580px] lg:max-h-[calc(100vh-7.5rem)] flex flex-col bg-background border-none lg:border lg:border-border rounded-none lg:rounded-3xl shadow-2xl lg:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] dark:lg:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 pointer-events-auto">
      {/* Header */}
        
        {/* Header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-[#111111] via-[#1a1721] to-[#2b1728] dark:from-[#0a0a0c] dark:to-[#1f1220] text-white flex items-center justify-between shadow-md">
          {/* Subtle glowing background accent */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-[#e25c80]/20 to-[#b38e5d]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex items-center gap-3">
            <div className="relative flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#e25c80] via-[#c44062] to-[#b38e5d] text-white shadow-lg ring-2 ring-white/20">
              <Sparkles size={20} className="animate-pulse" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">Velina AI Assistant</h3>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-white/15 text-rose-200 rounded-full border border-white/20">
                  AI 2.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Online & Ready to help
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-1">
            <button
              onClick={handleClearHistory}
              title="Reset Chat"
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={onClose}
              title="Close Assistant"
              className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Banner Alert for WhatsApp Escalation */}
        <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <MessageSquare size={13} className="text-emerald-500 shrink-0" />
            Need live human agent support?
          </span>
          {onOpenWhatsApp && (
            <button
              onClick={onOpenWhatsApp}
              className="font-bold underline hover:text-emerald-600 transition-colors text-[11px]"
            >
              WhatsApp Us
            </button>
          )}
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-surface/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              } space-y-1`}
            >
              <div
                className={`flex items-end gap-2 max-w-[85%] ${
                  msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm ${
                    msg.sender === "user"
                      ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black"
                      : "bg-gradient-to-tr from-[#e25c80] to-[#b38e5d] text-white"
                  }`}
                >
                  {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>

                {/* Bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-[#111111] text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-br-none font-medium whitespace-pre-line"
                      : "bg-surface-2 text-foreground border border-border rounded-bl-none"
                  }`}
                >
                  {msg.sender === "user" ? (
                    msg.text
                  ) : (
                    <MarkdownContent content={msg.text} />
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-muted px-9">
                {msg.timestamp}
              </span>

              {/* Product Recommendation Cards (if returned by AI) */}
              {msg.products && msg.products.length > 0 && (
                <div className="w-full pl-9 pr-2 pt-2 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-velina-rose">
                    Suggested Products:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {msg.products.map((prod) => {
                      const isAdded = addedProductIds.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            router.push(`/products/${prod.id}`);
                          }}
                          className="flex items-center gap-3 p-2.5 rounded-2xl border border-border bg-background hover:border-velina-rose/50 hover:shadow-md transition-all shadow-sm group cursor-pointer"
                          title={`View details for ${prod.title}`}
                        >
                          <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-border">
                            {prod.images_url?.[0] ? (
                              <Image
                                src={prod.images_url[0]}
                                alt={prod.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted">
                                <ShoppingBag size={18} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-velina-rose transition-colors">
                              {prod.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-velina-rose">
                                ৳{prod.price?.toLocaleString()}
                              </span>
                              {prod.regular_price && prod.regular_price > prod.price && (
                                <span className="text-[10px] text-muted line-through">
                                  ৳{prod.regular_price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(prod);
                            }}
                            disabled={isAdded}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                              isAdded
                                ? "bg-emerald-500 text-white"
                                : "bg-velina-rose text-white hover:bg-velina-magenta shadow-sm"
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check size={12} /> Added
                              </>
                            ) : (
                              <>
                                <ShoppingBag size={12} /> Add
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 pl-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#e25c80] to-[#b38e5d] text-white flex items-center justify-center text-xs">
                <Bot size={14} />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-surface-2 border border-border text-xs text-muted flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin text-velina-rose" />
                <span>Velina Assistant is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-3 py-2 border-t border-border bg-background flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt.query)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-2 border border-border text-[11px] font-medium text-foreground transition-all hover:scale-105"
            >
              {prompt.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-background border-t border-border flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask Velina AI about products, skin routines..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-surface border border-border text-xs focus:outline-none focus:ring-2 focus:ring-velina-rose/50 transition-all text-foreground placeholder:text-muted"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim()}
            className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#e25c80] via-[#c44062] to-[#b38e5d] text-white hover:opacity-90 disabled:opacity-40 transition-all shadow-md shrink-0"
          >
            <Send size={15} />
          </button>
        </div>

      </div>
  );
}

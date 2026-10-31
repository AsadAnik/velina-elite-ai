"use client";

import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { fetchApi } from "@/lib/api";
import { X, Sparkles, MessageCircle } from "lucide-react";
import VelinaAssistantModal from "./VelinaAssistantModal";

function buildWhatsAppUrl(numberStr?: string, messageStr?: string) {
  const digits = (numberStr || "8801347375533").replace(/[^\d]/g, "");
  let url = `https://wa.me/${digits || "8801347375533"}`;
  if (messageStr && messageStr.trim()) {
    url += `?text=${encodeURIComponent(messageStr.trim())}`;
  }
  return url;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function FloatingChatWidget() {
  const pathname = usePathname();
  const { isWhatsAppHidden, setWhatsAppHidden, siteSettings } = useStore();

  const settings = siteSettings || {
    whatsapp_number: "8801347375533",
    whatsapp_message: "Hello! I have a question about Velina Elite.",
    is_whatsapp_active: true,
    is_ai_active: true,
  };

  const whatsappUrlRef = useRef(buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_message));

  useEffect(() => {
    whatsappUrlRef.current = buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_message);
  }, [settings.whatsapp_number, settings.whatsapp_message]);

  // Floating speed-dial open/closed state & AI Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const posRef = useRef({ top: -500, left: -500 });
  const [pos, _setPos] = useState({ top: -500, left: -500 });
  const setPos = (p: { top: number; left: number }) => {
    posRef.current = p;
    _setPos(p);
  };

  const [isDragging, setIsDragging] = useState(false);
  const [isOverDismissZone, setIsOverDismissZone] = useState(false);
  const isOverDismissZoneRef = useRef(false);

  const [ready, setReady] = useState(false);
  const didMove = useRef(false);

  const dragEl = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });

  const clamp = (p: { top: number; left: number }, elW = 70, elH = 70) => ({
    top: Math.max(8, Math.min(p.top, window.innerHeight - elH - 8)),
    left: Math.max(8, Math.min(p.left, window.innerWidth - elW - 8)),
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("velina_wa_pos");
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p.top === "number" && typeof p.left === "number") {
          setPos(clamp(p));
          setReady(true);
          return;
        }
      }
    } catch { /* ignore */ }

    const isMobile = window.innerWidth < 640;
    setPos({
      top: window.innerHeight - (isMobile ? 90 : 110),
      left: window.innerWidth - (isMobile ? 86 : 280),
    });
    setReady(true);
  }, []);

  useEffect(() => {
    const onResize = () => {
      setPos(clamp(posRef.current));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const startCoord = useRef({ x: 0, y: 0 });
  const startTime = useRef(0);

  const openWhatsApp = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const url = whatsappUrlRef.current;
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== "undefined" ? navigator.userAgent : ""
      ) || (typeof window !== "undefined" && window.innerWidth < 768);

    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setIsOpen(false);
  };

  const openVelinaAssistant = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsAssistantOpen(true);
    setIsOpen(false);
  };

  useEffect(() => {
    const el = dragEl.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      didMove.current = false;
      startCoord.current = { x: e.clientX, y: e.clientY };
      startTime.current = Date.now();

      const rect = el.getBoundingClientRect();
      offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
      setIsOverDismissZone(false);
      isOverDismissZoneRef.current = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!el.hasPointerCapture(e.pointerId)) return;

      const dist = Math.hypot(
        e.clientX - startCoord.current.x,
        e.clientY - startCoord.current.y
      );

      if (dist > 7) {
        didMove.current = true;
        setIsDragging(true);

        const elW = el.offsetWidth || 70;
        const elH = el.offsetHeight || 70;
        const newPos = {
          top: Math.max(8, Math.min(e.clientY - offset.current.y, window.innerHeight - elH - 8)),
          left: Math.max(8, Math.min(e.clientX - offset.current.x, window.innerWidth - elW - 8)),
        };
        setPos(newPos);

        const targetX = window.innerWidth / 2;
        const targetY = window.innerHeight - 70;
        const dx = e.clientX - targetX;
        const dy = e.clientY - targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const isNearDismiss = distance < 95;

        isOverDismissZoneRef.current = isNearDismiss;
        setIsOverDismissZone(isNearDismiss);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (el.hasPointerCapture(e.pointerId)) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {}
      }

      setIsDragging(false);

      if (isOverDismissZoneRef.current) {
        setWhatsAppHidden(true);
        setIsOverDismissZone(false);
        isOverDismissZoneRef.current = false;
        return;
      }

      setIsOverDismissZone(false);
      isOverDismissZoneRef.current = false;

      // Only save position if dragged
      if (didMove.current) {
        localStorage.setItem("velina_wa_pos", JSON.stringify(posRef.current));
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (el.hasPointerCapture(e.pointerId)) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {}
      }
      setIsDragging(false);
      setIsOverDismissZone(false);
      isOverDismissZoneRef.current = false;
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    el.addEventListener("lostpointercapture", onPointerCancel);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
      el.removeEventListener("lostpointercapture", onPointerCancel);
    };
  }, [setWhatsAppHidden]);

  if (pathname.startsWith("/admin")) return null;

  const isAiActive = settings.is_ai_active !== false;
  const isWhatsAppActive = settings.is_whatsapp_active !== false;

  const hidden = isWhatsAppHidden || (!isAiActive && !isWhatsAppActive);

  const handleChatHeadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (didMove.current) return;
    
    // If only one option is active, open it directly on click!
    if (isAiActive && !isWhatsAppActive) {
      openVelinaAssistant();
      return;
    }
    if (isWhatsAppActive && !isAiActive) {
      openWhatsApp();
      return;
    }
    
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          zIndex: 9999,
          visibility: ready && !hidden ? "visible" : "hidden",
          pointerEvents: ready && !hidden ? "auto" : "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <div className="relative flex flex-col items-end">

          {/* ── EXPANDED SPEED DIAL OPTIONS (SHOWN WHEN CHAT HEAD IS CLICKED) ── */}
          {isOpen && !isDragging && (
            <div className="absolute bottom-full mb-3 flex flex-col gap-3 items-end animate-in fade-in slide-in-from-bottom-4 duration-200 z-[10001]">
              
              {/* Option 1: Velina AI Assistant */}
              {isAiActive && (
                <div
                  onClick={openVelinaAssistant}
                  className="flex items-center gap-2.5 cursor-pointer group pointer-events-auto"
                >
                  <div className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-2xl bg-zinc-900/90 dark:bg-zinc-800/90 text-white backdrop-blur-md shadow-xl border border-white/10 transition-transform group-hover:scale-105">
                    <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                      <Sparkles size={11} /> Velina AI Assistant
                    </span>
                    <span className="text-[9px] text-zinc-300">24/7 Smart Beauty Guide</span>
                  </div>
                  <button
                    type="button"
                    onClick={openVelinaAssistant}
                    aria-label="Open Velina AI Assistant"
                    className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#e25c80] via-[#c44062] to-[#b38e5d] text-white shadow-[0_8px_25px_rgba(226,92,128,0.5)] ring-2 ring-white/30 hover:scale-110 active:scale-95 transition-all duration-200"
                  >
                    <Sparkles className="h-6 w-6 animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-white">
                      AI
                    </span>
                  </button>
                </div>
              )}

              {/* Option 2: WhatsApp Support */}
              {isWhatsAppActive && (
                <div
                  onClick={openWhatsApp}
                  className="flex items-center gap-2.5 cursor-pointer group pointer-events-auto"
                >
                  <div className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-2xl bg-zinc-900/90 dark:bg-zinc-800/90 text-white backdrop-blur-md shadow-xl border border-white/10 transition-transform group-hover:scale-105">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <MessageCircle size={11} /> WhatsApp Support
                    </span>
                    <span className="text-[9px] text-zinc-300">Human Agent & Orders</span>
                  </div>
                  <button
                    type="button"
                    onClick={openWhatsApp}
                    aria-label="Chat on WhatsApp"
                    className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_25px_rgba(37,211,102,0.5)] ring-2 ring-white/30 hover:scale-110 active:scale-95 transition-all duration-200"
                  >
                    <WhatsAppIcon className="h-6 w-6" />
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ── MASKED CHAT HEAD LAUNCHER BUTTON ── */}
          <div
            ref={dragEl}
            role="button"
            tabIndex={0}
            aria-label="Open Chat Options"
            onClick={handleChatHeadClick}
            style={{ touchAction: "none", cursor: isDragging ? "grabbing" : "grab" }}
            className={`relative flex items-center justify-center h-14 w-14 rounded-full select-none transition-all duration-200 ${
              isOverDismissZone
                ? "bg-rose-500 scale-90 opacity-70 shadow-none"
                : isOpen
                ? "bg-zinc-900 dark:bg-zinc-800 shadow-2xl ring-2 ring-white/30 scale-105"
                : isDragging
                ? "bg-gradient-to-tr from-[#111111] via-[#1c1622] to-[#c44062] shadow-[0_20px_50px_rgba(196,64,98,0.8)] scale-110"
                : "bg-gradient-to-tr from-[#111111] via-[#1a1721] to-[#c44062] shadow-[0_10px_35px_rgba(226,92,128,0.5)] hover:scale-110 ring-2 ring-white/20"
            }`}
          >
            {/* Ambient shimmer ring */}
            {!isOpen && (
              <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#e25c80] to-[#25D366] animate-ping opacity-25 pointer-events-none" />
            )}

            {/* Toggle Icon or Masked Chat Head Icons */}
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <div className="relative flex items-center justify-center pointer-events-none">
                {/* Masked dual-avatar head */}
                <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-tr from-[#e25c80] via-[#c44062] to-[#b38e5d] text-white ring-1 ring-white/40 shadow-inner overflow-hidden">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  {/* Overlapping WhatsApp mini badge */}
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] ring-2 ring-[#111111] text-white">
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
                {/* Active status pulse dot */}
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-[#111111]" />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Messenger-style Drag-to-Dismiss Drop Zone */}
      {isDragging && ready && !hidden && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
          }}
          className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-200 pointer-events-none ${
            isOverDismissZone ? "scale-110" : "scale-100"
          }`}
        >
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-2xl transition-all ${
              isOverDismissZone
                ? "bg-rose-600 border-white text-white shadow-rose-600/70 animate-bounce scale-110"
                : "bg-zinc-900/90 border-zinc-700 text-zinc-300 backdrop-blur-md"
            }`}
          >
            <X size={isOverDismissZone ? 24 : 20} className="stroke-[3]" />
          </div>
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md transition-colors ${
              isOverDismissZone ? "bg-rose-600 text-white" : "bg-zinc-900/90 text-zinc-300 backdrop-blur-md"
            }`}
          >
            {isOverDismissZone ? "Release to Hide" : "Drag here to hide"}
          </span>
        </div>
      )}

      {/* Interactive Velina AI Assistant Floating Chat Window */}
      <VelinaAssistantModal
        isOpen={isAssistantOpen && isAiActive}
        onClose={() => setIsAssistantOpen(false)}
        onOpenWhatsApp={openWhatsApp}
      />
    </>
  );
}

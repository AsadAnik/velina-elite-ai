"use client";

import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { fetchApi } from "@/lib/api";
import { X } from "lucide-react";

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

export default function WhatsAppButton() {
  const pathname = usePathname();
  const { isWhatsAppHidden, setWhatsAppHidden } = useStore();

  const [settings, setSettings] = useState<{
    whatsapp_number?: string;
    whatsapp_message?: string;
    is_whatsapp_active?: boolean;
  }>({
    whatsapp_number: "8801347375533",
    whatsapp_message: "Hello! I have a question about Velina Elite.",
    is_whatsapp_active: true,
  });
  const whatsappUrlRef = useRef(buildWhatsAppUrl("8801347375533", "Hello! I have a question about Velina Elite."));

  // Fetch dynamic settings from API
  useEffect(() => {
    fetchApi<{
      whatsapp_number?: string;
      whatsapp_message?: string;
      is_whatsapp_active?: boolean;
    }>("/site-settings")
      .then((data) => {
        if (data) {
          setSettings(data);
          whatsappUrlRef.current = buildWhatsAppUrl(data.whatsapp_number, data.whatsapp_message);
        }
      })
      .catch((err) => {
        console.error("Failed to load site settings for WhatsApp button:", err);
      });
  }, []);

  // Start off-screen so element mounts immediately (ref available), then snap to real position
  const posRef = useRef({ top: -500, left: -500 });
  const [pos, _setPos] = useState({ top: -500, left: -500 });
  const setPos = (p: { top: number; left: number }) => {
    posRef.current = p;
    _setPos(p);
  };

  const [isDragging, setIsDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const didMove = useRef(false);

  const dragEl = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });

  // ── Clamp position so button stays within viewport
  const clamp = (p: { top: number; left: number }, elW = 70, elH = 70) => ({
    top: Math.max(8, Math.min(p.top, window.innerHeight - elH - 8)),
    left: Math.max(8, Math.min(p.left, window.innerWidth - elW - 8)),
  });

  // ── Step 1: Load position (runs after first render, ref is already available)
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

    // Mobile-safe default: bottom-right with enough room for the button
    const isMobile = window.innerWidth < 640;
    setPos({
      top: window.innerHeight - (isMobile ? 90 : 100),
      left: window.innerWidth - (isMobile ? 86 : 260),
    });
    setReady(true);
  }, []);

  // ── Re-clamp on window resize (e.g. device rotation)
  useEffect(() => {
    const onResize = () => {
      setPos(clamp(posRef.current));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Step 2: Attach pointer events (runs after first render, dragEl.current is valid)
  useEffect(() => {
    const el = dragEl.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      didMove.current = false;

      // getBoundingClientRect gives current rendered position
      const rect = el.getBoundingClientRect();
      offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      // Pointer capture: browser routes ALL subsequent pointer events here
      // even if finger/cursor moves off element or off screen
      el.setPointerCapture(e.pointerId);
      setIsDragging(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      e.preventDefault();
      didMove.current = true;

      // Clamp so button can't be dragged off any edge
      const elW = el.offsetWidth || 70;
      const elH = el.offsetHeight || 70;
      const newPos = {
        top: Math.max(8, Math.min(e.clientY - offset.current.y, window.innerHeight - elH - 8)),
        left: Math.max(8, Math.min(e.clientX - offset.current.x, window.innerWidth - elW - 8)),
      };
      setPos(newPos);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      el.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      localStorage.setItem("velina_wa_pos", JSON.stringify(posRef.current));

      // If it was just a tap (no movement), open WhatsApp
      if (!didMove.current) {
        window.open(whatsappUrlRef.current, "_blank", "noopener,noreferrer");
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, []); // empty deps — safe because we use refs for all mutable values

  if (pathname.startsWith("/admin")) return null;

  // Always render the div (never unmount it) so the dragEl ref stays valid
  // and pointer listeners don't need re-attaching after hide/unhide.
  // Visibility is controlled by CSS display below.
  const hidden = isWhatsAppHidden || settings.is_whatsapp_active === false;

  return (
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
      <div className="relative group">

        {/* Hide button */}
        <button
          style={{ position: "absolute", top: -8, right: -8, zIndex: 10 }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setWhatsAppHidden(true)}
          className="bg-white dark:bg-zinc-800 text-zinc-500 hover:text-velina-rose border border-zinc-200 dark:border-zinc-700 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          title="Hide chat button"
        >
          <X size={14} />
        </button>

        {/* Draggable button — touch-action:none prevents scroll interference */}
        <div
          ref={dragEl}
          style={{ touchAction: "none", cursor: isDragging ? "grabbing" : "grab" }}
          className={`relative flex items-center gap-3 rounded-full bg-[#25D366] pl-4 pr-5 py-3.5 text-white select-none transition-all duration-200 ${
            isDragging
              ? "shadow-[0_20px_60px_rgba(37,211,102,0.8)] scale-[1.06]"
              : "shadow-[0_8px_30px_rgba(37,211,102,0.45)] hover:shadow-[0_12px_40px_rgba(37,211,102,0.6)]"
          }`}
        >
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none" />
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/25 pointer-events-none">
            <WhatsAppIcon className="h-5 w-5" />
          </span>
          <span className="relative hidden sm:flex flex-col items-start leading-none pointer-events-none">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
              Need help?
            </span>
            <span className="mt-1 text-sm font-black tracking-wide">Chat on WhatsApp</span>
          </span>
        </div>

      </div>
    </div>
  );
}

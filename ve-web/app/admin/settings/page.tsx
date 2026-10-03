"use client";

import { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { Save, MessageCircle, Phone, MessageSquare, ExternalLink, CheckCircle2, AlertCircle, Image as ImageIcon, Upload, Globe, Sparkles } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import Image from "next/image";

interface SiteSettings {
  id?: number;
  site_name: string;
  site_logo: string;
  whatsapp_number: string;
  whatsapp_message: string;
  is_whatsapp_active: boolean;
  updated_at?: string;
}

export default function SettingsPage() {
  const { refreshSiteSettings } = useStore();
  const [activeTab, setActiveTab] = useState<"branding" | "whatsapp">("branding");

  const [settings, setSettings] = useState<SiteSettings>({
    site_name: "Velina Elite",
    site_logo: "/1776256116755-removebg-preview.png",
    whatsapp_number: "8801347375533",
    whatsapp_message: "Hello! I have a question about Velina Elite.",
    is_whatsapp_active: true,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<SiteSettings>("/site-settings");
      if (data) {
        setSettings({
          site_name: data.site_name || "Velina Elite",
          site_logo: data.site_logo || "/1776256116755-removebg-preview.png",
          whatsapp_number: data.whatsapp_number || "8801347375533",
          whatsapp_message: data.whatsapp_message || "Hello! I have a question about Velina Elite.",
          is_whatsapp_active: data.is_whatsapp_active ?? true,
          updated_at: data.updated_at,
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  // ── Save Branding Tab Independent Handler (PATCH)
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToastMessage(null);

    try {
      let updated: SiteSettings;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("site_name", settings.site_name);
        formData.append("logo_file", selectedFile);

        updated = await fetchApi<SiteSettings>("/site-settings", {
          method: "PATCH",
          data: formData,
        });
      } else {
        const payload = {
          site_name: settings.site_name,
          site_logo: settings.site_logo,
        };

        updated = await fetchApi<SiteSettings>("/site-settings", {
          method: "PATCH",
          data: payload,
        });
      }

      if (updated) {
        setSettings((prev) => ({
          ...prev,
          site_name: updated.site_name || prev.site_name,
          site_logo: updated.site_logo || prev.site_logo,
          updated_at: updated.updated_at,
        }));
        setSelectedFile(null);
        setFilePreview(null);
      }

      await refreshSiteSettings();
      setToastMessage({ type: "success", text: "Store branding and logo updated successfully!" });
    } catch (error: unknown) {
      console.error("Failed to save branding settings:", error);
      const msg = error instanceof Error ? error.message : "Failed to save branding settings.";
      setToastMessage({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Save WhatsApp Tab Independent Handler (PATCH)
  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToastMessage(null);

    const rawNumber = settings.whatsapp_number.trim();
    const cleanNumber = rawNumber.replace(/[^\d]/g, "");

    if (!cleanNumber) {
      setToastMessage({ type: "error", text: "Please enter a valid WhatsApp phone number." });
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        whatsapp_number: cleanNumber,
        whatsapp_message: settings.whatsapp_message,
        is_whatsapp_active: settings.is_whatsapp_active,
      };

      const updated = await fetchApi<SiteSettings>("/site-settings", {
        method: "PATCH",
        data: payload,
      });

      if (updated) {
        setSettings((prev) => ({
          ...prev,
          whatsapp_number: updated.whatsapp_number || cleanNumber,
          whatsapp_message: updated.whatsapp_message || "",
          is_whatsapp_active: updated.is_whatsapp_active ?? true,
          updated_at: updated.updated_at,
        }));
      }

      await refreshSiteSettings();
      setToastMessage({ type: "success", text: "WhatsApp chat preferences updated successfully!" });
    } catch (error: unknown) {
      console.error("Failed to save WhatsApp settings:", error);
      const msg = error instanceof Error ? error.message : "Failed to save WhatsApp settings.";
      setToastMessage({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTestWhatsAppUrl = () => {
    const digits = settings.whatsapp_number.replace(/[^\d]/g, "") || "8801347375533";
    let url = `https://wa.me/${digits}`;
    if (settings.whatsapp_message && settings.whatsapp_message.trim()) {
      url += `?text=${encodeURIComponent(settings.whatsapp_message.trim())}`;
    }
    return url;
  };

  const currentLogoSrc = filePreview || settings.site_logo || "/1776256116755-removebg-preview.png";

  return (
    <AdminShell title="Settings" subtitle="Configure store branding, logo, and WhatsApp preferences">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Toast Alert Feedback */}
        {toastMessage && (
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border ${
              toastMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}
          >
            {toastMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </div>
        )}

        {/* TOP TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-border pb-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("branding");
              setToastMessage(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "branding"
                ? "bg-gradient-to-r from-velina-rose to-velina-magenta text-white shadow-md shadow-velina-rose/20"
                : "text-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <Globe size={16} />
            Store Branding & Logo
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("whatsapp");
              setToastMessage(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "whatsapp"
                ? "bg-gradient-to-r from-[#25D366] to-emerald-600 text-white shadow-md shadow-[#25D366]/20"
                : "text-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <MessageCircle size={16} />
            WhatsApp Contract & Chat
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted">Loading store settings...</div>
          </div>
        ) : (
          <div>
            {/* TAB 1: BRANDING & LOGO */}
            {activeTab === "branding" && (
              <form onSubmit={handleSaveBranding} className="space-y-6">
                <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-velina-rose/10 text-velina-rose">
                        <Globe size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Website & Store Branding</h3>
                        <p className="text-sm text-muted">
                          Set the official brand name and logo displayed across header, navbar, sidebar, and footer
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Brand Name Input */}
                    <div className="space-y-2">
                      <label htmlFor="site_name" className="block text-sm font-semibold text-foreground">
                        Store / Brand Name
                      </label>
                      <input
                        id="site_name"
                        type="text"
                        value={settings.site_name}
                        onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all font-semibold"
                        placeholder="e.g. Velina Elite"
                        required
                      />
                      <p className="text-xs text-muted">This name will appear on the storefront header, navigation bar, and footer.</p>
                    </div>

                    {/* Brand Logo Upload & URL */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-foreground">
                        Storefront & Admin Brand Logo Icon
                      </label>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* File Upload Box */}
                        <div className="space-y-2">
                          <div className="border-2 border-dashed border-border hover:border-velina-rose rounded-2xl p-6 text-center transition-colors cursor-pointer bg-surface/30 relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <div className="p-3 bg-velina-rose/10 text-velina-rose rounded-full">
                                <Upload size={20} />
                              </div>
                              <span className="text-xs font-bold text-foreground">
                                {selectedFile ? selectedFile.name : "Click or drag logo image file here"}
                              </span>
                              <span className="text-[10px] text-muted">PNG, SVG, WEBP or JPG (transparent bg recommended)</span>
                            </div>
                          </div>
                        </div>

                        {/* Logo Image URL Option */}
                        <div className="space-y-2">
                          <label htmlFor="site_logo_url" className="text-xs font-bold text-muted uppercase tracking-wider">
                            Or enter Logo Image URL directly
                          </label>
                          <input
                            id="site_logo_url"
                            type="text"
                            value={settings.site_logo}
                            onChange={(e) => {
                              setSettings({ ...settings, site_logo: e.target.value });
                              setSelectedFile(null);
                              setFilePreview(null);
                            }}
                            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all text-xs"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      {/* Live Branding Preview */}
                      <div className="rounded-xl border border-border bg-surface/50 p-4 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                          <ImageIcon size={14} className="text-velina-rose" />
                          Live Header & Navigation Preview
                        </div>
                        <div className="flex items-center gap-6 flex-wrap p-4 bg-white dark:bg-zinc-900 rounded-xl border border-border">
                          {/* Navbar Logo Preview */}
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-32 shrink-0">
                              <Image
                                src={currentLogoSrc}
                                alt="Logo preview"
                                fill
                                sizes="128px"
                                className="object-contain object-left scale-125 dark:invert"
                              />
                            </div>
                          </div>
                          {/* Sidebar Brand Preview */}
                          <div className="flex items-center gap-2.5 border-l border-border pl-6">
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-velina-peach/40">
                              <Image
                                src={currentLogoSrc}
                                alt="Logo icon"
                                fill
                                sizes="32px"
                                className="object-contain p-1 dark:invert"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-black text-foreground">{settings.site_name || "Velina Elite"}</p>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-velina-rose">Admin Panel</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Branding Button */}
                    <div className="flex justify-end pt-4 border-t border-border">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-velina-rose to-velina-magenta px-7 py-3 text-sm font-bold text-white shadow-md shadow-velina-rose/25 hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Save size={16} />
                        {isSubmitting ? "Saving Branding..." : "Save Branding Settings"}
                      </button>
                    </div>

                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: WHATSAPP CONFIGURATION */}
            {activeTab === "whatsapp" && (
              <form onSubmit={handleSaveWhatsApp} className="space-y-6">
                <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366]">
                          <MessageCircle size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">WhatsApp Contract & Support Number</h3>
                          <p className="text-sm text-muted">
                            Assign the official WhatsApp number for customer inquiries and contract chats
                          </p>
                        </div>
                      </div>

                      <a
                        href={getTestWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all cursor-pointer"
                        title="Test opening WhatsApp contract link with current number"
                      >
                        <ExternalLink size={14} />
                        Test WhatsApp Link
                      </a>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">

                    {/* Active Switch */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface/50">
                      <div>
                        <div className="text-sm font-semibold text-foreground">Enable Floating WhatsApp Button</div>
                        <div className="text-xs text-muted">Show the interactive floating WhatsApp button on storefront pages</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.is_whatsapp_active}
                          onChange={(e) => setSettings({ ...settings, is_whatsapp_active: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                      </label>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <label htmlFor="whatsapp_number" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Phone size={16} className="text-[#25D366]" />
                        WhatsApp Phone Number (With Country Code)
                      </label>
                      <input
                        id="whatsapp_number"
                        type="text"
                        value={settings.whatsapp_number}
                        onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-[#25D366] focus:outline-none focus:ring-1 focus:ring-[#25D366] transition-all font-mono"
                        placeholder="e.g. 8801347375533 or +8801347375533"
                        required
                      />
                      <p className="text-xs text-muted">
                        Include country code without spaces or dashes (e.g. <span className="font-semibold text-foreground">8801347375533</span> for Bangladesh).
                      </p>
                    </div>

                    {/* Default Welcome Message */}
                    <div className="space-y-2">
                      <label htmlFor="whatsapp_message" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <MessageSquare size={16} className="text-velina-rose" />
                        Pre-filled Chat Message (Optional)
                      </label>
                      <textarea
                        id="whatsapp_message"
                        rows={3}
                        value={settings.whatsapp_message}
                        onChange={(e) => setSettings({ ...settings, whatsapp_message: e.target.value })}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-velina-rose focus:outline-none focus:ring-1 focus:ring-velina-rose transition-all"
                        placeholder="e.g. Hello! I have a question about Velina Elite."
                      />
                      <p className="text-xs text-muted">
                        This text will automatically pre-fill when a customer clicks the WhatsApp button to contact you.
                      </p>
                    </div>

                    {/* WhatsApp Link Preview */}
                    <div className="rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#25D366]">
                        Generated WhatsApp Contract Link
                      </div>
                      <div className="text-xs font-mono text-muted break-all select-all">
                        {getTestWhatsAppUrl()}
                      </div>
                    </div>

                    {/* Submit WhatsApp Button */}
                    <div className="flex justify-end pt-4 border-t border-border">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#25D366] to-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-[#25D366]/25 hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Save size={16} />
                        {isSubmitting ? "Saving WhatsApp Settings..." : "Save WhatsApp Settings"}
                      </button>
                    </div>

                  </div>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </AdminShell>
  );
}

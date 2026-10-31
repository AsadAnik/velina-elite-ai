"use client";

import { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import {
  Save,
  MessageCircle,
  Phone,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Globe,
  ShieldCheck,
  Shield,
  Crown,
  UserPlus,
  UserCheck,
  Trash2,
  Search,
  Lock,
  Mail,
  User as UserIcon,
  Plus,
  Eye,
  EyeOff,
  UserX,
  X,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Bot,
} from "lucide-react";
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
  is_ai_active?: boolean;
  updated_at?: string;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: "owner" | "admin" | "customer";
  created_at: string;
  updated_at?: string;
  customer?: {
    id: number;
    fname: string;
    lname: string;
    phone?: string | null;
    gender?: string;
  } | null;
  fullName: string;
}

export default function SettingsPage() {
  const { user: currentUser, refreshSiteSettings } = useStore();
  const [activeTab, setActiveTab] = useState<"branding" | "whatsapp" | "admins">("branding");

  // Site Settings state
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

  // Admin Management state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    user: AdminUser;
    action: "revoke" | "delete";
  } | null>(null);

  const [createAdminForm, setCreateAdminForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "owner",
    phone: "",
  });

  // Customer search for promotion
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
          is_ai_active: data.is_ai_active ?? true,
          updated_at: data.updated_at,
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const list = await fetchApi<AdminUser[]>("/admin-users");
      setAdminUsers(list || []);
    } catch (error) {
      console.error("Failed to load admin users:", error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadAdmins();
  }, []);

  const handleSearchCustomers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await fetchApi<AdminUser[]>(
        `/admin-users/search-customers?query=${encodeURIComponent(query.trim())}`
      );
      setSearchResults(results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdmin(true);
    setToastMessage(null);

    try {
      const res = await fetchApi<AdminUser>("/admin-users", {
        method: "POST",
        data: {
          fullName: createAdminForm.fullName.trim(),
          email: createAdminForm.email.trim().toLowerCase(),
          password: createAdminForm.password,
          role: createAdminForm.role,
          phone: createAdminForm.phone.trim() || undefined,
        },
      });

      if (res) {
        setAdminUsers((prev) => [res, ...prev.filter((u) => u.id !== res.id)]);
      }

      setCreateAdminForm({
        fullName: "",
        email: "",
        password: "",
        role: "admin",
        phone: "",
      });
      setShowCreateModal(false);
      setToastMessage({
        type: "success",
        text: `New ${createAdminForm.role === "owner" ? "System Owner" : "Store Administrator"} created successfully!`,
      });
      loadAdmins();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to create administrator.";
      setToastMessage({ type: "error", text: msg });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleUpdateRole = async (targetUser: AdminUser, newRole: "admin" | "owner" | "customer") => {
    setIsSubmittingAdmin(true);
    setToastMessage(null);

    try {
      await fetchApi<AdminUser>(`/admin-users/${targetUser.id}/role`, {
        method: "PATCH",
        data: { role: newRole },
      });

      if (newRole === "customer") {
        setAdminUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
        setToastMessage({
          type: "success",
          text: `Admin access for ${targetUser.fullName || targetUser.email} has been revoked (set to Customer).`,
        });
      } else {
        setAdminUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
        );
        setToastMessage({
          type: "success",
          text: `Role for ${targetUser.fullName || targetUser.email} updated to ${newRole.toUpperCase()}.`,
        });
      }
      loadAdmins();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update role.";
      setToastMessage({ type: "error", text: msg });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handlePromoteExistingCustomer = async (targetUser: AdminUser, roleToAssign: "admin" | "owner") => {
    setIsSubmittingAdmin(true);
    setToastMessage(null);

    try {
      await fetchApi(`/admin-users/${targetUser.id}/role`, {
        method: "PATCH",
        data: { role: roleToAssign },
      });

      setToastMessage({
        type: "success",
        text: `Customer ${targetUser.fullName || targetUser.email} has been assigned as ${roleToAssign.toUpperCase()}!`,
      });
      setShowPromoteModal(false);
      setSearchQuery("");
      setSearchResults([]);
      loadAdmins();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to assign role.";
      setToastMessage({ type: "error", text: msg });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!deleteDialog) return;
    const { user: targetUser, action } = deleteDialog;

    setIsSubmittingAdmin(true);
    setToastMessage(null);

    try {
      const res = await fetchApi<{ message: string; actionTaken: string }>(
        `/admin-users/${targetUser.id}?action=${action}`,
        {
          method: "DELETE",
        }
      );

      setAdminUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      setToastMessage({
        type: "success",
        text: res?.message || (action === "delete" ? "Account removed." : "Admin access revoked."),
      });
      setDeleteDialog(null);
      loadAdmins();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to remove user.";
      setToastMessage({ type: "error", text: msg });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

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
        is_ai_active: settings.is_ai_active,
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
          is_ai_active: updated.is_ai_active ?? true,
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

  const totalOwners = adminUsers.filter((u) => u.role === "owner").length;
  const totalAdmins = adminUsers.filter((u) => u.role === "admin").length;

  return (
    <AdminShell title="Settings" subtitle="Configure store branding, WhatsApp chat, and administrator accounts">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Toast Alert Feedback */}
        {toastMessage && (
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${
              toastMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}
          >
            {toastMessage.type === "success" ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </div>
        )}

        {/* TOP TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab("branding");
              setToastMessage(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
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
            className={`flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "whatsapp"
                ? "bg-gradient-to-r from-[#e25c80] via-[#c44062] to-[#25D366] text-white shadow-md"
                : "text-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <Sparkles size={16} />
            <div className="flex flex-col items-start leading-tight">
              <span className="font-extrabold text-sm">Velina Live Support</span>
              <span className={`text-[9px] font-black uppercase tracking-wider ${activeTab === "whatsapp" ? "text-rose-100" : "text-velina-rose"}`}>
                Velina-AI
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("admins");
              setToastMessage(null);
              loadAdmins();
            }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "admins"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                : "text-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <ShieldCheck size={16} />
            Admin Accounts & Roles
            {adminUsers.length > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === "admins" ? "bg-white/20 text-white" : "bg-surface border border-border text-foreground"
              }`}>
                {adminUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* ─── TAB 1: BRANDING & LOGO ─── */}
        {activeTab === "branding" && (
          loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted">Loading store settings...</div>
            </div>
          ) : (
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
          )
        )}

        {/* ─── TAB 2: VELINA LIVE SUPPORT CONTROL CENTER ─── */}
        {activeTab === "whatsapp" && (
          loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted">Loading live support preferences...</div>
            </div>
          ) : (
            <form onSubmit={handleSaveWhatsApp} className="space-y-6">
              <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#e25c80] via-[#c44062] to-[#25D366] text-white shadow-md">
                        <Sparkles size={20} className="animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-foreground">Velina Live Support</h3>
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-full">
                            Velina-AI
                          </span>
                        </div>
                        <p className="text-sm text-muted mt-0.5">
                          Control center for AI Assistant and WhatsApp customer engagement launcher
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

                  {/* ── CONTROL 1: VELINA-AI CHAT ENGINE SWITCH ── */}
                  <div className="p-5 rounded-2xl border border-border bg-surface/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#e25c80] to-[#b38e5d] text-white shadow-sm">
                          <Bot size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-foreground">Velina-AI Chat Engine</h4>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              settings.is_ai_active !== false
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            }`}>
                              {settings.is_ai_active !== false ? "🟢 Active & Responding" : "🔴 Disabled"}
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-0.5">
                            Enable interactive 24/7 AI beauty advisor and product finder on storefront pages
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={settings.is_ai_active !== false}
                          onChange={(e) => setSettings({ ...settings, is_ai_active: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#e25c80] peer-checked:to-[#c44062]"></div>
                      </label>
                    </div>
                  </div>

                  {/* ── CONTROL 2: WHATSAPP SUPPORT SWITCH ── */}
                  <div className="p-5 rounded-2xl border border-border bg-surface/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm">
                          <MessageCircle size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-foreground">WhatsApp Human Support</h4>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              settings.is_whatsapp_active !== false
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            }`}>
                              {settings.is_whatsapp_active !== false ? "🟢 Active" : "🔴 Disabled"}
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-0.5">
                            Show official WhatsApp direct messaging button in live support launcher
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={settings.is_whatsapp_active !== false}
                          onChange={(e) => setSettings({ ...settings, is_whatsapp_active: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                      </label>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2 pt-2">
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
                      Pre-filled WhatsApp Chat Message (Optional)
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

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4 border-t border-border">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-velina-rose to-velina-magenta px-7 py-3 text-sm font-bold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Save size={16} />
                      {isSubmitting ? "Saving Support Settings..." : "Save Live Support Settings"}
                    </button>
                  </div>

                </div>
              </div>
            </form>
          )
        )}

        {/* ─── TAB 3: ADMIN ACCOUNTS & ROLE MANAGEMENT ─── */}
        {activeTab === "admins" && (
          <div className="space-y-6">

            {/* Header & Quick Action Card */}
            <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      Administrator & Owner Access
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        <Sparkles size={11} />
                        RBAC System
                      </span>
                    </h3>
                    <p className="text-sm text-muted">
                      Assign roles, create new website admins or owners, and manage staff privileges.
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPromoteModal(true);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface/80 text-foreground text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <UserCheck size={15} className="text-indigo-500" />
                    Assign Existing User
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/25 cursor-pointer"
                  >
                    <Plus size={16} />
                    Create New Admin
                  </button>
                </div>
              </div>

              {/* Roles Metrics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border">
                <div className="rounded-xl border border-border/60 bg-surface/40 p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Total Privileged</p>
                    <p className="text-xl font-extrabold text-foreground">{adminUsers.length}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                    <Shield size={18} />
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Owners</p>
                    <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{totalOwners}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Crown size={18} />
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Admins</p>
                    <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{totalAdmins}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck size={18} />
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-surface/40 p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Your Role</p>
                    <p className="text-sm font-extrabold uppercase text-velina-rose">
                      {currentUser?.role || "Owner"}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-velina-rose/10 text-velina-rose">
                    <UserIcon size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Administrators List Table / Cards */}
            <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-base font-bold text-foreground">Active Administrators & Owners</h4>
                  <p className="text-xs text-muted">All accounts authorized to log in to the admin panel</p>
                </div>
                <button
                  type="button"
                  onClick={loadAdmins}
                  disabled={loadingAdmins}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted hover:text-foreground hover:bg-surface transition-all cursor-pointer"
                >
                  <RefreshCw size={13} className={loadingAdmins ? "animate-spin text-purple-600" : ""} />
                  Refresh
                </button>
              </div>

              {loadingAdmins ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                  <p className="text-xs text-muted font-medium">Fetching privileged accounts...</p>
                </div>
              ) : adminUsers.length === 0 ? (
                <div className="p-12 text-center text-muted">
                  <Shield size={36} className="mx-auto mb-3 text-muted/50" />
                  <p className="font-semibold text-foreground">No Admin Users Found</p>
                  <p className="text-xs mt-1">Create an admin account to manage the storefront.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {adminUsers.map((admin) => {
                    const isSelf = currentUser?.id === admin.id || currentUser?.email === admin.email;
                    const isOnlyOwner = admin.role === "owner" && totalOwners <= 1;

                    return (
                      <div
                        key={admin.id}
                        className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-surface/30 transition-colors"
                      >
                        {/* User Details */}
                        <div className="flex items-start sm:items-center gap-3.5">
                          {/* Avatar Initials */}
                          <div
                            className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${
                              admin.role === "owner"
                                ? "bg-gradient-to-tr from-amber-500 to-amber-300 text-zinc-950"
                                : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
                            }`}
                          >
                            {admin.fullName ? admin.fullName.charAt(0).toUpperCase() : "A"}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground truncate">
                                {admin.fullName || admin.username}
                              </span>

                              {isSelf && (
                                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-velina-rose/10 text-velina-rose border border-velina-rose/20">
                                  You
                                </span>
                              )}

                              {/* Role Badge */}
                              {admin.role === "owner" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  <Crown size={12} className="text-amber-500" />
                                  Owner
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                                  <Shield size={12} className="text-indigo-500" />
                                  Admin
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
                              <span className="flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-400">
                                <Mail size={12} />
                                {admin.email}
                              </span>
                              {admin.customer?.phone && (
                                <span className="flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-400">
                                  <Phone size={12} />
                                  {admin.customer.phone}
                                </span>
                              )}
                              <span className="text-[11px]">
                                Added {new Date(admin.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Role Change Dropdown & Actions */}
                        <div className="flex items-center gap-3 self-end lg:self-center flex-wrap">
                          {/* Role Switcher */}
                          <div className="flex items-center gap-1.5">
                            <label htmlFor={`role-select-${admin.id}`} className="text-xs text-muted font-medium">
                              Role:
                            </label>
                            <select
                              id={`role-select-${admin.id}`}
                              value={admin.role}
                              disabled={isSubmittingAdmin || isOnlyOwner}
                              onChange={(e) =>
                                handleUpdateRole(admin, e.target.value as "admin" | "owner")
                              }
                              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground focus:border-purple-500 focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="owner">👑 Owner (Full Control)</option>
                              <option value="admin">🛡️ Admin (Store Manager)</option>
                            </select>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                            {/* Revoke Role Button */}
                            <button
                              type="button"
                              disabled={isSubmittingAdmin || isSelf || isOnlyOwner}
                              onClick={() => setDeleteDialog({ user: admin, action: "revoke" })}
                              className="p-2 rounded-xl border border-border hover:border-amber-500/50 hover:bg-amber-500/10 text-muted hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title={
                                isSelf
                                  ? "Cannot revoke your own access"
                                  : isOnlyOwner
                                  ? "Cannot revoke the only owner"
                                  : "Revoke Admin access (set role back to Customer)"
                              }
                            >
                              <UserX size={15} />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              disabled={isSubmittingAdmin || isSelf || isOnlyOwner}
                              onClick={() => setDeleteDialog({ user: admin, action: "delete" })}
                              className="p-2 rounded-xl border border-border hover:border-rose-500/50 hover:bg-rose-500/10 text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title={
                                isSelf
                                  ? "Cannot delete your own account"
                                  : isOnlyOwner
                                  ? "Cannot delete the only owner"
                                  : "Permanently remove account"
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ─── MODAL: CREATE NEW ADMIN ─── */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Create New Admin Account</h3>
                    <p className="text-xs text-muted">Add a new manager or owner to access the administration dashboard</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="create_full_name" className="block text-xs font-bold text-foreground">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="create_full_name"
                      type="text"
                      required
                      value={createAdminForm.fullName}
                      onChange={(e) =>
                        setCreateAdminForm({ ...createAdminForm, fullName: e.target.value })
                      }
                      placeholder="e.g. Ayesha Rahman"
                      className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-purple-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label htmlFor="create_email" className="block text-xs font-bold text-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="create_email"
                      type="email"
                      required
                      value={createAdminForm.email}
                      onChange={(e) =>
                        setCreateAdminForm({ ...createAdminForm, email: e.target.value })
                      }
                      placeholder="e.g. ayesha@velinaelite.com"
                      className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-purple-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password with Eye Toggle */}
                <div className="space-y-1.5">
                  <label htmlFor="create_password" className="block text-xs font-bold text-foreground">
                    Password (Min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="create_password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={createAdminForm.password}
                      onChange={(e) =>
                        setCreateAdminForm({ ...createAdminForm, password: e.target.value })
                      }
                      placeholder="Enter secure password"
                      className="w-full rounded-xl border border-border bg-surface pl-10 pr-10 py-2.5 text-sm text-foreground focus:border-purple-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Role Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Assign Role Level
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCreateAdminForm({ ...createAdminForm, role: "admin" })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        createAdminForm.role === "admin"
                          ? "border-purple-500 bg-purple-500/10 shadow-sm"
                          : "border-border bg-surface hover:bg-surface/80"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        <Shield size={14} className="text-purple-600" />
                        Admin
                      </div>
                      <p className="text-[10px] text-muted mt-1">Store manager for products, orders & deals</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreateAdminForm({ ...createAdminForm, role: "owner" })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        createAdminForm.role === "owner"
                          ? "border-amber-500 bg-amber-500/10 shadow-sm"
                          : "border-border bg-surface hover:bg-surface/80"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-600 dark:text-amber-400">
                        <Crown size={14} className="text-amber-500" />
                        Owner
                      </div>
                      <p className="text-[10px] text-muted mt-1">Full system authority, billing & admin management</p>
                    </button>
                  </div>
                </div>

                {/* Phone Number (Optional) */}
                <div className="space-y-1.5">
                  <label htmlFor="create_phone" className="block text-xs font-bold text-foreground">
                    Phone Number <span className="text-muted font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="create_phone"
                      type="text"
                      value={createAdminForm.phone}
                      onChange={(e) =>
                        setCreateAdminForm({ ...createAdminForm, phone: e.target.value })
                      }
                      placeholder="+8801700000000"
                      className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-purple-500 focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted hover:text-foreground transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdmin}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-500/25 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus size={15} />
                    {isSubmittingAdmin ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL: PROMOTE EXISTING CUSTOMER ─── */}
        {showPromoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Assign Customer to Admin / Owner</h3>
                    <p className="text-xs text-muted">Search existing registered users and upgrade their access privileges</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPromoteModal(false)}
                  className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchCustomers(e.target.value)}
                  placeholder="Search customer by name, email, or phone number..."
                  className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {isSearching ? (
                  <div className="py-8 text-center text-xs text-muted flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                    Searching users...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((cust) => (
                    <div
                      key={cust.id}
                      className="p-3.5 rounded-xl border border-border bg-surface/50 hover:bg-surface flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {cust.fullName || cust.username}
                        </p>
                        <p className="text-[11px] text-muted truncate">{cust.email}</p>
                        {cust.customer?.phone && (
                          <p className="text-[10px] text-muted font-mono">{cust.customer.phone}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePromoteExistingCustomer(cust, "admin")}
                          className="px-2.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Make Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePromoteExistingCustomer(cust, "owner")}
                          className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Make Owner
                        </button>
                      </div>
                    </div>
                  ))
                ) : searchQuery.trim() ? (
                  <div className="py-8 text-center text-xs text-muted">
                    No customer accounts found matching &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted">
                    Type a name, email or phone to search registered customers.
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPromoteModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted hover:text-foreground transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── CONFIRMATION DIALOG ─── */}
        {deleteDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-border bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-500">
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    {deleteDialog.action === "delete" ? "Delete Account" : "Revoke Admin Privileges"}
                  </h4>
                  <p className="text-xs text-muted">Confirmation required</p>
                </div>
              </div>

              <p className="text-sm text-foreground">
                {deleteDialog.action === "delete" ? (
                  <>
                    Are you sure you want to permanently delete the account for{" "}
                    <span className="font-bold">{deleteDialog.user.fullName || deleteDialog.user.email}</span>?
                  </>
                ) : (
                  <>
                    Are you sure you want to revoke Admin access for{" "}
                    <span className="font-bold">{deleteDialog.user.fullName || deleteDialog.user.email}</span>?
                    Their role will be downgraded to a standard Customer.
                  </>
                )}
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDeleteDialog(null)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted hover:text-foreground transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingAdmin}
                  onClick={handleConfirmRemove}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingAdmin
                    ? "Processing..."
                    : deleteDialog.action === "delete"
                    ? "Yes, Delete"
                    : "Yes, Revoke Access"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminShell>
  );
}

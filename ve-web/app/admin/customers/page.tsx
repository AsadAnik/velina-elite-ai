"use client";

import { useEffect, useState, useCallback } from "react";
import AdminShell from "../components/AdminShell";
import {
  Search,
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Copy,
  Check,
  Star,
  Heart,
  Save,
  ShieldAlert,
} from "lucide-react";
import { fetchApi } from "@/lib/api";

interface Address {
  id: number;
  line1: string;
  line2?: string | null;
  city: string;
  counrty: string;
  postal_code: string;
  is_default: boolean;
}

interface CustomerProfile {
  id: number;
  fname: string;
  lname: string;
  phone?: string | null;
  gender: string;
  addresses?: Address[];
  ordersCount: number;
  ratingsCount: number;
  wishlistsCount: number;
  totalSpent: number;
}

interface CustomerUser {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  fullName: string;
  customer?: CustomerProfile | null;
}

interface CustomersApiResponse {
  items: CustomerUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [copiedEmailId, setCopiedEmailId] = useState<number | null>(null);

  // Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState<CustomerUser | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    fname: "",
    lname: "",
    phone: "",
    gender: "other",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // View Customer Details Modal
  const [viewingCustomer, setViewingCustomer] = useState<CustomerUser | null>(null);

  // Delete Dialog State
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setMeta((prev) => ({ ...prev, page: 1 }));
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadCustomers = useCallback(
    async (pageToLoad = meta.page, limitToLoad = meta.limit, searchToLoad = debouncedSearch) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(pageToLoad),
          limit: String(limitToLoad),
        });

        if (searchToLoad.trim()) {
          queryParams.set("search", searchToLoad.trim());
        }

        const data = await fetchApi<CustomersApiResponse>(`/customers?${queryParams.toString()}`);
        if (data) {
          setCustomers(data.items || []);
          setMeta(data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
        }
      } catch (error: unknown) {
        console.error("Failed to load customers:", error);
        const msg = error instanceof Error ? error.message : "Failed to load customers";
        setToast({ type: "error", text: msg });
      } finally {
        setLoading(false);
      }
    },
    [meta.page, meta.limit, debouncedSearch]
  );

  useEffect(() => {
    loadCustomers(meta.page, meta.limit, debouncedSearch);
  }, [meta.page, meta.limit, debouncedSearch, loadCustomers]);

  const handleCopyEmail = (email: string, id: number) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: CustomerUser) => {
    setEditingCustomer(user);
    setEditForm({
      username: user.username,
      email: user.email,
      fname: user.customer?.fname || "",
      lname: user.customer?.lname || "",
      phone: user.customer?.phone || "",
      gender: user.customer?.gender || "other",
    });
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setIsSubmittingEdit(true);
    setToast(null);

    try {
      const updated = await fetchApi<CustomerUser>(`/customers/${editingCustomer.id}`, {
        method: "PATCH",
        data: {
          username: editForm.username.trim(),
          email: editForm.email.trim().toLowerCase(),
          fname: editForm.fname.trim(),
          lname: editForm.lname.trim(),
          phone: editForm.phone.trim() || undefined,
          gender: editForm.gender,
        },
      });

      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...updated } : c))
      );

      setEditingCustomer(null);
      setToast({ type: "success", text: "Customer profile updated successfully!" });
      loadCustomers();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update customer.";
      setToast({ type: "error", text: msg });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Submit Delete
  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;

    setIsDeleting(true);
    setToast(null);

    try {
      const res = await fetchApi<{ message: string }>(`/customers/${deletingCustomer.id}`, {
        method: "DELETE",
      });

      setCustomers((prev) => prev.filter((c) => c.id !== deletingCustomer.id));
      setToast({
        type: "success",
        text: res?.message || `Customer ${deletingCustomer.username} has been deleted.`,
      });
      setDeletingCustomer(null);
      loadCustomers();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete customer.";
      setToast({ type: "error", text: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics Calculations
  const totalRevenue = customers.reduce((acc, c) => acc + (c.customer?.totalSpent || 0), 0);
  const activeBuyers = customers.filter((c) => (c.customer?.ordersCount || 0) > 0).length;

  return (
    <AdminShell
      title="Customers"
      subtitle="View, search, edit, and manage registered store customer accounts"
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Toast Alert Feedback */}
        {toast && (
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
            <span className="text-sm font-medium">{toast.text}</span>
          </div>
        )}

        {/* ─── METRIC STATS CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total Customers</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{meta.total}</h3>
              <p className="text-[11px] text-muted mt-0.5">Registered accounts</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-velina-rose/10 text-velina-rose flex items-center justify-center">
              <Users size={22} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Active Buyers</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeBuyers}</h3>
              <p className="text-[11px] text-muted mt-0.5">Placed at least 1 order</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag size={22} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Page Total Revenue</p>
              <h3 className="text-2xl font-black text-foreground mt-1">৳{totalRevenue.toLocaleString()}</h3>
              <p className="text-[11px] text-muted mt-0.5">From current page</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign size={22} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Average Activity</p>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {customers.length > 0
                  ? (
                      customers.reduce((acc, c) => acc + (c.customer?.ordersCount || 0), 0) /
                      customers.length
                    ).toFixed(1)
                  : "0.0"}
              </h3>
              <p className="text-[11px] text-muted mt-0.5">Orders per customer</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>

        {/* ─── TOOLBAR CONTROLS ─── */}
        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, username, email, phone..."
              className="w-full rounded-xl border border-border bg-surface pl-10 pr-9 py-2.5 text-sm text-foreground focus:border-velina-rose focus:outline-none transition-all placeholder:text-muted"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Rows Per Page & Refresh */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium whitespace-nowrap">Show per page:</span>
              <select
                value={meta.limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  setMeta((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                }}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-velina-rose focus:outline-none transition-all cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => loadCustomers()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-surface/80 text-foreground text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-velina-rose" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ─── CUSTOMERS TABLE ─── */}
        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/40 text-[11px] font-black uppercase tracking-wider text-muted">
                  <th className="py-4 px-5">Customer</th>
                  <th className="py-4 px-5">Contact Details</th>
                  <th className="py-4 px-5">Shopping Activity</th>
                  <th className="py-4 px-5">Joined Date</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-velina-rose border-t-transparent"></div>
                        <p className="text-xs text-muted font-medium">Loading customer database...</p>
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users size={36} className="text-muted/40 mb-1" />
                        <p className="font-bold text-foreground">No Customers Found</p>
                        <p className="text-xs text-muted">
                          {debouncedSearch
                            ? `No customer matches the query "${debouncedSearch}".`
                            : "No registered customers in the database yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((user) => {
                    const initials = (user.fullName || user.username || "C")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    const defaultAddress = user.customer?.addresses?.find((a) => a.is_default) || user.customer?.addresses?.[0];

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-surface/40 transition-colors group"
                      >
                        {/* Customer Info */}
                        <td className="py-4 px-5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-velina-rose/20 to-velina-magenta/20 text-velina-rose flex items-center justify-center font-black text-xs shrink-0 border border-velina-rose/20 shadow-inner">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{user.fullName || user.username}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs text-muted">@{user.username}</span>
                                {user.customer?.gender && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border text-muted uppercase">
                                    {user.customer.gender}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Details */}
                        <td className="py-4 px-5 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-foreground font-mono">
                              <Mail size={12} className="text-muted shrink-0" />
                              <span className="truncate max-w-[180px]">{user.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(user.email, user.id)}
                                className="p-1 text-muted hover:text-foreground rounded transition-colors cursor-pointer"
                                title="Copy Email"
                              >
                                {copiedEmailId === user.id ? (
                                  <Check size={12} className="text-emerald-500" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>

                            {user.customer?.phone ? (
                              <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
                                <Phone size={12} className="text-muted shrink-0" />
                                <span>{user.customer.phone}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted/60 italic">No phone attached</span>
                            )}

                            {defaultAddress && (
                              <div className="flex items-center gap-1.5 text-[11px] text-muted truncate max-w-[200px]">
                                <MapPin size={11} className="text-velina-rose shrink-0" />
                                <span className="truncate">{defaultAddress.city}, {defaultAddress.counrty}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Shopping Activity */}
                        <td className="py-4 px-5 align-middle">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                                  (user.customer?.ordersCount || 0) > 0
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : "bg-surface border border-border text-muted"
                                }`}
                              >
                                <ShoppingBag size={11} />
                                {user.customer?.ordersCount || 0} Orders
                              </span>

                              <span className="font-extrabold text-xs text-foreground">
                                ৳{(user.customer?.totalSpent || 0).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-muted">
                              <span className="flex items-center gap-1">
                                <Heart size={11} className="text-rose-400" />
                                {user.customer?.wishlistsCount || 0} Wishlist
                              </span>
                              <span className="flex items-center gap-1">
                                <Star size={11} className="text-amber-400" />
                                {user.customer?.ratingsCount || 0} Ratings
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-5 align-middle whitespace-nowrap text-xs text-muted">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-muted" />
                            <span>{new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[10px] text-muted/70 mt-0.5">
                            {new Date(user.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Profile */}
                            <button
                              type="button"
                              onClick={() => setViewingCustomer(user)}
                              className="p-2 rounded-xl border border-border bg-surface hover:bg-surface/80 text-muted hover:text-foreground transition-all cursor-pointer"
                              title="View Customer Overview"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Edit Profile */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(user)}
                              className="p-2 rounded-xl border border-border bg-surface hover:border-velina-rose/40 hover:bg-velina-rose/10 text-muted hover:text-velina-rose transition-all cursor-pointer"
                              title="Edit Customer Profile"
                            >
                              <Edit2 size={15} />
                            </button>

                            {/* Delete Profile */}
                            <button
                              type="button"
                              onClick={() => setDeletingCustomer(user)}
                              className="p-2 rounded-xl border border-border bg-surface hover:border-rose-500/40 hover:bg-rose-500/10 text-muted hover:text-rose-600 transition-all cursor-pointer"
                              title="Delete Customer Account"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ─── PAGINATION BAR ─── */}
          {meta.totalPages > 1 && (
            <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0}
                </span>{" "}
                to{" "}
                <span className="font-bold text-foreground">
                  {Math.min(meta.page * meta.limit, meta.total)}
                </span>{" "}
                of <span className="font-bold text-foreground">{meta.total}</span> customers
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={meta.page <= 1 || loading}
                  onClick={() => setMeta((prev) => ({ ...prev, page: prev.page - 1 }))}
                  className="p-2 rounded-xl border border-border bg-surface text-muted hover:text-foreground hover:bg-surface/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (meta.totalPages > 5 && meta.page > 3) {
                    pageNum = meta.page - 2 + i;
                    if (pageNum > meta.totalPages) {
                      pageNum = meta.totalPages - (4 - i);
                    }
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      disabled={loading}
                      onClick={() => setMeta((prev) => ({ ...prev, page: pageNum }))}
                      className={`h-8 min-w-[32px] px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        meta.page === pageNum
                          ? "bg-gradient-to-r from-velina-rose to-velina-magenta text-white shadow-md shadow-velina-rose/25"
                          : "border border-border bg-surface text-muted hover:text-foreground"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={meta.page >= meta.totalPages || loading}
                  onClick={() => setMeta((prev) => ({ ...prev, page: prev.page + 1 }))}
                  className="p-2 rounded-xl border border-border bg-surface text-muted hover:text-foreground hover:bg-surface/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── MODAL: EDIT CUSTOMER ─── */}
        {editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-velina-rose/10 text-velina-rose">
                    <Edit2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Edit Customer Profile</h3>
                    <p className="text-xs text-muted">Update account credentials and personal details</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Username & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="edit_username" className="block text-xs font-bold text-foreground">
                      Username
                    </label>
                    <input
                      id="edit_username"
                      type="text"
                      required
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-velina-rose focus:outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit_email" className="block text-xs font-bold text-foreground">
                      Email Address
                    </label>
                    <input
                      id="edit_email"
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-velina-rose focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="edit_fname" className="block text-xs font-bold text-foreground">
                      First Name
                    </label>
                    <input
                      id="edit_fname"
                      type="text"
                      value={editForm.fname}
                      onChange={(e) => setEditForm({ ...editForm, fname: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-velina-rose focus:outline-none transition-all"
                      placeholder="e.g. Ayesha"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit_lname" className="block text-xs font-bold text-foreground">
                      Last Name
                    </label>
                    <input
                      id="edit_lname"
                      type="text"
                      value={editForm.lname}
                      onChange={(e) => setEditForm({ ...editForm, lname: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-velina-rose focus:outline-none transition-all"
                      placeholder="e.g. Rahman"
                    />
                  </div>
                </div>

                {/* Phone & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="edit_phone" className="block text-xs font-bold text-foreground">
                      Phone Number
                    </label>
                    <input
                      id="edit_phone"
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-velina-rose focus:outline-none transition-all font-mono"
                      placeholder="+8801700000000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit_gender" className="block text-xs font-bold text-foreground">
                      Gender
                    </label>
                    <select
                      id="edit_gender"
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-velina-rose focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Not specified</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted hover:text-foreground transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-velina-rose to-velina-magenta text-white text-xs font-bold shadow-md shadow-velina-rose/25 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Save size={15} />
                    {isSubmittingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL: VIEW CUSTOMER DETAILS ─── */}
        {viewingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-xl rounded-3xl border border-border bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-velina-rose/10 text-velina-rose font-black text-sm">
                    {viewingCustomer.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{viewingCustomer.fullName}</h3>
                    <p className="text-xs text-muted font-mono">@{viewingCustomer.username}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingCustomer(null)}
                  className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Stats Chips */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl border border-border bg-surface/50 text-center">
                  <p className="text-[10px] font-bold text-muted uppercase">Orders</p>
                  <p className="text-lg font-black text-emerald-600 mt-0.5">
                    {viewingCustomer.customer?.ordersCount || 0}
                  </p>
                </div>

                <div className="p-3 rounded-2xl border border-border bg-surface/50 text-center">
                  <p className="text-[10px] font-bold text-muted uppercase">Spent</p>
                  <p className="text-lg font-black text-foreground mt-0.5">
                    ৳{(viewingCustomer.customer?.totalSpent || 0).toLocaleString()}
                  </p>
                </div>

                <div className="p-3 rounded-2xl border border-border bg-surface/50 text-center">
                  <p className="text-[10px] font-bold text-muted uppercase">Wishlist</p>
                  <p className="text-lg font-black text-rose-500 mt-0.5">
                    {viewingCustomer.customer?.wishlistsCount || 0}
                  </p>
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Account Information</h4>
                <div className="divide-y divide-border rounded-2xl border border-border bg-surface/30 p-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted">Email</span>
                    <span className="font-mono text-foreground font-semibold">{viewingCustomer.email}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted">Phone Number</span>
                    <span className="font-mono text-foreground font-semibold">
                      {viewingCustomer.customer?.phone || "None attached"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted">Gender</span>
                    <span className="text-foreground capitalize">{viewingCustomer.customer?.gender || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted">Registered On</span>
                    <span className="text-foreground">
                      {new Date(viewingCustomer.created_at).toLocaleDateString()} at{" "}
                      {new Date(viewingCustomer.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Addresses */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Saved Shipping Addresses</h4>
                {viewingCustomer.customer?.addresses && viewingCustomer.customer.addresses.length > 0 ? (
                  <div className="space-y-2">
                    {viewingCustomer.customer.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-3.5 rounded-2xl border border-border bg-surface/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <MapPin size={13} className="text-velina-rose" />
                            {addr.line1}
                          </span>
                          {addr.is_default && (
                            <span className="px-2 py-0.5 rounded-md bg-velina-rose/10 text-velina-rose text-[10px] font-bold">
                              Default
                            </span>
                          )}
                        </div>
                        {addr.line2 && <p className="text-muted">{addr.line2}</p>}
                        <p className="text-muted font-mono">
                          {addr.city}, {addr.postal_code} - {addr.counrty}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted italic bg-surface/30 p-3 rounded-xl border border-border">
                    No shipping addresses saved by this customer yet.
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setViewingCustomer(null)}
                  className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-muted hover:text-foreground transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL: DELETE CONFIRMATION ─── */}
        {deletingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-border bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-500">
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">Delete Customer Account</h4>
                  <p className="text-xs text-muted">Permanent destructive action</p>
                </div>
              </div>

              <p className="text-sm text-foreground">
                Are you sure you want to delete customer{" "}
                <span className="font-bold">{deletingCustomer.fullName || deletingCustomer.username}</span> (
                <span className="font-mono text-xs">{deletingCustomer.email}</span>)?
              </p>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>
                  This will remove the customer profile, wishlists, cart items, and associated data cleanly.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDeletingCustomer(null)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted hover:text-foreground transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Customer"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminShell>
  );
}

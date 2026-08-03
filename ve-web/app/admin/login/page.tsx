"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";

type LoginResponse = {
    access_token: string;
    user: {
        id: number;
        email: string;
        role: string;
    };
};

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState(""); // velinaelitebd01@gmail.com
    const [password, setPassword] = useState(""); // Velina.Admin1234
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        try {
            const result = await fetchApi<LoginResponse>("/auth/admin/login", {
                method: "POST",
                data: { email, password },
            });

            if (!result.access_token) {
                throw new Error("Missing access token");
            }

            localStorage.setItem("velina_admin_token", result.access_token);
            localStorage.setItem("velina_admin_user", JSON.stringify(result.user));
            toast.success("Admin login successful.");
            router.replace("/admin");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Admin login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,214,169,0.35),transparent_25%),linear-gradient(135deg,#160f18_0%,#24192b_45%,#0f172a_100%)] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
                <div className="bg-white/5 px-6 py-5 border-b border-white/10">
                    <div className="flex items-center gap-3 text-velina-gold">
                        <div className="rounded-full bg-velina-gold/15 p-2">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-white/60">Velina Elite</p>
                            <h1 className="text-2xl font-black text-white">Admin Access</h1>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6 text-white">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-2xl border border-white/15 bg-black/20 py-3 pl-10 pr-3 text-sm text-white outline-none ring-0 placeholder:text-white/35 focus:border-velina-gold"
                                placeholder="Velina Owner / Admin"
                                type="email"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-2xl border border-white/15 bg-black/20 py-3 pl-10 pr-10 text-sm text-white outline-none ring-0 placeholder:text-white/35 focus:border-velina-gold"
                                placeholder="Enter password"
                                type={showPassword ? "text" : "password"}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-2xl bg-linear-to-r from-velina-gold to-velina-rose px-4 py-3 text-sm font-black text-slate-950 transition hover:opacity-90 disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign In to Admin Panel"}
                    </button>
                </form>
            </div>
        </div>
    );
}

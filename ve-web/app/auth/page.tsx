"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { useStore } from "@/lib/store";

type Tab = "signin" | "register";

type AuthResponse = {
  access_token: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
};

export default function AuthPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [tab, setTab] = useState<Tab>("signin");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      toast.error("Please fill in your email and password.");
      return;
    }

    setLoginLoading(true);

    try {
      const result = await fetchApi<AuthResponse>("/auth/login", {
        method: "POST",
        data: {
          email: loginForm.email.trim(),
          password: loginForm.password,
        },
      });

      if (!result.access_token) {
        throw new Error("Missing access token");
      }

      setUser(result.user, result.access_token);
      toast.success("Welcome back! You are now signed in.");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Customer login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const requiredFields = [
      registerForm.fullName.trim(),
      registerForm.email.trim(),
      registerForm.password,
      registerForm.confirmPassword,
    ];

    if (requiredFields.some((field) => !field)) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (registerForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setRegisterLoading(true);

    try {
      const result = await fetchApi<AuthResponse>("/auth/register", {
        method: "POST",
        data: {
          fullName: registerForm.fullName.trim(),
          email: registerForm.email.trim(),
          phone: registerForm.phone.trim(),
          password: registerForm.password,
          confirmPassword: registerForm.confirmPassword,
        },
      });

      if (!result.access_token) {
        throw new Error("Missing access token");
      }

      setUser(result.user, result.access_token);
      toast.success("Account created successfully. Welcome to Velina Elite BD.");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12 bg-gradient-to-br from-[#1c1420] via-[#2e1a2e] to-[#1c223a]">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-velina-rose/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-velina-gold/10 blur-3xl" />

        <div className="relative z-10 text-center">
          <Image
            src="/1776256116755.png"
            alt="Velina Elite"
            width={200}
            height={64}
            className="object-contain mx-auto [mix-blend-mode:screen] brightness-200"
          />
          <div className="mt-8 space-y-4">
            <h2 className="text-3xl font-black text-white leading-tight">
              Your Beauty,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-velina-gold to-velina-rose">Elevated.</span>
            </h2>
            <p className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">
              Join 500,000+ beauty lovers discovering authentic premium products at the best prices.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[{ label: "500K+", sub: "Happy Customers" }, { label: "10K+", sub: "Products" }, { label: "100%", sub: "Authentic" }].map((item) => (
              <div key={item.label} className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                <p className="text-velina-gold font-black text-lg">{item.label}</p>
                <p className="text-zinc-400 text-[10px] leading-tight mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-10 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 transition-colors">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/1776256116755.png"
              alt="Velina Elite"
              width={160}
              height={50}
              className="object-contain mx-auto [mix-blend-mode:multiply] dark:invert dark:[mix-blend-mode:normal]"
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl dark:shadow-zinc-950 border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            <div className="flex border-b border-zinc-100 dark:border-zinc-800">
              {(["signin", "register"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-4 text-sm font-bold transition-all relative ${
                    tab === t ? "text-velina-rose" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  }`}
                >
                  {t === "signin" ? "Sign In" : "Create Account"}
                  {tab === t && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-velina-rose rounded-full" />}
                </button>
              ))}
            </div>

            <div className="p-6 sm:p-8">
              {tab === "signin" ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Welcome back 👋</h1>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Sign in to access your wishlist, orders and more.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"><Mail size={15} /></span>
                      <input
                        type="email"
                        required
                        value={loginForm.email}
                        onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-xl text-sm outline-none focus:border-velina-rose transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-11 py-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 rounded-xl text-sm outline-none focus:border-velina-rose transition-colors"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="button" className="text-xs text-velina-rose font-bold hover:underline">Forgot password?</button>
                  </div>

                  <button type="submit" disabled={loginLoading} className="w-full bg-velina-rose text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-velina-magenta transition-colors text-sm shadow-sm shadow-velina-rose/25 disabled:opacity-70">
                    {loginLoading ? "Signing In..." : "Sign In"} <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Sparkles size={20} className="text-velina-gold" /> Join Velina Elite
                    </h1>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Create your account and start shopping.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"><User size={15} /></span>
                      <input
                        type="text"
                        required
                        value={registerForm.fullName}
                        onChange={(e) => setRegisterForm((prev) => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-4 py-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-xl text-sm outline-none focus:border-velina-rose transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"><Mail size={15} /></span>
                      <input
                        type="email"
                        required
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-xl text-sm outline-none focus:border-velina-rose transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Phone</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"><Phone size={15} /></span>
                      <input
                        type="tel"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+880 ..."
                        className="w-full pl-10 pr-4 py-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-xl text-sm outline-none focus:border-velina-rose transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="Min. 8 characters"
                        className="w-full pl-10 pr-11 py-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 rounded-xl text-sm outline-none focus:border-velina-rose transition-colors"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        required
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Repeat your password"
                        className="w-full pl-10 pr-11 py-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 rounded-xl text-sm outline-none focus:border-velina-rose transition-colors"
                      />
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                        {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
                    By creating an account you agree to our <span className="text-velina-rose font-bold cursor-pointer">Terms of Service</span> and <span className="text-velina-rose font-bold cursor-pointer">Privacy Policy</span>.
                  </p>

                  <button type="submit" disabled={registerLoading} className="w-full bg-gradient-to-r from-velina-rose to-velina-gold text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm shadow-sm disabled:opacity-70">
                    {registerLoading ? "Creating Account..." : "Create Account"} <Sparkles size={15} />
                  </button>
                </form>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-6">
            <Link href="/" className="hover:text-velina-rose transition-colors font-medium">← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

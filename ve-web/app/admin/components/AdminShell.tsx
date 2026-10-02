"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

type AdminShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

// region ADMIN SHELL
export default function AdminShell({ title, subtitle, children }: AdminShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-velina-rose selection:text-white transition-colors duration-300">
      {mobileOpen && (
        <button
          aria-label="Close menu overlay"
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <AdminSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        onNavigate={() => setMobileOpen(false)}
      />

      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? "lg:pl-18" : "lg:pl-64"
          }`}
      >
        <AdminHeader
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileOpen((prev) => !prev)}
        />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

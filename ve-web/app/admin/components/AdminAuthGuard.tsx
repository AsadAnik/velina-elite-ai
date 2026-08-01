"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const token = typeof window !== "undefined" ? localStorage.getItem("velina_admin_token") : null;
    const isPublicRoute = pathname === "/admin/login";

    useEffect(() => {
        if (!token && !isPublicRoute) {
            router.replace("/admin/login");
        }
    }, [token, isPublicRoute, router]);

    if (!token && !isPublicRoute) {
        return null;
    }

    return <>{children}</>;
}

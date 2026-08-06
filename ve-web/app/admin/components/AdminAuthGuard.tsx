"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const token = localStorage.getItem("velina_admin_token");
        const isPublicRoute = pathname === "/admin/login";

        if (!token && !isPublicRoute) {
            router.replace("/admin/login");
        }
    }, [pathname, router]);

    if (!isMounted) return null;

    const token = localStorage.getItem("velina_admin_token");
    const isPublicRoute = pathname === "/admin/login";

    if (!token && !isPublicRoute) {
        return null;
    }

    return <>{children}</>;
}

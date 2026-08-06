"use client";

import { useStore } from "@/lib/store";
import ToastContainer from "./Toast";

export default function ToastWrapper({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useStore();
  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

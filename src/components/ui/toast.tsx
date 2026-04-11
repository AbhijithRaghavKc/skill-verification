"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
};

type ToastContextType = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles: Record<ToastType, string> = {
    success: "border-green-500 bg-green-50 text-green-900",
    error: "border-red-500 bg-red-50 text-red-900",
    warning: "border-yellow-500 bg-yellow-50 text-yellow-900",
    info: "border-blue-500 bg-blue-50 text-blue-900",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border-l-4 p-4 shadow-lg animate-slide-up min-w-[320px] max-w-[420px]",
        styles[toast.type]
      )}
    >
      <div className="flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs opacity-80">{toast.description}</p>
        )}
      </div>
      <button onClick={onClose} className="opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

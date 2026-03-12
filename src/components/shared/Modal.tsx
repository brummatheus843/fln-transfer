"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-md" }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
      onClick={onClose}
    >
      <div
        ref={ref}
        className={`liquid-glass rounded-3xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-admin-text tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-admin-muted hover:text-admin-text p-1.5 hover:bg-white/5 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

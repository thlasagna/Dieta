"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-xp text-white text-sm font-medium animate-slide-up"
      role="alert"
    >
      {message}
    </div>
  );
}

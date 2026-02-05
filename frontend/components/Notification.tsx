"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

interface NotificationProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  description?: string;
  onClose?: () => void;
}

export default function Notification({
  type,
  message,
  description,
  onClose,
}: NotificationProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const borderColors = {
    success: "border-green-500/50",
    error: "border-red-500/50",
    warning: "border-yellow-500/50",
    info: "border-blue-500/50",
  };

  return (
    <div
      className={cn(
        "bg-gray-800/90 backdrop-blur-xl border rounded-lg p-4 shadow-lg",
        borderColors[type],
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1">
          <p className="text-white font-medium">{message}</p>
          {description && (
            <p className="text-gray-400 text-sm mt-1">{description}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

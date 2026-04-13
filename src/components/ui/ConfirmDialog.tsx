"use client";

import { useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
        {/* Icon */}
        {variant === "danger" && (
          <div className="mb-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-rust/10 sm:mb-0 sm:mr-4">
            <AlertTriangle size={24} className="text-rust" />
          </div>
        )}

        {/* Text */}
        <div className="flex-1">
          <h3 className="font-display text-lg text-ink">{title}</h3>
          <p className="mt-2 font-body text-sm leading-relaxed text-warm-gray">
            {message}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>

        <Button
          variant={variant === "danger" ? "primary" : "secondary"}
          size="sm"
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            variant === "danger" && "bg-rust hover:bg-rust/90"
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Processing...
            </span>
          ) : (
            confirmText
          )}
        </Button>
      </div>
    </Modal>
  );
}

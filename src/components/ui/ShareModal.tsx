"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link, Mail } from "lucide-react";

function TwitterIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.09.07 1.373.14v3.34c-.15-.02-.41-.02-.733-.02-1.04 0-1.44.395-1.44 1.42v2.678h3.868l-.663 3.667h-3.205v8.168C18.996 22.78 23 17.9 23 12c0-6.075-4.925-11-11-11S1 5.925 1 12c0 5.159 3.549 9.492 8.101 10.691z" />
    </svg>
  );
}
import toast from "react-hot-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  description: string;
}

interface ShareOptionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}

function ShareOption({ icon, label, onClick, color }: ShareOptionProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl p-4 transition-colors hover:bg-cream-dark"
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full text-cream"
        style={{ backgroundColor: color }}
      >
        {icon}
      </span>
      <span className="font-body text-sm text-ink-light">{label}</span>
    </button>
  );
}

export default function ShareModal({ isOpen, onClose, title, url, description }: ShareModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
      onClose();
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`${title} - ${description}`);
    const encodedUrl = encodeURIComponent(url);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
    onClose();
  };

  const handleFacebook = () => {
    const encodedUrl = encodeURIComponent(url);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
    onClose();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-ink/50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-cream p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Share this stop"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
              aria-label="Close share modal"
            >
              <X size={18} />
            </button>

            <h3 className="font-display text-xl text-forest">Share</h3>
            <p className="mt-1 font-body text-sm text-warm-gray line-clamp-1">
              {title}
            </p>

            <div className="mt-6 grid grid-cols-4 gap-1">
              <ShareOption
                icon={<Link size={20} />}
                label="Copy Link"
                onClick={handleCopyLink}
                color="#1B3A2D"
              />
              <ShareOption
                icon={<TwitterIcon size={20} />}
                label="X / Twitter"
                onClick={handleTwitter}
                color="#1A1A1A"
              />
              <ShareOption
                icon={<FacebookIcon size={20} />}
                label="Facebook"
                onClick={handleFacebook}
                color="#1877F2"
              />
              <ShareOption
                icon={<Mail size={20} />}
                label="Email"
                onClick={handleEmail}
                color="#C45D3E"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

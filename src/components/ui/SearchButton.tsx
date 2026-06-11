"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import SearchModal from "./SearchModal";

export default function SearchButton() {
  const [isOpen, setIsOpen] = useState(false);

  /* ---- Global Cmd+K / Ctrl+K shortcut ---- */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /* ---- Detect platform for shortcut badge ---- */
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(
      typeof navigator !== "undefined" &&
        /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
    );
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open search"
        className="hidden items-center gap-2 rounded-full border border-border bg-cream-dark px-3 py-1.5 font-body text-sm text-warm-gray transition-colors hover:border-warm-gray-light hover:text-ink md:inline-flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-1 rounded border border-border bg-cream px-1.5 py-0.5 font-body text-[10px] font-medium text-warm-gray-light">
          {isMac ? "\u2318" : "Ctrl+"}K
        </kbd>
      </button>

      {/* Mobile: icon-only button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open search"
        className="flex h-9 w-9 items-center justify-center rounded-md text-forest md:hidden"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

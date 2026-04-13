"use client";

import { useState, useEffect, useCallback } from "react";
import SearchModal from "./SearchModal";

/**
 * Invisible component that registers the global Cmd+K / Ctrl+K shortcut
 * and renders the SearchModal when triggered. Place this in the root layout.
 * For a visible search trigger button in the navbar, use SearchButton instead.
 */
export default function GlobalSearchShortcut() {
  const [isOpen, setIsOpen] = useState(false);

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

  return <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full bg-cream-dark p-1"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.key}`}
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative rounded-full px-4 py-2 font-body text-sm font-medium transition-colors",
              isActive
                ? "text-ink"
                : "text-warm-gray hover:text-ink-light"
            )}
          >
            {/* Animated background pill */}
            {isActive && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-full bg-white shadow-sm"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}

            {/* Label + optional count */}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.label}

              {tab.count !== undefined && (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs",
                    isActive
                      ? "bg-cream-dark text-ink-light"
                      : "bg-warm-gray-light/40 text-warm-gray"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

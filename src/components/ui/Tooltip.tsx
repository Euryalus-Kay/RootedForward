"use client";

import {
  useState,
  useRef,
  type ReactNode,
  type CSSProperties,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
}

function getPositionStyles(side: TooltipProps["side"]): CSSProperties {
  switch (side) {
    case "bottom":
      return {
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginTop: 8,
      };
    case "left":
      return {
        right: "100%",
        top: "50%",
        transform: "translateY(-50%)",
        marginRight: 8,
      };
    case "right":
      return {
        left: "100%",
        top: "50%",
        transform: "translateY(-50%)",
        marginLeft: 8,
      };
    case "top":
    default:
      return {
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginBottom: 8,
      };
  }
}

function getArrowClasses(side: TooltipProps["side"]): string {
  switch (side) {
    case "bottom":
      return "-top-1 left-1/2 -translate-x-1/2 rotate-45";
    case "left":
      return "top-1/2 -right-1 -translate-y-1/2 rotate-45";
    case "right":
      return "top-1/2 -left-1 -translate-y-1/2 rotate-45";
    case "top":
    default:
      return "-bottom-1 left-1/2 -translate-x-1/2 rotate-45";
  }
}

export default function Tooltip({
  children,
  content,
  side = "top",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute z-50 whitespace-nowrap"
            style={getPositionStyles(side)}
            role="tooltip"
          >
            <div className="rounded-md bg-ink px-3 py-1.5 font-body text-xs text-cream shadow-md">
              {content}
            </div>

            {/* Arrow */}
            <div
              className={cn(
                "absolute h-2 w-2 bg-ink",
                getArrowClasses(side)
              )}
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

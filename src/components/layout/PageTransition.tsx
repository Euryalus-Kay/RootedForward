"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

/* Route-level entrance. One quiet move shared by every page so
   navigation feels like turning a page, not loading an app. */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

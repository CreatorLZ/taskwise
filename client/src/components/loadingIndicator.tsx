"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface LoadingIndicatorProps {
  className?: string;
}

export function LoadingIndicator({ className }: LoadingIndicatorProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex items-center gap-2 rounded-full bg-primary/5",
        "px-2 py-1 sm:px-3",
        // Stack vertically on mobile
        isMobile ? "flex-col" : "flex-row",
        className
      )}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-primary" />
      </motion.div>
      <motion.span
        className={cn(
          "text-xs sm:text-sm font-medium text-primary",
          // Center text on mobile
          isMobile ? "text-center" : ""
        )}
        animate={{
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        {isMobile ? "AI Setup" : "Configuring AI Scheduling"}
      </motion.span>
      <motion.div
        className="flex space-x-0.5 sm:space-x-1"
        animate={{
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <span className="text-primary">.</span>
        <span className="text-primary">.</span>
        <span className="text-primary">.</span>
      </motion.div>
    </motion.div>
  );
}

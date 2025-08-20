"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ShimmerButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  shimmerDuration?: string;
}

const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      children,
      className,
      shimmerColor = "rgba(255,255,255,0.2)",
      shimmerSize = "0.1em",
      shimmerDuration = "3s",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-lg px-6 py-3 font-medium text-white transition-all duration-300",
          "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500",
          "shadow-lg hover:shadow-xl active:scale-95",
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        <span
          className={cn(
            "absolute inset-0 -z-0 animate-shimmer-infinite",
            "before:absolute before:inset-0 before:-translate-x-full",
            "before:animate-shimmer before:bg-gradient-to-r",
            "before:from-transparent before:via-white/20 before:to-transparent"
          )}
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 20%, ${shimmerColor} 40%, transparent 100%)`,
            backgroundSize: `${shimmerSize} 100%`,
            animationDuration: shimmerDuration,
          }}
        />
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";

export default ShimmerButton;

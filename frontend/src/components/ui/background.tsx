"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Background = ({
  children,
  className,
  containerClassName,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 0.4,
            transition: { duration: 0.8, delay: 0.5 },
          }}
          className="absolute inset-0"
        >
          <div className="absolute -inset-[100%] opacity-30">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.8]"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20"></div>
          </div>
        </motion.div>
      </div>
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
};

export default Background;

"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionTemplate, useMotionValue, useSpring, HTMLMotionProps } from "framer-motion";
import { ReactNode, useEffect, useRef } from "react";

type Card3DProps = {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  intensity?: number;
} & Omit<React.HTMLAttributes<HTMLDivElement>, keyof HTMLMotionProps<"div">>;

const Card3D = ({
  children,
  className,
  containerClassName,
  intensity = 10,
  ...props
}: Card3DProps) => {
  const mouseX = useSpring(0, { stiffness: 300, damping: 100 });
  const mouseY = useSpring(0, { stiffness: 300, damping: 100 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  useEffect(() => {
    const xSpring = mouseX.onChange((x) => {
      rotateY.set(x);
    });
    const ySpring = mouseY.onChange((y) => {
      rotateX.set(-y);
    });
    
    return () => {
      xSpring();
      ySpring();
    };
  }, [mouseX, mouseY, rotateX, rotateY]);

  return (
    <div
      ref={cardRef}
      className={cn("relative group", containerClassName)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      <motion.div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm",
          "transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/10",
          className
        )}
        style={{
          transform,
        }}
        {...(props as any)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {children}
      </motion.div>
      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-primary/20 via-background to-primary/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
    </div>
  );
};

export default Card3D;

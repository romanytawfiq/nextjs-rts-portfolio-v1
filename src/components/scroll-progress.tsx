"use client";

import { motion, useScroll } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      aria-hidden="true"
      className="scroll-progress pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-accent"
      data-scroll-progress=""
      style={{ scaleX: scrollYProgress }}
    />
  );
}

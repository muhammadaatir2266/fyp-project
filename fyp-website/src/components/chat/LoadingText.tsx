"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Warm, caring status messages — kept gentle and reassuring so they comfort
// the user during a long wait without exposing what's happening.
const PHASES = [
  { after: 0, text: "Care AI is here for you…" },
  { after: 3000, text: "Taking a moment to understand you…" },
  { after: 9000, text: "Thinking this through with care…" },
  { after: 16000, text: "Almost ready, thank you for waiting…" },
  { after: 26000, text: "Your patience means a lot, hang in there…" },
];

export function LoadingText() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 500);
    return () => clearInterval(id);
  }, []);

  const phase = [...PHASES].reverse().find((p) => elapsed >= p.after) ?? PHASES[0];

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={phase.text}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25 }}
        className="text-xs text-muted-foreground"
      >
        {phase.text}
      </motion.span>
    </AnimatePresence>
  );
}

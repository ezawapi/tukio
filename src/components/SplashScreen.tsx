import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import tukioIcon from "@/assets/tukio-icon-orange.png";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState<"logo" | "fade">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("fade"), 1800);
    const t2 = setTimeout(() => onFinish(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onFinish]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "fade" ? 0 : 1 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{
          background:
            "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 60%, hsl(var(--primary)/0.85) 100%)",
        }}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-background/95 shadow-2xl ring-1 ring-primary-foreground/20">
            <img src={tukioIcon} alt="Tukio" className="h-24 w-24 object-contain" />
          </div>
          <h1 className="font-display text-4xl font-bold text-primary-foreground tracking-wide">Tukio</h1>
          <p className="font-body text-sm text-primary-foreground/80">Découvrez des événements près de vous</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-12 flex flex-col items-center gap-3"
        >
          <div className="h-1 w-16 overflow-hidden rounded-full bg-primary-foreground/20">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
              className="h-full w-1/2 rounded-full bg-primary-foreground/80"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;

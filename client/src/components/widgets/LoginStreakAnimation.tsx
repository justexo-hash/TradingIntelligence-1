import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";

interface LoginStreakAnimationProps {
  streak: number;
  className?: string;
}

export default function LoginStreakAnimation({ streak, className }: LoginStreakAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [lastStreak, setLastStreak] = useState(streak);
  const isMilestone = streak > 0 && streak % 5 === 0;

  useEffect(() => {
    if (streak > lastStreak) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
    setLastStreak(streak);
  }, [streak, lastStreak]);

  const particles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i * Math.PI * 2) / 8;
    return {
      x: Math.cos(angle) * 30,
      y: Math.sin(angle) * 30,
    };
  });

  return (
    <div className={className}>
      <AnimatePresence>
        {showAnimation && (
          <>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                  times: [0, 0.5, 1],
                }}
                className="text-2xl font-bold text-gradient"
              >
                {streak} {streak === 1 ? 'day' : 'days'}!
              </motion.div>
            </motion.div>

            {isMilestone && (
              <>
                {particles.map((particle, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: particle.x,
                      y: particle.y,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "easeOut",
                    }}
                    className="absolute left-1/2 top-1/2"
                  >
                    <Star className="h-4 w-4 text-[rgb(var(--solana-purple))]" />
                  </motion.div>
                ))}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{
                    scale: [0, 1.2, 1],
                    rotate: [0, 45, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 bg-[rgb(var(--solana-green))/0.1] rounded-lg"
                />
              </>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

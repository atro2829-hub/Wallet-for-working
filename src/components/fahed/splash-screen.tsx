'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOGO_BASE64 } from '@/lib/logo';

interface SplashScreenProps {
  onComplete: () => void;
}

// Particle component for background effect
function Particle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: 'rgba(230, 0, 0, 0.15)',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.6, 0],
        scale: [0, 1, 0.5],
        y: [0, -30, -60],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// Letter-by-letter text animation
function LetterByLetter({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={className}>
      {text.split('').map((letter, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: delay + i * 0.05,
            ease: 'easeOut',
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  );
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showTagline, setShowTagline] = useState(false);

  // Generate particles once
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 2,
      });
    }
    return arr;
  }, []);

  // Progress bar animation
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2300; // slightly less than 2.5s to complete before callback

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, []);

  // Show tagline after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setShowTagline(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Complete after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0F0F0F' }}
    >
      {/* Background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <Particle key={p.id} delay={p.delay} x={p.x} y={p.y} size={p.size} />
        ))}
      </div>

      {/* Subtle radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(230,0,0,0.08) 0%, transparent 60%)',
        }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10"
      >
        <motion.div
          className="w-28 h-28 rounded-3xl flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #E60000 0%, #8B0000 100%)',
            boxShadow: '0 12px 40px rgba(230,0,0,0.4)',
          }}
          animate={{
            boxShadow: [
              '0 12px 40px rgba(230,0,0,0.4)',
              '0 12px 60px rgba(230,0,0,0.6)',
              '0 12px 40px rgba(230,0,0,0.4)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img
            src={LOGO_BASE64}
            alt="محفظة الجنوب"
            className="w-20 h-20 object-contain"
            draggable={false}
          />
        </motion.div>
      </motion.div>

      {/* App name - letter by letter */}
      <motion.div
        className="mt-6 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        <LetterByLetter
          text="محفظة الجنوب"
          delay={0.6}
          className="text-2xl font-bold text-white"
        />
      </motion.div>

      {/* Tagline */}
      <AnimatePresence>
        {showTagline && (
          <motion.p
            className="mt-2 text-sm relative z-10"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            محفظتك الرقمية الموثوقة
          </motion.p>
        )}
      </AnimatePresence>

      {/* Loading bar at bottom */}
      <div className="absolute bottom-12 left-8 right-8 z-10">
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #E60000, #FF3333, #E60000)',
              width: `${progress}%`,
            }}
            transition={{ duration: 0.05 }}
          />
        </div>
        <motion.p
          className="text-center mt-3 text-xs"
          style={{ color: 'rgba(255,255,255,0.25)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          جارٍ التحميل...
        </motion.p>
      </div>
    </div>
  );
}

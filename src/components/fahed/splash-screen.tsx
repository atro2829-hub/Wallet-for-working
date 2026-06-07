'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOGO_BASE64 } from '@/lib/logo';

interface SplashScreenProps {
  onComplete: () => void;
}

// Geometric shapes like Jaib splash screen - diamonds arranged in circle
const SHAPES_COUNT = 8;

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'loading' | 'logo' | 'complete' | 'exiting'>('loading');
  const [progress, setProgress] = useState(0);

  // Phase 1: Loading with geometric shapes (0-2000ms)
  useEffect(() => {
    const loadDuration = 2000;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / loadDuration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setPhase('logo');
      }
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // Phase 2: Logo reveal (2000-3000ms)
  useEffect(() => {
    if (phase !== 'logo') return;
    const timer = setTimeout(() => {
      setPhase('complete');
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase]);

  // Phase 3: Complete (3000-3500ms)
  useEffect(() => {
    if (phase !== 'complete') return;
    const timer = setTimeout(() => {
      setPhase('exiting');
    }, 500);
    return () => clearTimeout(timer);
  }, [phase]);

  // Phase 4: Exit
  useEffect(() => {
    if (phase !== 'exiting') return;
    const timer = setTimeout(() => {
      onComplete();
    }, 400);
    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'exiting' ? (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #E60000 0%, #8B0000 60%, #5C0000 100%)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {/* Jaib-style geometric shapes in circular arrangement */}
          <div className="relative" style={{ width: 200, height: 200 }}>
            {/* Rotating container */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              {Array.from({ length: SHAPES_COUNT }).map((_, i) => {
                const angle = (i * 360) / SHAPES_COUNT;
                const rad = (angle * Math.PI) / 180;
                const radius = 65;
                const x = 100 + radius * Math.cos(rad);
                const y = 100 + radius * Math.sin(rad);
                const delay = i * 0.1;

                return (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: x - 15,
                      top: y - 15,
                      width: 30,
                      height: 30,
                    }}
                    initial={{ opacity: 0, scale: 0, rotate: 0 }}
                    animate={{
                      opacity: phase === 'loading' ? [0, 0.6, 0.3, 0.6] : 0,
                      scale: [0, 1, 0.8, 1],
                      rotate: [0, 90, 180, 270],
                    }}
                    transition={{
                      duration: 2,
                      delay: delay,
                      repeat: phase === 'loading' ? Infinity : 0,
                      ease: 'easeInOut',
                    }}
                  >
                    {/* Diamond shape - like Jaib */}
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 4,
                        transform: 'rotate(45deg) scale(0.7)',
                        border: '1.5px solid rgba(255,255,255,0.3)',
                      }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Center diamond - larger */}
            <motion.div
              className="absolute"
              style={{ left: 80, top: 80, width: 40, height: 40 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: phase === 'loading' ? [0, 1, 0.7, 1] : (phase === 'logo' ? 0 : 1),
                scale: [0, 1, 0.9, 1],
                rotate: [0, 90, 180, 270],
              }}
              transition={{
                duration: 2,
                repeat: phase === 'loading' ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#FFFFFF',
                  borderRadius: 6,
                  transform: 'rotate(45deg) scale(0.7)',
                  boxShadow: '0 4px 12px rgba(255,255,255,0.5)',
                }}
              />
            </motion.div>
          </div>

          {/* Logo - appears after loading */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: phase === 'logo' || phase === 'complete' ? 1 : 0,
              scale: phase === 'logo' || phase === 'complete' ? 1 : 0.8,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute flex flex-col items-center"
          >
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden mb-4 flex items-center justify-center"
              style={{
                boxShadow: '0 8px 24px rgba(230,0,0,0.3)',
                background: 'rgba(255,255,255,0.15)',
              }}
            >
              <img src={LOGO_BASE64} alt="الحبيلين اونلاين" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>الحبيلين اونلاين</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>محفظتك الرقمية الموثوقة</p>
          </motion.div>

          {/* Loading bar */}
          <div className="absolute bottom-16 left-12 right-12">
            <div
              className="h-[3px] rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: '#FFFFFF',
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="fixed inset-0"
          style={{ background: 'linear-gradient(145deg, #E60000 0%, #8B0000 60%, #5C0000 100%)' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      )}
    </AnimatePresence>
  );
}

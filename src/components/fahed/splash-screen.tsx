'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOGO_BASE64 } from '@/lib/logo';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'loading' | 'logo' | 'name' | 'tagline' | 'exiting'>('loading');
  const [progress, setProgress] = useState(0);

  // Phase 1: Loading with progress bar (0-2000ms)
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

  // Phase 2: Logo appears (2000ms)
  useEffect(() => {
    if (phase !== 'logo') return;
    const timer = setTimeout(() => {
      setPhase('name');
    }, 600);
    return () => clearTimeout(timer);
  }, [phase]);

  // Phase 3: App name fades in (2600ms)
  useEffect(() => {
    if (phase !== 'name') return;
    const timer = setTimeout(() => {
      setPhase('tagline');
    }, 600);
    return () => clearTimeout(timer);
  }, [phase]);

  // Phase 4: Tagline appears (3200ms)
  useEffect(() => {
    if (phase !== 'tagline') return;
    const timer = setTimeout(() => {
      setPhase('exiting');
    }, 800);
    return () => clearTimeout(timer);
  }, [phase]);

  // Phase 5: Exit
  useEffect(() => {
    if (phase !== 'exiting') return;
    const timer = setTimeout(() => {
      onComplete();
    }, 500);
    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  const showLogo = phase === 'logo' || phase === 'name' || phase === 'tagline';
  const showName = phase === 'name' || phase === 'tagline';
  const showTagline = phase === 'tagline';

  return (
    <AnimatePresence>
      {phase !== 'exiting' ? (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #E60000 0%, #8B0000 60%, #5C0000 100%)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Decorative background circles */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.02)' }} />

          {/* Loading phase - spinning ring */}
          {phase === 'loading' && (
            <div className="relative" style={{ width: 120, height: 120 }}>
              {/* Outer ring - spinning */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                {[0, 1, 2, 3].map((i) => {
                  const angle = (i * 360) / 4;
                  const rad = (angle * Math.PI) / 180;
                  const radius = 48;
                  const x = 60 + radius * Math.cos(rad);
                  const y = 60 + radius * Math.sin(rad);
                  return (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: x - 8,
                        top: y - 8,
                        width: 16,
                        height: 16,
                      }}
                      animate={{
                        opacity: [0.2, 0.8, 0.2],
                        scale: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'rgba(255,255,255,0.5)',
                          borderRadius: 4,
                          transform: 'rotate(45deg) scale(0.7)',
                        }}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Center pulsing dot */}
              <motion.div
                className="absolute"
                style={{ left: 50, top: 50, width: 20, height: 20 }}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [0.8, 1.1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: 6,
                    transform: 'rotate(45deg) scale(0.7)',
                    boxShadow: '0 0 20px rgba(255,255,255,0.3)',
                  }}
                />
              </motion.div>
            </div>
          )}

          {/* Logo - appears after loading */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{
              opacity: showLogo ? 1 : 0,
              scale: showLogo ? 1 : 0.5,
              y: showLogo ? 0 : 20,
            }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="flex flex-col items-center"
          >
            {/* Logo with background */}
            <div
              className="rounded-3xl overflow-hidden flex items-center justify-center mb-5"
              style={{
                width: 96,
                height: 96,
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
              }}
            >
              <img src={LOGO_BASE64} alt="محفظة الجنوب" className="w-[72px] h-[72px] object-cover" />
            </div>
          </motion.div>

          {/* App Name */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{
              opacity: showName ? 1 : 0,
              y: showName ? 0 : 15,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-2xl font-bold text-white mb-2"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
          >
            محفظة الجنوب
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: showTagline ? 1 : 0,
              y: showTagline ? 0 : 10,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-sm"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            محفظتك الرقمية الموثوقة
          </motion.p>

          {/* Loading progress bar at bottom */}
          <div className="absolute bottom-12 left-8 right-8">
            {/* Progress percentage */}
            {phase === 'loading' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between mb-2"
              >
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>جارٍ التحميل</span>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }} dir="ltr">
                  {Math.round(progress)}%
                </span>
              </motion.div>
            )}
            {/* Progress bar track */}
            <div
              className="h-[3px] rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.8) 100%)',
                  width: `${progress}%`,
                  boxShadow: progress > 0 ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
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
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      )}
    </AnimatePresence>
  );
}

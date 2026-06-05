'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, User, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store';

type AuthStep = 'login' | 'register' | 'otp';

export default function AuthScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { setUser } = useAppStore();

  const [step, setStep] = useState<AuthStep>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Login fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPinConfirm, setRegPinConfirm] = useState('');

  // OTP field
  const [otp, setOtp] = useState(['', '', '', '']);
  const [registeredUserId, setRegisteredUserId] = useState('');

  const handleLogin = async () => {
    if (!loginPhone || !loginPin) {
      setError('يرجى إدخال رقم الهاتف والرقم السري');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, pin: loginPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ في تسجيل الدخول');
        return;
      }

      setUser(data.user);
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName || !regPhone || !regPin) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    if (regPin !== regPinConfirm) {
      setError('الرقم السري غير متطابق');
      return;
    }

    if (regPin.length !== 4) {
      setError('الرقم السري يجب أن يكون 4 أرقام');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: regPhone, name: regName, pin: regPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ في التسجيل');
        return;
      }

      setRegisteredUserId(data.user.id);
      setStep('otp');
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      setError('يرجى إدخال رمز التحقق');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulated OTP verification (always succeeds with "1234")
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (otpCode !== '1234') {
      setError('رمز التحقق غير صحيح (استخدم 1234)');
      setIsLoading(false);
      return;
    }

    // After OTP, log the user in
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: regPhone, pin: regPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        setIsLoading(false);
        return;
      }

      setUser(data.user);
    } catch {
      setError('حدث خطأ في الاتصال');
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const inputStyle = {
    background: isDark ? '#222' : '#F8F8F8',
    border: isDark ? '1px solid #333' : '1px solid #EEE',
    color: isDark ? '#FFF' : '#1a1a1a',
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}
    >
      {/* Logo Area */}
      <div className="flex flex-col items-center pt-12 pb-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg, #E60000 0%, #B30000 100%)',
            boxShadow: '0 8px 24px rgba(230,0,0,0.3)',
          }}
        >
          <span className="text-white text-2xl font-bold">فهد</span>
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold"
          style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
        >
          فهد نت
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm mt-1"
          style={{ color: isDark ? '#888' : '#AAA' }}
        >
          محفظتك الرقمية الموثوقة
        </motion.p>
      </div>

      {/* Form Area */}
      <div className="flex-1 px-6">
        <AnimatePresence mode="wait">
          {/* LOGIN STEP */}
          {step === 'login' && (
            <motion.div
              key="login"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="space-y-4"
            >
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
              >
                تسجيل الدخول
              </h2>

              {/* Phone */}
              <div
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                style={inputStyle}
              >
                <Phone size={18} strokeWidth={1.5} color="#E60000" />
                <input
                  type="tel"
                  placeholder="رقم الهاتف"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                  dir="ltr"
                />
              </div>

              {/* PIN */}
              <div
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                style={inputStyle}
              >
                <Lock size={18} strokeWidth={1.5} color="#E60000" />
                <input
                  type={showPin ? 'text' : 'password'}
                  placeholder="الرقم السري"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  maxLength={4}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                  dir="ltr"
                />
                <button onClick={() => setShowPin(!showPin)}>
                  {showPin ? (
                    <EyeOff size={18} strokeWidth={1.5} color={isDark ? '#888' : '#AAA'} />
                  ) : (
                    <Eye size={18} strokeWidth={1.5} color={isDark ? '#888' : '#AAA'} />
                  )}
                </button>
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-center"
                  style={{ color: '#E60000' }}
                >
                  {error}
                </motion.p>
              )}

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #E60000 0%, #B30000 100%)',
                  boxShadow: '0 4px 16px rgba(230,0,0,0.3)',
                }}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <span>تسجيل الدخول</span>
                )}
              </button>

              {/* Register Link */}
              <div className="flex items-center justify-center gap-1 pt-2">
                <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>
                  ليس لديك حساب؟
                </span>
                <button
                  onClick={() => {
                    setStep('register');
                    setError('');
                  }}
                  className="text-xs font-bold"
                  style={{ color: '#E60000' }}
                >
                  سجل الآن
                </button>
              </div>
            </motion.div>
          )}

          {/* REGISTER STEP */}
          {step === 'register' && (
            <motion.div
              key="register"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setStep('login');
                    setError('');
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: isDark ? '#222' : '#F0F0F0' }}
                >
                  <ArrowLeft size={16} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
                </button>
                <h2
                  className="text-lg font-bold"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  إنشاء حساب
                </h2>
              </div>

              {/* Name */}
              <div
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                style={inputStyle}
              >
                <User size={18} strokeWidth={1.5} color="#E60000" />
                <input
                  type="text"
                  placeholder="الاسم الكامل"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                />
              </div>

              {/* Phone */}
              <div
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                style={inputStyle}
              >
                <Phone size={18} strokeWidth={1.5} color="#E60000" />
                <input
                  type="tel"
                  placeholder="رقم الهاتف"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                  dir="ltr"
                />
              </div>

              {/* PIN */}
              <div
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                style={inputStyle}
              >
                <Lock size={18} strokeWidth={1.5} color="#E60000" />
                <input
                  type="password"
                  placeholder="الرقم السري (4 أرقام)"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  maxLength={4}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                  dir="ltr"
                />
              </div>

              {/* Confirm PIN */}
              <div
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                style={inputStyle}
              >
                <ShieldCheck size={18} strokeWidth={1.5} color="#E60000" />
                <input
                  type="password"
                  placeholder="تأكيد الرقم السري"
                  value={regPinConfirm}
                  onChange={(e) => setRegPinConfirm(e.target.value)}
                  maxLength={4}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                  dir="ltr"
                />
              </div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-center"
                  style={{ color: '#E60000' }}
                >
                  {error}
                </motion.p>
              )}

              {/* Register Button */}
              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #E60000 0%, #B30000 100%)',
                  boxShadow: '0 4px 16px rgba(230,0,0,0.3)',
                }}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <span>إنشاء الحساب</span>
                )}
              </button>
            </motion.div>
          )}

          {/* OTP STEP */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setStep('register');
                    setError('');
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: isDark ? '#222' : '#F0F0F0' }}
                >
                  <ArrowLeft size={16} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
                </button>
                <h2
                  className="text-lg font-bold"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  التحقق من الرمز
                </h2>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(230,0,0,0.1)' }}
                >
                  <ShieldCheck size={32} strokeWidth={1.5} color="#E60000" />
                </div>
                <p
                  className="text-sm text-center"
                  style={{ color: isDark ? '#AAA' : '#888' }}
                >
                  أدخل رمز التحقق المرسل إلى رقمك
                </p>
                <p
                  className="text-sm font-bold mt-1"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                  dir="ltr"
                >
                  {regPhone}
                </p>
              </div>

              {/* OTP Inputs */}
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="tel"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    className="w-14 h-14 rounded-2xl text-center text-xl font-bold outline-none"
                    style={{
                      background: isDark ? '#222' : '#F8F8F8',
                      border: digit
                        ? '2px solid #E60000'
                        : isDark
                          ? '1px solid #333'
                          : '1px solid #EEE',
                      color: isDark ? '#FFF' : '#1a1a1a',
                    }}
                  />
                ))}
              </div>

              <p className="text-xs text-center" style={{ color: isDark ? '#666' : '#CCC' }}>
                الرمز التجريبي: 1234
              </p>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-center"
                  style={{ color: '#E60000' }}
                >
                  {error}
                </motion.p>
              )}

              {/* Verify Button */}
              <button
                onClick={handleOtpVerify}
                disabled={isLoading}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #E60000 0%, #B30000 100%)',
                  boxShadow: '0 4px 16px rgba(230,0,0,0.3)',
                }}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <span>تحقق</span>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

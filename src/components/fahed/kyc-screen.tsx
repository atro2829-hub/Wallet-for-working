'use client';

import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Camera,
  Upload,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function KYCScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, setUser, setActiveScreen } = useAppStore();

  const [step, setStep] = useState(1);
  const [idNumber, setIdNumber] = useState('');
  const [idPhoto, setIdPhoto] = useState<string>('');
  const [selfiePhoto, setSelfiePhoto] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const idFileRef = useRef<HTMLInputElement>(null);
  const selfieFileRef = useRef<HTMLInputElement>(null);

  const totalSteps = 4;

  const handleFileToBase64 = (file: File, setter: (val: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileToBase64(file, setIdPhoto);
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileToBase64(file, setSelfiePhoto);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return idNumber.length >= 5;
      case 2: return !!idPhoto;
      case 3: return !!selfiePhoto;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          kycStatus: 'submitted',
          kycIdNumber: idNumber,
          kycIdPhoto: idPhoto,
          kycSelfie: selfiePhoto,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ في الإرسال');
        return;
      }

      setSuccess(true);
      setUser({ ...user, kycStatus: 'submitted' });
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    background: isDark ? '#222' : '#F8F8F8',
    border: isDark ? '1px solid #333' : '1px solid #EEE',
    color: isDark ? '#FFF' : '#1a1a1a',
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex flex-col items-center"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(16,185,129,0.1)' }}
          >
            <CheckCircle2 size={40} strokeWidth={1.5} color="#10B981" />
          </div>
          <h2
            className="text-xl font-bold"
            style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
          >
            تم إرسال الطلب بنجاح!
          </h2>
          <p
            className="text-sm text-center mt-2 max-w-[250px]"
            style={{ color: isDark ? '#888' : '#AAA' }}
          >
            سيتم مراجعة بياناتك والرد عليك خلال 24 ساعة
          </p>
          <button
            onClick={() => setActiveScreen('main')}
            className="mt-6 px-8 py-3 rounded-2xl text-sm font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #E60000 0%, #B30000 100%)',
              boxShadow: '0 4px 16px rgba(230,0,0,0.3)',
            }}
          >
            العودة للرئيسية
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('main')}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: isDark ? '#222' : '#F0F0F0' }}
          >
            <ArrowRight size={16} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
          </button>
          <h1
            className="text-xl font-bold"
            style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
          >
            التحقق من الهوية
          </h1>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-5 mt-3">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: isDark ? '#222' : '#EEE' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: i < step ? '#E60000' : 'transparent' }}
                initial={{ width: '0%' }}
                animate={{ width: i < step ? '100%' : '0%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: isDark ? '#888' : '#AAA' }}>
          الخطوة {step} من {totalSteps}
        </p>
      </div>

      {/* Steps Content */}
      <div className="flex-1 px-5 mt-6">
        <AnimatePresence mode="wait">
          {/* Step 1: ID Number */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'rgba(230,0,0,0.1)' }}
                >
                  <CreditCard size={32} strokeWidth={1.5} color="#E60000" />
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  رقم الهوية
                </h3>
                <p
                  className="text-xs text-center mt-1 max-w-[250px]"
                  style={{ color: isDark ? '#888' : '#AAA' }}
                >
                  أدخل رقم بطاقة الهوية الشخصية الخاصة بك
                </p>
              </div>

              <div
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                style={inputStyle}
              >
                <CreditCard size={18} strokeWidth={1.5} color="#E60000" />
                <input
                  type="text"
                  placeholder="رقم الهوية"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                  dir="ltr"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: ID Photo */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'rgba(230,0,0,0.1)' }}
                >
                  <Camera size={32} strokeWidth={1.5} color="#E60000" />
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  صورة الهوية
                </h3>
                <p
                  className="text-xs text-center mt-1 max-w-[250px]"
                  style={{ color: isDark ? '#888' : '#AAA' }}
                >
                  ارفع صورة واضحة لبطاقة الهوية الشخصية
                </p>
              </div>

              <input
                ref={idFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleIdPhotoChange}
              />

              {idPhoto ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src={idPhoto}
                    alt="صورة الهوية"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => setIdPhoto('')}
                    className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <span className="text-white text-xs">✕</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => idFileRef.current?.click()}
                  className="w-full h-48 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed"
                  style={{
                    borderColor: isDark ? '#333' : '#DDD',
                    background: isDark ? '#1A1A1A' : '#FFFFFF',
                  }}
                >
                  <Upload size={32} strokeWidth={1.5} color={isDark ? '#555' : '#CCC'} />
                  <span className="text-xs" style={{ color: isDark ? '#555' : '#CCC' }}>
                    اضغط لرفع الصورة
                  </span>
                </button>
              )}
            </motion.div>
          )}

          {/* Step 3: Selfie */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'rgba(230,0,0,0.1)' }}
                >
                  <Camera size={32} strokeWidth={1.5} color="#E60000" />
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  صورة شخصية
                </h3>
                <p
                  className="text-xs text-center mt-1 max-w-[250px]"
                  style={{ color: isDark ? '#888' : '#AAA' }}
                >
                  ارفع صورة شخصية واضحة (سيلفي)
                </p>
              </div>

              <input
                ref={selfieFileRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleSelfieChange}
              />

              {selfiePhoto ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src={selfiePhoto}
                    alt="صورة شخصية"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => setSelfiePhoto('')}
                    className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <span className="text-white text-xs">✕</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => selfieFileRef.current?.click()}
                  className="w-full h-48 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed"
                  style={{
                    borderColor: isDark ? '#333' : '#DDD',
                    background: isDark ? '#1A1A1A' : '#FFFFFF',
                  }}
                >
                  <Camera size={32} strokeWidth={1.5} color={isDark ? '#555' : '#CCC'} />
                  <span className="text-xs" style={{ color: isDark ? '#555' : '#CCC' }}>
                    اضغط لالتقاط صورة
                  </span>
                </button>
              )}
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'rgba(230,0,0,0.1)' }}
                >
                  <CheckCircle2 size={32} strokeWidth={1.5} color="#E60000" />
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  تأكيد البيانات
                </h3>
                <p
                  className="text-xs text-center mt-1 max-w-[250px]"
                  style={{ color: isDark ? '#888' : '#AAA' }}
                >
                  تأكد من صحة البيانات المدخلة قبل الإرسال
                </p>
              </div>

              <div
                className="rounded-2xl p-4 space-y-3"
                style={{
                  background: isDark ? '#1A1A1A' : '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>
                    رقم الهوية
                  </span>
                  <span className="text-sm font-medium" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} dir="ltr">
                    {idNumber}
                  </span>
                </div>
                <div
                  className="h-px"
                  style={{ background: isDark ? '#2A2A2A' : '#F0F0F0' }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>
                    صورة الهوية
                  </span>
                  <span className="text-sm font-medium" style={{ color: idPhoto ? '#10B981' : '#E60000' }}>
                    {idPhoto ? '✓ تم الرفع' : '✕ لم يتم الرفع'}
                  </span>
                </div>
                <div
                  className="h-px"
                  style={{ background: isDark ? '#2A2A2A' : '#F0F0F0' }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>
                    الصورة الشخصية
                  </span>
                  <span className="text-sm font-medium" style={{ color: selfiePhoto ? '#10B981' : '#E60000' }}>
                    {selfiePhoto ? '✓ تم الرفع' : '✕ لم يتم الرفع'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl mt-4"
            style={{ background: 'rgba(230,0,0,0.1)' }}
          >
            <AlertCircle size={16} color="#E60000" />
            <p className="text-xs" style={{ color: '#E60000' }}>{error}</p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 pb-8">
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: canProceed()
                  ? 'linear-gradient(135deg, #E60000 0%, #B30000 100%)'
                  : '#999',
                boxShadow: canProceed() ? '0 4px 16px rgba(230,0,0,0.3)' : 'none',
              }}
            >
              <span>التالي</span>
              <ArrowLeft size={16} strokeWidth={1.5} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
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
                <span>إرسال الطلب</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

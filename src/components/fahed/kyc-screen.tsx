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
  AlertCircle,
  MapPin,
  FileText,
  Eye,
  X,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { governorates, cardTypes, compressBase64Image } from '@/lib/utils';
import { useToast } from '@/components/fahed/toast-provider';
import { ref, update } from 'firebase/database';
import { database } from '@/lib/firebase';

export default function KYCScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, setUser, setActiveScreen } = useAppStore();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [cardType, setCardType] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardIssuedAt, setCardIssuedAt] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [idPhoto, setIdPhoto] = useState<string>('');
  const [selfiePhoto, setSelfiePhoto] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  const idFileRef = useRef<HTMLInputElement>(null);
  const selfieFileRef = useRef<HTMLInputElement>(null);

  const totalSteps = 6;

  const stepLabels = [
    'نوع البطاقة',
    'بيانات البطاقة',
    'المحافظة',
    'صورة البطاقة',
    'صورة شخصية',
    'تأكيد',
  ];

  const handleFileToBase64 = async (file: File, setter: (val: string) => void) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'خطأ', 'حجم الصورة كبير جداً (الحد 10 ميجابايت)');
      return;
    }

    setCompressing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      // Show preview first
      setPreviewImage(base64);
      try {
        const compressed = await compressBase64Image(base64, 400, 0.8);
        setter(compressed);
        setPreviewImage(compressed);
      } catch {
        setter(base64);
        setPreviewImage(base64);
      }
      setCompressing(false);
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
      case 1: return cardType !== '';
      case 2: return cardNumber.length >= 5 && cardIssuedAt !== '';
      case 3: return governorate !== '';
      case 4: return !!idPhoto;
      case 5: return !!selfiePhoto;
      case 6: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      // Update user KYC data directly in Firebase
      const userRef = ref(database, `users/${user.id}`);
      await update(userRef, {
        kycStatus: 'submitted',
        kycIdNumber: cardNumber,
        kycIdPhoto: idPhoto,
        kycSelfie: selfiePhoto,
        cardType,
        cardNumber,
        cardIssuedAt,
        governorate,
      });

      setSuccess(true);
      setUser({
        ...user,
        kycStatus: 'submitted',
        cardType,
        cardNumber,
        cardIssuedAt,
        governorate,
      });
      showToast('success', 'تم الإرسال', 'تم إرسال طلب التحقق بنجاح');
    } catch {
      setError('حدث خطأ في الاتصال');
      showToast('error', 'خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const glassCardStyle = {
    background: isDark
      ? 'rgba(255,255,255,0.06)'
      : 'rgba(0,0,0,0.02)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
  };

  const inputStyle = {
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
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
            style={{
              background: 'rgba(16,185,129,0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
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

      {/* Progress Bar with Step Labels */}
      <div className="px-5 mt-3">
        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ background: isDark ? '#222' : '#EEE' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: i < step
                      ? 'linear-gradient(90deg, #E60000, #B30000)'
                      : 'transparent',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: i < step ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span
                className="text-[8px] font-medium"
                style={{
                  color: i < step ? '#E60000' : isDark ? '#555' : '#CCC',
                }}
              >
                {stepLabels[i]}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3 font-medium" style={{ color: isDark ? '#888' : '#AAA' }}>
          الخطوة {step} من {totalSteps}
        </p>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewImage && !idPhoto && !selfiePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-6"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage}
                alt="معاينة"
                className="w-full rounded-2xl"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
              >
                <X size={16} color="#FFF" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Steps Content */}
      <div className="flex-1 px-5 mt-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Card Type Selection */}
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
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: 'rgba(230,0,0,0.08)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(230,0,0,0.15)',
                  }}
                >
                  <CreditCard size={32} strokeWidth={1.5} color="#E60000" />
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  نوع البطاقة
                </h3>
                <p
                  className="text-xs text-center mt-1 max-w-[250px]"
                  style={{ color: isDark ? '#888' : '#AAA' }}
                >
                  اختر نوع وثيقة التعريف الخاصة بك
                </p>
              </div>

              <div className="space-y-2">
                {cardTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setCardType(type)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
                    style={{
                      background: cardType === type
                        ? 'rgba(230,0,0,0.08)'
                        : isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(0,0,0,0.02)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: cardType === type
                        ? '2px solid #E60000'
                        : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: cardType === type ? '#E60000' : isDark ? '#555' : '#CCC',
                      }}
                    >
                      {cardType === type && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#E60000' }} />
                      )}
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: cardType === type ? '#E60000' : isDark ? '#FFF' : '#1a1a1a' }}
                    >
                      {type}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Card Number + Issued At */}
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
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: 'rgba(230,0,0,0.08)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(230,0,0,0.15)',
                  }}
                >
                  <FileText size={32} strokeWidth={1.5} color="#E60000" />
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  بيانات البطاقة
                </h3>
                <p
                  className="text-xs text-center mt-1 max-w-[250px]"
                  style={{ color: isDark ? '#888' : '#AAA' }}
                >
                  أدخل رقم البطاقة ومكان إصدارها
                </p>
              </div>

              <div>
                <label
                  className="text-xs font-medium mb-1.5 block"
                  style={{ color: isDark ? '#AAA' : '#888' }}
                >
                  رقم البطاقة
                </label>
                <div
                  className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                  style={inputStyle}
                >
                  <CreditCard size={18} strokeWidth={1.5} color="#E60000" />
                  <input
                    type="text"
                    placeholder="رقم البطاقة"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label
                  className="text-xs font-medium mb-1.5 block"
                  style={{ color: isDark ? '#AAA' : '#888' }}
                >
                  مكان الإصدار
                </label>
                <div
                  className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                  style={inputStyle}
                >
                  <MapPin size={18} strokeWidth={1.5} color="#E60000" />
                  <input
                    type="text"
                    placeholder="مكان إصدار البطاقة"
                    value={cardIssuedAt}
                    onChange={(e) => setCardIssuedAt(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Governorate Selection */}
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
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: 'rgba(230,0,0,0.08)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(230,0,0,0.15)',
                  }}
                >
                  <MapPin size={32} strokeWidth={1.5} color="#E60000" />
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  المحافظة
                </h3>
                <p
                  className="text-xs text-center mt-1 max-w-[250px]"
                  style={{ color: isDark ? '#888' : '#AAA' }}
                >
                  اختر محافظتك من محافظات جنوب اليمن
                </p>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                {governorates.map((gov) => (
                  <button
                    key={gov}
                    onClick={() => setGovernorate(gov)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
                    style={{
                      background: governorate === gov
                        ? 'rgba(230,0,0,0.08)'
                        : isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(0,0,0,0.02)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: governorate === gov
                        ? '2px solid #E60000'
                        : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: governorate === gov ? '#E60000' : isDark ? '#555' : '#CCC',
                      }}
                    >
                      {governorate === gov && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#E60000' }} />
                      )}
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: governorate === gov ? '#E60000' : isDark ? '#FFF' : '#1a1a1a' }}
                    >
                      {gov}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: ID Photo Upload */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: 'rgba(230,0,0,0.08)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(230,0,0,0.15)',
                  }}
                >
                  <Camera size={32} strokeWidth={1.5} color="#E60000" />
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  صورة البطاقة
                </h3>
                <p
                  className="text-xs text-center mt-1 max-w-[250px]"
                  style={{ color: isDark ? '#888' : '#AAA' }}
                >
                  ارفع صورة واضحة لبطاقة التعريف الشخصية
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
                    alt="صورة البطاقة"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <button
                      onClick={() => setPreviewImage(idPhoto)}
                      className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                    >
                      <Eye size={14} color="#FFF" />
                    </button>
                    <button
                      onClick={() => { setIdPhoto(''); setPreviewImage(null); }}
                      className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                    >
                      <X size={14} color="#FFF" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <CheckCircle2 size={24} color="#10B981" strokeWidth={1.5} />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => idFileRef.current?.click()}
                  disabled={compressing}
                  className="w-full h-48 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed"
                  style={{
                    borderColor: isDark ? '#333' : '#DDD',
                    background: isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.02)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  {compressing ? (
                    <>
                      <Loader2 size={32} strokeWidth={1.5} className="animate-spin" color="#E60000" />
                      <span className="text-xs" style={{ color: '#E60000' }}>جاري الضغط...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={32} strokeWidth={1.5} color={isDark ? '#555' : '#CCC'} />
                      <span className="text-xs" style={{ color: isDark ? '#555' : '#CCC' }}>
                        اضغط لرفع الصورة
                      </span>
                    </>
                  )}
                </button>
              )}
            </motion.div>
          )}

          {/* Step 5: Selfie Upload */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: 'rgba(230,0,0,0.08)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(230,0,0,0.15)',
                  }}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <button
                      onClick={() => setPreviewImage(selfiePhoto)}
                      className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                    >
                      <Eye size={14} color="#FFF" />
                    </button>
                    <button
                      onClick={() => { setSelfiePhoto(''); setPreviewImage(null); }}
                      className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                    >
                      <X size={14} color="#FFF" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <CheckCircle2 size={24} color="#10B981" strokeWidth={1.5} />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => selfieFileRef.current?.click()}
                  disabled={compressing}
                  className="w-full h-48 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed"
                  style={{
                    borderColor: isDark ? '#333' : '#DDD',
                    background: isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.02)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  {compressing ? (
                    <>
                      <Loader2 size={32} strokeWidth={1.5} className="animate-spin" color="#E60000" />
                      <span className="text-xs" style={{ color: '#E60000' }}>جاري الضغط...</span>
                    </>
                  ) : (
                    <>
                      <Camera size={32} strokeWidth={1.5} color={isDark ? '#555' : '#CCC'} />
                      <span className="text-xs" style={{ color: isDark ? '#555' : '#CCC' }}>
                        اضغط لالتقاط صورة
                      </span>
                    </>
                  )}
                </button>
              )}
            </motion.div>
          )}

          {/* Step 6: Confirmation */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center mb-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: 'rgba(230,0,0,0.08)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(230,0,0,0.15)',
                  }}
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
                  ...glassCardStyle,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
              >
                {[
                  { label: 'نوع البطاقة', value: cardType },
                  { label: 'رقم البطاقة', value: cardNumber, dir: 'ltr' as const },
                  { label: 'مكان الإصدار', value: cardIssuedAt },
                  { label: 'المحافظة', value: governorate },
                  { label: 'صورة البطاقة', value: idPhoto ? 'تم الرفع' : 'لم يتم الرفع', color: idPhoto ? '#10B981' : '#E60000' },
                  { label: 'الصورة الشخصية', value: selfiePhoto ? 'تم الرفع' : 'لم يتم الرفع', color: selfiePhoto ? '#10B981' : '#E60000' },
                ].map((item, i, arr) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: isDark ? '#888' : '#AAA' }}>
                        {item.label}
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: item.color || (isDark ? '#FFF' : '#1a1a1a'),
                        }}
                        dir={item.dir}
                      >
                        {item.value}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="h-px mt-3" style={{ background: isDark ? '#2A2A2A' : '#F0F0F0' }} />
                    )}
                  </div>
                ))}
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
          {step < totalSteps ? (
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
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <span>إرسال الطلب</span>
              )}
            </button>
          )}

          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="w-full py-3 mt-2 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium"
              style={{
                color: isDark ? '#AAA' : '#888',
              }}
            >
              <ArrowRight size={16} strokeWidth={1.5} />
              <span>السابق</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

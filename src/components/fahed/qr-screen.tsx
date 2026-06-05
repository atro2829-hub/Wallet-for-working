'use client';

import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowRight,
  QrCode,
  Camera,
  Copy,
  Share2,
  UserPlus,
  HandCoins,

  CheckCircle2,
  Clipboard,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { currencySymbols, currencyBadgeColors } from '@/lib/utils';
import { LOGO_BASE64 } from '@/lib/logo';
import { useToast } from '@/components/fahed/toast-provider';

type QRTab = 'scan' | 'generate';
type GenerateType = 'receive' | 'request';

export default function QRScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, setActiveScreen } = useAppStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<QRTab>('generate');
  const [generateType, setGenerateType] = useState<GenerateType>('receive');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'YER' | 'SAR' | 'USD'>('YER');
  const [scanResult, setScanResult] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const qrData = (() => {
    if (!user) return '';
    switch (generateType) {
      case 'receive':
        return `FAHED:RECEIVE:${user.userId}${amount ? `:AMT:${amount}:${currency}` : ''}`;
      case 'request':
        return `FAHED:REQUEST:${user.userId}:AMT:${amount || '0'}:${currency}`;
      default:
        return '';
    }
  })();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      showToast('success', 'تم النسخ', 'تم نسخ البيانات إلى الحافظة');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'خطأ', 'فشل نسخ البيانات');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'محفظة الجنوب',
          text: qrData,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleScanResult = () => {
    if (!manualInput.trim()) return;
    setScanResult(manualInput.trim());
    showToast('info', 'تم القراءة', 'تم قراءة البيانات بنجاح');
  };

  const generateTypes: { key: GenerateType; label: string; icon: typeof UserPlus }[] = [
    { key: 'receive', label: 'استقبال تحويل', icon: UserPlus },
    { key: 'request', label: 'طلب أموال', icon: HandCoins },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: isDark ? '#0F0F0F' : '#F5F5F5' }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('main')}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: isDark ? '#1A1A1A' : '#F0F0F0' }}
          >
            <ArrowRight size={16} strokeWidth={1.5} color={isDark ? '#FFF' : '#666'} />
          </button>
          <h1
            className="text-xl font-bold"
            style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
          >
            مسح QR
          </h1>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="px-5 mt-2">
        <div
          className="flex rounded-2xl overflow-hidden"
          style={{ background: isDark ? '#1A1A1A' : '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <button
            onClick={() => setActiveTab('scan')}
            className="flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2"
            style={{
              background: activeTab === 'scan' ? '#E60000' : 'transparent',
              color: activeTab === 'scan' ? '#FFF' : isDark ? '#AAA' : '#888',
            }}
          >
            <Camera size={16} strokeWidth={1.5} />
            <span>مسح رمز</span>
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className="flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2"
            style={{
              background: activeTab === 'generate' ? '#E60000' : 'transparent',
              color: activeTab === 'generate' ? '#FFF' : isDark ? '#AAA' : '#888',
            }}
          >
            <QrCode size={16} strokeWidth={1.5} />
            <span>توليد رمز</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 mt-4 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'scan' ? (
            <motion.div
              key="scan"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Camera Placeholder */}
              <div
                className="w-full aspect-square rounded-3xl flex flex-col items-center justify-center gap-4"
                style={{
                  background: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.02)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `2px dashed ${isDark ? '#333' : '#DDD'}`,
                }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                >
                  <Camera size={40} strokeWidth={1.5} color={isDark ? '#555' : '#CCC'} />
                </div>
                <p className="text-sm" style={{ color: isDark ? '#666' : '#AAA' }}>
                  وجه الكاميرا نحو رمز QR
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{
                    background: 'linear-gradient(135deg, #E60000 0%, #CC0000 100%)',
                    boxShadow: '0 4px 12px rgba(230,0,0,0.3)',
                  }}
                >
                  اضغط للمسح
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={() => {
                    setScanResult('FAHED:RECEIVE:101234');
                    showToast('success', 'تم المسح', 'تم قراءة رمز QR بنجاح');
                  }}
                />
                <p className="text-[10px] mt-1" style={{ color: isDark ? '#555' : '#BBB' }}>
                  مسح الكاميرا يتطلب تطبيق الموبايل
                </p>
              </div>

              {/* Manual Input */}
              <div>
                <label
                  className="text-xs font-medium mb-1.5 block"
                  style={{ color: isDark ? '#AAA' : '#888' }}
                >
                  أو أدخل البيانات يدوياً
                </label>
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <Clipboard size={18} strokeWidth={1.5} color="#E60000" />
                  <input
                    type="text"
                    placeholder="الصق بيانات QR هنا"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                    dir="ltr"
                  />
                  <button
                    onClick={handleScanResult}
                    disabled={!manualInput.trim()}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-white disabled:opacity-40"
                    style={{ background: '#E60000' }}
                  >
                    قراءة
                  </button>
                </div>
              </div>

              {/* Scan Result */}
              <AnimatePresence>
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-2xl p-4"
                    style={{
                      background: isDark
                        ? 'rgba(16,185,129,0.08)'
                        : 'rgba(16,185,129,0.05)',
                      border: `1px solid rgba(16,185,129,0.2)`,
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} color="#10B981" strokeWidth={1.5} />
                      <span className="text-xs font-bold" style={{ color: '#10B981' }}>
                        نتيجة المسح
                      </span>
                    </div>
                    <p
                      className="text-sm font-mono break-all"
                      style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                      dir="ltr"
                    >
                      {scanResult}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="generate"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Generate Type Selection */}
              <div className="flex gap-2">
                {generateTypes.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setGenerateType(key);
                      setAmount('');
                      setScanResult('');
                    }}
                    className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all"
                    style={{
                      background: generateType === key
                        ? 'rgba(230,0,0,0.1)'
                        : isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(0,0,0,0.02)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: generateType === key
                        ? '2px solid #E60000'
                        : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    }}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      color={generateType === key ? '#E60000' : isDark ? '#888' : '#AAA'}
                    />
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: generateType === key ? '#E60000' : isDark ? '#888' : '#AAA' }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Amount Input (for receive and request) */}
              {(generateType === 'receive' || generateType === 'request') && (
                <div className="space-y-3">
                  <div>
                    <label
                      className="text-xs font-medium mb-1.5 block"
                      style={{ color: isDark ? '#AAA' : '#888' }}
                    >
                      المبلغ {generateType === 'receive' ? '(اختياري)' : ''}
                    </label>
                    <div
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      }}
                    >
                      <input
                        type="number"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm"
                        style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                        dir="ltr"
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: isDark ? '#AAA' : '#888' }}
                      >
                        {currencySymbols[currency]}
                      </span>
                    </div>
                  </div>

                  {/* Currency Selector */}
                  <div className="flex gap-2">
                    {(['YER', 'SAR', 'USD'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all"
                        style={{
                          background: currency === c
                            ? `${currencyBadgeColors[c]}15`
                            : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                          border: currency === c
                            ? `1px solid ${currencyBadgeColors[c]}`
                            : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                          color: currency === c ? currencyBadgeColors[c] : isDark ? '#AAA' : '#888',
                        }}
                      >
                        <span
                          className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white"
                          style={{ background: currencyBadgeColors[c] }}
                        >
                          {c.charAt(0)}
                        </span>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QR Card */}
              <motion.div
                layout
                className="relative rounded-3xl overflow-hidden p-6"
                style={{
                  background: isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                }}
              >
                {/* Logo Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <img src={LOGO_BASE64} alt="" className="w-48 h-48 object-contain" />
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div
                      className="p-4 rounded-2xl"
                      style={{
                        background: '#FFFFFF',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                      }}
                    >
                      <QRCodeSVG
                        value={qrData}
                        size={200}
                        level="H"
                        bgColor="#FFFFFF"
                        fgColor="#0F0F0F"
                        marginSize={0}
                        imageSettings={{
                          src: LOGO_BASE64,
                          height: 40,
                          width: 40,
                          excavate: true,
                        }}
                      />
                    </div>
                  </motion.div>
                </div>

                {/* User Info */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <p
                    className="text-sm font-medium"
                    style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                  >
                    {user?.name || 'مستخدم'}
                  </p>
                  <p
                    className="text-3xl font-bold mt-1 tracking-wider"
                    style={{ color: '#E60000' }}
                    dir="ltr"
                  >
                    {user?.userId || '100000'}
                  </p>
                  {amount && (
                    <p
                      className="text-sm mt-2"
                      style={{ color: isDark ? '#AAA' : '#888' }}
                    >
                      {parseInt(amount).toLocaleString('ar-SA')} {currencySymbols[currency]}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: '#E60000' }}>
                      الجنوب
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 relative z-10">
                  <button
                    onClick={handleCopy}
                    className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                      color: isDark ? '#FFF' : '#1a1a1a',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    }}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 size={16} strokeWidth={1.5} color="#10B981" />
                        <span style={{ color: '#10B981' }}>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} strokeWidth={1.5} />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium text-white"
                    style={{
                      background: 'linear-gradient(135deg, #E60000 0%, #CC0000 100%)',
                      boxShadow: '0 4px 12px rgba(230,0,0,0.3)',
                    }}
                  >
                    <Share2 size={16} strokeWidth={1.5} />
                    <span>مشاركة</span>
                  </button>
                </div>
              </motion.div>


            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

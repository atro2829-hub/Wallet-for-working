'use client';

import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Camera,
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  Loader2,
  Lock,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { governorates, compressBase64Image } from '@/lib/utils';
import { LOGO_BASE64 } from '@/lib/logo';
import { useToast } from '@/components/fahed/toast-provider';
import { ref, update } from 'firebase/database';
import { database } from '@/lib/firebase';

// Yemen flag indicator
function YemenFlagIndicator() {
  return (
    <div className="flex flex-col w-6 h-4 rounded-sm overflow-hidden shrink-0">
      <div className="flex-1 bg-red-600" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-black" />
    </div>
  );
}

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, setUser, setActiveScreen } = useAppStore();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone ? user.phone.replace('+967', '') : '');
  const [email] = useState(user?.email || '');
  const [selectedGovernorate, setSelectedGovernorate] = useState(user?.governorate || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 3) {
      newErrors.name = 'الاسم يجب أن يكون 3 أحرف على الأقل';
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length !== 9 || !cleanedPhone.startsWith('7')) {
      newErrors.phone = 'رقم الهاتف يجب أن يبدأ بـ 7 ويتكون من 9 أرقام';
    }

    if (!selectedGovernorate) {
      newErrors.governorate = 'يرجى اختيار المحافظة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 9);
    setPhone(cleaned);
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'خطأ', 'حجم الصورة كبير جداً');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      try {
        const compressed = await compressBase64Image(base64, 200, 0.7);
        setAvatar(compressed);
      } catch {
        setAvatar(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user || !validate()) return;

    setIsLoading(true);
    try {
      const fullPhone = `+967${phone}`;
      const updates = {
        name: name.trim(),
        phone: fullPhone,
        governorate: selectedGovernorate,
        avatar,
      };

      // Update Firebase
      try {
        const userRef = ref(database, `users/${user.id}`);
        await update(userRef, updates);
      } catch {
        // Continue locally
      }

      // Update local store
      setUser({
        ...user,
        name: name.trim(),
        phone: fullPhone,
        governorate: selectedGovernorate,
        avatar,
      });

      showToast('success', 'تم التحديث', 'تم تحديث بياناتك بنجاح');

      setTimeout(() => {
        setActiveScreen('main');
      }, 800);
    } catch {
      showToast('error', 'خطأ', 'حدث خطأ أثناء تحديث البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const inputContainerStyle = {
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
  };

  const inputErrorStyle = (field: string) =>
    errors[field]
      ? { border: '1px solid #E60000', boxShadow: '0 0 0 2px rgba(230,0,0,0.1)' }
      : {};

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
            تعديل الملف الشخصي
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 mt-4 pb-8 overflow-y-auto">
        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                background: isDark ? '#1A1A1A' : '#F0F0F0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} strokeWidth={1.5} color={isDark ? '#555' : '#CCC'} />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 left-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: '#E60000',
                boxShadow: '0 2px 8px rgba(230,0,0,0.4)',
              }}
            >
              <Camera size={14} strokeWidth={1.5} color="#FFF" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </motion.div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
          >
            <label
              className="text-xs font-medium mb-1.5 block"
              style={{ color: isDark ? '#AAA' : '#888' }}
            >
              الاسم الكامل
            </label>
            <div
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
              style={{ ...inputContainerStyle, ...inputErrorStyle('name') }}
            >
              <User size={18} strokeWidth={1.5} color="#E60000" />
              <input
                type="text"
                placeholder="الاسم الكامل"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
              />
            </div>
            {errors.name && (
              <p className="text-[10px] mt-1" style={{ color: '#E60000' }}>{errors.name}</p>
            )}
          </motion.div>

          {/* Phone */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label
              className="text-xs font-medium mb-1.5 block"
              style={{ color: isDark ? '#AAA' : '#888' }}
            >
              رقم الهاتف
            </label>
            <div
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
              style={{ ...inputContainerStyle, ...inputErrorStyle('phone') }}
            >
              <Phone size={18} strokeWidth={1.5} color="#E60000" />
              <YemenFlagIndicator />
              <span
                className="text-sm font-medium shrink-0"
                style={{ color: isDark ? '#AAA' : '#888' }}
                dir="ltr"
              >
                +967
              </span>
              <div
                className="w-px h-5 shrink-0"
                style={{ background: isDark ? '#444' : '#DDD' }}
              />
              <input
                type="tel"
                placeholder="7XX XXX XXX"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                dir="ltr"
              />
            </div>
            {errors.phone && (
              <p className="text-[10px] mt-1" style={{ color: '#E60000' }}>{errors.phone}</p>
            )}
          </motion.div>

          {/* Email (readonly) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label
              className="text-xs font-medium mb-1.5 block"
              style={{ color: isDark ? '#AAA' : '#888' }}
            >
              البريد الإلكتروني
            </label>
            <div
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
              style={{
                ...inputContainerStyle,
                opacity: 0.6,
              }}
            >
              <Mail size={18} strokeWidth={1.5} color="#E60000" />
              <input
                type="email"
                value={email}
                readOnly
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: isDark ? '#888' : '#AAA' }}
                dir="ltr"
              />
              <Lock size={14} strokeWidth={1.5} color={isDark ? '#555' : '#CCC'} />
            </div>
            <p className="text-[10px] mt-1" style={{ color: isDark ? '#555' : '#CCC' }}>
              لا يمكن تغيير البريد
            </p>
          </motion.div>

          {/* Governorate */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label
              className="text-xs font-medium mb-1.5 block"
              style={{ color: isDark ? '#AAA' : '#888' }}
            >
              المحافظة
            </label>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ ...inputContainerStyle, ...inputErrorStyle('governorate') }}
            >
              <div className="flex items-center gap-2 px-4 py-2">
                <MapPin size={18} strokeWidth={1.5} color="#E60000" />
                <select
                  value={selectedGovernorate}
                  onChange={(e) => {
                    setSelectedGovernorate(e.target.value);
                    if (errors.governorate) setErrors((prev) => ({ ...prev, governorate: '' }));
                  }}
                  className="flex-1 bg-transparent outline-none text-sm appearance-none"
                  style={{ color: isDark ? '#FFF' : '#1a1a1a' }}
                >
                  <option value="" disabled style={{ background: isDark ? '#222' : '#FFF' }}>
                    اختر المحافظة
                  </option>
                  {governorates.map((gov) => (
                    <option
                      key={gov}
                      value={gov}
                      style={{ background: isDark ? '#222' : '#FFF' }}
                    >
                      {gov}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {errors.governorate && (
              <p className="text-[10px] mt-1" style={{ color: '#E60000' }}>{errors.governorate}</p>
            )}
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white text-sm transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #E60000 0%, #B30000 100%)',
              boxShadow: '0 4px 16px rgba(230,0,0,0.3)',
            }}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Save size={18} strokeWidth={1.5} />
                <span>حفظ التغييرات</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

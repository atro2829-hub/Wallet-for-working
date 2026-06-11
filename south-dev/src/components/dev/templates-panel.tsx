'use client';

import { useState, useEffect } from 'react';
import { useDevStore, AppTemplate } from '@/lib/store';
import { database } from '@/lib/firebase';
import { ref, set, remove, update, get, push } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutTemplate, Plus, Edit3, Trash2, Save, X,
  CheckCircle, Palette, Package, Star, ArrowLeft,
  Loader2, Copy, Settings
} from 'lucide-react';
import { cn, generateId } from '@/lib/utils';

const defaultTemplates: AppTemplate[] = [
  {
    id: 'basic-wallet',
    name: 'محفظة أساسية',
    description: 'محفظة رقمية أساسية مع الميزات الأساسية: إرسال، استقبال، رصيد',
    defaultColors: { primary: '#6C3CE1', secondary: '#8B5CF6' },
    defaultPackagePrefix: 'com.qtbm',
    icon: 'wallet',
  },
  {
    id: 'advanced-wallet',
    name: 'محفظة متقدمة',
    description: 'محفظة متقدمة مع ميزات إضافية: سجل المعاملات، إشعارات، دعم متعدد العملات',
    defaultColors: { primary: '#059669', secondary: '#10B981' },
    defaultPackagePrefix: 'com.qtbm',
    icon: 'shield',
  },
  {
    id: 'vip-wallet',
    name: 'محفظة VIP',
    description: 'محفظة مميزة مع واجهة فاخرة، دعم أولوية، ميزات حصرية وتخصيص كامل',
    defaultColors: { primary: '#D97706', secondary: '#F59E0B' },
    defaultPackagePrefix: 'com.qtbm',
    icon: 'crown',
  },
];

const templateIconMap: Record<string, React.ElementType> = {
  wallet: Package,
  shield: CheckCircle,
  crown: Star,
  default: LayoutTemplate,
};

export default function TemplatesPanel() {
  const { templates, setTemplates, setActivePanel } = useDevStore();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AppTemplate>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load templates from Firebase on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesRef = ref(database, 'devSettings/templates');
        const snapshot = await get(templatesRef);
        const data = snapshot.val();

        if (data) {
          const list: AppTemplate[] = Object.entries(data).map(([id, val]: [string, any]) => ({
            id,
            ...val,
          }));
          setTemplates(list);
        } else {
          // Initialize with default templates
          for (const tmpl of defaultTemplates) {
            await set(ref(database, `devSettings/templates/${tmpl.id}`), tmpl);
          }
          setTemplates(defaultTemplates);
        }
      } catch (error) {
        console.error('Load templates error:', error);
        // Use defaults if Firebase fails
        if (templates.length === 0) {
          setTemplates(defaultTemplates);
        }
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, []);

  const handleNewTemplate = () => {
    setFormData({
      name: '',
      description: '',
      defaultColors: { primary: '#6C3CE1', secondary: '#8B5CF6' },
      defaultPackagePrefix: 'com.qtbm',
      icon: 'default',
    });
    setEditingId(null);
    setView('form');
  };

  const handleEditTemplate = (template: AppTemplate) => {
    setFormData({ ...template });
    setEditingId(template.id);
    setView('form');
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setSaving(true);
    try {
      const id = editingId || generateId();
      const templateData: AppTemplate = {
        id,
        name: formData.name || '',
        description: formData.description || '',
        defaultColors: formData.defaultColors || { primary: '#6C3CE1', secondary: '#8B5CF6' },
        defaultPackagePrefix: formData.defaultPackagePrefix || 'com.qtbm',
        icon: formData.icon || 'default',
      };

      await set(ref(database, `devSettings/templates/${id}`), templateData);

      if (editingId) {
        setTemplates(templates.map(t => t.id === id ? templateData : t));
      } else {
        setTemplates([...templates, templateData]);
      }

      setView('list');
      setEditingId(null);
    } catch (error) {
      console.error('Save template error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(ref(database, `devSettings/templates/${id}`));
      setTemplates(templates.filter(t => t.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete template error:', error);
    }
  };

  const handleCreateInstance = (template: AppTemplate) => {
    // Navigate to instances panel with template pre-fill
    // Store the template ID so instances panel can pick it up
    setActivePanel('instances');
    // We'll use a simple approach - store in localStorage temporarily
    localStorage.setItem('pendingTemplateId', template.id);
  };

  const inputClass = "w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30 transition-all text-sm";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1 px-1";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // =========== FORM VIEW ===========
  if (view === 'form') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            {editingId ? 'تعديل القالب' : 'إضافة قالب جديد'}
          </h1>
          <button
            onClick={() => { setView('list'); setEditingId(null); }}
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div className="ios-card p-5 space-y-4">
            <div>
              <label className={labelClass}>اسم القالب</label>
              <input className={inputClass} value={formData.name || ''} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="محفظة مخصصة" />
            </div>
            <div>
              <label className={labelClass}>الوصف</label>
              <textarea className={cn(inputClass, 'h-24 resize-none py-3')} value={formData.description || ''} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="وصف القالب والميزات المتضمنة..." />
            </div>
            <div>
              <label className={labelClass}>بادئة الحزمة الافتراضية</label>
              <input className={inputClass} value={formData.defaultPackagePrefix || ''} onChange={e => setFormData(prev => ({ ...prev, defaultPackagePrefix: e.target.value }))} placeholder="com.qtbm" dir="ltr" />
            </div>
            <div>
              <label className={labelClass}>رمز القالب</label>
              <select className={inputClass} value={formData.icon || 'default'} onChange={e => setFormData(prev => ({ ...prev, icon: e.target.value }))}>
                <option value="default">افتراضي</option>
                <option value="wallet">محفظة</option>
                <option value="shield">درع</option>
                <option value="crown">تاج</option>
              </select>
            </div>
          </div>

          {/* Colors */}
          <div className="ios-card p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-500" /> الألوان الافتراضية
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>اللون الأساسي</label>
                <div className="flex items-center gap-2">
                  <input type="color" className="w-10 h-10 rounded-xl border-0 cursor-pointer" value={formData.defaultColors?.primary || '#6C3CE1'} onChange={e => setFormData(prev => ({ ...prev, defaultColors: { ...prev.defaultColors!, primary: e.target.value } }))} />
                  <input className={cn(inputClass, 'flex-1')} value={formData.defaultColors?.primary || ''} onChange={e => setFormData(prev => ({ ...prev, defaultColors: { ...prev.defaultColors!, primary: e.target.value } }))} dir="ltr" />
                </div>
              </div>
              <div>
                <label className={labelClass}>اللون الثانوي</label>
                <div className="flex items-center gap-2">
                  <input type="color" className="w-10 h-10 rounded-xl border-0 cursor-pointer" value={formData.defaultColors?.secondary || '#8B5CF6'} onChange={e => setFormData(prev => ({ ...prev, defaultColors: { ...prev.defaultColors!, secondary: e.target.value } }))} />
                  <input className={cn(inputClass, 'flex-1')} value={formData.defaultColors?.secondary || ''} onChange={e => setFormData(prev => ({ ...prev, defaultColors: { ...prev.defaultColors!, secondary: e.target.value } }))} dir="ltr" />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className={labelClass}>معاينة</label>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/20">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg" style={{ background: `linear-gradient(135deg, ${formData.defaultColors?.primary || '#6C3CE1'}, ${formData.defaultColors?.secondary || '#8B5CF6'})` }}>
                  A
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{formData.name || 'اسم القالب'}</p>
                  <p className="text-xs text-muted-foreground">{formData.description?.substring(0, 40) || 'وصف القالب...'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !formData.name}
            className="w-full h-12 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/30 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 active:scale-[0.98]"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'جاري الحفظ...' : 'حفظ القالب'}
          </button>
        </div>
      </div>
    );
  }

  // =========== LIST VIEW ===========
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ios-large-title text-foreground">القوالب</h1>
          <p className="text-muted-foreground text-sm mt-1">قوالب التطبيقات الجاهزة للتخصيص السريع</p>
        </div>
        <button
          onClick={handleNewTemplate}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600 transition-all active:scale-[0.98] shadow-lg shadow-purple-500/25"
        >
          <Plus className="w-4 h-4" /> قالب جديد
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-16">
          <LayoutTemplate className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium">لا توجد قوالب</p>
          <p className="text-muted-foreground/60 text-sm mt-1">أنشئ قالبًا لتسريع إنشاء النسخ الجديدة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template, idx) => {
            const IconComponent = templateIconMap[template.icon] || templateIconMap.default;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="ios-card overflow-hidden"
              >
                {/* Color Header */}
                <div
                  className="h-24 flex items-center justify-center relative"
                  style={{ background: `linear-gradient(135deg, ${template.defaultColors.primary}, ${template.defaultColors.secondary})` }}
                >
                  <IconComponent className="w-12 h-12 text-white/80" />
                  <div className="absolute top-3 left-3 flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full border-2 border-white/30" style={{ background: template.defaultColors.primary }} />
                    <div className="w-5 h-5 rounded-full border-2 border-white/30" style={{ background: template.defaultColors.secondary }} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-sm mb-1">{template.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{template.description}</p>
                  <div className="text-[10px] text-muted-foreground/60 mb-3" dir="ltr">
                    {template.defaultPackagePrefix}.xxx
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCreateInstance(template)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 transition-colors active:scale-[0.98]"
                    >
                      <Copy className="w-3.5 h-3.5" /> إنشاء نسخة
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="p-2 rounded-xl bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {deleteConfirm === template.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(template.id)} className="p-2 rounded-xl bg-red-500 text-white">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-2 rounded-xl bg-muted/50 text-muted-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(template.id)}
                        className="p-2 rounded-xl bg-muted/30 text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="ios-card p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" /> معلومات القوالب
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• القوالب تُعبّئ تلقائياً حقول النسخة الجديدة عند الإنشاء</p>
          <p>• يمكنك تعديل أي حقل بعد اختيار القالب</p>
          <p>• يتم تخزين القوالب في Firebase تحت <code className="bg-muted/50 px-1 rounded text-xs">devSettings/templates</code></p>
          <p>• الألوان الافتراضية تُطبق على الهوية البصرية للتطبيق</p>
        </div>
      </div>
    </div>
  );
}

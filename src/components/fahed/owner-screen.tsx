'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BarChart3, Users, Layers, FolderTree, Settings, ShieldCheck,
  Clock, Database, Plus, Trash2, ToggleLeft, ToggleRight, Save, Search,
  Upload, Download, Eye, EyeOff, Edit3, X, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, Crown, Server, Smartphone, Gamepad2, Wifi,
  CreditCard, DollarSign, Activity, FileText, Filter, Ban, UserCheck,
  UserX, ChevronLeft, ImagePlus, Package, Zap, Globe, Mail, Hash,
  Key, HardDrive, Cloud, Archive, Copy, Unlock
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { currencySymbols, formatNumber, generateReference, compressBase64Image } from '@/lib/utils';
import { ref, set, get, update, remove, push, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { LOGO_BASE64 } from '@/lib/logo';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type OwnerTab = 'overview' | 'sections' | 'subsections' | 'projectConfig' | 'adminMgmt' | 'activityLog' | 'backup';

interface OwnerSection {
  id: string;
  name: string;
  icon: string;
  isVisible: boolean;
  order: number;
  type: string;
}

interface OwnerSubSection {
  id: string;
  parentId: string;
  name: string;
  icon: string;
  isVisible: boolean;
  order: number;
}

interface ProjectConfig {
  firebaseApiKey: string;
  firebaseProjectId: string;
  firebaseDatabaseUrl: string;
  firebaseStorageBucket: string;
  firebaseAppId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  packageName: string;
  appName: string;
}

interface ActivityLogEntry {
  id: string;
  type: 'user' | 'admin' | 'system';
  action: string;
  userId?: string;
  userName?: string;
  timestamp: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isBlocked: boolean;
  createdAt?: string;
}

interface BackupEntry {
  id: string;
  timestamp: string;
  size: string;
  type: 'auto' | 'manual';
}

const defaultProjectConfig: ProjectConfig = {
  firebaseApiKey: '',
  firebaseProjectId: '',
  firebaseDatabaseUrl: '',
  firebaseStorageBucket: '',
  firebaseAppId: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  packageName: 'com.example.wallet',
  appName: '\u0645\u062D\u0641\u0638\u0629 \u0627\u0644\u062C\u0646\u0648\u0628',
};

// Sortable section item component
function SortableSectionItem({ section, isDark, onToggle, onDelete, onIconChange, onEditName }: {
  section: OwnerSection;
  isDark: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onIconChange: (id: string, icon: string) => void;
  onEditName: (id: string, name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const fileRef = useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)';
  const inputBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const textColor = isDark ? '#FFF' : '#1a1a1a';
  const subTextColor = isDark ? '#888' : '#AAA';

  const handleSaveName = () => {
    onEditName(section.id, editName);
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="rounded-2xl p-4" style={{ background: cardBg, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1" style={{ color: subTextColor }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="4" cy="4" r="1.5" /><circle cx="12" cy="4" r="1.5" />
              <circle cx="4" cy="8" r="1.5" /><circle cx="12" cy="8" r="1.5" />
              <circle cx="4" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" />
            </svg>
          </div>

          {/* Icon */}
          <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onloadend = () => onIconChange(section.id, reader.result as string);
            reader.readAsDataURL(file);
          }} />
          <button onClick={() => fileRef.current?.click()} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.12)' }}>
            {section.icon && section.icon.startsWith('data:') ? (
              <img src={section.icon} alt={section.name} className="w-7 h-7 rounded object-cover" />
            ) : (
              <Layers size={18} color="#8B5CF6" />
            )}
          </button>

          {/* Name + Order */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 px-2 py-1 rounded text-sm outline-none" style={{ background: inputBg, color: textColor }} />
                <button onClick={handleSaveName}><Save size={14} color="#8B5CF6" /></button>
                <button onClick={() => setEditing(false)}><X size={14} color="#E60000" /></button>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold truncate" style={{ color: textColor }}>{section.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>#{section.order}</span>
                  <span className="text-[10px]" style={{ color: section.isVisible ? '#10B981' : '#E60000' }}>{section.isVisible ? '\u0638\u0627\u0647\u0631' : '\u0645\u062E\u0641\u064A'}</span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)}><Edit3 size={14} color={subTextColor} /></button>
            <button onClick={() => onToggle(section.id)}>
              {section.isVisible ? <ToggleRight size={22} color="#10B981" /> : <ToggleLeft size={22} color={isDark ? '#444' : '#CCC'} />}
            </button>
            <button onClick={() => onDelete(section.id)}><Trash2 size={14} color="#E60000" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// SubSection item component (extracted to avoid hooks-in-callback issues)
function SubSectionItem({ sub, isDark, onToggle, onDelete, onIconChange, onEditName, inputStyle, cardStyle }: {
  sub: OwnerSubSection;
  isDark: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onIconChange: (id: string, icon: string) => void;
  onEditName: (id: string, name: string) => void;
  inputStyle: React.CSSProperties;
  cardStyle: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(sub.name);
  const subIconRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-2xl p-4" style={cardStyle}>
      <div className="flex items-center gap-3">
        <input type="file" ref={subIconRef} accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onloadend = () => onIconChange(sub.id, reader.result as string);
          reader.readAsDataURL(file);
        }} />
        <button onClick={() => subIconRef.current?.click()} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.12)' }}>
          {sub.icon && sub.icon.startsWith('data:') ? (
            <img src={sub.icon} alt={sub.name} className="w-7 h-7 rounded object-cover" />
          ) : (
            <FolderTree size={18} color="#8B5CF6" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 px-2 py-1 rounded text-sm outline-none" style={inputStyle} />
              <button onClick={() => { onEditName(sub.id, editName); setEditing(false); }}><Save size={14} color="#8B5CF6" /></button>
              <button onClick={() => setEditing(false)}><X size={14} color="#E60000" /></button>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold truncate" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{sub.name}</p>
              <span className="text-[10px]" style={{ color: sub.isVisible ? '#10B981' : '#E60000' }}>{sub.isVisible ? '\u0638\u0627\u0647\u0631' : '\u0645\u062E\u0641\u064A'}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)}><Edit3 size={14} color={isDark ? '#888' : '#AAA'} /></button>
          <button onClick={() => onToggle(sub.id)}>
            {sub.isVisible ? <ToggleRight size={22} color="#10B981" /> : <ToggleLeft size={22} color={isDark ? '#444' : '#CCC'} />}
          </button>
          <button onClick={() => onDelete(sub.id)}><Trash2 size={14} color="#E60000" /></button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { setActiveScreen, user } = useAppStore();

  const [activeTab, setActiveTab] = useState<OwnerTab>('overview');

  // Sections state
  const [sections, setSections] = useState<OwnerSection[]>([]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionType, setNewSectionType] = useState('telecom');
  const [newSectionIcon, setNewSectionIcon] = useState('');
  const sectionFileRef = useRef<HTMLInputElement>(null);

  // Subsections state
  const [subsections, setSubsections] = useState<OwnerSubSection[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [showAddSubsection, setShowAddSubsection] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubIcon, setNewSubIcon] = useState('');
  const subFileRef = useRef<HTMLInputElement>(null);

  // Project config state
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>(defaultProjectConfig);
  const [configSaved, setConfigSaved] = useState(false);

  // Admin management state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  // Activity log state
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'user' | 'admin' | 'system'>('all');

  // Backup state
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Overview stats
  const [overviewStats, setOverviewStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    activeProviders: 0,
    systemHealth: 98,
    revenueYER: 0,
    revenueSAR: 0,
    revenueUSD: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Card/input styles
  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)' as const,
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
  };

  const inputStyle = {
    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    color: isDark ? '#FFF' : '#1a1a1a',
  };

  // ===== Firebase Listeners =====

  // Listen to sections
  useEffect(() => {
    const sectionsRef = ref(database, 'ownerSettings/sections');
    const unsub = onValue(sectionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          name: val.name || '',
          icon: val.icon || '',
          isVisible: val.isVisible !== false,
          order: val.order || 0,
          type: val.type || 'telecom',
        }));
        setSections(list.sort((a, b) => a.order - b.order));
      } else {
        setSections([]);
      }
    });
    return () => unsub();
  }, []);

  // Listen to subsections
  useEffect(() => {
    const subRef = ref(database, 'ownerSettings/subsections');
    const unsub = onValue(subRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          parentId: val.parentId || '',
          name: val.name || '',
          icon: val.icon || '',
          isVisible: val.isVisible !== false,
          order: val.order || 0,
        }));
        setSubsections(list.sort((a, b) => a.order - b.order));
      } else {
        setSubsections([]);
      }
    });
    return () => unsub();
  }, []);

  // Listen to project config
  useEffect(() => {
    const configRef = ref(database, 'ownerSettings/projectConfig');
    const unsub = onValue(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setProjectConfig({ ...defaultProjectConfig, ...data });
      }
    });
    return () => unsub();
  }, []);

  // Listen to users for admin management
  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsub = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          name: val.name || '',
          email: val.email || '',
          phone: val.phone || '',
          role: val.role || 'user',
          isBlocked: val.isBlocked || false,
          createdAt: val.createdAt,
        }));
        setAllUsers(list);
        setAdminUsers(list.filter(u => u.role === 'admin' || u.role === 'owner'));
      }
    });
    return () => unsub();
  }, []);

  // Listen to activity log
  useEffect(() => {
    const logRef = ref(database, 'ownerSettings/activityLog');
    const unsub = onValue(logRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          type: val.type || 'system',
          action: val.action || '',
          userId: val.userId,
          userName: val.userName,
          timestamp: val.timestamp || new Date().toISOString(),
        }));
        setActivityLog(list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 100));
      } else {
        setActivityLog([]);
      }
    });
    return () => unsub();
  }, []);

  // Listen to backup history
  useEffect(() => {
    const backupRef = ref(database, 'ownerSettings/backups');
    const unsub = onValue(backupRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          timestamp: val.timestamp || '',
          size: val.size || '0 KB',
          type: val.type || 'manual',
        }));
        setBackups(list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } else {
        setBackups([]);
      }
    });
    return () => unsub();
  }, []);

  // Listen to overview stats
  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsub1 = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ordersList = Object.values(data) as any[];
        const completed = ordersList.filter((o: any) => o.status === 'completed');
        const revYER = completed.filter((o: any) => o.currency === 'YER').reduce((s: number, o: any) => s + (o.amount || 0), 0);
        const revSAR = completed.filter((o: any) => o.currency === 'SAR').reduce((s: number, o: any) => s + (o.amount || 0), 0);
        const revUSD = completed.filter((o: any) => o.currency === 'USD').reduce((s: number, o: any) => s + (o.amount || 0), 0);
        setOverviewStats(prev => ({
          ...prev,
          totalOrders: ordersList.length,
          pendingOrders: ordersList.filter((o: any) => o.status === 'pending').length,
          revenueYER: revYER,
          revenueSAR: revSAR,
          revenueUSD: revUSD,
          totalRevenue: revYER,
        }));
      }
    });

    const usersRef = ref(database, 'users');
    const unsub2 = onValue(usersRef, (snapshot) => {
      setOverviewStats(prev => ({ ...prev, totalUsers: snapshot.exists() ? Object.keys(snapshot.val()).length : 0 }));
    });

    const providersRef = ref(database, 'providers');
    const unsub3 = onValue(providersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const active = Object.values(data).filter((p: any) => p.isActive).length;
        setOverviewStats(prev => ({ ...prev, activeProviders: active }));
      }
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  // ===== Section Handlers =====

  const handleAddSection = async () => {
    if (!newSectionName) return;
    const id = newSectionName.replace(/\s/g, '-').toLowerCase() + '-' + Date.now();
    const section: OwnerSection = {
      id, name: newSectionName, icon: newSectionIcon,
      isVisible: true, order: sections.length, type: newSectionType,
    };
    try {
      await set(ref(database, `ownerSettings/sections/${id}`), section);
      setNewSectionName('');
      setNewSectionIcon('');
      setNewSectionType('telecom');
      setShowAddSection(false);
    } catch {}
  };

  const handleToggleSection = async (id: string) => {
    const section = sections.find(s => s.id === id);
    if (section) {
      try { await update(ref(database, `ownerSettings/sections/${id}`), { isVisible: !section.isVisible }); } catch {}
    }
  };

  const handleDeleteSection = async (id: string) => {
    try { await remove(ref(database, `ownerSettings/sections/${id}`)); } catch {}
  };

  const handleSectionIconChange = async (id: string, icon: string) => {
    try {
      const compressed = await compressBase64Image(icon);
      await update(ref(database, `ownerSettings/sections/${id}`), { icon: compressed });
    } catch {}
  };

  const handleSectionNameChange = async (id: string, name: string) => {
    try { await update(ref(database, `ownerSettings/sections/${id}`), { name }); } catch {}
  };

  const handleDragEndSections = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);
    setSections(reordered);
    try {
      for (let i = 0; i < reordered.length; i++) {
        await update(ref(database, `ownerSettings/sections/${reordered[i].id}`), { order: i });
      }
    } catch {}
  };

  // ===== Subsection Handlers =====

  const handleAddSubsection = async () => {
    if (!newSubName || !selectedParentId) return;
    const id = 'sub-' + Date.now();
    const parentSubs = subsections.filter(s => s.parentId === selectedParentId);
    const sub: OwnerSubSection = {
      id, parentId: selectedParentId, name: newSubName, icon: newSubIcon,
      isVisible: true, order: parentSubs.length,
    };
    try {
      await set(ref(database, `ownerSettings/subsections/${id}`), sub);
      setNewSubName('');
      setNewSubIcon('');
      setShowAddSubsection(false);
    } catch {}
  };

  const handleToggleSubsection = async (id: string) => {
    const sub = subsections.find(s => s.id === id);
    if (sub) {
      try { await update(ref(database, `ownerSettings/subsections/${id}`), { isVisible: !sub.isVisible }); } catch {}
    }
  };

  const handleDeleteSubsection = async (id: string) => {
    try { await remove(ref(database, `ownerSettings/subsections/${id}`)); } catch {}
  };

  const handleSubIconChange = async (id: string, icon: string) => {
    try {
      const compressed = await compressBase64Image(icon);
      await update(ref(database, `ownerSettings/subsections/${id}`), { icon: compressed });
    } catch {}
  };

  const handleSubNameChange = async (id: string, name: string) => {
    try { await update(ref(database, `ownerSettings/subsections/${id}`), { name }); } catch {}
  };

  // ===== Project Config Handlers =====

  const handleSaveConfig = async () => {
    try {
      await set(ref(database, 'ownerSettings/projectConfig'), projectConfig);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
      // Log activity
      const logId = generateReference();
      await set(ref(database, `ownerSettings/activityLog/${logId}`), {
        id: logId, type: 'admin', action: '\u062A\u0645 \u062D\u0641\u0638 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0634\u0631\u0648\u0639',
        userId: user?.id, userName: user?.name, timestamp: new Date().toISOString(),
      });
    } catch {}
  };

  // ===== Admin Management Handlers =====

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      await update(ref(database, `users/${userId}`), { role: 'admin' });
      const logId = generateReference();
      await set(ref(database, `ownerSettings/activityLog/${logId}`), {
        id: logId, type: 'admin', action: `\u062A\u0645 \u062A\u0631\u0642\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0625\u0644\u0649 \u0623\u062F\u0645\u0646`,
        userId: user?.id, userName: user?.name, timestamp: new Date().toISOString(),
      });
    } catch {}
  };

  const handleDemoteAdmin = async (userId: string) => {
    try {
      await update(ref(database, `users/${userId}`), { role: 'user' });
      const logId = generateReference();
      await set(ref(database, `ownerSettings/activityLog/${logId}`), {
        id: logId, type: 'admin', action: `\u062A\u0645 \u062A\u062E\u0641\u064A\u0636 \u0627\u0644\u0623\u062F\u0645\u0646 \u0625\u0644\u0649 \u0645\u0633\u062A\u062E\u062F\u0645`,
        userId: user?.id, userName: user?.name, timestamp: new Date().toISOString(),
      });
    } catch {}
  };

  const handleToggleBlockAdmin = async (adminUser: AdminUser) => {
    try {
      await update(ref(database, `users/${adminUser.id}`), { isBlocked: !adminUser.isBlocked });
      const logId = generateReference();
      await set(ref(database, `ownerSettings/activityLog/${logId}`), {
        id: logId, type: 'admin', action: `${adminUser.isBlocked ? '\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062D\u0638\u0631' : '\u062A\u0645 \u0627\u0644\u062D\u0638\u0631'} \u0639\u0644\u0649 \u0627\u0644\u0623\u062F\u0645\u0646 ${adminUser.name}`,
        userId: user?.id, userName: user?.name, timestamp: new Date().toISOString(),
      });
    } catch {}
  };

  const handleAddAdminByEmail = async () => {
    if (!newAdminEmail) return;
    const matchedUser = allUsers.find(u => u.email?.toLowerCase() === newAdminEmail.toLowerCase());
    if (matchedUser) {
      await handlePromoteToAdmin(matchedUser.id);
      setNewAdminEmail('');
    }
  };

  // ===== Backup Handlers =====

  const handleExportBackup = async () => {
    setExportLoading(true);
    try {
      const snapshot = await get(ref(database, '/'));
      const data = snapshot.exists() ? snapshot.val() : {};
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log backup
      const backupId = generateReference();
      await set(ref(database, `ownerSettings/backups/${backupId}`), {
        id: backupId, timestamp: new Date().toISOString(),
        size: `${(jsonStr.length / 1024).toFixed(1)} KB`, type: 'manual',
      });
      const logId = generateReference();
      await set(ref(database, `ownerSettings/activityLog/${logId}`), {
        id: logId, type: 'system', action: '\u062A\u0645 \u062A\u0635\u062F\u064A\u0631 \u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629',
        userId: user?.id, userName: user?.name, timestamp: new Date().toISOString(),
      });
    } catch {}
    setExportLoading(false);
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Write each top-level key to Firebase
      for (const key of Object.keys(data)) {
        await set(ref(database, `/${key}`), data[key]);
      }

      const logId = generateReference();
      await set(ref(database, `ownerSettings/activityLog/${logId}`), {
        id: logId, type: 'system', action: '\u062A\u0645 \u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629',
        userId: user?.id, userName: user?.name, timestamp: new Date().toISOString(),
      });

      const backupId = generateReference();
      await set(ref(database, `ownerSettings/backups/${backupId}`), {
        id: backupId, timestamp: new Date().toISOString(),
        size: `${(file.size / 1024).toFixed(1)} KB`, type: 'manual',
      });
    } catch {}
    setImportLoading(false);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  // ===== Tabs Definition =====

  const tabs: { id: OwnerTab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: '\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629', icon: BarChart3 },
    { id: 'sections', label: '\u0627\u0644\u0623\u0642\u0633\u0627\u0645', icon: Layers },
    { id: 'subsections', label: '\u0641\u0631\u0639\u064A\u0629', icon: FolderTree },
    { id: 'projectConfig', label: '\u0627\u0644\u0645\u0634\u0631\u0648\u0639', icon: Settings },
    { id: 'adminMgmt', label: '\u0627\u0644\u0623\u062F\u0645\u0646', icon: ShieldCheck },
    { id: 'activityLog', label: '\u0627\u0644\u0646\u0634\u0627\u0637', icon: Clock },
    { id: 'backup', label: '\u0627\u0644\u0646\u0633\u062E', icon: Database },
  ];

  const activeTabInfo = tabs.find(t => t.id === activeTab);

  const filteredActivity = activityLog.filter(entry => {
    if (activityFilter !== 'all' && entry.type !== activityFilter) return false;
    return true;
  });

  const filteredAdminUsers = allUsers.filter(u => {
    if (!adminSearch) return u.role === 'admin' || u.role === 'owner';
    const q = adminSearch.toLowerCase();
    return (u.role === 'admin' || u.role === 'owner') && (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: isDark ? '#0F0F0F' : '#F5F5F5', direction: 'rtl' }}>
      {/* Header */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(145deg, #1A0A2E 0%, #2D1B4E 50%, #0F0F0F 100%)' }}>
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(139,92,246,0.3) 0%, transparent 60%)' }} />
        <div className="relative px-4 pt-4 pb-4">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveScreen('account')} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <ArrowLeft size={18} strokeWidth={1.5} color="#FFF" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-white text-lg font-bold">{'\u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0627\u0644\u0643'}</h1>
              <p className="text-white/40 text-[10px]">{'\u0627\u0644\u062A\u062D\u0643\u0645 \u0627\u0644\u0643\u0627\u0645\u0644'} - {activeTabInfo?.label}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.2)', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
              <Crown size={20} strokeWidth={1.5} color="#8B5CF6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main layout: content + right sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-8 px-4 pt-3" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <AnimatePresence mode="wait">

            {/* === OVERVIEW === */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646', value: overviewStats.totalUsers, icon: Users, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
                    { label: '\u0627\u0644\u0625\u064A\u0631\u0627\u062F\u0627\u062A (\u0631.\u064A)', value: overviewStats.revenueYER, icon: DollarSign, color: '#E60000', bg: 'rgba(230,0,0,0.12)' },
                    { label: '\u0627\u0644\u0645\u0632\u0648\u062F\u0648\u0646 \u0627\u0644\u0646\u0634\u0637\u0648\u0646', value: overviewStats.activeProviders, icon: Server, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                    { label: '\u0635\u062D\u0629 \u0627\u0644\u0646\u0638\u0627\u0645', value: overviewStats.systemHealth, icon: Activity, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                        className="rounded-2xl p-4" style={cardStyle}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                            <Icon size={20} strokeWidth={1.5} color={stat.color} />
                          </div>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{stat.label.includes('\u0635\u062D\u0629') ? `${stat.value}%` : formatNumber(stat.value)}</p>
                        <p className="text-xs mt-0.5" style={{ color: isDark ? '#777' : '#999' }}>{stat.label}</p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Revenue Breakdown */}
                <div className="rounded-2xl p-4" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={16} color="#8B5CF6" />
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{'\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0625\u064A\u0631\u0627\u062F\u0627\u062A'}</h3>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: '\u0631\u064A\u0627\u0644 \u064A\u0645\u0646\u064A', value: overviewStats.revenueYER, color: '#E60000' },
                      { label: '\u0631\u064A\u0627\u0644 \u0633\u0639\u0648\u062F\u064A', value: overviewStats.revenueSAR, color: '#10B981' },
                      { label: '\u062F\u0648\u0644\u0627\u0631 \u0623\u0645\u0631\u064A\u0643\u064A', value: overviewStats.revenueUSD, color: '#3B82F6' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                          <span className="text-xs" style={{ color: isDark ? '#AAA' : '#666' }}>{item.label}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{formatNumber(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Health */}
                <div className="rounded-2xl p-4" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={16} color="#8B5CF6" />
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{'\u062D\u0627\u0644\u0629 \u0627\u0644\u0646\u0638\u0627\u0645'}</h3>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Firebase', status: true },
                      { label: '\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A', status: true },
                      { label: '\u0627\u0644\u062A\u062E\u0632\u064A\u0646', status: true },
                      { label: '\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A', status: true },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                        <span className="text-xs" style={{ color: isDark ? '#AAA' : '#666' }}>{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: item.status ? '#10B981' : '#E60000' }} />
                          <span className="text-[10px] font-medium" style={{ color: item.status ? '#10B981' : '#E60000' }}>{item.status ? '\u0639\u0645\u0644' : '\u0645\u0639\u0637\u0644'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="rounded-2xl p-4" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={16} color="#8B5CF6" />
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{'\u0645\u0644\u062E\u0635 \u0627\u0644\u0637\u0644\u0628\u0627\u062A'}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl text-center" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                      <p className="text-xl font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{overviewStats.totalOrders}</p>
                      <p className="text-[10px]" style={{ color: isDark ? '#777' : '#999' }}>{'\u0625\u062C\u0645\u0627\u0644\u064A'}</p>
                    </div>
                    <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(245,158,11,0.08)' }}>
                      <p className="text-xl font-bold" style={{ color: '#F59E0B' }}>{overviewStats.pendingOrders}</p>
                      <p className="text-[10px]" style={{ color: '#F59E0B' }}>{'\u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* === SECTIONS MANAGEMENT === */}
            {activeTab === 'sections' && (
              <motion.div key="sections" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddSection(!showAddSection)}
                  className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium"
                  style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(20px)' }}>
                  <Plus size={18} strokeWidth={1.5} /><span>{'\u0625\u0636\u0627\u0641\u0629 \u0642\u0633\u0645 \u062C\u062F\u064A\u062F'}</span>
                </motion.button>

                <AnimatePresence>
                  {showAddSection && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="rounded-2xl p-4 space-y-3 overflow-hidden" style={cardStyle}>
                      <input type="text" placeholder={'\u0627\u0633\u0645 \u0627\u0644\u0642\u0633\u0645'} value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                      <select value={newSectionType} onChange={(e) => setNewSectionType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                        <option value="telecom">{'\u0627\u062A\u0635\u0627\u0644\u0627\u062A'}</option>
                        <option value="internet">{'\u0625\u0646\u062A\u0631\u0646\u062A'}</option>
                        <option value="entertainment">{'\u062A\u0631\u0641\u064A\u0647'}</option>
                        <option value="cards">{'\u0628\u0637\u0627\u0642\u0627\u062A'}</option>
                        <option value="electricity">{'\u0643\u0647\u0631\u0628\u0627\u0621'}</option>
                        <option value="government">{'\u062D\u0643\u0648\u0645\u064A\u0629'}</option>
                      </select>
                      <div>
                        <input type="file" ref={sectionFileRef} accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => setNewSectionIcon(reader.result as string);
                          reader.readAsDataURL(file);
                        }} className="hidden" />
                        <div className="flex items-center gap-3">
                          <button onClick={() => sectionFileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ ...inputStyle, color: isDark ? '#AAA' : '#888' }}>
                            <ImagePlus size={14} /><span>{'\u0631\u0641\u0639 \u0623\u064A\u0642\u0648\u0646\u0629'}</span>
                          </button>
                          {newSectionIcon && <img src={newSectionIcon} alt="icon" className="w-8 h-8 rounded-lg object-cover" />}
                        </div>
                      </div>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddSection} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#8B5CF6' }}>{'\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0642\u0633\u0645'}</motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSections}>
                  <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {sections.map((section) => (
                        <SortableSectionItem
                          key={section.id}
                          section={section}
                          isDark={isDark}
                          onToggle={handleToggleSection}
                          onDelete={handleDeleteSection}
                          onIconChange={handleSectionIconChange}
                          onEditName={handleSectionNameChange}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {sections.length === 0 && (
                  <div className="flex flex-col items-center py-8">
                    <Layers size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                    <p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>{'\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u0642\u0633\u0627\u0645'}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* === SUBSECTIONS MANAGEMENT === */}
            {activeTab === 'subsections' && (
              <motion.div key="subsections" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {/* Parent selector */}
                <div className="rounded-2xl p-4" style={cardStyle}>
                  <label className="text-xs font-medium mb-2 block" style={{ color: isDark ? '#AAA' : '#666' }}>{'\u0627\u062E\u062A\u0631 \u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u0623\u0628'}</label>
                  <select value={selectedParentId} onChange={(e) => setSelectedParentId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                    <option value="">{'-- \u0627\u062E\u062A\u0631 --'}</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {selectedParentId && (
                  <>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddSubsection(!showAddSubsection)}
                      className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium"
                      style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(20px)' }}>
                      <Plus size={18} strokeWidth={1.5} /><span>{'\u0625\u0636\u0627\u0641\u0629 \u0642\u0633\u0645 \u0641\u0631\u0639\u064A'}</span>
                    </motion.button>

                    <AnimatePresence>
                      {showAddSubsection && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="rounded-2xl p-4 space-y-3 overflow-hidden" style={cardStyle}>
                          <input type="text" placeholder={'\u0627\u0633\u0645 \u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u0641\u0631\u0639\u064A'} value={newSubName} onChange={(e) => setNewSubName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                          <div>
                            <input type="file" ref={subFileRef} accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onloadend = () => setNewSubIcon(reader.result as string);
                              reader.readAsDataURL(file);
                            }} className="hidden" />
                            <div className="flex items-center gap-3">
                              <button onClick={() => subFileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ ...inputStyle, color: isDark ? '#AAA' : '#888' }}>
                                <ImagePlus size={14} /><span>{'\u0631\u0641\u0639 \u0623\u064A\u0642\u0648\u0646\u0629'}</span>
                              </button>
                              {newSubIcon && <img src={newSubIcon} alt="icon" className="w-8 h-8 rounded-lg object-cover" />}
                            </div>
                          </div>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddSubsection} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#8B5CF6' }}>{'\u0625\u0636\u0627\u0641\u0629'}</motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* List subsections for selected parent */}
                    {subsections.filter(s => s.parentId === selectedParentId).map((sub) => (
                      <SubSectionItem
                        key={sub.id}
                        sub={sub}
                        isDark={isDark}
                        onToggle={handleToggleSubsection}
                        onDelete={handleDeleteSubsection}
                        onIconChange={handleSubIconChange}
                        onEditName={handleSubNameChange}
                        inputStyle={inputStyle}
                        cardStyle={cardStyle}
                      />
                    ))}

                    {subsections.filter(s => s.parentId === selectedParentId).length === 0 && (
                      <div className="flex flex-col items-center py-8">
                        <FolderTree size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                        <p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>{'\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u0642\u0633\u0627\u0645 \u0641\u0631\u0639\u064A\u0629'}</p>
                      </div>
                    )}
                  </>
                )}

                {!selectedParentId && (
                  <div className="flex flex-col items-center py-8">
                    <FolderTree size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                    <p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>{'\u0627\u062E\u062A\u0631 \u0642\u0633\u0645 \u0623\u0628 \u0644\u0639\u0631\u0636 \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u0641\u0631\u0639\u064A\u0629'}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* === PROJECT CONFIG === */}
            {activeTab === 'projectConfig' && (
              <motion.div key="projectConfig" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {/* Firebase Config */}
                <div className="rounded-2xl p-4 space-y-3" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-1">
                    <Cloud size={16} color="#8B5CF6" />
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{'\u0625\u0639\u062F\u0627\u062F\u0627\u062A Firebase'}</h3>
                  </div>
                  {[
                    { key: 'firebaseApiKey' as const, label: 'API Key', icon: Key },
                    { key: 'firebaseProjectId' as const, label: 'Project ID', icon: Hash },
                    { key: 'firebaseDatabaseUrl' as const, label: 'Database URL', icon: Globe },
                    { key: 'firebaseStorageBucket' as const, label: 'Storage Bucket', icon: HardDrive },
                    { key: 'firebaseAppId' as const, label: 'App ID', icon: Smartphone },
                  ].map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.key} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.1)' }}>
                          <Icon size={14} color="#8B5CF6" />
                        </div>
                        <input type="text" placeholder={field.label} value={projectConfig[field.key]} onChange={(e) => setProjectConfig({ ...projectConfig, [field.key]: e.target.value })} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} dir="ltr" />
                      </div>
                    );
                  })}
                </div>

                {/* Supabase Config */}
                <div className="rounded-2xl p-4 space-y-3" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-1">
                    <Database size={16} color="#10B981" />
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{'\u0625\u0639\u062F\u0627\u062F\u0627\u062A Supabase (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)'}</h3>
                  </div>
                  {[
                    { key: 'supabaseUrl' as const, label: 'Supabase URL', icon: Globe },
                    { key: 'supabaseAnonKey' as const, label: 'Anon Key', icon: Key },
                  ].map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.key} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.1)' }}>
                          <Icon size={14} color="#10B981" />
                        </div>
                        <input type="text" placeholder={field.label} value={projectConfig[field.key]} onChange={(e) => setProjectConfig({ ...projectConfig, [field.key]: e.target.value })} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} dir="ltr" />
                      </div>
                    );
                  })}
                </div>

                {/* App Config */}
                <div className="rounded-2xl p-4 space-y-3" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-1">
                    <Package size={16} color="#8B5CF6" />
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{'\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642'}</h3>
                  </div>
                  {[
                    { key: 'packageName' as const, label: '\u0627\u0633\u0645 \u0627\u0644\u062D\u0632\u0645\u0629 (Package Name)', icon: Archive },
                    { key: 'appName' as const, label: '\u0627\u0633\u0645 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 (App Name)', icon: CreditCard },
                  ].map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.key} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.1)' }}>
                          <Icon size={14} color="#8B5CF6" />
                        </div>
                        <input type="text" placeholder={field.label} value={projectConfig[field.key]} onChange={(e) => setProjectConfig({ ...projectConfig, [field.key]: e.target.value })} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                      </div>
                    );
                  })}
                </div>

                {/* Save Button */}
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleSaveConfig}
                  className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white"
                  style={{ background: configSaved ? '#10B981' : '#8B5CF6' }}>
                  {configSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                  <span>{configSaved ? '\u062A\u0645 \u0627\u0644\u062D\u0641\u0638' : '\u062D\u0641\u0638 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A'}</span>
                </motion.button>
              </motion.div>
            )}

            {/* === ADMIN MANAGEMENT === */}
            {activeTab === 'adminMgmt' && (
              <motion.div key="adminMgmt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {/* Add admin by email */}
                <div className="rounded-2xl p-4 space-y-3" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck size={16} color="#8B5CF6" />
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{'\u0625\u0636\u0627\u0641\u0629 \u0623\u062F\u0645\u0646 \u0628\u0627\u0644\u0628\u0631\u064A\u062F'}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="email" placeholder={'\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A'} value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} dir="ltr" />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddAdminByEmail} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#8B5CF6' }}>
                      <Plus size={16} />
                    </motion.button>
                  </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={cardStyle}>
                  <Search size={16} color={isDark ? '#555' : '#AAA'} />
                  <input type="text" placeholder={'\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0623\u062F\u0645\u0646...'} value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" style={{ color: isDark ? '#FFF' : '#1a1a1a' }} />
                </div>

                {/* Admin List */}
                {filteredAdminUsers.map((adminUser) => (
                  <div key={adminUser.id} className="rounded-2xl p-4" style={cardStyle}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: adminUser.role === 'owner' ? 'rgba(139,92,246,0.15)' : 'rgba(230,0,0,0.1)' }}>
                        {adminUser.role === 'owner' ? <Crown size={18} color="#8B5CF6" /> : <ShieldCheck size={18} color="#E60000" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{adminUser.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: adminUser.role === 'owner' ? 'rgba(139,92,246,0.15)' : 'rgba(230,0,0,0.1)', color: adminUser.role === 'owner' ? '#8B5CF6' : '#E60000' }}>
                            {adminUser.role === 'owner' ? '\u0645\u0627\u0644\u0643' : '\u0623\u062F\u0645\u0646'}
                          </span>
                          {adminUser.isBlocked && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(230,0,0,0.15)', color: '#E60000' }}>{'\u0645\u062D\u0638\u0648\u0631'}</span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: isDark ? '#666' : '#AAA' }} dir="ltr">{adminUser.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {adminUser.role === 'admin' && (
                          <button onClick={() => handleDemoteAdmin(adminUser.id)} title={'\u062A\u062E\u0641\u064A\u0636 \u0625\u0644\u0649 \u0645\u0633\u062A\u062E\u062F\u0645'}>
                            <UserX size={16} color="#F59E0B" />
                          </button>
                        )}
                        {adminUser.role !== 'owner' && (
                          <button onClick={() => handleToggleBlockAdmin(adminUser)}>
                            {adminUser.isBlocked ? <Unlock size={16} color="#10B981" /> : <Ban size={16} color="#E60000" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Promote regular users */}
                <div className="rounded-2xl p-4" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck size={16} color="#8B5CF6" />
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{'\u062A\u0631\u0642\u064A\u0629 \u0645\u0633\u062A\u062E\u062F\u0645'}</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin' }}>
                    {allUsers.filter(u => u.role === 'user').slice(0, 20).map((u) => (
                      <div key={u.id} className="flex items-center justify-between py-2 px-2 rounded-xl hover:opacity-80" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                        <div>
                          <p className="text-xs font-medium" style={{ color: isDark ? '#DDD' : '#444' }}>{u.name}</p>
                          <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }} dir="ltr">{u.email}</p>
                        </div>
                        <button onClick={() => handlePromoteToAdmin(u.id)} className="px-2 py-1 rounded-lg text-[10px] font-medium" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                          {'\u062A\u0631\u0642\u064A\u0629'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* === ACTIVITY LOG === */}
            {activeTab === 'activityLog' && (
              <motion.div key="activityLog" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {/* Filter */}
                <div className="flex gap-2">
                  {[
                    { id: 'all' as const, label: '\u0627\u0644\u0643\u0644' },
                    { id: 'user' as const, label: '\u0645\u0633\u062A\u062E\u062F\u0645' },
                    { id: 'admin' as const, label: '\u0623\u062F\u0645\u0646' },
                    { id: 'system' as const, label: '\u0646\u0638\u0627\u0645' },
                  ].map((filter) => (
                    <button key={filter.id} onClick={() => setActivityFilter(filter.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-medium"
                      style={{
                        background: activityFilter === filter.id ? 'rgba(139,92,246,0.15)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                        color: activityFilter === filter.id ? '#8B5CF6' : (isDark ? '#888' : '#AAA'),
                        border: activityFilter === filter.id ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                      }}>
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Log entries */}
                {filteredActivity.map((entry) => (
                  <div key={entry.id} className="rounded-2xl p-4" style={cardStyle}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{
                        background: entry.type === 'user' ? 'rgba(59,130,246,0.12)' : entry.type === 'admin' ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.12)'
                      }}>
                        {entry.type === 'user' ? <Users size={14} color="#3B82F6" /> : entry.type === 'admin' ? <ShieldCheck size={14} color="#8B5CF6" /> : <Server size={14} color="#10B981" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm" style={{ color: isDark ? '#DDD' : '#444' }}>{entry.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                            background: entry.type === 'user' ? 'rgba(59,130,246,0.12)' : entry.type === 'admin' ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.12)',
                            color: entry.type === 'user' ? '#3B82F6' : entry.type === 'admin' ? '#8B5CF6' : '#10B981'
                          }}>
                            {entry.type === 'user' ? '\u0645\u0633\u062A\u062E\u062F\u0645' : entry.type === 'admin' ? '\u0623\u062F\u0645\u0646' : '\u0646\u0638\u0627\u0645'}
                          </span>
                          {entry.userName && <span className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{entry.userName}</span>}
                          <span className="text-[10px]" style={{ color: isDark ? '#555' : '#BBB' }}>{new Date(entry.timestamp).toLocaleString('ar-SA')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredActivity.length === 0 && (
                  <div className="flex flex-col items-center py-8">
                    <Clock size={40} strokeWidth={1.5} color={isDark ? '#333' : '#DDD'} />
                    <p className="text-sm mt-2" style={{ color: isDark ? '#666' : '#AAA' }}>{'\u0644\u0627 \u062A\u0648\u062C\u062F \u0633\u062C\u0644\u0627\u062A'}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* === BACKUP === */}
            {activeTab === 'backup' && (
              <motion.div key="backup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {/* Export */}
                <div className="rounded-2xl p-4" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-3">
                    <Download size={16} color="#8B5CF6" />
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{'\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A'}</h3>
                  </div>
                  <p className="text-xs mb-3" style={{ color: isDark ? '#888' : '#AAA' }}>{'\u062A\u0635\u062F\u064A\u0631 \u062C\u0645\u064A\u0639 \u0628\u064A\u0627\u0646\u0627\u062A Firebase \u0643\u0645\u0644\u0641 JSON'}</p>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleExportBackup} disabled={exportLoading}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: exportLoading ? '#666' : '#8B5CF6' }}>
                    {exportLoading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                    <span>{exportLoading ? '\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u0635\u062F\u064A\u0631...' : '\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629'}</span>
                  </motion.button>
                </div>

                {/* Import */}
                <div className="rounded-2xl p-4" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-3">
                    <Upload size={16} color="#10B981" />
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{'\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A'}</h3>
                  </div>
                  <p className="text-xs mb-3" style={{ color: isDark ? '#888' : '#AAA' }}>{'\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u0645\u0646 \u0645\u0644\u0641 JSON'}</p>
                  <input type="file" ref={importFileRef} accept=".json" onChange={handleImportBackup} className="hidden" />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => importFileRef.current?.click()} disabled={importLoading}
                    className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                    {importLoading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                    <span>{importLoading ? '\u062C\u0627\u0631\u064A \u0627\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F...' : '\u0627\u062E\u062A\u0631 \u0645\u0644\u0641 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629'}</span>
                  </motion.button>
                </div>

                {/* Warning */}
                <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} color="#F59E0B" className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>{'\u062A\u062D\u0630\u064A\u0631'}</p>
                      <p className="text-[10px] mt-1" style={{ color: isDark ? '#AAA' : '#888' }}>{'\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u0633\u064A\u0633\u062A\u0628\u062F\u0644 \u062C\u0645\u064A\u0639 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629. \u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u0642\u0628\u0644 \u0627\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F.'}</p>
                    </div>
                  </div>
                </div>

                {/* Previous Backups */}
                <div className="rounded-2xl p-4" style={cardStyle}>
                  <div className="flex items-center gap-2 mb-3">
                    <Archive size={16} color="#8B5CF6" />
                    <h3 className="text-sm font-bold" style={{ color: isDark ? '#FFF' : '#1a1a1a' }}>{'\u0633\u062C\u0644 \u0627\u0644\u0646\u0633\u062E \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A'}</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin' }}>
                    {backups.map((backup) => (
                      <div key={backup.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                        <div className="flex items-center gap-2">
                          <Database size={12} color="#8B5CF6" />
                          <div>
                            <p className="text-xs font-medium" style={{ color: isDark ? '#DDD' : '#444' }}>{new Date(backup.timestamp).toLocaleString('ar-SA')}</p>
                            <p className="text-[10px]" style={{ color: isDark ? '#666' : '#AAA' }}>{backup.size}</p>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                          background: backup.type === 'auto' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)',
                          color: backup.type === 'auto' ? '#3B82F6' : '#8B5CF6'
                        }}>
                          {backup.type === 'auto' ? '\u062A\u0644\u0642\u0627\u0626\u064A' : '\u064A\u062F\u0648\u064A'}
                        </span>
                      </div>
                    ))}
                    {backups.length === 0 && (
                      <p className="text-xs text-center py-4" style={{ color: isDark ? '#666' : '#AAA' }}>{'\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u0633\u062E \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629'}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar Navigation */}
        <div className="flex-shrink-0 w-[70px] border-l flex flex-col" style={{
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          borderLeft: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          maxHeight: 'calc(100vh - 80px)',
        }}>
          <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full flex flex-col items-center justify-center py-2.5 px-1 relative transition-all"
                  style={{
                    background: isActive ? 'rgba(139,92,246,0.15)' : 'transparent',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="owner-sidebar-active"
                      className="absolute right-0 top-1 bottom-1 w-[3px] rounded-l-full"
                      style={{ background: '#8B5CF6' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon size={20} strokeWidth={1.5} color={isActive ? '#8B5CF6' : isDark ? '#666' : '#AAA'} />
                  <span className="text-[8px] mt-1 leading-tight text-center font-medium" style={{ color: isActive ? '#8B5CF6' : isDark ? '#666' : '#AAA' }}>
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDevStore, AppInstance } from '@/lib/store';
import { database } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { motion } from 'framer-motion';
import {
  Activity, Search, ExternalLink, CheckCircle,
  XCircle, Clock, Loader2, Zap, RefreshCw,
  RotateCcw, StopCircle, Play, Timer
} from 'lucide-react';
import {
  cn, buildStatusLabels, buildStatusColors, formatDateAr,
  timeAgo, formatDuration, buildPriorityLabels, buildPriorityColors
} from '@/lib/utils';

interface BuildActivity {
  id: string;
  instanceId: string;
  instanceName: string;
  appType: 'المستخدم' | 'الإدارة';
  buildStatus: AppInstance['userAppBuildStatus'];
  buildLog: string;
  buildAt: string;
  apkUrl: string;
  primaryColor: string;
  githubRunId: string;
  buildPriority: string;
  instance: AppInstance;
}

export default function BuildActivityPanel() {
  const { instances, devSettings, setInstances, addNotification } = useDevStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [polling, setPolling] = useState(false);
  const [autoPolling, setAutoPolling] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const buildActivities: BuildActivity[] = instances
    .filter(i => i.userAppBuildStatus !== 'none' || i.adminAppBuildStatus !== 'none')
    .flatMap(i => {
      const activities: BuildActivity[] = [];
      if (i.userAppBuildStatus !== 'none') {
        activities.push({
          id: `${i.id}-user`,
          instanceId: i.id,
          instanceName: i.appName || 'بدون اسم',
          appType: 'المستخدم',
          buildStatus: i.userAppBuildStatus,
          buildLog: i.userAppBuildLog,
          buildAt: i.userAppBuildAt,
          apkUrl: i.userAppApkUrl,
          primaryColor: i.primaryColor,
          githubRunId: i.githubRunId,
          buildPriority: i.buildPriority || 'normal',
          instance: i,
        });
      }
      if (i.adminAppBuildStatus !== 'none') {
        activities.push({
          id: `${i.id}-admin`,
          instanceId: i.id,
          instanceName: i.appName || 'بدون اسم',
          appType: 'الإدارة',
          buildStatus: i.adminAppBuildStatus,
          buildLog: i.adminAppBuildLog,
          buildAt: i.adminAppBuildAt,
          apkUrl: i.adminAppApkUrl,
          primaryColor: i.primaryColor,
          githubRunId: i.githubRunId,
          buildPriority: i.buildPriority || 'normal',
          instance: i,
        });
      }
      return activities;
    })
    .sort((a, b) => {
      // Priority ordering: urgent > high > normal
      const priorityOrder = { urgent: 0, high: 1, normal: 2 };
      const aPriority = priorityOrder[a.buildPriority as keyof typeof priorityOrder] ?? 2;
      const bPriority = priorityOrder[b.buildPriority as keyof typeof priorityOrder] ?? 2;

      // Building first, then queued, then by priority, then by date
      if (a.buildStatus === 'building' && b.buildStatus !== 'building') return -1;
      if (b.buildStatus === 'building' && a.buildStatus !== 'building') return 1;
      if (a.buildStatus === 'queued' && b.buildStatus !== 'queued') return -1;
      if (b.buildStatus === 'queued' && a.buildStatus !== 'queued') return 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.buildAt || 0).getTime() - new Date(a.buildAt || 0).getTime();
    });

  const filteredActivities = buildActivities.filter(a =>
    !searchQuery || a.instanceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const buildingCount = buildActivities.filter(a => a.buildStatus === 'building').length;
  const queuedCount = buildActivities.filter(a => a.buildStatus === 'queued').length;
  const successCount = buildActivities.filter(a => a.buildStatus === 'success').length;
  const failedCount = buildActivities.filter(a => a.buildStatus === 'failed').length;

  const hasActiveBuilds = buildingCount > 0 || queuedCount > 0;

  const handlePollStatus = useCallback(async () => {
    if (!devSettings.githubToken || !devSettings.githubOwner || !devSettings.githubRepo) return;

    setPolling(true);
    try {
      for (const instance of instances) {
        if (instance.githubRunId && (instance.userAppBuildStatus === 'queued' || instance.userAppBuildStatus === 'building' || instance.adminAppBuildStatus === 'queued' || instance.adminAppBuildStatus === 'building')) {
          const response = await fetch(
            `https://api.github.com/repos/${devSettings.githubOwner}/${devSettings.githubRepo}/actions/runs/${instance.githubRunId}`,
            {
              headers: {
                'Authorization': `Bearer ${devSettings.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const isCompleted = data.status === 'completed';
            const isSuccess = data.conclusion === 'success';
            const isFailed = data.conclusion === 'failure';

            if (isCompleted) {
              const updates: any = { updatedAt: new Date().toISOString() };
              if (instance.userAppBuildStatus === 'building' || instance.userAppBuildStatus === 'queued') {
                updates.userAppBuildStatus = isSuccess ? 'success' : 'failed';
                updates.userAppBuildAt = new Date().toISOString();
              }
              if (instance.adminAppBuildStatus === 'building' || instance.adminAppBuildStatus === 'queued') {
                updates.adminAppBuildStatus = isSuccess ? 'success' : 'failed';
                updates.adminAppBuildAt = new Date().toISOString();
              }
              await update(ref(database, `appInstances/${instance.id}`), updates);

              addNotification({
                type: isSuccess ? 'build_complete' : 'build_failed',
                title: isSuccess ? 'اكتمال البناء' : 'فشل البناء',
                message: `${isSuccess ? 'تم بنجاح' : 'فشل'} بناء "${instance.appName}"`,
                read: false,
                instanceId: instance.id,
              });
            } else if (data.status === 'in_progress') {
              const updates: any = { updatedAt: new Date().toISOString() };
              if (instance.userAppBuildStatus === 'queued') updates.userAppBuildStatus = 'building';
              if (instance.adminAppBuildStatus === 'queued') updates.adminAppBuildStatus = 'building';
              await update(ref(database, `appInstances/${instance.id}`), updates);
            }
          }
        }
      }
    } catch (error) {
      console.error('Poll error:', error);
    } finally {
      setPolling(false);
    }
  }, [devSettings, instances, addNotification]);

  // Auto-poll every 30 seconds when builds are active
  useEffect(() => {
    if (!autoPolling || !hasActiveBuilds) return;

    const interval = setInterval(() => {
      handlePollStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoPolling, hasActiveBuilds, handlePollStatus]);

  const handleCancelBuild = async (activity: BuildActivity) => {
    try {
      const isUser = activity.appType === 'المستخدم';
      const updates: any = {
        updatedAt: new Date().toISOString(),
      };
      if (isUser) updates.userAppBuildStatus = 'none';
      else updates.adminAppBuildStatus = 'none';

      await update(ref(database, `appInstances/${activity.instanceId}`), updates);
      setInstances(instances.map(i =>
        i.id === activity.instanceId
          ? { ...i, ...updates }
          : i
      ));
    } catch (error) {
      console.error('Cancel build error:', error);
    }
  };

  const handleRetryBuild = async (activity: BuildActivity) => {
    setRetrying(activity.id);
    try {
      const isUser = activity.appType === 'المستخدم';
      const instance = activity.instance;

      // Reset to queued
      const updates: any = { updatedAt: new Date().toISOString() };
      if (isUser) updates.userAppBuildStatus = 'queued';
      else updates.adminAppBuildStatus = 'queued';

      await update(ref(database, `appInstances/${activity.instanceId}`), updates);

      // Trigger GitHub Actions again
      if (devSettings.githubToken && devSettings.githubOwner && devSettings.githubRepo) {
        await fetch(
          `https://api.github.com/repos/${devSettings.githubOwner}/${devSettings.githubRepo}/dispatches`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${devSettings.githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event_type: 'build-custom-app',
              client_payload: {
                instanceId: instance.id,
                appType: isUser ? 'user' : 'admin',
                appName: instance.appName,
                primaryColor: instance.primaryColor,
                secondaryColor: instance.secondaryColor,
                packageName: isUser ? instance.userAppPackageName : instance.adminAppPackageName,
                firebaseApiKey: isUser ? instance.firebaseApiKey : instance.adminFirebaseApiKey,
                firebaseProjectId: isUser ? instance.firebaseProjectId : instance.adminFirebaseProjectId,
                firebaseDatabaseUrl: isUser ? instance.firebaseDatabaseUrl : instance.adminFirebaseDatabaseUrl,
                firebaseStorageBucket: isUser ? instance.firebaseStorageBucket : instance.adminFirebaseStorageBucket,
                firebaseMessagingSenderId: isUser ? instance.firebaseMessagingSenderId : instance.adminFirebaseMessagingSenderId,
                firebaseAppId: isUser ? instance.firebaseAppId : instance.adminFirebaseAppId,
              },
            }),
          }
        );
      }

      setInstances(instances.map(i =>
        i.id === activity.instanceId
          ? { ...i, ...updates }
          : i
      ));

      addNotification({
        type: 'build_complete',
        title: 'إعادة المحاولة',
        message: `تم إعادة محاولة بناء "${instance.appName}"`,
        read: false,
        instanceId: instance.id,
      });
    } catch (error) {
      console.error('Retry build error:', error);
    } finally {
      setRetrying(null);
    }
  };

  const getBuildDuration = (activity: BuildActivity): string | null => {
    if (!activity.buildAt) return null;
    if (activity.buildStatus === 'building') {
      const start = new Date(activity.buildAt).getTime();
      const now = Date.now();
      return formatDuration(now - start);
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="ios-large-title text-foreground">نشاط البناء</h1>
          <p className="text-muted-foreground text-sm mt-1">تتبع حالة عمليات البناء</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoPolling(!autoPolling)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors',
              autoPolling ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted/30 text-muted-foreground'
            )}
          >
            {autoPolling ? <Play className="w-3.5 h-3.5" /> : <StopCircle className="w-3.5 h-3.5" />}
            {autoPolling ? 'تحديث تلقائي' : 'متوقف'}
          </button>
          <button
            onClick={handlePollStatus}
            disabled={polling}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium rounded-xl hover:bg-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {polling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="text-sm">تحديث الآن</span>
          </button>
        </div>
      </div>

      {/* Auto-poll indicator */}
      {hasActiveBuilds && autoPolling && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/15">
          <div className="w-2 h-2 rounded-full bg-blue-500 pulse-dot" />
          <span className="text-xs text-blue-600 dark:text-blue-400">تحديث تلقائي كل 30 ثانية - يوجد {buildingCount + queuedCount} عملية نشطة</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'قيد البناء', value: buildingCount, icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', animate: true },
          { label: 'في الانتظار', value: queuedCount, icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10', animate: false },
          { label: 'ناجح', value: successCount, icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', animate: false },
          { label: 'فاشل', value: failedCount, icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', animate: false },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="ios-card p-4">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', stat.bg)}>
                <Icon className={cn('w-4 h-4', stat.color, stat.animate && 'animate-spin')} />
              </div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Build Queue */}
      {queuedCount > 0 && (
        <div className="ios-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" /> طابور البناء ({queuedCount})
          </h3>
          <div className="space-y-2">
            {buildActivities.filter(a => a.buildStatus === 'queued').map((activity, idx) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 w-6 text-center">{idx + 1}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: activity.primaryColor || '#6C3CE1' }}>
                  {activity.instanceName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{activity.instanceName}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{activity.appType}</span>
                    <span className={`px-1.5 py-0.5 rounded-full font-medium ${buildPriorityColors[activity.buildPriority]}`}>
                      {buildPriorityLabels[activity.buildPriority as keyof typeof buildPriorityLabels] || 'عادي'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelBuild(activity)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                  title="إلغاء"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث بالاسم..."
          className="w-full h-11 pr-10 pl-4 rounded-2xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all text-sm"
        />
      </div>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-16">
          <Activity className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium">لا يوجد نشاط بناء</p>
          <p className="text-muted-foreground/60 text-sm mt-1">ستظهر عمليات البناء هنا عند إطلاقها</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map(activity => {
            const duration = getBuildDuration(activity);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'ios-card p-4',
                  activity.buildStatus === 'building' && 'border border-blue-500/20',
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: activity.primaryColor || '#6C3CE1' }}
                  >
                    {activity.buildStatus === 'building' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : activity.buildStatus === 'success' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : activity.buildStatus === 'failed' ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm truncate">{activity.instanceName}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-medium">
                        {activity.appType}
                      </span>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', buildStatusColors[activity.buildStatus])}>
                        {buildStatusLabels[activity.buildStatus]}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${buildPriorityColors[activity.buildPriority]}`}>
                        {buildPriorityLabels[activity.buildPriority as keyof typeof buildPriorityLabels] || 'عادي'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {activity.buildAt && <span>{timeAgo(activity.buildAt)}</span>}
                      {duration && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Timer className="w-3 h-3" /> {duration}
                        </span>
                      )}
                    </div>

                    {/* Build Logs */}
                    {activity.buildLog && (
                      <div className="mt-2 p-2 rounded-lg bg-muted/30 text-[10px] text-muted-foreground font-mono max-h-24 overflow-y-auto scrollbar-thin" dir="ltr">
                        {activity.buildLog}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {activity.apkUrl && (
                        <a href={activity.apkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline">
                          <ExternalLink className="w-3 h-3" /> تحميل APK
                        </a>
                      )}
                      {activity.githubRunId && devSettings.githubOwner && devSettings.githubRepo && (
                        <a href={`https://github.com/${devSettings.githubOwner}/${devSettings.githubRepo}/actions/runs/${activity.githubRunId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
                          <ExternalLink className="w-3 h-3" /> GitHub Actions
                        </a>
                      )}
                      {activity.buildStatus === 'failed' && (
                        <button
                          onClick={() => handleRetryBuild(activity)}
                          disabled={retrying === activity.id}
                          className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-50"
                        >
                          {retrying === activity.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                          إعادة المحاولة
                        </button>
                      )}
                      {(activity.buildStatus === 'queued') && (
                        <button onClick={() => handleCancelBuild(activity)} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
                          <StopCircle className="w-3 h-3" /> إلغاء
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

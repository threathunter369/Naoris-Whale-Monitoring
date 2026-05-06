import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Hash, 
  Shield, 
  Save,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertSeverity } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const settingsSchema = z.object({
  inApp: z.boolean(),
  email: z.object({
    enabled: z.boolean(),
    recipient: z.string().email().optional().or(z.literal('')),
  }),
  telegram: z.object({
    enabled: z.boolean(),
    chatId: z.string().optional().or(z.literal('')),
  }),
  discord: z.object({
    enabled: z.boolean(),
    webhookUrl: z.string().url().optional().or(z.literal('')),
  }),
  minSeverity: z.nativeEnum(AlertSeverity),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      inApp: true,
      email: { enabled: false, recipient: '' },
      telegram: { enabled: false, chatId: '' },
      discord: { enabled: false, webhookUrl: '' },
      minSeverity: AlertSeverity.MEDIUM,
    }
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setSettingsLoading(false);
      setDataLoaded(true);
      return;
    }

    // Fallback timeout to ensure the UI is not blocked indefinitely
    const timeout = setTimeout(() => {
      setSettingsLoading(false);
      setDataLoaded(true);
    }, 3500);

    const unsub = onSnapshot(doc(db, 'settings', user.uid), (snap) => {
      clearTimeout(timeout);
      if (snap.exists()) {
        reset(snap.data() as SettingsForm);
      }
      setSettingsLoading(false);
      setDataLoaded(true);
    }, (err) => {
      clearTimeout(timeout);
      console.error("Settings snapshot error:", err);
      // Ensure we stop loading state before throwing
      setSettingsLoading(false);
      setDataLoaded(true);
      handleFirestoreError(err, OperationType.GET, `settings/${user.uid}`);
    });
    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, [reset, user, authLoading]);

  const onSubmit = async (data: SettingsForm) => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    // Safety timeout for saving state
    const saveTimeout = setTimeout(() => {
      setIsSaving(false);
      setSaveError("Synchronization is taking longer than expected. Please check your connection.");
    }, 10000);

    try {
      await setDoc(doc(db, 'settings', user.uid), {
        ...data,
        userId: user.uid,
        updatedAt: serverTimestamp()
      });
      clearTimeout(saveTimeout);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      clearTimeout(saveTimeout);
      console.error("Save settings error:", err);
      setSaveError("Failed to synchronize settings with security nodes.");
      handleFirestoreError(err, OperationType.WRITE, `settings/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to revert all configurations to factory defaults?')) {
      reset({
        inApp: true,
        email: { enabled: false, recipient: '' },
        telegram: { enabled: false, chatId: '' },
        discord: { enabled: false, webhookUrl: '' },
        minSeverity: AlertSeverity.MEDIUM,
      });
    }
  };

  if (authLoading || (settingsLoading && !dataLoaded)) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <RefreshCw className="w-12 h-12 animate-spin text-brand-primary" />
      <p className="text-gray-500 font-mono text-xs animate-pulse">RECONNAISSANCE IN PROGRESS...</p>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">System Configuration</h2>
        <p className="text-gray-400 mt-1">Control notification channels and surveillance thresholds.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Notification Channels */}
        <section className="bg-brand-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
            <Bell className="w-5 h-5 text-brand-primary" />
            <h3 className="font-bold">Notification Channels</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* In-App */}
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-200">In-App Dashboard Alerts</p>
                  <p className="text-xs text-gray-500">Real-time alerts displayed on the active dashboard.</p>
                </div>
              </div>
              <input type="checkbox" {...register('inApp')} className="w-5 h-5 accent-brand-primary" />
            </div>

            {/* Email */}
            <div className="space-y-4 p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-200">Email Notifications</p>
                    <p className="text-xs text-gray-500">Summary alerts sent directly to your inbox.</p>
                  </div>
                </div>
                <input type="checkbox" {...register('email.enabled')} className="w-5 h-5 accent-brand-primary" />
              </div>
              {watch('email.enabled') && (
                <div className="pl-14 space-y-2">
                  <input 
                    {...register('email.recipient')}
                    placeholder="investigator@company.com"
                    className={cn(
                      "w-full max-w-md bg-black/40 border rounded-lg py-2 px-3 text-sm outline-none transition-colors",
                      errors.email?.recipient ? "border-red-500" : "border-white/10 focus:border-brand-primary/50"
                    )}
                  />
                  {errors.email?.recipient && (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email.recipient.message || "Invalid Email Address"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Telegram */}
            <div className="space-y-4 p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-200">Telegram Bot Integration</p>
                    <p className="text-xs text-gray-500">Instant push notifications via NAORIS Alert Bot.</p>
                  </div>
                </div>
                <input type="checkbox" {...register('telegram.enabled')} className="w-5 h-5 accent-brand-primary" />
              </div>
              {watch('telegram.enabled') && (
                <div className="pl-14 space-y-2">
                  <input 
                    {...register('telegram.chatId')}
                    placeholder="Enter Chat ID"
                    className={cn(
                      "w-full max-w-md bg-black/40 border rounded-lg py-2 px-3 text-sm outline-none transition-colors",
                      errors.telegram?.chatId ? "border-red-500" : "border-white/10 focus:border-brand-primary/50"
                    )}
                  />
                  {errors.telegram?.chatId && (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.telegram.chatId.message || "Invalid Chat ID"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Discord */}
            <div className="space-y-4 p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Hash className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-200">Discord Webhook</p>
                    <p className="text-xs text-gray-500">Relay alerts to a dedicated Discord channel.</p>
                  </div>
                </div>
                <input type="checkbox" {...register('discord.enabled')} className="w-5 h-5 accent-brand-primary" />
              </div>
              {watch('discord.enabled') && (
                <div className="pl-14 space-y-2">
                  <input 
                    {...register('discord.webhookUrl')}
                    placeholder="https://discord.com/api/webhooks/..."
                    className={cn(
                      "w-full bg-black/40 border rounded-lg py-2 px-3 text-sm outline-none transition-colors",
                      errors.discord?.webhookUrl ? "border-red-500" : "border-white/10 focus:border-brand-primary/50"
                    )}
                  />
                  {errors.discord?.webhookUrl && (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.discord.webhookUrl.message || "Invalid Webhook URL"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Thresholds */}
        <section className="bg-brand-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
            <Shield className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold">Surveillance Thresholds</h3>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Minimum Notification Severity</label>
              <div className="grid grid-cols-4 gap-3">
                {Object.values(AlertSeverity).map(severity => (
                  <button
                    key={severity}
                    type="button"
                    onClick={() => setValue('minSeverity', severity)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                      watch('minSeverity') === severity 
                        ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                        : "bg-black/40 border-white/10 text-gray-500 hover:border-white/20"
                    )}
                  >
                    {severity}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-2 italic">Alerts below this level will be logged but won't trigger external notifications.</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end items-center gap-4">
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 text-brand-primary font-bold text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Synchronized with Mainnet</span>
              </motion.div>
            )}
            {saveError && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 text-red-500 font-bold text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{saveError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            <button 
              type="button"
              onClick={handleReset}
              className="px-6 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-all border border-red-500/10 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Reset Data
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 bg-brand-primary text-black font-black rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Synching...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

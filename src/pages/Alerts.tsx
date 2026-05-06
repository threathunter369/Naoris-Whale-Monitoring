import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc,
  limit,
  addDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
import { 
  BellRing, 
  Eye, 
  EyeOff, 
  ShieldAlert,
  Info,
  Clock,
  ExternalLink,
  Plus,
  Zap,
  Settings2,
  ToggleLeft as Toggle,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { cn, formatAddress } from '../lib/utils';
import { Alert, AlertStatus, AlertSeverity, AlertRule, AlertRuleType } from '../types';

export default function Alerts() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules'>('alerts');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [filter, setFilter] = useState<AlertStatus | 'All'>('New');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form State
  const defaultRule = {
    name: '',
    ruleType: AlertRuleType.BALANCE_ABOVE,
    threshold: 1000000,
    severity: AlertSeverity.HIGH,
    comparison: 'greater_than' as 'greater_than' | 'less_than'
  };

  const [newRule, setNewRule] = useState(defaultRule);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubAlerts = onSnapshot(query(
      collection(db, 'alerts'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'), 
      limit(100)
    ), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
      setAlerts(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'alerts'));

    const unsubRules = onSnapshot(query(
      collection(db, 'alertRules'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    ), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlertRule));
      setRules(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'alertRules'));

    return () => {
      unsubAlerts();
      unsubRules();
    };
  }, []);

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    try {
      const ruleData = {
        userId: user.uid,
        ...newRule,
        updatedAt: Date.now(),
        description: `Trigger ${newRule.severity} alert when ${newRule.ruleType} ${newRule.comparison === 'greater_than' ? '>' : '<'} ${newRule.threshold.toLocaleString()}`
      };

      if (editingRuleId) {
        await updateDoc(doc(db, 'alertRules', editingRuleId), ruleData);
      } else {
        await addDoc(collection(db, 'alertRules'), {
          ...ruleData,
          isActive: true,
          createdAt: Date.now(),
        });
      }

      closeModal();
    } catch (err) {
      handleFirestoreError(err, editingRuleId ? OperationType.UPDATE : OperationType.CREATE, 'alertRules');
    }
  };

  const openEditModal = (rule: AlertRule) => {
    setEditingRuleId(rule.id);
    setNewRule({
      name: rule.name,
      ruleType: rule.ruleType,
      threshold: rule.threshold,
      severity: rule.severity,
      comparison: rule.comparison
    });
    setShowRuleModal(true);
  };

  const closeModal = () => {
    setShowRuleModal(false);
    setEditingRuleId(null);
    setNewRule(defaultRule);
  };

  const toggleRule = async (rule: AlertRule) => {
    try {
      await updateDoc(doc(db, 'alertRules', rule.id), { 
        isActive: !rule.isActive,
        updatedAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `alertRules/${rule.id}`);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    try {
      await deleteDoc(doc(db, 'alertRules', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `alertRules/${id}`);
    }
  };

  const updateStatus = async (id: string, status: AlertStatus) => {
    try {
      await updateDoc(doc(db, 'alerts', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `alerts/${id}`);
    }
  };

  const filteredAlerts = alerts.filter(a => filter === 'All' || a.status === filter);

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL: return 'border-red-500/50 bg-red-500/10 text-red-500';
      case AlertSeverity.HIGH: return 'border-orange-500/50 bg-orange-500/10 text-orange-500';
      case AlertSeverity.MEDIUM: return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500';
      default: return 'border-blue-500/50 bg-blue-500/10 text-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 w-fit mb-4">
             <button 
               onClick={() => setActiveTab('alerts')}
               className={cn(
                 "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                 activeTab === 'alerts' ? "bg-brand-primary text-black" : "text-gray-500 hover:text-white"
               )}
             >
               <BellRing className="w-3 h-3" /> Security Feed
             </button>
             <button 
               onClick={() => setActiveTab('rules')}
               className={cn(
                 "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                 activeTab === 'rules' ? "bg-brand-primary text-black" : "text-gray-500 hover:text-white"
               )}
             >
               <Zap className="w-3 h-3" /> Automation Rules
             </button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            {activeTab === 'alerts' ? 'Threat Surveillance' : 'Watchtower Protocols'}
          </h2>
          <p className="text-gray-400">
            {activeTab === 'alerts' ? 'High-fidelity findings requiring forensic review.' : 'Configure autonomous triggers for decentralized surveillance.'}
          </p>
        </div>

        {activeTab === 'rules' && (
          <button 
            onClick={() => setShowRuleModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-black font-black rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            <Plus className="w-4 h-4" /> Instantiate Rule
          </button>
        )}

        {activeTab === 'alerts' && (
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            {['New', 'Reviewed', 'Ignored', 'All'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filter === s ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </header>

      {activeTab === 'alerts' ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredAlerts.length === 0 ? (
            <div className="py-24 text-center bg-brand-card rounded-2xl border border-dashed border-white/10">
              <ShieldAlert className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 font-medium tracking-tight">No active threats detected in this category.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div key={alert.id} className={cn(
                "p-6 rounded-2xl border transition-all hover:scale-[1.005] group relative",
                getSeverityStyles(alert.severity)
              )}>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-current opacity-70">
                        {alert.severity}
                      </span>
                      <h3 className="font-black text-xl tracking-tight text-white">{alert.alertType}</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <Info className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Reasoning</p>
                          <p className="text-sm text-gray-200 leading-relaxed font-medium">{alert.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="p-2 bg-white/5 rounded-lg text-emerald-500">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Recommended Action</p>
                          <p className="text-sm text-emerald-400 font-bold">{alert.recommendedAction || 'Monitor closely for subsequent related activity.'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                          <p className="text-[11px] text-gray-500 font-bold uppercase">Entity:</p>
                          <p className="text-sm font-mono text-gray-300">{alert.walletLabel} ({formatAddress(alert.walletAddress)})</p>
                      </div>
                      <div className="flex items-center gap-2">
                          <p className="text-[11px] text-gray-500 font-bold uppercase">Amount:</p>
                          <p className="text-sm font-black text-white">{alert.amount.toLocaleString()} N</p>
                      </div>
                      <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-600" />
                          <p className="text-[11px] text-gray-500">{new Date(alert.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {alert.blockNumber && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 p-3 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <div>
                          <p className="text-[8px] font-black uppercase text-gray-500 mb-0.5 tracking-tighter">Block Index</p>
                          <p className="text-[10px] font-mono text-gray-300">#{alert.blockNumber}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase text-gray-500 mb-0.5 tracking-tighter">Gas Consumption</p>
                          <p className="text-[10px] font-mono text-gray-300">{Number(alert.gasUsed).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase text-gray-500 mb-0.5 tracking-tighter">Gas Price</p>
                          <p className="text-[10px] font-mono text-gray-300">{alert.gasPrice}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase text-gray-500 mb-0.5 tracking-tighter">Node Integrity</p>
                          <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {alert.networkHealth}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col justify-end gap-3 self-end md:self-auto shrink-0">
                    <a 
                      href={alert.txHash ? `https://sepolia.etherscan.io/tx/${alert.txHash}` : '#'} 
                      target={alert.txHash ? "_blank" : undefined} 
                      rel="noreferrer"
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                        alert.txHash 
                          ? "bg-white/10 hover:bg-white/20 text-white border-white/5" 
                          : "bg-white/5 text-gray-500 border-white/5 cursor-not-allowed opacity-50"
                      )}
                    >
                      <ExternalLink className="w-3 h-3" /> Proof
                    </a>
                    {alert.status === AlertStatus.NEW && (
                      <button 
                        onClick={() => updateStatus(alert.id, AlertStatus.REVIEWED)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl text-xs font-bold transition-all border border-blue-600/20"
                      >
                        <Eye className="w-3 h-3" /> Mark Reviewed
                      </button>
                    )}
                    {alert.status !== AlertStatus.IGNORED && (
                      <button 
                        onClick={() => updateStatus(alert.id, AlertStatus.IGNORED)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded-xl text-xs font-bold transition-all border border-gray-500/10"
                      >
                        <EyeOff className="w-3 h-3" /> Ignore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-brand-card rounded-3xl border border-dashed border-white/10">
              <Zap className="w-12 h-12 text-gray-800 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">No active surveillance rules configured.</p>
              <button 
                onClick={() => setShowRuleModal(true)}
                className="mt-4 text-brand-primary text-xs font-black uppercase tracking-widest hover:underline"
              >
                Create First Rule
              </button>
            </div>
          ) : (
            rules.map(rule => (
              <div key={rule.id} className="bg-brand-card rounded-2xl border border-white/5 p-6 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "p-2 rounded-xl border",
                      rule.isActive ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary" : "bg-white/5 border-white/10 text-gray-500"
                    )}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex gap-1">
                       <button 
                         onClick={() => openEditModal(rule)}
                         className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                         title="Configure Rule"
                       >
                         <Settings2 className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => deleteRule(rule.id)}
                         className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                         title="Decommission Protocol"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                  <h4 className="font-black text-lg text-white">{rule.name}</h4>
                  <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">{rule.description}</p>
                  
                  <div className="flex items-center gap-3 mt-4">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                      getSeverityStyles(rule.severity)
                    )}>
                      {rule.severity}
                    </span>
                    <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-0.5 rounded uppercase">
                      {rule.ruleType}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    rule.isActive ? "text-emerald-500" : "text-gray-600"
                  )}>
                    {rule.isActive ? 'System Live' : 'Paused'}
                  </span>
                  <button 
                    onClick={() => toggleRule(rule)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none",
                      rule.isActive ? "bg-brand-primary" : "bg-white/10"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      rule.isActive ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Rule Creation Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-brand-card border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-white mb-2">{editingRuleId ? 'Modify Protocol' : 'Instantiate Protocol'}</h3>
            <p className="text-gray-400 text-sm mb-8 font-medium">{editingRuleId ? 'Update parameters for this autonomous rule.' : 'Configure a new autonomous surveillance rule.'}</p>
            
            <form onSubmit={createRule} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Rule Name</label>
                <input 
                  required
                  type="text" 
                  value={newRule.name}
                  onChange={e => setNewRule({...newRule, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-primary transition-all font-medium"
                  placeholder="e.g. Whale Inflow Monitor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Type</label>
                  <select 
                    value={newRule.ruleType}
                    onChange={e => setNewRule({...newRule, ruleType: e.target.value as AlertRuleType})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-primary select-none font-medium"
                  >
                    {Object.values(AlertRuleType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Severity</label>
                  <select 
                    value={newRule.severity}
                    onChange={e => setNewRule({...newRule, severity: e.target.value as AlertSeverity})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-primary font-medium"
                  >
                    {Object.values(AlertSeverity).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Comparison</label>
                  <select 
                    value={newRule.comparison}
                    onChange={e => setNewRule({...newRule, comparison: e.target.value as any})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-primary font-medium"
                  >
                    <option value="greater_than">Greater Than (&gt;)</option>
                    <option value="less_than">Less Than (&lt;)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Threshold (N)</label>
                  <input 
                    required
                    type="number" 
                    value={newRule.threshold}
                    onChange={e => setNewRule({...newRule, threshold: Number(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-primary font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 text-xs font-bold uppercase tracking-widest">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-4 bg-white/5 text-gray-400 rounded-2xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 bg-brand-primary text-black rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  {editingRuleId ? 'Apply Pattern' : 'Instantiate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

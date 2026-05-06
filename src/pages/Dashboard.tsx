import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Activity,
  History,
  Wallet
} from 'lucide-react';
import { 
  ComposedChart,
  Line,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { formatNumber, formatAddress, cn } from '../lib/utils';
import { RiskLevel, Transaction, Alert } from '../types';

import { useMarketData } from '../services/marketData';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const market = useMarketData();
  const [totalBalance, setTotalBalance] = useState(0);
  const [stats, setStats] = useState({
    totalWallets: 0,
    activeAlerts: 0,
    lastBlock: 0,
    dailyVolume: 0
  });
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [riskScore, setRiskScore] = useState(850); // Default placeholder

  useEffect(() => {
    if (!user) return;

    // Stats: Wallets
    const unsubWallets = onSnapshot(query(collection(db, 'wallets'), where('userId', '==', user.uid)), (snap) => {
      setStats(prev => ({ ...prev, totalWallets: snap.size }));
      const total = snap.docs.reduce((acc, doc) => acc + (Number(doc.data().naorisBalance) || 0), 0);
      setTotalBalance(total);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'wallets'));

    // Stats: Alerts
    const unsubAlerts = onSnapshot(query(
      collection(db, 'alerts'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'), 
      limit(50)
    ), (snap) => {
      const alerts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
      setRecentAlerts(alerts.slice(0, 5));
      const activeCount = alerts.filter(a => a.status === 'New').length;
      setStats(prev => ({ ...prev, activeAlerts: activeCount }));
      
      // Dynamic Risk Score based on critical alerts in last 50 alerts
      const criticalCount = alerts.filter(a => a.severity === 'Critical').length;
      setRiskScore(Math.max(100, 950 - (criticalCount * 50) - (activeCount * 5)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'alerts'));

    // Stats: Txs
    const unsubTxs = onSnapshot(query(
      collection(db, 'transactions'), 
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'), 
      limit(100)
    ), (snap) => {
      const txs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setRecentTxs(txs.slice(0, 5));
      
      // Volume calculation (last 24h)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const volume = txs
        .filter(t => t.timestamp > oneDayAgo)
        .reduce((sum, t) => sum + t.amountFormatted, 0);
      setStats(prev => ({ ...prev, dailyVolume: volume }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    // Sync State
    const unsubSync = onSnapshot(collection(db, 'sync'), (snap) => {
      snap.forEach(doc => {
        if (doc.id === 'ethereum') {
          setStats(prev => ({ ...prev, lastBlock: doc.data().lastBlock }));
        }
      });
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'sync'));

    return () => {
      unsubWallets();
      unsubAlerts();
      unsubTxs();
      unsubSync();
    };
  }, [user]);

  const getRiskColor = (score: number) => {
    if (score >= 900) return 'text-green-500';
    if (score >= 700) return 'text-yellow-500';
    if (score >= 400) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRiskBg = (score: number) => {
    if (score >= 900) return 'bg-green-500/10 border-green-500/20';
    if (score >= 700) return 'bg-yellow-500/10 border-yellow-500/20';
    if (score >= 400) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Market Dashboard</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-400">Real-time surveillance of NAORIS whale activity.</p>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">NAORIS PRICE:</span>
              <span className="text-sm font-mono font-bold text-brand-primary">${market.price.toFixed(4)}</span>
              <span className={cn(
                "text-[10px] font-bold",
                market.change24h >= 0 ? "text-emerald-500" : "text-red-500"
              )}>
                {market.change24h >= 0 ? '+' : ''}{market.change24h}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs text-gray-400">
          <Activity className="w-3 h-3 text-brand-primary animate-pulse" />
          Block: {stats.lastBlock || 'Syncing...'}
        </div>
      </header>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Tracked Wallets" value={stats.totalWallets} icon={Wallet} color="text-blue-500" />
        <StatCard label="Pending Alerts" value={stats.activeAlerts} icon={AlertTriangle} color="text-red-500" />
        <StatCard label="24h Volume" value={`${formatNumber(stats.dailyVolume)} N`} icon={TrendingUp} color="text-emerald-500" />
        <StatCard label="Monitored Assets" value={`${formatNumber(totalBalance)} N`} icon={ShieldCheck} color="text-brand-primary" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Side: Risk Score (Col 1-3) */}
        <div className={cn("xl:col-span-3 p-6 rounded-2xl border flex flex-col justify-between", getRiskBg(riskScore))}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg text-gray-300">Risk Score</h3>
              <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            </div>
            <p className="text-xs text-gray-500">Market Surveillance Index</p>
          </div>
          <div className="py-8 text-center">
            <motion.span 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn("text-7xl font-black tracking-tighter block", getRiskColor(riskScore))}
            >
              {riskScore}
            </motion.span>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/5">
              {riskScore >= 900 ? 'Secure' : riskScore >= 700 ? 'Observation' : 'High Risk'}
            </div>
          </div>
          <div className="space-y-4">
             <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-gray-500">
                <span>Network Integrity</span>
                <span className="text-brand-primary">98.2%</span>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary w-[98.2%]" />
             </div>
             <p className="text-[10px] text-gray-500 italic text-center font-medium">Auto-scaling protection enabled</p>
          </div>
        </div>

        {/* Center: Trading View (Chart + Order Book) (Col 4-9) */}
        <div className="xl:col-span-6 bg-brand-card rounded-2xl border border-white/5 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-gray-400">MARKET TELEMETRY</h3>
              <div className="flex gap-1">
                {['1m', '5m', '15m'].map(t => (
                  <button key={t} className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-bold transition-colors",
                    t === '1m' ? "bg-brand-primary text-black" : "text-gray-500 hover:bg-white/5"
                  )}>{t}</button>
                ))}
              </div>
            </div>
            <div className="text-[10px] font-mono text-brand-primary font-bold">
              {market.price.toFixed(4)} USDT
            </div>
          </div>
          
          <div className="flex-1 flex flex-col sm:flex-row min-h-[350px]">
            {/* Chart Area */}
            <div className="flex-1 relative p-4 bg-black/40 border-r border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={market.candlesticks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    orientation="right" 
                    tick={{ fontSize: 9, fill: '#444' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val.toFixed(4)}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#111] border border-white/10 p-2 rounded shadow-2xl text-[9px] font-mono">
                            <p className="text-white">PRC: {d.close.toFixed(4)}</p>
                            <p className="text-brand-primary">VOL: {formatNumber(d.volume)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={false}
                    animationDuration={300}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              
              <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-brand-primary text-black px-1.5 py-0.5 rounded text-[10px] font-black shadow-lg">
                {market.price.toFixed(4)}
              </div>
            </div>

            {/* Simple Order Book Sidebar inside Center part */}
            <div className="w-full sm:w-40 bg-black/20 flex flex-col overflow-hidden">
               <div className="px-3 py-2 flex justify-between text-[8px] font-bold text-gray-500 uppercase border-b border-white/5">
                 <span>Price</span>
                 <span>Amt</span>
               </div>
               <div className="flex-1 flex flex-col gap-px p-1 overflow-hidden">
                  {/* Small Subset of asks/bids */}
                  <div className="flex flex-col-reverse">
                    {market.orderBook.asks.slice(-5).map((ask, i) => (
                      <div key={i} className="px-2 py-0.5 flex justify-between text-[9px] font-mono text-red-500/80">
                        <span>{ask.price.toFixed(3)}</span>
                        <span className="text-gray-600">{ask.amount.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-white/5 my-1" />
                  <div>
                    {market.orderBook.bids.slice(0, 5).map((bid, i) => (
                      <div key={i} className="px-2 py-0.5 flex justify-between text-[9px] font-mono text-emerald-500/80">
                        <span>{bid.price.toFixed(3)}</span>
                        <span className="text-gray-600">{bid.amount.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Protocol Hierarchy Panel (Col 10-12) */}
        <div className="xl:col-span-3 bg-brand-card rounded-2xl border border-white/5 flex flex-col overflow-hidden">
           <div className="p-4 border-b border-white/5 bg-black/20">
             <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-brand-primary flex items-center gap-2">
               <ShieldCheck className="w-3 h-3" />
               PROTOCOL HIERARCHY
             </h3>
           </div>
           <div className="p-4 flex-1 flex flex-col gap-5">
             <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-[#050505] p-1">
               <img 
                 src="/naoris_token_control.png" 
                 alt="Protocol Visualization" 
                 className="w-full h-auto rounded-lg"
                 onError={(e) => {
                   const target = e.target as HTMLImageElement;
                   target.src = 'https://placehold.co/400x500/0a0a0a/10b981?text=Awaiting+Image+Upload';
                 }}
               />
               <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary">Full structural map loaded</span>
               </div>
             </div>
             
             <div className="space-y-4">
               {[
                 { label: "Treasury Multisig", val: "40.6%", color: "bg-blue-500" },
                 { label: "Vesting Contract", val: "33.8%", color: "bg-purple-500" },
                 { label: "Gnosis Proxy layer", val: "7.85%", color: "bg-emerald-500" }
               ].map((item, i) => (
                 <div key={i} className="space-y-2">
                   <div className="flex justify-between text-[9px] font-bold uppercase tracking-tight text-gray-400">
                     <span>{item.label}</span>
                     <span className="text-white">{item.val}</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: item.val }}
                        transition={{ duration: 1, delay: 0.2 * i }}
                        className={cn("h-full", item.color)} 
                     />
                   </div>
                 </div>
               ))}
             </div>
             
             <button 
              onClick={() => navigate('/tokenomics')}
              className="mt-2 w-full py-2.5 border border-white/5 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-brand-primary hover:bg-white/10 transition-all"
             >
               Detailed Distribution Report
             </button>
           </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-brand-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-semibold">Recent Movements</h3>
            <History className="w-4 h-4 text-gray-500" />
          </div>
          <div className="divide-y divide-white/5">
            {recentTxs.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">No recent transactions found.</div>
            ) : (
              recentTxs.map(tx => (
                <div key={tx.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      tx.direction === 'Inbound' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {tx.direction === 'Inbound' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{formatAddress(tx.fromAddress)} → {formatAddress(tx.toAddress)}</p>
                      <p className="text-[10px] text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatNumber(tx.amountFormatted)} N</p>
                    <p className={cn("text-[10px] font-bold uppercase", 
                      tx.riskLevel === RiskLevel.CRITICAL ? 'text-red-500' : 
                      tx.riskLevel === RiskLevel.HIGH ? 'text-orange-500' : 'text-gray-500'
                    )}>
                      {tx.riskLevel}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-brand-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-semibold">Priority Alerts</h3>
            <span className="bg-red-500/20 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">LIVE</span>
          </div>
          <div className="divide-y divide-white/5">
            {recentAlerts.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">System stable. No active alerts.</div>
            ) : (
              recentAlerts.map(alert => (
                <div key={alert.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        alert.severity === 'Critical' ? 'bg-red-500' : 
                        alert.severity === 'High' ? 'bg-orange-500' : 'bg-yellow-500'
                      )} />
                      <p className="text-sm font-bold">{alert.alertType}</p>
                    </div>
                    <span className="text-[10px] text-gray-500">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{alert.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string, value: any, icon: any, color: string }) {
  return (
    <div className="bg-brand-card p-6 rounded-2xl border border-white/5 flex items-center gap-4">
      <div className={cn("p-3 rounded-xl bg-white/5", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">{label}</p>
        <p className="text-2xl font-black">{value}</p>
      </div>
    </div>
  );
}

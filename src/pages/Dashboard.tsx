import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
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
    const user = auth.currentUser;
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
  }, []);

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Risk Score Card */}
        <div className={cn("p-6 rounded-2xl border flex flex-col justify-between", getRiskBg(riskScore))}>
          <div>
            <h3 className="font-semibold text-lg text-gray-300">Whale Risk Score</h3>
            <p className="text-xs text-gray-500 mt-1">Composite market sentiment index</p>
          </div>
          <div className="py-8 text-center">
            <span className={cn("text-7xl font-black tracking-tighter", getRiskColor(riskScore))}>
              {riskScore}
            </span>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-xs font-bold uppercase tracking-wider">
              {riskScore >= 900 ? 'Low Risk' : riskScore >= 700 ? 'Moderate' : 'Critical'}
            </div>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                <span>Network Integrity</span>
                <span className="text-brand-primary">98.2%</span>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary w-[98.2%]" />
             </div>
          </div>
        </div>

        {/* Professional Trading Chart */}
        <div className="lg:col-span-3 bg-brand-card rounded-2xl border border-white/5 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">NAORIS / USDT <span className="text-emerald-500 ml-2">Real-time</span></h3>
              <div className="flex gap-1">
                {['1m', '5m', '15m', '1h', '1D'].map(t => (
                  <button key={t} className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold transition-colors",
                    t === '1m' ? "bg-brand-primary text-black" : "text-gray-500 hover:bg-white/5"
                  )}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 text-[10px] font-mono">
              <span className="text-gray-500">O: <span className="text-white">{(market.candlesticks[market.candlesticks.length-1]?.open || 0).toFixed(4)}</span></span>
              <span className="text-gray-500">H: <span className="text-white">{(market.candlesticks[market.candlesticks.length-1]?.high || 0).toFixed(4)}</span></span>
              <span className="text-gray-500">L: <span className="text-white">{(market.candlesticks[market.candlesticks.length-1]?.low || 0).toFixed(4)}</span></span>
              <span className="text-gray-500">C: <span className="text-white">{(market.candlesticks[market.candlesticks.length-1]?.close || 0).toFixed(4)}</span></span>
            </div>
          </div>
          
          <div className="flex-1 flex min-h-[350px]">
            {/* Chart Area */}
            <div className="flex-1 relative p-4 bg-black/40">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={market.candlesticks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    hide 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    orientation="right" 
                    tick={{ fontSize: 10, fill: '#666' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val.toFixed(4)}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#111] border border-white/10 p-2 rounded shadow-xl text-[10px] font-mono">
                            <p className="text-gray-500 mb-1">{new Date(d.time).toLocaleTimeString()}</p>
                            <p className="text-white">PRICE: {d.close.toFixed(4)}</p>
                            <p className="text-brand-primary">VOL: {formatNumber(d.volume)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="volume" yAxisId={1} fill="#ffffff05" barSize={10}>
                    {market.candlesticks.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? '#10b98120' : '#ef444420'} />
                    ))}
                  </Bar>
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
              
              {/* Overlay Price Label */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-brand-primary text-black px-2 py-1 rounded text-xs font-black shadow-lg">
                {market.price.toFixed(4)}
              </div>
            </div>

            {/* Simple Order Book Sidebar */}
            <div className="w-48 border-l border-white/5 bg-black/20 flex flex-col pt-1">
              <div className="px-3 py-1 flex justify-between text-[8px] font-bold text-gray-500 uppercase tracking-tighter border-b border-white/5 mb-1">
                <span>Price (USDT)</span>
                <span>Amount</span>
              </div>
              
              {/* Asks */}
              <div className="flex-1 flex flex-col-reverse overflow-hidden">
                {market.orderBook.asks.slice(-12).map((ask, i) => (
                  <div key={i} className="px-3 py-0.5 flex justify-between text-[9px] font-mono hover:bg-white/5 transition-colors relative group">
                    <div className="absolute inset-y-0 right-0 bg-red-500/5 transition-all" style={{ width: `${Math.min(100, (ask.amount / 100))}%` }} />
                    <span className="text-red-500 z-10">{ask.price.toFixed(4)}</span>
                    <span className="text-gray-400 z-10">{ask.amount.toFixed(0)}</span>
                  </div>
                ))}
              </div>

              {/* Spread */}
              <div className="px-3 py-2 border-y border-white/5 bg-black/40">
                <div className="flex justify-between items-center">
                   <span className="text-base font-black text-emerald-500 leading-none">{market.price.toFixed(4)}</span>
                </div>
                <div className="text-[8px] text-gray-500 font-bold mt-1">≈ $0.13651</div>
              </div>

              {/* Bids */}
              <div className="flex-1 overflow-hidden">
                {market.orderBook.bids.slice(0, 12).map((bid, i) => (
                   <div key={i} className="px-3 py-0.5 flex justify-between text-[9px] font-mono hover:bg-white/5 transition-colors relative group">
                      <div className="absolute inset-y-0 right-0 bg-emerald-500/5 transition-all" style={{ width: `${Math.min(100, (bid.amount / 100))}%` }} />
                      <span className="text-emerald-500 z-10">{bid.price.toFixed(4)}</span>
                      <span className="text-gray-400 z-10">{bid.amount.toFixed(0)}</span>
                   </div>
                ))}
              </div>
            </div>
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

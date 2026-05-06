import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  limit 
} from 'firebase/firestore';
import { 
  Filter, 
  Download, 
  Search, 
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown
} from 'lucide-react';
import { formatAddress, formatNumber, cn } from '../lib/utils';
import { Transaction, RiskLevel } from '../types';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState({
    risk: 'All',
    direction: 'All',
    search: ''
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub = onSnapshot(query(
      collection(db, 'transactions'), 
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'), 
      limit(50)
    ), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));
    return unsub;
  }, []);

  const filteredTxs = transactions.filter(tx => {
    const matchesRisk = filter.risk === 'All' || tx.riskLevel === filter.risk;
    const matchesDir = filter.direction === 'All' || tx.direction === filter.direction;
    const matchesSearch = filter.search === '' || 
      tx.fromAddress.toLowerCase().includes(filter.search.toLowerCase()) ||
      tx.toAddress.toLowerCase().includes(filter.search.toLowerCase()) ||
      tx.txHash.toLowerCase().includes(filter.search.toLowerCase());
    return matchesRisk && matchesDir && matchesSearch;
  });

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.CRITICAL: return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case RiskLevel.HIGH: return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      case RiskLevel.MEDIUM: return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Ledger</h2>
          <p className="text-gray-400 mt-1">Immutable record of monitored NAORIS movements.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-brand-card rounded-2xl border border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text"
            placeholder="Search hash or address..."
            className="w-full bg-black/30 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-primary/50 transition-all font-mono"
            value={filter.search}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        
        <div className="relative group">
          <select 
            className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-4 text-sm outline-none appearance-none focus:border-brand-primary/50 cursor-pointer"
            value={filter.risk}
            onChange={(e) => setFilter(prev => ({ ...prev, risk: e.target.value }))}
          >
            <option value="All">All Risk Levels</option>
            {Object.values(RiskLevel).map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative group">
          <select 
            className="w-full bg-black/30 border border-white/10 rounded-xl py-2 px-4 text-sm outline-none appearance-none focus:border-brand-primary/50 cursor-pointer"
            value={filter.direction}
            onChange={(e) => setFilter(prev => ({ ...prev, direction: e.target.value }))}
          >
            <option value="All">All Directions</option>
            <option value="Inbound">Inbound</option>
            <option value="Outbound">Outbound</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 px-4 text-xs text-gray-500 font-medium">
          <Filter className="w-3 h-3" />
          Showing {filteredTxs.length} records
        </div>
      </div>

      <div className="bg-brand-card rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500">
              <th className="px-6 py-4 font-bold">Timestamp</th>
              <th className="px-6 py-4 font-bold">Direction</th>
              <th className="px-6 py-4 font-bold">From / To</th>
              <th className="px-6 py-4 font-bold text-right">Amount (N)</th>
              <th className="px-6 py-4 font-bold text-center">Risk</th>
              <th className="px-6 py-4 font-bold text-right">Explorer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {filteredTxs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-sans">
                  No matches found for current filters.
                </td>
              </tr>
            ) : (
              filteredTxs.map(tx => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-200">{new Date(tx.timestamp).toLocaleDateString()}</p>
                    <p className="text-[10px] text-gray-600">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      tx.direction === 'Inbound' ? "text-emerald-500 bg-emerald-500/5" : "text-red-400 bg-red-400/5"
                    )}>
                      {tx.direction === 'Inbound' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {tx.direction}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 w-8">FROM</span>
                        <span className="text-[11px] text-gray-400">{formatAddress(tx.fromAddress)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 w-8">TO</span>
                        <span className="text-[11px] text-gray-400">{formatAddress(tx.toAddress)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-gray-100">{tx.amountFormatted.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-600 italic">{(tx.percentTotalSupply).toFixed(4)}% Supply</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", getRiskBadge(tx.riskLevel))}>
                        {tx.riskLevel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-400 hover:text-blue-400 hover:border-blue-400/30 transition-all font-sans"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

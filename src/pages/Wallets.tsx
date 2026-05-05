import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  ToggleLeft, 
  ToggleRight,
  Shield,
  Layers,
  Search,
  X,
  RefreshCw 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatAddress, formatNumber, cn } from '../lib/utils';
import { WalletType, Wallet } from '../types';
import { DEFAULT_WALLETS } from '../constants';

const walletSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  label: z.string().min(1, 'Label is required').max(50),
  walletType: z.nativeEnum(WalletType),
  alertsEnabled: z.boolean(),
});

type WalletForm = z.infer<typeof walletSchema>;

export default function Wallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WalletForm>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      walletType: WalletType.UNKNOWN,
      alertsEnabled: true
    }
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'wallets'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet));
      setWallets(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'wallets'));
    return unsub;
  }, []);

  const onSubmit = async (data: WalletForm) => {
    try {
      await addDoc(collection(db, 'wallets'), {
        ...data,
        isActive: true,
        naorisBalance: '0',
        ethBalance: '0',
        lastActivityAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setIsModalOpen(false);
      reset();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'wallets');
    }
  };

  const toggleWallet = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'wallets', id), { isActive: !current, updatedAt: Date.now() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `wallets/${id}`);
    }
  };

  const deleteWallet = async (id: string) => {
    if (confirm('Are you sure you want to remove this wallet from monitoring?')) {
      try {
        await deleteDoc(doc(db, 'wallets', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `wallets/${id}`);
      }
    }
  };

  const initializeDefaults = async () => {
    setIsInitializing(true);
    try {
      for (const w of DEFAULT_WALLETS) {
        // Check if already exists
        if (!wallets.some(existing => existing.address.toLowerCase() === w.address.toLowerCase())) {
          await addDoc(collection(db, 'wallets'), {
            address: w.address,
            label: w.label,
            walletType: w.walletType as WalletType,
            isActive: true,
            alertsEnabled: true,
            naorisBalance: '0',
            ethBalance: '0',
            lastActivityAt: null,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
      }
      alert('Network nodes initialized with default whale parameters.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'wallets');
    } finally {
      setIsInitializing(false);
    }
  };

  const filteredWallets = wallets.filter(w => 
    w.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Wallet Watchlist</h2>
          <p className="text-gray-400 mt-1">Manage entity addresses and classification.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={initializeDefaults}
            disabled={isInitializing}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isInitializing ? <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" /> : <Layers className="w-4 h-4" />}
            {isInitializing ? 'Initializing...' : 'Load Presets'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-brand-primary text-black rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Add Wallet
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input 
          type="text"
          placeholder="Search by label or address..."
          className="w-full bg-brand-card border border-white/10 rounded-2xl py-3 pl-11 pr-4 outline-none focus:border-brand-primary/50 transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-brand-card rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500">
              <th className="px-6 py-4 font-bold">Label & Type</th>
              <th className="px-6 py-4 font-bold">Address</th>
              <th className="px-6 py-4 font-bold text-center">Status</th>
              <th className="px-6 py-4 font-bold">NAORIS Balance</th>
              <th className="px-6 py-4 font-bold">Last Activity</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredWallets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No wallets found matching your search.
                </td>
              </tr>
            ) : (
              filteredWallets.map(wallet => (
                <tr key={wallet.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-brand-primary transition-colors">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{wallet.label}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">{wallet.walletType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-400 font-mono">{formatAddress(wallet.address)}</code>
                      <a 
                        href={`https://sepolia.etherscan.io/address/${wallet.address}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-gray-600 hover:text-blue-400 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button 
                        onClick={() => toggleWallet(wallet.id, wallet.isActive)}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all",
                          wallet.isActive ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                        )}
                      >
                        {wallet.isActive ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                        {wallet.isActive ? 'Active' : 'Paused'}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-brand-primary">
                      {formatNumber(Number(wallet.naorisBalance || 0))} N
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      {Number(wallet.ethBalance || 0).toFixed(4)} Ξ
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-400">
                      {wallet.lastActivityAt ? new Date(wallet.lastActivityAt).toLocaleDateString() : 'Never'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deleteWallet(wallet.id)}
                      className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-brand-card w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="font-bold text-lg">Add New Wallet</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                <input 
                  {...register('address')}
                  placeholder="0x..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-brand-primary/50 transition-all font-mono text-sm"
                />
                {errors.address && <p className="text-[10px] text-red-500 font-bold">{errors.address.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Label</label>
                <input 
                  {...register('label')}
                  placeholder="e.g. NAORIS Treasury"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-brand-primary/50 transition-all text-sm"
                />
                {errors.label && <p className="text-[10px] text-red-500 font-bold">{errors.label.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Classification</label>
                <select 
                  {...register('walletType')}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-brand-primary/50 transition-all text-sm appearance-none"
                >
                  {Object.values(WalletType).map(type => (
                    <option key={type} value={type} className="bg-brand-card">{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox"
                  {...register('alertsEnabled')}
                  className="w-4 h-4 accent-brand-primary"
                />
                <label className="text-sm text-gray-300">Enable real-time alerts</label>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-3 bg-brand-primary text-black font-black rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  START MONITORING
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

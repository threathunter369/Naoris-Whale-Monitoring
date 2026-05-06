import React from 'react';
import { motion } from 'motion/react';
import { Database, Info, ExternalLink } from 'lucide-react';

export default function Tokenomics() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Token Control Structure</h2>
        <p className="text-gray-400 mt-1">Official transparency report on NAORIS token distribution and major wallet oversight.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Image Card */}
        <div className="bg-brand-card rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-brand-primary" />
              <h3 className="font-bold text-sm uppercase tracking-widest text-gray-300">Architecture Visualization</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-500 uppercase">
              Updated: May 26, 2025
            </div>
          </div>
          
          <div className="p-1 bg-[#050505] relative group">
            {/* The Image */}
            <img 
              src="/naoris_token_control.png" 
              alt="NAORIS Token Control Structure" 
              className="w-full h-auto rounded-xl shadow-inner transition-all duration-700 group-hover:scale-[1.01]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/1200x1500/0a0a0a/10b981?text=Awaiting+Image+Upload\n(public/naoris_token_control.png)';
              }}
            />
            
            {/* Overlay Info */}
            <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <div className="flex items-center gap-2 text-brand-primary text-xs font-bold uppercase tracking-[0.2em]">
                 <Info className="w-4 h-4" />
                 Verified Network Protocol Data
               </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Text */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-brand-card p-8 rounded-2xl border border-white/5 space-y-4">
             <div className="flex items-center gap-3 mb-2">
               <div className="w-2 h-2 rounded-full bg-brand-primary" />
               <h4 className="font-bold text-lg">Centralization Analysis</h4>
             </div>
             <p className="text-gray-400 text-sm leading-relaxed">
               Current analysis indicates that <span className="text-white font-bold">~89%</span> of the total supply is controlled by the top four wallets. 
               This includes the primary Treasury, the DecubateVestingV3 contract, and strategic multisig layers.
             </p>
             <ul className="space-y-3 pt-4">
               <li className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span>Treasury Control: 40.6%</span>
               </li>
               <li className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span>Vesting Contracts: 33.8%</span>
               </li>
               <li className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span>Public Holders: 11.2%</span>
               </li>
             </ul>
          </div>

          <div className="bg-brand-card p-8 rounded-2xl border border-white/5 space-y-4">
             <div className="flex items-center gap-3 mb-2 text-orange-500">
               <div className="w-2 h-2 rounded-full bg-current" />
               <h4 className="font-bold text-lg">Risk Assessment</h4>
             </div>
             <p className="text-gray-400 text-sm leading-relaxed">
               Governance is managed through a professional multisig setup (Gnosis Safe Proxy). 
               While centralized, the structured and professional setup provides transparency compared to unverified anonymous wallets.
             </p>
             <div className="pt-4">
                <a 
                  href="https://naorisprotocol.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:underline cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Audit Documents
                </a>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

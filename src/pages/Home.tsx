import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Radar, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Lock, 
  ArrowRight, 
  ExternalLink,
  ChevronRight,
  Globe,
  Database,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-brand-primary selection:text-black">
      {/* Background Interlocking Grid */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#00FF41 1px, transparent 1px), linear-gradient(90deg, #00FF41 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      
      {/* Global Navigation Header (Absolute) */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Radar className="w-6 h-6 text-black" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tighter leading-none">NAORIS <span className="text-brand-primary italic">OPS</span></span>
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">
               <div className="w-1 h-1 rounded-full bg-brand-primary animate-pulse" />
               Live Surveillance Node
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <a href="#features" className="hover:text-brand-primary transition-colors">Heuristics</a>
            <a href="#architecture" className="hover:text-brand-primary transition-colors">Architecture</a>
            <a href="#advantages" className="hover:text-brand-primary transition-colors">Telemetry</a>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-6 py-2.5 border border-white/10 text-white rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-white/5 transition-all active:scale-95"
          >
            Terminal Access
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-black rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all active:scale-95"
          >
            Login / Register
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-8 overflow-hidden min-h-screen flex flex-col justify-center">
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[150px]" />

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-20">
            <div className="flex-1 space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary"
              >
                 <ShieldCheck className="w-3 h-3" /> Autonomous On-Chain Intelligence
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85]"
              >
                UNBREAKABLE <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-emerald-400 to-white">SURVEILLANCE</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl md:text-2xl text-gray-400 font-medium max-w-xl leading-snug"
              >
                The primary intelligence layer for NAORIS ecosystem tracking. Monitor whale movements, automate risk detection, and verify protocol state in real-time.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4 pt-4"
              >
                <button 
                   onClick={() => navigate('/dashboard')}
                   className="px-10 py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-primary hover:text-black transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] group"
                >
                  Initiate Scan <ChevronRight className="w-5 h-5 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
                  Watch Demo
                </button>
              </motion.div>

              <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/5 mt-16">
                {[
                  { label: "Daily Volume", val: "142M+" },
                  { label: "Active Monitors", val: "8.4K+" },
                  { label: "Uptime", val: "99.99%" }
                ].map((stat, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-white">{stat.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 relative group"
            >
               <div className="absolute -inset-4 bg-brand-primary/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-700" />
               <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden min-h-[500px] flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] mb-6">Security Layer Topology</p>
                    <div className="space-y-6">
                      {[
                        { label: 'Treasury Control', percent: '40.6%', color: 'bg-blue-500', amount: '1,623,724,385' },
                        { label: 'Vesting Contract', percent: '33.8%', color: 'bg-purple-500', amount: '1,352,405,586' },
                        { label: 'Gnosis Safe Proxy', percent: '7.85%', color: 'bg-emerald-500', amount: '313,999,975' },
                        { label: 'Secondary Multisig', percent: '6.55%', color: 'bg-amber-500', amount: '262,074,989' },
                      ].map((item, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between items-end">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                              <span className="text-xs font-black text-white">{item.percent}</span>
                           </div>
                           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: item.percent }}
                                transition={{ duration: 1.5, delay: 0.5 + (i * 0.1) }}
                                className={cn("h-full rounded-full", item.color)} 
                              />
                           </div>
                           <p className="text-[9px] font-mono text-gray-500">{item.amount} NAORIS</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                           <ShieldCheck className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Decentralized Monitoring</p>
                           <p className="text-[9px] text-gray-500 font-medium italic">89% of supply under active surveillance</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest">End-to-End Encryption Enabled</span>
                        <div className="flex-1 h-px bg-white/5" />
                     </div>
                  </div>

                  {/* Aesthetic Glitch overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/5 to-transparent pointer-events-none" />
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grids */}
      <section id="features" className="py-32 px-8 bg-white/5 relative border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20 space-y-4">
             <p className="text-brand-primary text-[10px] font-black uppercase tracking-[0.4em]">Integrated Telemetry</p>
             <h2 className="text-5xl font-black tracking-tight">MISSION CRITICAL <span className="text-gray-500 italic">SYSTEMS</span></h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Zap, 
                title: "Real-Time Telemetry", 
                desc: "Sub-second block processing with automated gas and network state extraction for every transaction.",
                accent: "text-blue-500"
              },
              { 
                icon: Radar, 
                title: "Whale Forensics", 
                desc: "Proprietary whale detection heuristics that track multisig dispersals and treasury deployments instantly.",
                accent: "text-brand-primary"
              },
              { 
                icon: Lock, 
                title: "Autonomous Rules", 
                desc: "Define custom triggers using our domain-specific sentinel engine. Monitor balance shifts and large transfers 24/7.",
                accent: "text-amber-500"
              },
              { 
                icon: ShieldCheck, 
                title: "Verified Proofs", 
                desc: "Direct integration with explorers for cryptographic verification of every alert generated by the system.",
                accent: "text-emerald-500"
              },
              { 
                icon: Globe, 
                title: "Decentralized Nodes", 
                desc: "High-availability RPC infrastructure ensures no single point of failure in our monitoring lifecycle.",
                accent: "text-indigo-500"
              },
              { 
                icon: Activity, 
                title: "Risk Analysis", 
                desc: "Behavioral modeling to predict protocol pressure based on vesting cliff schedules and treasury health.",
                accent: "text-rose-500"
              }
            ].map((f, i) => (
              <div key={i} className="p-10 border border-white/5 bg-black/40 rounded-[2rem] hover:border-brand-primary/30 transition-all group">
                <f.icon className={cn("w-10 h-10 mb-6 group-hover:scale-110 transition-transform", f.accent)} />
                <h3 className="text-xl font-black mb-4">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Infographic Section */}
      <section id="architecture" className="py-40 px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
             <div className="space-y-10 order-2 lg:order-1">
                <div className="space-y-4">
                  <h3 className="text-4xl font-black tracking-tight leading-none">PROTOCOL <br /> HIERARCHY <br /><span className="text-gray-600 italic">VISUALIZATION</span></h3>
                  <p className="text-gray-500 max-w-lg text-lg">Our structural analysis reveals the intricate balance of NAORIS token control. By monitoring major multisig wallets and vesting contracts, we provide an unparalleled view into the protocol's systemic risk and stability.</p>
                </div>
                
                <div className="space-y-8">
                  {[
                    { label: "Treasury Control", desc: "Real-time monitoring of primary and secondary multisig layers.", color: "bg-blue-500" },
                    { label: "Vesting Intelligence", desc: "Tracking lock systems and future unlock liquidity events.", color: "bg-purple-500" },
                    { label: "Public Distribution", desc: "Transparent breakdown of decentralized holder concentration.", color: "bg-teal-500" }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 items-start">
                       <div className={cn("w-1 h-12 shrink-0 rounded-full", item.color)} />
                       <div>
                          <p className="font-black text-sm uppercase tracking-wider mb-1">{item.label}</p>
                          <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                       </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="order-1 lg:order-2">
                <div className="relative group">
                  <div className="absolute -inset-px bg-gradient-to-br from-brand-primary to-transparent opacity-20 group-hover:opacity-40 transition-opacity blur-sm rounded-3xl" />
                  <img 
                    src="/naoris_token_control.png" 
                    alt="NAORIS Token Control Structure" 
                    className="w-full h-auto rounded-3xl shadow-2xl relative z-10 hover:shadow-brand-primary/20 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  {/* Digital pulse nodes on top of placeholder */}
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-brand-primary rounded-full animate-ping z-20" />
                  <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-blue-500 rounded-full animate-ping z-20" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Advantage Banner */}
      <section id="advantages" className="px-8 pb-32">
        <div className="max-w-6xl mx-auto rounded-[3rem] bg-gradient-to-br from-[#0a0a0a] to-[#050505] border border-white/10 p-16 md:p-24 relative overflow-hidden text-center">
           <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 blur-[120px] -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10 space-y-8">
              <Radar className="w-16 h-16 text-brand-primary mx-auto animate-pulse" />
              <h2 className="text-5xl md:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-none">READY TO OPERATE AT <span className="text-brand-primary italic"> SCALE?</span></h2>
              <p className="text-gray-400 text-xl max-w-2xl mx-auto">Join the Elite Nodes monitoring the frontlines of NAORIS ecosystem security. Free for individual analysts, enterprise-ready for protocols.</p>
              <div className="pt-8">
                 <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-12 py-6 bg-brand-primary text-black rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_50px_rgba(16,185,129,0.3)] active:scale-95"
                 >
                   Access Command Center
                 </button>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
           <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <Radar className="w-6 h-6 text-brand-primary" />
                <span className="font-black text-xl">NAORIS <span className="text-brand-primary italic">OPS</span></span>
              </div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">Decentralized Intelligence Network &copy; 2026</p>
           </div>
           
           <div className="flex gap-12 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <div className="space-y-4">
                 <p className="text-white">Protocols</p>
                 <a href="#" className="block hover:text-brand-primary transition-colors">Sentinel API</a>
                 <a href="#" className="block hover:text-brand-primary transition-colors">Risk Nodes</a>
              </div>
              <div className="space-y-4">
                 <p className="text-white">Legal</p>
                 <a href="#" className="block hover:text-brand-primary transition-colors">Privacy</a>
                 <a href="#" className="block hover:text-brand-primary transition-colors">Compliance</a>
              </div>
              <div className="space-y-4">
                 <p className="text-white">Network</p>
                 <a href="#" className="block hover:text-brand-primary transition-colors">Status</a>
                 <a href="#" className="block hover:text-brand-primary transition-colors">Log</a>
              </div>
           </div>

           <div className="pt-8 md:pt-0">
             <div className="flex gap-4">
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors"><Globe className="w-5 h-5 text-gray-500" /></div>
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors"><Database className="w-5 h-5 text-gray-500" /></div>
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors"><Search className="w-5 h-5 text-gray-500" /></div>
             </div>
           </div>
        </div>
      </footer>
    </div>
  );
}

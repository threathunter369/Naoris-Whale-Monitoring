import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  Bell, 
  Settings, 
  Radar,
  CircleAlert,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
        isActive 
          ? "bg-brand-primary/10 text-brand-primary" 
          : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
      )
    }
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </NavLink>
);

export default function Layout() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Login failed:", err);
      setAuthError(err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Auth failed:", err);
      setAuthError(err.message);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Radar className="w-12 h-12 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 relative overflow-hidden font-mono">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#00FF41 1px, transparent 1px), linear-gradient(90deg, #00FF41 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Ambient Glows */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />

        <div className="w-full max-w-md relative">
          {/* Metallic Border Container */}
          <div className="bg-brand-card border-x border-t border-white/10 rounded-t-[2.5rem] p-1 shadow-2xl relative overflow-hidden group">
            {/* Scanner Line */}
            <motion.div 
              initial={{ top: "0%" }}
              animate={{ top: "100%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatType: "reverse" }}
              className="absolute left-0 right-0 h-px bg-brand-primary/50 shadow-[0_0_15px_#10b981] z-20 pointer-events-none"
            />

            <div className="bg-[#0f0f0f] rounded-t-[2.3rem] p-8 pt-12 text-center space-y-8 border border-white/5 relative z-10">
              <div className="flex flex-col items-center gap-4">
                <motion.div 
                  className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] relative group animate-pulse"
                >
                  <Radar className="w-8 h-8 text-black" />
                  {/* Decorative corners */}
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-brand-primary" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-brand-primary" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-brand-primary" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-brand-primary" />
                </motion.div>

                <div className="space-y-1">
                  <h1 className="text-2xl font-black tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">NAORIS OPS</h1>
                  <div className="flex items-center gap-2 text-[8px] text-brand-primary font-bold uppercase tracking-[0.3em] justify-center opacity-80 italic">
                    <div className="w-1 h-1 rounded-full bg-brand-primary animate-ping" />
                    Secure Access Terminal
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {isRegister && (
                    <div className="relative group">
                      <input 
                        type="text" 
                        placeholder="OPERATOR NAME"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-[11px] text-brand-primary placeholder:text-gray-600 focus:outline-none focus:border-brand-primary transition-all font-mono"
                        required
                      />
                    </div>
                  )}
                  <div className="relative group">
                    <input 
                      type="email" 
                      placeholder="SECURE EMAIL"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-[11px] text-brand-primary placeholder:text-gray-600 focus:outline-none focus:border-brand-primary transition-all font-mono"
                      required
                    />
                  </div>
                  <div className="relative group">
                    <input 
                      type="password" 
                      placeholder="ACCESS KEY"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-[11px] text-brand-primary placeholder:text-gray-600 focus:outline-none focus:border-brand-primary transition-all font-mono"
                      required
                    />
                  </div>

                  {authError && (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight text-left pl-1">
                      {authError.includes('auth/invalid-credential') ? 'ACCESS DENIED: INVALID CREDENTIALS' : `ERROR: ${authError.toUpperCase()}`}
                    </p>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-brand-primary text-black py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-[0_5px_15px_rgba(16,185,129,0.2)] active:scale-[0.98] border-b-4 border-emerald-700"
                  >
                    {isRegister ? 'Register Signature' : 'Decrypt Session'}
                  </button>
                </form>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[9px] text-gray-600 font-bold tracking-widest uppercase">Encryption Mesh</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white/5 text-gray-300 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5 group relative overflow-hidden"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-3 h-3 grayscale group-hover:grayscale-0 transition-all" alt="G" />
                  <span>Google SSO Payload</span>
                </button>

                <p className="text-[10px] text-gray-500 pt-2">
                  {isRegister ? 'Already verified? ' : 'Awaiting identification? '}
                  <button 
                    onClick={() => setIsRegister(!isRegister)}
                    className="text-brand-primary font-bold hover:underline underline-offset-4"
                  >
                    {isRegister ? 'INITIATE LOGIN' : 'REQUEST ADMISSION'}
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Metallic Base */}
          <div className="bg-[#1a1a1a] border border-white/10 h-6 rounded-b-[2.5rem] mt-px shadow-2xl flex items-center justify-center gap-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="w-8 h-1 rounded-full bg-gray-700/50" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
          </div>

          <div className="mt-8 flex items-center justify-between px-4">
            <div className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">Encrypted Terminal Environment</div>
            <div className="flex gap-2">
              <div className="w-1 h-1 rounded-full bg-brand-primary" />
              <div className="w-1 h-1 rounded-full bg-brand-primary opacity-50" />
              <div className="w-1 h-1 rounded-full bg-brand-primary opacity-20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-bg text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col fixed h-full bg-brand-bg/50 backdrop-blur-xl z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Radar className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">NAORIS</h1>
            <p className="text-[10px] text-brand-primary font-bold uppercase tracking-widest">Whale Ops</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/wallets" icon={Wallet} label="Wallets" />
          <NavItem to="/transactions" icon={ArrowLeftRight} label="Transactions" />
          <NavItem to="/alerts" icon={Bell} label="Alerts" />
        </nav>

        <div className="px-4 py-6 border-t border-white/5 space-y-1">
          <NavItem to="/settings" icon={Settings} label="Settings" />
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all group mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
        
        {/* User Badge */}
        <div className="p-4 m-4 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 border border-white/10">
            {user.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <User className="w-full h-full p-1 text-gray-500" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold truncate">{user.displayName || 'Operator'}</p>
            <p className="text-[9px] text-gray-500 font-medium truncate uppercase tracking-tighter">Verified Agent</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}

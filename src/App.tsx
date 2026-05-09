/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { auth, googleProvider, signInWithPopup, db, collection, doc, onSnapshot, getDocs, query, where, Timestamp, serverTimestamp, handleFirestoreError, OperationType } from './lib/firebase.ts';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Wallet, Landmark, ArrowLeftRight, LayoutDashboard, Plus, LogOut, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dashboard } from './components/Dashboard.tsx';
import { Transactions } from './components/Transactions.tsx';
import { AssetsDebts } from './components/AssetsDebts.tsx';
import { Profile, Account, Transaction } from './types/index.ts';
import { cn } from './lib/utils.ts';

type View = 'dashboard' | 'transactions' | 'accounts';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Accounts
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'accounts'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];
      setAccounts(accData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'accounts');
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Transactions
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'transactions'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      // Sort by date descending
      setTransactions(transData.sort((a, b) => b.date.toMillis() - a.date.toMillis()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'transactions');
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0c] p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#121216] border border-slate-800 p-8 rounded-[32px] shadow-2xl max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-emerald-500 text-[#0a0a0c] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">DuitKu</h1>
          <p className="text-slate-400 mb-8">Kelola keuangan pribadi dengan simpel dan tersinkronisasi otomatis.</p>
          <button
            onClick={handleLogin}
            className="w-full bg-emerald-600 text-white py-4 px-6 rounded-2xl font-medium hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20"
          >
            Masuk dengan Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] pb-24 md:pb-0 md:pl-64">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[#121216] border-r border-slate-800 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-[#0a0a0c]">
            <Wallet className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">DuitKu</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
          <NavItem active={view === 'transactions'} onClick={() => setView('transactions')} icon={<ArrowLeftRight />} label="Transaksi" />
          <NavItem active={view === 'accounts'} onClick={() => setView('accounts')} icon={<Landmark />} label="Aset & Hutang" />
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-6">
            <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-slate-800" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'dashboard' && <Dashboard accounts={accounts} transactions={transactions} onNavigate={setView} />}
            {view === 'transactions' && <Transactions transactions={transactions} accounts={accounts} />}
            {view === 'accounts' && <AssetsDebts accounts={accounts} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-1 left-4 right-4 bg-[#121216] border border-slate-800 h-20 rounded-[24px] flex items-center justify-around px-4 z-50 shadow-2xl">
        <MobileNavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard />} label="Beranda" />
        <MobileNavItem active={view === 'transactions'} onClick={() => setView('transactions')} icon={<ArrowLeftRight />} label="Transaksi" />
        <MobileNavItem active={view === 'accounts'} onClick={() => setView('accounts')} icon={<Landmark />} label="Aset" />
      </nav>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
        active ? "bg-emerald-500/10 text-emerald-400" : "text-slate-500 hover:text-slate-300"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
      {label}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-emerald-400" : "text-slate-600"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
    </button>
  );
}

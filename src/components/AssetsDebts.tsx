import React, { useState } from 'react';
import { Account, AccountType } from '../types/index.ts';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType, deleteDoc, doc, auth } from '../lib/firebase.ts';
import { Landmark, Plus, Trash2, Wallet, X, CreditCard, TrendingUp, Banknote, ArrowLeftRight } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils.ts';
import { motion, AnimatePresence } from 'motion/react';

interface AssetsDebtsProps {
  accounts: Account[];
}

export function AssetsDebts({ accounts }: AssetsDebtsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('savings');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'accounts'), {
        name,
        type,
        balance: parseFloat(balance),
        ownerId: auth.currentUser.uid,
        lastUpdated: serverTimestamp()
      });
      setIsAdding(false);
      setName('');
      setBalance('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus akun ini? Transaksi yang terkait mungkin tidak akan sinkron.')) return;
    try {
      await deleteDoc(doc(db, 'accounts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'accounts');
    }
  };

  const assets = accounts.filter(a => ['savings', 'investment', 'cash'].includes(a.type));
  const debts = accounts.filter(a => ['loan', 'credit_card'].includes(a.type));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white">Daftar Aset & Hutang</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
        >
          <Plus className="w-4 h-4" /> Tambah Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assets Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
            <TrendingUp className="w-3 h-3" /> Rincian Aset
          </h3>
          <div className="space-y-3">
            {assets.length > 0 ? (
              assets.map(acc => (
                <AccountCard key={acc.id} account={acc} onDelete={handleDelete} />
              ))
            ) : (
              <div className="bg-[#121216] border border-slate-800 border-dashed p-10 rounded-3xl text-center text-slate-600">
                <p className="text-sm">Belum ada aset terdaftar</p>
              </div>
            )}
          </div>
        </div>

        {/* Debts Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
            <CreditCard className="w-3 h-3" /> Rincian Hutang
          </h3>
          <div className="space-y-3">
            {debts.length > 0 ? (
              debts.map(acc => (
                <AccountCard key={acc.id} account={acc} onDelete={handleDelete} />
              ))
            ) : (
              <div className="bg-[#121216] border border-slate-800 border-dashed p-10 rounded-3xl text-center text-slate-600">
                <p className="text-sm">Belum ada hutang terdaftar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#121216] border border-slate-800 w-full max-w-md rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white">Tambah Akun</h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Akun</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="BCA, Dompet, Investasi..."
                    className="w-full bg-[#1a1a21] text-white border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tipe</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as AccountType)}
                    className="w-full bg-[#1a1a21] text-white border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium appearance-none"
                  >
                    <option value="savings">Tabungan / Bank</option>
                    <option value="cash">Uang Tunai</option>
                    <option value="investment">Investasi</option>
                    <option value="loan">Pinjaman</option>
                    <option value="credit_card">Kartu Kredit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Saldo Awal</label>
                  <input
                    required
                    type="number"
                    value={balance}
                    onChange={e => setBalance(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#1a1a21] text-white border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium placeholder:text-slate-600"
                  />
                  {balance && (
                    <p className="mt-2 text-xs font-medium text-emerald-400">
                      Preview: {formatCurrency(Number(balance))}
                    </p>
                  )}
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Simpan Akun
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountCard({ account, onDelete }: { account: Account, onDelete: (id: string) => void | Promise<void>, key?: string }) {
  return (
    <div className="bg-[#121216] border border-slate-800 p-5 rounded-2xl group flex items-center justify-between hover:border-slate-700 transition-all shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#1a1a21] border border-slate-800 rounded-2xl flex items-center justify-center">
          <AccountIcon type={account.type} />
        </div>
        <div>
          <p className="font-bold text-white leading-tight">{account.name}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{account.type}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <p className={cn(
          "text-lg font-bold tabular-nums",
          ['loan', 'credit_card'].includes(account.type) ? "text-rose-400" : "text-white"
        )}>
          {formatCurrency(account.balance)}
        </p>
        <button 
          onClick={() => onDelete(account.id)}
          className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-rose-500 transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function AccountIcon({ type }: { type: string }) {
  switch (type) {
    case 'savings': return <Landmark className="w-5 h-5 text-emerald-400" />;
    case 'investment': return <TrendingUp className="w-5 h-5 text-purple-400" />;
    case 'cash': return <Banknote className="w-5 h-5 text-blue-400" />;
    case 'loan': return <ArrowLeftRight className="w-5 h-5 text-orange-400" />;
    case 'credit_card': return <CreditCard className="w-5 h-5 text-rose-400" />;
    default: return <Wallet className="w-5 h-5 text-slate-400" />;
  }
}

function Loader2({ className }: { className?: string }) {
  return <Plus className={cn("animate-spin", className)} />;
}

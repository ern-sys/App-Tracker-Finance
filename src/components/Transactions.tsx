import React, { useState } from 'react';
import { Transaction, Account, TransactionType } from '../types/index.ts';
import { db, collection, addDoc, updateDoc, doc, serverTimestamp, handleFirestoreError, OperationType, auth, deleteDoc, Timestamp } from '../lib/firebase.ts';
import { Plus, X, Search, Filter, TrendingUp, TrendingDown, ArrowLeftRight, Trash2, Calendar, Tag, CreditCard } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils.ts';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface TransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
}

export function Transactions({ transactions, accounts }: TransactionsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const filteredTransactions = transactions.filter(t => 
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !accountId) return;

    setLoading(true);
    try {
      const numAmount = parseFloat(amount);
      const selectedAccount = accounts.find(a => a.id === accountId);
      
      if (!selectedAccount) throw new Error("Akun tidak ditemukan");

      // 1. Create Transaction
      await addDoc(collection(db, 'transactions'), {
        amount: numAmount,
        type,
        category,
        accountId,
        description,
        date: Timestamp.fromDate(new Date(date)),
        ownerId: auth.currentUser.uid
      });

      // 2. Update Account Balance
      let newBalance = selectedAccount.balance;
      if (type === 'income') newBalance += numAmount;
      if (type === 'expense') newBalance -= numAmount;
      // Transfer logic could be more complex, keeping it simple:
      // In this simple app, we treat transfer as a special category for now 
      // or implement dual-entry if needed. Let's stick to simple Income/Expense.

      await updateDoc(doc(db, 'accounts', accountId), {
        balance: newBalance,
        lastUpdated: serverTimestamp()
      });

      setIsAdding(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (t: Transaction) => {
    if (!confirm('Hapus transaksi ini? Saldo akun tidak akan otomatis terkoreksi.')) return;
    try {
      await deleteDoc(doc(db, 'transactions', t.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'transactions');
    }
  };

  const resetForm = () => {
    setAmount('');
    setType('expense');
    setCategory('');
    setAccountId('');
    setDescription('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-white">Riwayat Transaksi</h2>
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Cari transaksi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#121216] text-white border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-600"
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Tambah Transaksi
          </button>
        </div>
      </div>

      <div className="bg-[#121216] border border-slate-800 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1a21]">
                <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal</th>
                <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Keterangan</th>
                <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kategori</th>
                <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Akun</th>
                <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Jumlah</th>
                <th className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-[#1a1a21]/50 transition-colors group">
                    <td className="p-6 text-sm text-slate-500 whitespace-nowrap">
                      {format(t.date.toDate(), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-bold text-white">{t.description || '-'}</p>
                    </td>
                    <td className="p-6 text-sm">
                      <span className="bg-[#1a1a21] border border-slate-800 px-3 py-1 rounded-full text-slate-400 font-medium">{t.category}</span>
                    </td>
                    <td className="p-6 text-sm text-slate-500">
                      {accounts.find(a => a.id === t.accountId)?.name || 'Unknown'}
                    </td>
                    <td className={cn(
                      "p-6 text-sm font-bold text-right whitespace-nowrap",
                      t.type === 'income' ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => handleDelete(t)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-rose-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-500 italic">
                    Belum ada transaksi yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
              className="relative bg-[#121216] border border-slate-800 w-full max-w-lg rounded-[32px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white">Catat Transaksi</h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex p-1 bg-[#1a1a21] border border-slate-800 rounded-2xl">
                  <TransactionTypeTab active={type === 'expense'} label="Pengeluaran" onClick={() => setType('expense')} color="rose" />
                  <TransactionTypeTab active={type === 'income'} label="Pemasukan" onClick={() => setType('income')} color="emerald" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Tag className="w-3 h-3" /> Kategori
                    </label>
                    <select
                      required
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-[#1a1a21] text-white border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium appearance-none"
                    >
                      <option value="">Pilih Kategori</option>
                      {type === 'expense' ? (
                        <>
                          <option value="Makan & Minum">Makan & Minum</option>
                          <option value="Transportasi">Transportasi</option>
                          <option value="Belanja">Belanja</option>
                          <option value="Hiburan">Hiburan</option>
                          <option value="Tagihan">Tagihan</option>
                          <option value="Kesehatan">Kesehatan</option>
                          <option value="Lainnya">Lainnya</option>
                        </>
                      ) : (
                        <>
                          <option value="Gaji">Gaji</option>
                          <option value="Bonus">Bonus</option>
                          <option value="Investasi">Investasi</option>
                          <option value="Lainnya">Lainnya</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <CreditCard className="w-3 h-3" /> Akun
                    </label>
                    <select
                      required
                      value={accountId}
                      onChange={e => setAccountId(e.target.value)}
                      className="w-full bg-[#1a1a21] text-white border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium appearance-none"
                    >
                      <option value="">Pilih Akun</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Jumlah (Rp)</label>
                  <input
                    required
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#1a1a21] text-white border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-2xl font-bold placeholder:text-slate-600"
                  />
                  {amount && (
                    <p className="mt-2 text-xs font-medium text-emerald-400">
                      Konfirmasi: {formatCurrency(Number(amount))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Tanggal
                  </label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-[#1a1a21] text-white border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Keterangan (Opsional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Misal: Makan siang di warung"
                    className="w-full bg-[#1a1a21] text-white border border-slate-800 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium placeholder:text-slate-600"
                  />
                </div>

                <button
                  disabled={loading || accounts.length === 0}
                  type="submit"
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20",
                    type === 'income' ? "bg-emerald-600 text-white" : "bg-rose-500 text-white",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
                {accounts.length === 0 && (
                  <p className="text-center text-xs text-rose-400 font-medium">Tambah akun/aset terlebih dahulu!</p>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TransactionTypeTab({ active, label, onClick, color }: { active: boolean, label: string, onClick: () => void, color: 'rose' | 'emerald' }) {
  const activeStyles = {
    rose: "bg-[#121216] text-rose-500 shadow-sm border border-slate-800",
    emerald: "bg-[#121216] text-emerald-400 shadow-sm border border-slate-800"
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
        active ? activeStyles[color] : "text-slate-500"
      )}
    >
      {label}
    </button>
  );
}

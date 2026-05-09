import React from 'react';
import { Account, Transaction } from '../types/index.ts';
import { formatCurrency, cn } from '../lib/utils.ts';
import { TrendingUp, TrendingDown, Wallet, ArrowRight, CreditCard, Landmark, Banknote, ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  onNavigate: (view: 'dashboard' | 'transactions' | 'accounts') => void;
}

export function Dashboard({ accounts, transactions, onNavigate }: DashboardProps) {
  const totalAssets = accounts
    .filter(a => ['savings', 'investment', 'cash'].includes(a.type))
    .reduce((sum, a) => sum + a.balance, 0);
  
  const totalDebts = accounts
    .filter(a => ['loan', 'credit_card'].includes(a.type))
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const netWorth = totalAssets - totalDebts;

  const recentTransactions = transactions.slice(0, 5);

  const pieData = [
    { name: 'Aset', value: totalAssets, color: '#10b981' }, // Emerald-500
    { name: 'Hutang', value: totalDebts, color: '#f43f5e' }, // Rose-500
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Ringkasan Keuangan</h1>
          <p className="text-slate-400 text-sm">Dashboard akun finansial Anda</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Cloud Sync Aktif</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Kekayaan Bersih" 
          value={netWorth} 
          icon={<Wallet />} 
          color="emerald"
        />
        <StatCard 
          title="Total Aset" 
          value={totalAssets} 
          icon={<TrendingUp />} 
          color="blue"
        />
        <StatCard 
          title="Total Hutang" 
          value={totalDebts} 
          icon={<TrendingDown />} 
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Composition Chart */}
        <div className="bg-[#121216] border border-slate-800 p-8 rounded-[32px] shadow-sm">
          <h3 className="text-lg font-bold text-white mb-6">Komposisi Keuangan</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1a1a21', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-slate-400 font-sans">Aset</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-sm font-medium text-slate-400 font-sans">Hutang</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#121216] border border-slate-800 p-8 rounded-[32px] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Transaksi Terakhir</h3>
            <button 
              onClick={() => onNavigate('transactions')}
              className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1 hover:underline"
            >
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-[#1a1a21] border border-slate-800/50 rounded-2xl hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      t.type === 'income' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.description || t.category}</p>
                      <p className="text-xs text-slate-500">{t.date.toDate().toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <p className={cn(
                    "text-sm font-bold",
                    t.type === 'income' ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p>Belum ada transaksi</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assets Overview */}
      <div className="bg-[#121216] border border-slate-800 p-8 rounded-[32px] shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-white">Aset & Hutang</h3>
          <button 
            onClick={() => onNavigate('accounts')}
            className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1 hover:underline"
          >
            Kelola Akun <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.length > 0 ? (
            accounts.map((acc) => (
              <div key={acc.id} className="bg-[#1a1a21] border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <AccountIcon type={acc.type} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{acc.type}</span>
                </div>
                <p className="font-bold text-white mb-1">{acc.name}</p>
                <p className={cn(
                  "text-lg font-bold",
                  ['loan', 'credit_card'].includes(acc.type) ? "text-rose-400" : "text-emerald-400"
                )}>
                  {formatCurrency(acc.balance)}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
              <p>Belum ada aset terdaftar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: 'emerald' | 'blue' | 'rose' }) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    rose: "bg-rose-500/10 text-rose-400"
  };

  return (
    <div className="bg-[#1a1a21] border border-slate-800 p-8 rounded-[32px] shadow-sm">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", colors[color])}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 font-sans">{title}</p>
      <p className="text-2xl font-bold tracking-tight text-white">{formatCurrency(Math.abs(value))}</p>
    </div>
  );
}

function AccountIcon({ type }: { type: string }) {
  switch (type) {
    case 'savings': return <Landmark className="w-4 h-4 text-emerald-400" />;
    case 'investment': return <TrendingUp className="w-4 h-4 text-purple-400" />;
    case 'cash': return <Banknote className="w-4 h-4 text-blue-400" />;
    case 'loan': return <ArrowLeftRight className="w-4 h-4 text-orange-400" />;
    case 'credit_card': return <CreditCard className="w-4 h-4 text-rose-400" />;
    default: return <Wallet className="w-4 h-4 text-slate-400" />;
  }
}

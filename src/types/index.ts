import { Timestamp } from 'firebase/firestore';

export type AccountType = 'savings' | 'investment' | 'cash' | 'loan' | 'credit_card';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Profile {
  uid: string;
  displayName: string;
  email: string;
  currency: string;
  createdAt: Timestamp;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  ownerId: string;
  lastUpdated: Timestamp;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  category: string;
  date: Timestamp;
  accountId: string;
  ownerId: string;
}

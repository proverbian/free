import { ExpenseCategory as SupExpenseCategory, IncomeSource as SupIncomeSource } from "@/lib/supabase/types";

export type ExpenseCategory = SupExpenseCategory;

export type IncomeSource = SupIncomeSource;

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  note?: string | null;
  occurredAt: string;
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  source: IncomeSource;
  note?: string | null;
  occurredAt: string;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface UserProfile {
  displayName?: string | null;
  avatarUrl?: string | null;
  currency?: string | null;
}

export type OfflineAction =
  | {
      type: "expense";
      payload: {
        userId: string;
        amount: number;
        category: ExpenseCategory;
        note?: string | null;
        occurredAt?: string | Date;
      };
    }
  | {
      type: "income";
      payload: {
        userId: string;
        amount: number;
        source: IncomeSource;
        note?: string | null;
        occurredAt?: string | Date;
      };
    };

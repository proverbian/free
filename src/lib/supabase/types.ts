export type ExpenseCategory =
  | "GROCERIES"
  | "UTILITIES"
  | "MAINTENANCE"
  | "MISC"
  | "LOANS"
  | "SUBSCRIPTIONS"
  | "SAVINGS"
  | "INSURANCE"
  | "TUITIONS"
  | "ALLOWANCES";

export type IncomeSource = "SALARY" | "INVESTMENT" | "OTHER";

export interface ExpenseRow {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  note: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeRow {
  id: string;
  userId: string;
  amount: number;
  source: IncomeSource;
  note: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileRow {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Database {
  public: {
    Tables: {
      Expense: {
        Row: ExpenseRow;
        Insert: ExpenseRow;
        Update: Partial<ExpenseRow> & { id?: string };
      };
      Income: {
        Row: IncomeRow;
        Insert: IncomeRow;
        Update: Partial<IncomeRow> & { id?: string };
      };
      Profile: {
        Row: ProfileRow;
        Insert: ProfileRow;
        Update: Partial<ProfileRow> & { id?: string };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

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

export type ExpenseInsert = {
  id?: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  note?: string | null;
  occurredAt: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ExpenseUpdate = {
  id?: string;
  userId?: string;
  amount?: number;
  category?: ExpenseCategory;
  note?: string | null;
  occurredAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

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

export type IncomeInsert = {
  id?: string;
  userId: string;
  amount: number;
  source: IncomeSource;
  note?: string | null;
  occurredAt: string;
  createdAt?: string;
  updatedAt?: string;
};

export type IncomeUpdate = {
  id?: string;
  userId?: string;
  amount?: number;
  source?: IncomeSource;
  note?: string | null;
  occurredAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface ProfileRow {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export type ProfileInsert = {
  id?: string;
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProfileUpdate = {
  id?: string;
  userId?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AnyTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: Relationship[];
};

type AnyView =
  | {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
      Relationships: Relationship[];
    }
  | {
      Row: Record<string, unknown>;
      Relationships: Relationship[];
    };

type AnyFunction = {
  Args: Record<string, unknown> | never;
  Returns: unknown;
};

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export interface Database {
  public: {
    Tables: Record<string, AnyTable> & {
      Expense: {
        Row: ExpenseRow;
        Insert: ExpenseInsert;
        Update: ExpenseUpdate;
        Relationships: [];
      };
      Income: {
        Row: IncomeRow;
        Insert: IncomeInsert;
        Update: IncomeUpdate;
        Relationships: [];
      };
      Profile: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, AnyView>;
    Functions: Record<string, AnyFunction>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

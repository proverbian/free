'use client';

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Bell,
  ChartLine,
  Download,
  Layers,
  LayoutDashboard,
  List,
  LogOut,
  Plus,
  PiggyBank,
  User,
  Wallet,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Expense, ExpenseCategory, Income, IncomeSource, UserProfile } from "@/lib/types";
import { enqueueOfflineAction, flushOfflineQueue } from "@/lib/offline-queue";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, incomeSchema } from "@/lib/validation";
import type { ExpenseInput, IncomeInput } from "@/lib/validation";
import { format } from "date-fns";

type View = "dashboard" | "budget" | "expenses" | "expense" | "income" | "profile";

interface DashboardProps {
  user: { id: string; email?: string | null };
  initialExpenses: Expense[];
  initialIncomes: Income[];
  profile: UserProfile | null;
}

const expenseCategories: { label: string; value: ExpenseCategory }[] = [
  { label: "Groceries", value: "GROCERIES" },
  { label: "Utilities", value: "UTILITIES" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Misc", value: "MISC" },
  { label: "Loans", value: "LOANS" },
  { label: "Subscriptions", value: "SUBSCRIPTIONS" },
  { label: "Savings", value: "SAVINGS" },
  { label: "Insurance", value: "INSURANCE" },
  { label: "Tuitions", value: "TUITIONS" },
  { label: "Allowances", value: "ALLOWANCES" },
];

const incomeSources: { label: string; value: IncomeSource }[] = [
  { label: "Salary", value: "SALARY" },
  { label: "Investments", value: "INVESTMENT" },
  { label: "Other", value: "OTHER" },
];

export function Dashboard({ user, initialExpenses, initialIncomes, profile }: DashboardProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses ?? []);
  const [incomes, setIncomes] = useState<Income[]>(initialIncomes ?? []);
  const [status, setStatus] = useState<string | null>(null);
  const [settingsState, setSettingsState] = useState<UserProfile>(
    profile ?? { displayName: "", avatarUrl: "", currency: "USD" },
  );
  const [online, setOnline] = useState(true);
  const displayName = settingsState.displayName?.trim() || profile?.displayName || user.email || "Account";

  const expenseForm = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: "GROCERIES", amount: 0, note: "", occurredAt: undefined, recurring: false, interval: "MONTHLY" },
  });

  const incomeForm = useForm<IncomeInput>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { source: "SALARY", amount: 0, note: "", occurredAt: undefined, recurring: false, interval: "MONTHLY" },
  });

  const expenseRecurring = expenseForm.watch("recurring");
  const incomeRecurring = incomeForm.watch("recurring");

  useEffect(() => {
    flushOfflineQueue();
    if (typeof navigator !== "undefined") {
      setOnline(navigator.onLine);
      const goOnline = () => setOnline(true);
      const goOffline = () => setOnline(false);
      window.addEventListener("online", goOnline);
      window.addEventListener("offline", goOffline);
      return () => {
        window.removeEventListener("online", goOnline);
        window.removeEventListener("offline", goOffline);
      };
    }
  }, []);

  const summary = useMemo(() => {
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [expenses, incomes]);

  const chartData = useMemo(() => {
    const grouped = new Map<string, { income: number; expense: number }>();
    incomes.forEach((i) => {
      const key = format(new Date(i.occurredAt), "MMM dd");
      grouped.set(key, { income: (grouped.get(key)?.income ?? 0) + i.amount, expense: grouped.get(key)?.expense ?? 0 });
    });
    expenses.forEach((e) => {
      const key = format(new Date(e.occurredAt), "MMM dd");
      grouped.set(key, { income: grouped.get(key)?.income ?? 0, expense: (grouped.get(key)?.expense ?? 0) + e.amount });
    });
    return Array.from(grouped.entries()).map(([name, values]) => ({ name, ...values }));
  }, [expenses, incomes]);

  async function refreshDashboard() {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setExpenses(data.expenses ?? []);
      setIncomes(data.incomes ?? []);
    } catch (error) {
      console.error("Refresh failed", error);
    }
  }

  async function submitExpense(values: ExpenseInput) {
    const payload = {
      ...values,
      amount: Number(values.amount),
      occurredAt: values.recurring ? undefined : values.occurredAt ?? undefined,
    };
    try {
      const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
      if (!isOnline) {
        await enqueueOfflineAction({ type: "expense", payload: { ...payload, userId: user.id } });
        setStatus("Offline: expense queued");
      } else {
        const res = await fetch("/api/expense", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Save failed");
        setStatus("Expense saved");
      }
      expenseForm.reset();
      await refreshDashboard();
      setActiveView("expenses");
    } catch (error) {
      console.error(error);
      setStatus("Could not save expense");
    }
  }

  async function submitIncome(values: IncomeInput) {
    const payload = {
      ...values,
      amount: Number(values.amount),
      occurredAt: values.recurring ? undefined : values.occurredAt ?? undefined,
    };
    try {
      const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
      if (!isOnline) {
        await enqueueOfflineAction({ type: "income", payload: { ...payload, userId: user.id } });
        setStatus("Offline: income queued");
      } else {
        const res = await fetch("/api/income", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Save failed");
        setStatus("Income saved");
      }
      incomeForm.reset();
      await refreshDashboard();
      setActiveView("budget");
    } catch (error) {
      console.error(error);
      setStatus("Could not save income");
    }
  }

  async function saveProfile() {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsState),
      });
      if (!res.ok) throw new Error("Profile update failed");
      setStatus("Profile saved");
    } catch (error) {
      console.error(error);
      setStatus("Profile save failed");
    }
  }

  async function exportData() {
    const rows = [
      "type,date,amount,category_or_source,note",
      ...expenses.map((e) =>
        ["expense", e.occurredAt, e.amount.toFixed(2), e.category, (e.note ?? "").replace(/,/g, ";")].join(","),
      ),
      ...incomes.map((i) =>
        ["income", i.occurredAt, i.amount.toFixed(2), i.source, (i.note ?? "").replace(/,/g, ";")].join(","),
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "budget-export.csv";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Exported CSV");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  const sidebarItems: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "budget", label: "Budget", icon: <Wallet className="w-4 h-4" /> },
    { key: "expenses", label: "Expenses", icon: <List className="w-4 h-4" /> },
    { key: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { key: "expense", label: "Add expense", icon: <Wallet className="w-4 h-4" /> },
    { key: "income", label: "Add income", icon: <PiggyBank className="w-4 h-4" /> },
  ];

  const mobileNavItems: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { key: "budget", label: "Budget", icon: <Wallet className="w-5 h-5" /> },
    { key: "expenses", label: "Expenses", icon: <List className="w-5 h-5" /> },
    { key: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950">
      <aside
        className="hidden lg:block lg:static lg:w-64 bg-slate-900/70 border-r border-slate-800 px-4 py-5"
      >
        <div className="flex items-center gap-2 mb-6">
          <Image src="/logo.svg" alt="F.R.E.E Financial Program" className="h-9 w-9" width={36} height={36} />
          <div>
            <p className="text-xs text-slate-400">{process.env.APP_NAME ?? "F.R.E.E"}</p>
            <p className="font-semibold">Financial Program</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveView(item.key);
              }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                activeView === item.key ? "bg-sky-500/20 text-sky-200" : "hover:bg-slate-800"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-left text-rose-300 hover:bg-rose-500/15"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </nav>
      </aside>

      <main className="flex-1 min-h-screen pb-24 lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-slate-950/70 backdrop-blur px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="font-semibold">{displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
              <Bell className="w-4 h-4" />
              <span>Budgeting stays in sync</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 border border-slate-800 text-xs">
              <Activity className="w-3 h-3 text-emerald-400" />
                {online ? "Online" : "Offline"}
            </div>
          </div>
        </header>

        <section className="p-4 sm:p-6 flex flex-col gap-6">
          {status && (
            <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 px-4 py-2 rounded-xl">
              {status}
            </div>
          )}

          {activeView === "dashboard" && (
            <div className="flex flex-col gap-6">
              <div className="glass-card p-5">
                <p className="text-sm text-slate-400">Welcome</p>
                <h2 className="text-2xl font-semibold">{displayName}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={<LayoutDashboard className="w-4 h-4" />} label="Income" value={summary.totalIncome} tone="success" />
                <StatCard icon={<Wallet className="w-4 h-4" />} label="Expense" value={summary.totalExpense} tone="warning" />
                <StatCard icon={<ChartLine className="w-4 h-4" />} label="Balance" value={summary.balance} tone="sky" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="glass-card p-4 lg:col-span-2 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Income vs Expense
                    </h3>
                    <button
                      onClick={exportData}
                      className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm border border-slate-800 hover:border-slate-700"
                    >
                      <Download className="w-4 h-4" /> Export CSV
                    </button>
                  </div>
                  <div className="h-72 min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={chartData} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1f2937" }} />
                        <Legend />
                        <Bar dataKey="income" fill="#22c55e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="expense" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-4 flex flex-col gap-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Insights
                  </h3>
                  <p className="text-sm text-slate-400">Keep your income and expenses updated to see trends here.</p>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm">
                    <div className="flex items-center gap-2 font-semibold mb-2">
                      <Activity className="w-4 h-4 text-emerald-400" /> Quick stats
                    </div>
                    <ul className="list-disc ml-5 space-y-1 text-slate-300">
                      <li>Recent balance: {summary.balance.toFixed(2)}</li>
                      <li>Top expense category: {expenses[0]?.category ?? "N/A"}</li>
                      <li>Income events tracked: {incomes.length}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <HistoryCard title="Recent expenses" items={expenses.slice(0, 6)} type="expense" />
                <HistoryCard title="Recent income" items={incomes.slice(0, 6)} type="income" />
              </div>

              <div className="glass-card p-4 min-w-0">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <ChartLine className="w-4 h-4" /> Trend line
                </h3>
                <div className="h-64 min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={chartData} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1f2937" }} />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="expense" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeView === "budget" && (
            <div className="flex flex-col gap-4">
              <div className="glass-card p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Budget</p>
                  <h2 className="text-2xl font-semibold">Track and add income</h2>
                  <p className="text-sm text-slate-400">Quickly log income to keep your budget current.</p>
                </div>
                <button
                  onClick={() => setActiveView("income")}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 text-slate-950 px-4 py-2 text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add income
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <StatCard icon={<LayoutDashboard className="w-4 h-4" />} label="Income" value={summary.totalIncome} tone="success" />
              </div>

              <HistoryCard title="Recent income" items={incomes.slice(0, 6)} type="income" />
            </div>
          )}

          {activeView === "expenses" && (
            <div className="flex flex-col gap-4">
              <div className="glass-card p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Expenses</p>
                  <h2 className="text-2xl font-semibold">All expense transactions</h2>
                  <p className="text-sm text-slate-400">Every expense logged in your budget.</p>
                </div>
                <button
                  onClick={() => setActiveView("expense")}
                  className="flex items-center gap-2 rounded-full bg-slate-900/70 border border-slate-800 px-4 py-2 text-sm font-semibold"
                >
                  <Wallet className="w-4 h-4" />
                  Add expense
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <StatCard icon={<Wallet className="w-4 h-4" />} label="Total expenses" value={summary.totalExpense} tone="warning" />
              </div>

              <HistoryCard title="All expenses" items={expenses} type="expense" />
            </div>
          )}

          {activeView === "expense" && (
            <FormCard
              title="Add expense"
              icon={<Wallet className="w-4 h-4" />}
              onSubmit={expenseForm.handleSubmit((values) => submitExpense(values))}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2 text-sm">
                  <span>Amount</span>
                  <input
                    type="number"
                    step="0.01"
                    {...expenseForm.register("amount", { valueAsNumber: true })}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>Category</span>
                  <select
                    {...expenseForm.register("category")}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                  >
                    {expenseCategories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    {...expenseForm.register("recurring")}
                    className="h-4 w-4 rounded border border-slate-700 bg-slate-900"
                  />
                  <span>Recurring</span>
                </label>
                {expenseRecurring ? (
                  <label className="flex flex-col gap-2 text-sm">
                    <span>Interval</span>
                    <select
                      {...expenseForm.register("interval")}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                    >
                      <option value="WEEKLY">Weekly</option>
                      <option value="BI_WEEKLY">Bi-weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </label>
                ) : (
                  <label className="flex flex-col gap-2 text-sm">
                    <span>Date (optional)</span>
                    <input
                      type="date"
                      {...expenseForm.register("occurredAt", {
                        setValueAs: (value) => (value ? new Date(value) : undefined),
                      })}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                    />
                  </label>
                )}
                <label className="flex flex-col gap-2 text-sm">
                  <span>Note</span>
                  <input
                    type="text"
                    {...expenseForm.register("note")}
                    placeholder="Optional memo"
                    className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="mt-4 h-11 w-full sm:w-auto rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-semibold px-5"
              >
                Save expense
              </button>
            </FormCard>
          )}

          {activeView === "income" && (
            <FormCard
              title="Add income"
              icon={<PiggyBank className="w-4 h-4" />}
              onSubmit={incomeForm.handleSubmit((values) => submitIncome(values))}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2 text-sm">
                  <span>Amount</span>
                  <input
                    type="number"
                    step="0.01"
                    {...incomeForm.register("amount", { valueAsNumber: true })}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>Source</span>
                  <select
                    {...incomeForm.register("source")}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                  >
                    {incomeSources.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    {...incomeForm.register("recurring")}
                    className="h-4 w-4 rounded border border-slate-700 bg-slate-900"
                  />
                  <span>Recurring</span>
                </label>
                {incomeRecurring ? (
                  <label className="flex flex-col gap-2 text-sm">
                    <span>Interval</span>
                    <select
                      {...incomeForm.register("interval")}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                    >
                      <option value="WEEKLY">Weekly</option>
                      <option value="BI_WEEKLY">Bi-weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </label>
                ) : (
                  <label className="flex flex-col gap-2 text-sm">
                    <span>Date (optional)</span>
                    <input
                      type="date"
                      {...incomeForm.register("occurredAt", {
                        setValueAs: (value) => (value ? new Date(value) : undefined),
                      })}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                    />
                  </label>
                )}
                <label className="flex flex-col gap-2 text-sm">
                  <span>Note</span>
                  <input
                    type="text"
                    {...incomeForm.register("note")}
                    placeholder="Optional memo"
                    className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="mt-4 h-11 w-full sm:w-auto rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-slate-950 font-semibold px-5"
              >
                Save income
              </button>
            </FormCard>
          )}

          {activeView === "profile" && (
            <div className="glass-card p-6 flex flex-col gap-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Profile</h2>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                <span>Display name</span>
                <input
                  type="text"
                  value={settingsState.displayName ?? ""}
                  onChange={(e) => setSettingsState((s) => ({ ...s, displayName: e.target.value }))}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span>Currency</span>
                <input
                  type="text"
                  value={settingsState.currency ?? ""}
                  onChange={(e) => setSettingsState((s) => ({ ...s, currency: e.target.value }))}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <ProfileField label="Email" value={user.email ?? "-"} />
                <ProfileField label="Currency" value={profile?.currency ?? "USD"} />
                <ProfileField label="User ID" value={user.id} copyable />
              </div>
              <button
                onClick={saveProfile}
                className="h-11 w-full sm:w-auto rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-semibold px-5"
              >
                Save profile
              </button>
            </div>
          )}
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-950/90 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4">
          {mobileNavItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key)}
              className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
                activeView === item.key ? "text-sky-200" : "text-slate-400"
              }`}
              aria-label={item.label}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                  activeView === item.key ? "bg-sky-500/20" : "bg-slate-900/70"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "success" | "warning" | "sky";
}) {
  const colors = {
    success: "from-emerald-500/20 to-emerald-400/10",
    warning: "from-amber-500/20 to-amber-400/10",
    sky: "from-sky-500/20 to-sky-400/10",
  } as const;
  return (
    <div className={`glass-card p-4 border border-slate-800 bg-gradient-to-br ${colors[tone]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-300">{label}</p>
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">{icon}</div>
      </div>
      <p className="text-3xl font-semibold">{value.toFixed(2)}</p>
    </div>
  );
}

function HistoryCard<T extends Expense | Income>({
  title,
  items,
  type,
}: {
  title: string;
  items: T[];
  type: "expense" | "income";
}) {
  return (
    <div className="glass-card p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        {type === "expense" ? <Wallet className="w-4 h-4" /> : <PiggyBank className="w-4 h-4" />}
        {title}
      </h3>
      <div className="flex flex-col divide-y divide-slate-800">
        {items.length === 0 && <p className="text-sm text-slate-400">No entries yet.</p>}
        {items.map((item) => {
          const label =
            type === "expense" ? (item as Expense).category : (item as Income).source;
          return (
            <div key={item.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-slate-500">{format(new Date(item.occurredAt), "MMM dd, yyyy")}</p>
              </div>
              <p className={type === "expense" ? "text-sky-300" : "text-emerald-300"}>{item.amount.toFixed(2)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FormCard({
  title,
  icon,
  onSubmit,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  children: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </form>
  );
}

function ProfileField({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <div className="flex items-center gap-2">
        <p className="font-medium break-all">{value}</p>
        {copyable && (
          <button
            type="button"
            className="text-xs text-sky-400 underline"
            onClick={() => {
              navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

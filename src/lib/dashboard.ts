import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { UserProfile } from "@/lib/types";

export async function getDashboardData(userId: string) {
  try {
    const supabase = getSupabaseAdmin();

    const [{ data: expenses, error: expenseError }, { data: incomes, error: incomeError }] = await Promise.all([
      supabase
        .from("Expense")
        .select("id,userId,amount,category,note,occurredAt")
        .eq("userId", userId)
        .order("occurredAt", { ascending: false })
        .limit(50),
      supabase
        .from("Income")
        .select("id,userId,amount,source,note,occurredAt")
        .eq("userId", userId)
        .order("occurredAt", { ascending: false })
        .limit(50),
    ]);

    if (expenseError) throw expenseError;
    if (incomeError) throw incomeError;

    return {
      expenses: (expenses ?? []).map((e) => ({
        id: e.id,
        userId: e.userId,
        amount: typeof e.amount === "string" ? Number(e.amount) : (e.amount as number),
        category: e.category,
        note: e.note,
        occurredAt: typeof e.occurredAt === "string" ? e.occurredAt : new Date(e.occurredAt as string).toISOString(),
      })),
      incomes: (incomes ?? []).map((i) => ({
        id: i.id,
        userId: i.userId,
        amount: typeof i.amount === "string" ? Number(i.amount) : (i.amount as number),
        source: i.source,
        note: i.note,
        occurredAt: typeof i.occurredAt === "string" ? i.occurredAt : new Date(i.occurredAt as string).toISOString(),
      })),
    };
  } catch (error) {
    console.error("Dashboard query failed", error);
    return { expenses: [], incomes: [] };
  }
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from("Profile")
      .select("displayName,avatarUrl,currency")
      .eq("userId", userId)
      .maybeSingle();

    if (error) throw error;
    if (!profile) return null;
    return profile;
  } catch (error) {
    console.error("Profile fetch failed", error);
    return null;
  }
}
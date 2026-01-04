import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { expenseSchema } from "@/lib/validation";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = expenseSchema.parse({
      ...json,
      amount: Number(json.amount),
      occurredAt: json.occurredAt ? new Date(json.occurredAt) : new Date(),
    });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("Expense")
      .insert({
        id: randomUUID(),
        userId: user.id,
        amount: parsed.amount,
        category: parsed.category,
        note: parsed.note ?? null,
        occurredAt: (parsed.occurredAt ?? new Date()).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      expense: {
        ...data,
        amount: typeof data.amount === "string" ? Number(data.amount) : (data.amount as number),
      },
    });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to save expense";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ expenses: [] });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("Expense")
    .select("id,userId,amount,category,note,occurredAt")
    .eq("userId", user.id)
    .order("occurredAt", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ expenses: [] }, { status: 500 });
  }

  return NextResponse.json({
    expenses: (data ?? []).map((e) => ({ ...e, amount: typeof e.amount === "string" ? Number(e.amount) : (e.amount as number) })),
  });
}
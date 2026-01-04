import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { incomeSchema } from "@/lib/validation";
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
    const parsed = incomeSchema.parse({
      ...json,
      amount: Number(json.amount),
      occurredAt: json.occurredAt ? new Date(json.occurredAt) : new Date(),
    });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("Income")
      .insert({
        id: randomUUID(),
        userId: user.id,
        amount: parsed.amount,
        source: parsed.source,
        note: parsed.note ?? null,
        occurredAt: (parsed.occurredAt ?? new Date()).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      income: {
        ...data,
        amount: typeof data.amount === "string" ? Number(data.amount) : (data.amount as number),
      },
    });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to save income";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ incomes: [] });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("Income")
    .select("id,userId,amount,source,note,occurredAt")
    .eq("userId", user.id)
    .order("occurredAt", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ incomes: [] }, { status: 500 });
  }

  return NextResponse.json({
    incomes: (data ?? []).map((i) => ({ ...i, amount: typeof i.amount === "string" ? Number(i.amount) : (i.amount as number) })),
  });
}
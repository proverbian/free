import { getDashboardData } from "@/lib/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ expenses: [], incomes: [] }, { status: 200 });

  const data = await getDashboardData(user.id);
  return NextResponse.json(data);
}
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ profile: null });

  const admin = getSupabaseAdmin();
  const { data: profile, error } = await admin
    .from("Profile")
    .select("id,userId,displayName,avatarUrl,currency")
    .eq("userId", user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ profile: null }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { displayName, avatarUrl, currency } = body;

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("Profile")
    .upsert({
      userId: user.id,
      displayName,
      avatarUrl,
      currency,
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
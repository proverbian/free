import { Dashboard } from "@/components/dashboard/Dashboard";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardData, getProfile } from "@/lib/dashboard";

export default async function Home() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-6 max-w-lg text-center">
          <h1 className="text-2xl font-semibold mb-2">Supabase credentials missing</h1>
          <p className="text-sm text-slate-400">
            Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment (.env.local) to enable
            authentication and syncing.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <AuthPanel />
      </main>
    );
  }

  const { expenses, incomes } = await getDashboardData(session.user.id);
  const profile = await getProfile(session.user.id);
  const calendlyUrl = process.env.CALENDLY_URL || "https://calendly.com";

  return (
    <Dashboard
      user={{ id: session.user.id, email: session.user.email }}
      initialExpenses={expenses}
      initialIncomes={incomes}
      profile={profile}
      calendlyUrl={calendlyUrl}
    />
  );
}

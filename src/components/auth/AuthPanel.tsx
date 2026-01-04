'use client';

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Mail, Lock } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthPanel() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const programName = process.env.APP_NAME ?? "F.R.E.E Financial Program";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      }

      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.refresh();
      } else {
        const redirectTo =
          typeof window !== "undefined" && window.location
            ? `${window.location.origin}/`
            : undefined;

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
        });
        if (signUpError) throw signUpError;
        setMessage("Check your inbox to confirm your email.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message.includes("Failed to fetch")
          ? "Could not reach Supabase. Check your .env values, network, and that localhost is allowed in Supabase auth settings."
          : err.message;
        setError(msg);
      } else {
        setError("Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full glass-card p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Image src="/logo.svg" alt="FlowBudget" className="h-10 w-10" width={40} height={40} />
        <div>
          <h1 className="text-2xl font-semibold">{programName}</h1>
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Sign in to manage expenses, incomes, and coaching sessions. Offline-friendly and ready to
        sync when you’re back online.
      </p>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex items-center gap-3 rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2">
          <Mail className="w-4 h-4 text-slate-400" />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-transparent outline-none text-slate-50 placeholder:text-slate-500"
          />
        </label>
        <label className="flex items-center gap-3 rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2">
          <Lock className="w-4 h-4 text-slate-400" />
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-transparent outline-none text-slate-50 placeholder:text-slate-500"
          />
        </label>

        {error && <div className="text-sm text-rose-400">{error}</div>}
        {message && <div className="text-sm text-emerald-400">{message}</div>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-11 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-semibold disabled:opacity-60"
        >
          {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-slate-400 mt-4 text-center">
        {mode === "signin" ? "Need an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-sky-400 underline"
        >
          {mode === "signin" ? "Create one" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
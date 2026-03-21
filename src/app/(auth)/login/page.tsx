"use client";

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (!profile) {
      router.push("/onboarding");
    } else if (profile.role === "agent") {
      router.push("/agent/dashboard");
    } else {
      router.push("/client/projects");
    }
    router.refresh();
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <span className="text-2xl font-bold text-[#C9A84C]">CastBrief</span>
      </div>

      <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-6 sm:p-8">
        <h1 className="mb-6 text-center text-xl font-bold text-[#E8E3D8]">
          Sign in
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-[#8B8D93] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2.5 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-[#8B8D93] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2.5 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2.5 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#8B8D93]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#C9A84C] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-[#8B8D93]">Loading...</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

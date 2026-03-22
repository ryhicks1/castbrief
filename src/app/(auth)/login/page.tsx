"use client";

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";

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
        <span className="text-2xl font-bold text-[#C9A84C]">CastingBrief</span>
      </div>

      <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-6 sm:p-8">
        <h1 className="mb-6 text-center text-xl font-bold text-[#E8E3D8]">
          Sign in
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button variant="primary" className="w-full" loading={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
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

"use client";

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";

type Role = "agent" | "client" | "talent";

const ROLE_CARDS: { role: Role; title: string; subtitle: string; icon: string }[] = [
  { role: "agent", title: "I\u2019m an Agent", subtitle: "I represent talent", icon: "\uD83C\uDFAC" },
  { role: "client", title: "I\u2019m a Casting Director", subtitle: "I cast projects", icon: "\uD83C\uDFA5" },
  { role: "talent", title: "I\u2019m an Actor", subtitle: "Actor / Performer", icon: "\u2B50" },
];

function roleRedirect(role: Role): string {
  switch (role) {
    case "agent": return "/agent/dashboard";
    case "client": return "/client/projects";
    case "talent": return "/talent/profile";
  }
}

function SignupForm() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const redirectTo = searchParams.get("redirectTo");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) {
      setError("Please select your role");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // 1. Create auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const user = signUpData.user;
    if (!user) {
      setError("Account created. Please check your email to confirm, then sign in.");
      setLoading(false);
      return;
    }

    // 2. Create profile with selected role
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        role: selectedRole,
        full_name: fullName,
        email: user.email,
        agency_name: selectedRole === "agent" ? agencyName : null,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    // 3. Auto-create organization for agents
    if (selectedRole === "agent" && agencyName.trim()) {
      const slug = agencyName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      let orgId: string | null = null;
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .insert({ name: agencyName.trim(), slug })
          .select("id")
          .single();

        if (!orgError && orgData) {
          orgId = orgData.id;
        }
      }

      if (orgId) {
        await supabase
          .from("org_members")
          .upsert(
            { org_id: orgId, user_id: user.id, role: "admin" },
            { onConflict: "org_id,user_id" }
          );
      }
    }

    // 4. Redirect
    let dest: string;
    if (inviteToken) {
      dest = `/join/${inviteToken}`;
    } else if (redirectTo) {
      dest = redirectTo;
    } else {
      dest = roleRedirect(selectedRole);
    }

    router.push(dest);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <span className="text-2xl font-bold text-[#C9A84C]">CastingBrief</span>
      </div>

      <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-6 sm:p-8">
        <h1 className="mb-2 text-center text-xl font-bold text-[#E8E3D8]">
          Create your account
        </h1>
        <p className="mb-6 text-center text-sm text-[#8B8D93]">
          Select your role to get started
        </p>

        <form onSubmit={handleSignup} className="space-y-5">
          {/* Role selection cards */}
          <div>
            <div className="grid grid-cols-3 gap-3">
              {ROLE_CARDS.map((card) => (
                <button
                  key={card.role}
                  type="button"
                  onClick={() => setSelectedRole(card.role)}
                  className={`rounded-lg border-2 p-4 text-center transition min-h-[44px] ${
                    selectedRole === card.role
                      ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
                      : "border-[#2A2D35] text-[#E8E3D8] hover:border-[#3A3D45]"
                  }`}
                >
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <div className="text-sm font-semibold leading-tight">{card.title}</div>
                  <div className="mt-1 text-[10px] text-[#8B8D93]">{card.subtitle}</div>
                </button>
              ))}
            </div>
          </div>

          <Input
            id="fullName"
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          {selectedRole === "agent" && (
            <Input
              id="agencyName"
              label="Agency Name"
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              required
            />
          )}

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
            minLength={6}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            variant="primary"
            className="w-full"
            loading={loading}
            type="submit"
            disabled={loading || !selectedRole}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#8B8D93]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#C9A84C] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <p className="text-[#8B8D93]">Loading...</p>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

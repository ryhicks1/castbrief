"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
  const [role, setRole] = useState<"agent" | "client" | "talent" | null>(null);
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) {
        const dest =
          profile.role === "agent"
            ? "/agent/dashboard"
            : profile.role === "talent"
              ? "/talent/profile"
              : "/client/projects";
        router.push(dest);
        return;
      }

      setChecking(false);
    }

    checkProfile();
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) {
      setError("Please select a role");
      return;
    }
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("profiles").upsert({
      id: user.id,
      role,
      full_name: fullName,
      email: user.email,
      agency_name: role === "agent" ? agencyName : null,
    }, { onConflict: "id" });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Auto-create organization for agents
    if (role === "agent" && agencyName.trim()) {
      const slug = agencyName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Try to find existing org first, create if not exists
      let orgId: string;
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

        if (orgError) {
          setError(orgError.message);
          setLoading(false);
          return;
        }
        orgId = orgData.id;
      }

      if (orgId) {
        const { error: memberError } = await supabase
          .from("org_members")
          .upsert({ org_id: orgId, user_id: user.id, role: "admin" }, { onConflict: "org_id,user_id" });

        if (memberError) {
          setError(memberError.message);
          setLoading(false);
          return;
        }
      }
    }

    // Check for pending invite token
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get("invite");

    if (inviteToken) {
      router.push(`/join/${inviteToken}`);
    } else {
      const dest =
        role === "agent"
          ? "/agent/dashboard"
          : role === "talent"
            ? "/talent/profile"
            : "/client/projects";
      router.push(dest);
    }
    router.refresh();
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F14]">
        <p className="text-[#8B8D93]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0F14] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-[#C9A84C]">CastingBrief</span>
        </div>

        <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-6 sm:p-8">
          <h1 className="mb-2 text-center text-xl font-bold text-[#E8E3D8]">
            Welcome to CastingBrief
          </h1>
          <p className="mb-6 text-center text-sm text-[#8B8D93]">
            Tell us about yourself to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-[#8B8D93]">
                I am a...
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("agent")}
                  className={`rounded-lg border-2 p-4 text-center transition min-h-[44px] ${
                    role === "agent"
                      ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
                      : "border-[#2A2D35] text-[#E8E3D8] hover:border-[#3A3D45]"
                  }`}
                >
                  <div className="text-base font-semibold">I&apos;m an Agent</div>
                  <div className="mt-1 text-xs text-[#8B8D93]">
                    I represent talent
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`rounded-lg border-2 p-4 text-center transition min-h-[44px] ${
                    role === "client"
                      ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
                      : "border-[#2A2D35] text-[#E8E3D8] hover:border-[#3A3D45]"
                  }`}
                >
                  <div className="text-base font-semibold">I&apos;m a Client</div>
                  <div className="mt-1 text-xs text-[#8B8D93]">
                    Casting Director / Client
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("talent")}
                  className={`rounded-lg border-2 p-4 text-center transition min-h-[44px] ${
                    role === "talent"
                      ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
                      : "border-[#2A2D35] text-[#E8E3D8] hover:border-[#3A3D45]"
                  }`}
                >
                  <div className="text-base font-semibold">I&apos;m Talent</div>
                  <div className="mt-1 text-xs text-[#8B8D93]">
                    Actor / Performer
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm text-[#8B8D93] mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="block w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2.5 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
              />
            </div>

            {role === "agent" && (
              <div>
                <label htmlFor="agencyName" className="block text-sm text-[#8B8D93] mb-1">
                  Agency Name
                </label>
                <input
                  id="agencyName"
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2.5 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || !role}
              className="w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2.5 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

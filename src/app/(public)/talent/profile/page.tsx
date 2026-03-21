import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TalentProfileClient from "./TalentProfileClient";

export default async function TalentProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Find talent row linked to this user
  const { data: talent } = await supabase
    .from("talents")
    .select("*, talent_chips(chip_id, chips(id, label, color))")
    .eq("user_id", user.id)
    .single();

  if (!talent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F14] px-4">
        <div className="w-full max-w-md text-center">
          <span className="text-2xl font-bold text-[#C9A84C]">CastBrief</span>
          <div className="mt-8 rounded-xl border border-[#1E2128] bg-[#161920] p-6 sm:p-8">
            <h1 className="text-xl font-bold text-[#E8E3D8] mb-2">
              No Roster Yet
            </h1>
            <p className="text-sm text-[#8B8D93]">
              You haven&apos;t been added to any roster yet. Ask your agent to
              send you an invite link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get the agent's profile for agency info
  const { data: agentProfile } = await supabase
    .from("profiles")
    .select("full_name, agency_name")
    .eq("id", talent.agent_id)
    .single();

  // Get chips for the form
  const { data: chips } = await supabase
    .from("chips")
    .select("*")
    .eq("agent_id", talent.agent_id)
    .order("label");

  return (
    <TalentProfileClient
      talent={talent}
      chips={chips ?? []}
      agencyName={agentProfile?.agency_name || agentProfile?.full_name || "Unknown"}
      isLocked={talent.editing_locked ?? false}
    />
  );
}

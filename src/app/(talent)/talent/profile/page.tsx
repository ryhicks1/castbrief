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
  let { data: talent } = await supabase
    .from("talents")
    .select("*, talent_chips(chip_id, chips(id, label, color))")
    .eq("user_id", user.id)
    .single();

  // Auto-create talent record for independent talent (no agent)
  if (!talent) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const { data: newTalent, error: createError } = await supabase
      .from("talents")
      .insert({
        user_id: user.id,
        agent_id: null,
        full_name: profile?.full_name || user.email || "Unknown",
      })
      .select("*, talent_chips(chip_id, chips(id, label, color))")
      .single();

    if (createError) {
      return (
        <div className="flex items-center justify-center py-24 px-4">
          <div className="w-full max-w-md text-center">
            <div className="rounded-xl border border-[#1E2128] bg-[#13151A] p-6 sm:p-8">
              <h1 className="text-xl font-bold text-[#E8E3D8] mb-2">
                Something went wrong
              </h1>
              <p className="text-sm text-[#8B8D93]">
                Could not create your profile. Please try again or contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    talent = newTalent;
  }

  const isIndependent = !talent.agent_id;

  // Get the agent's profile for agency info (only if agent exists)
  let agencyName = "Independent";
  if (talent.agent_id) {
    const { data: agentProfile } = await supabase
      .from("profiles")
      .select("full_name, agency_name")
      .eq("id", talent.agent_id)
      .single();

    agencyName = agentProfile?.agency_name || agentProfile?.full_name || "Unknown";
  }

  // Get chips for the form (agent-specific or empty for independent)
  const chipsQuery = talent.agent_id
    ? supabase.from("chips").select("*").eq("agent_id", talent.agent_id).order("label")
    : supabase.from("chips").select("*").is("agent_id", null).order("label");

  const { data: chips } = await chipsQuery;

  return (
    <TalentProfileClient
      talent={talent}
      chips={chips ?? []}
      agencyName={agencyName}
      isLocked={talent.editing_locked ?? false}
      isIndependent={isIndependent}
    />
  );
}

import { createAdminClient } from "@/lib/supabase/admin";
import TalentPublicProfile from "@/components/public/TalentPublicProfile";

export default async function TalentViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: talent } = await supabase
    .from("talents")
    .select("id, full_name, age, gender, location, cultural_background, height_cm, weight_kg, about, special_skills, photo_url, links, talent_chips(chip_id, chips(id, label, color))")
    .eq("id", id)
    .single();

  if (!talent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F14]">
        <p className="text-[#8B8D93]">Profile not found.</p>
      </div>
    );
  }

  // Get agency name
  const { data: talentRow } = await supabase
    .from("talents")
    .select("agent_id")
    .eq("id", id)
    .single();

  let agencyName = "";
  if (talentRow?.agent_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_name, full_name")
      .eq("id", talentRow.agent_id)
      .single();
    agencyName = profile?.agency_name || profile?.full_name || "";
  }

  return <TalentPublicProfile talent={talent as any} agencyName={agencyName} />;
}

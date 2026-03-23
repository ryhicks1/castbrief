import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import TalentPublicProfile from "@/components/public/TalentPublicProfile";

export default async function TalentSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Skip reserved paths
  if (["view", "profile", "uploads"].includes(slug)) {
    return redirect("/login");
  }

  const supabase = createAdminClient();

  const { data: talent } = await supabase
    .from("talents")
    .select("id, full_name, age, gender, location, cultural_background, height_cm, weight_kg, about, special_skills, photo_url, links, agent_id, talent_chips(chip_id, chips(id, label, color))")
    .eq("profile_slug", slug)
    .single();

  if (!talent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F14]">
        <p className="text-[#8B8D93]">Profile not found.</p>
      </div>
    );
  }

  let agencyName = "";
  if (talent.agent_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_name, full_name")
      .eq("id", talent.agent_id)
      .single();
    agencyName = profile?.agency_name || profile?.full_name || "";
  }

  return <TalentPublicProfile talent={talent as any} agencyName={agencyName} />;
}

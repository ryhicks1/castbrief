import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import TalentForm from "@/components/agent/TalentForm";
import TalentNotes from "@/components/agent/TalentNotes";
import { getCurrentOrg } from "@/lib/supabase/org";

export default async function TalentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orgMembership = await getCurrentOrg(supabase, user.id);
  if (!orgMembership) redirect("/onboarding");

  const { data: talent } = await supabase
    .from("talents")
    .select("*, talent_chips(chip_id, chips(id, label, color)), talent_photos(id, url, sort_order, label)")
    .eq("id", id)
    .eq("org_id", orgMembership.orgId)
    .single();

  if (!talent) notFound();

  const { data: chips } = await supabase
    .from("chips")
    .select("*")
    .eq("org_id", orgMembership.orgId)
    .order("label");

  const { data: notes } = await supabase
    .from("talent_notes")
    .select("*")
    .eq("talent_id", id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <TalentForm talent={talent} chips={chips ?? []} agentId={user.id} orgId={orgMembership.orgId} />
      <TalentNotes talentId={id} notes={notes ?? []} />
    </div>
  );
}

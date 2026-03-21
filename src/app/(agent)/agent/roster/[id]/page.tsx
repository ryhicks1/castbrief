import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import TalentForm from "@/components/agent/TalentForm";
import TalentNotes from "@/components/agent/TalentNotes";
import { ensureOrg, orgFilter } from "@/lib/supabase/org";

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

  const orgMembership = (await ensureOrg(supabase, user.id))!;

  const { data: talent } = await supabase
    .from("talents")
    .select("*, talent_chips(chip_id, chips(id, label, color)), talent_photos(id, url, sort_order, label)")
    .eq("id", id)
    .eq(orgFilter(orgMembership.orgId, user.id).column, orgFilter(orgMembership.orgId, user.id).value)
    .single();

  if (!talent) notFound();

  const { data: chips } = await supabase
    .from("chips")
    .select("*")
    .eq(orgFilter(orgMembership.orgId, user.id).column, orgFilter(orgMembership.orgId, user.id).value)
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

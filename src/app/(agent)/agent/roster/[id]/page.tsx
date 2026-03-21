import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import TalentForm from "@/components/agent/TalentForm";
import TalentNotes from "@/components/agent/TalentNotes";

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

  const { data: talent } = await supabase
    .from("talents")
    .select("*, talent_chips(chip_id, chips(id, label, color))")
    .eq("id", id)
    .eq("agent_id", user.id)
    .single();

  if (!talent) notFound();

  const { data: chips } = await supabase
    .from("chips")
    .select("*")
    .eq("agent_id", user.id)
    .order("label");

  const { data: notes } = await supabase
    .from("talent_notes")
    .select("*")
    .eq("talent_id", id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <TalentForm talent={talent} chips={chips ?? []} agentId={user.id} />
      <TalentNotes talentId={id} notes={notes ?? []} />
    </div>
  );
}

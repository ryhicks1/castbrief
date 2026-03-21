import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TalentForm from "@/components/agent/TalentForm";

export default async function NewTalentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: chips } = await supabase
    .from("chips")
    .select("*")
    .eq("agent_id", user.id)
    .order("label");

  return <TalentForm chips={chips ?? []} agentId={user.id} />;
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TalentForm from "@/components/agent/TalentForm";
import { ensureOrg, orgFilter } from "@/lib/supabase/org";

export default async function NewTalentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orgMembership = (await ensureOrg(supabase, user.id))!;

  const { data: chips } = await supabase
    .from("chips")
    .select("*")
    .eq(orgFilter(orgMembership.orgId, user.id).column, orgFilter(orgMembership.orgId, user.id).value)
    .order("label");

  return <TalentForm chips={chips ?? []} agentId={user.id} orgId={orgMembership.orgId} />;
}

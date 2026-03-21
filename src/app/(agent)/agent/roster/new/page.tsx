import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TalentForm from "@/components/agent/TalentForm";
import { getCurrentOrg } from "@/lib/supabase/org";

export default async function NewTalentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orgMembership = await getCurrentOrg(supabase, user.id);
  if (!orgMembership) redirect("/onboarding");

  const { data: chips } = await supabase
    .from("chips")
    .select("*")
    .eq("org_id", orgMembership.orgId)
    .order("label");

  return <TalentForm chips={chips ?? []} agentId={user.id} orgId={orgMembership.orgId} />;
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RosterClient from "@/components/agent/RosterClient";
import { getCurrentOrg } from "@/lib/supabase/org";

export default async function RosterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orgMembership = await getCurrentOrg(supabase, user.id);
  if (!orgMembership) redirect("/onboarding");

  const { data: talents } = await supabase
    .from("talents")
    .select("*, talent_chips(chip_id, chips(id, label, color))")
    .eq("org_id", orgMembership.orgId)
    .order("created_at", { ascending: false });

  const { data: chips } = await supabase
    .from("chips")
    .select("*")
    .eq("org_id", orgMembership.orgId)
    .order("label");

  return (
    <RosterClient
      talents={talents ?? []}
      chips={chips ?? []}
      totalCount={talents?.length ?? 0}
    />
  );
}

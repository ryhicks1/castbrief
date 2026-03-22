import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RosterClient from "@/components/agent/RosterClient";
import { ensureOrg, orgFilter } from "@/lib/supabase/org";

export const metadata = { title: "Roster — CastingBrief" };

export default async function RosterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orgMembership = (await ensureOrg(supabase, user.id))!;

  const { data: talents } = await supabase
    .from("talents")
    .select("*, talent_chips(chip_id, chips(id, label, color))")
    .eq(orgFilter(orgMembership.orgId, user.id).column, orgFilter(orgMembership.orgId, user.id).value)
    .order("created_at", { ascending: false });

  const { data: chips } = await supabase
    .from("chips")
    .select("*")
    .eq(orgFilter(orgMembership.orgId, user.id).column, orgFilter(orgMembership.orgId, user.id).value)
    .order("label");

  return (
    <RosterClient
      talents={talents ?? []}
      chips={chips ?? []}
      totalCount={talents?.length ?? 0}
    />
  );
}

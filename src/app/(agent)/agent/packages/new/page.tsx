import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PackageBuilder from "@/components/agent/PackageBuilder";
import { getCurrentOrg } from "@/lib/supabase/org";

export default async function NewPackagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orgMembership = await getCurrentOrg(supabase, user.id);
  if (!orgMembership) redirect("/onboarding");

  const { data: talents } = await supabase
    .from("talents")
    .select("id, full_name, age, photo_url, talent_chips(chip_id, chips(id, label, color))")
    .eq("org_id", orgMembership.orgId)
    .order("full_name");

  const { data: chips } = await supabase
    .from("chips")
    .select("*")
    .eq("org_id", orgMembership.orgId)
    .order("label");

  // Normalize Supabase joined arrays (chips inside talent_chips)
  const normalizedTalents = (talents ?? []).map((t) => ({
    ...t,
    talent_chips: t.talent_chips.map(
      (tc: { chip_id: string; chips: { id: string; label: string; color: string } | { id: string; label: string; color: string }[] }) => ({
        ...tc,
        chips: Array.isArray(tc.chips) ? tc.chips[0] : tc.chips,
      })
    ),
  }));

  return (
    <PackageBuilder
      talents={normalizedTalents as Parameters<typeof PackageBuilder>[0]["talents"]}
      chips={chips ?? []}
      agentId={user.id}
    />
  );
}

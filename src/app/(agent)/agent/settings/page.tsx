import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentOrg, getOrgDivisions } from "@/lib/supabase/org";
import SettingsClient from "@/components/agent/SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orgMembership = await getCurrentOrg(supabase, user.id);
  if (!orgMembership) redirect("/onboarding");
  if (orgMembership.role !== "admin") redirect("/agent/dashboard");

  const divisions = await getOrgDivisions(supabase, orgMembership.orgId);

  const { data: members } = await supabase
    .from("org_members")
    .select("id, user_id, role, profiles:user_id(full_name, email)")
    .eq("org_id", orgMembership.orgId)
    .order("role");

  const normalizedMembers = (members ?? []).map((m: any) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      id: m.id,
      userId: m.user_id,
      role: m.role,
      fullName: profile?.full_name || "Unknown",
      email: profile?.email || "",
    };
  });

  return (
    <SettingsClient
      org={orgMembership.org!}
      orgId={orgMembership.orgId}
      divisions={divisions}
      members={normalizedMembers}
    />
  );
}

import { SupabaseClient } from "@supabase/supabase-js";

export async function getCurrentOrg(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("org_members")
    .select("org_id, role, organizations(id, name, slug, logo_url)")
    .eq("user_id", userId)
    .single();
  if (!data) return null;
  const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  return { orgId: data.org_id, role: data.role as "admin" | "agent" | "viewer", org };
}

export async function getOrgDivisions(supabase: SupabaseClient, orgId: string) {
  const { data } = await supabase
    .from("divisions")
    .select("id, name")
    .eq("org_id", orgId)
    .order("name");
  return data ?? [];
}

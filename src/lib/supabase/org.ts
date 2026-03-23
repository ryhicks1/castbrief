import { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getCurrentOrg(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("org_members")
    .select("org_id, role, organizations(id, name, slug, logo_url, contact_email, contact_phone, website, brand_color)")
    .eq("user_id", userId)
    .single();
  if (!data) return null;
  const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  return { orgId: data.org_id, role: data.role as "admin" | "agent" | "viewer", org };
}

/**
 * Ensures an agent has an org. If they don't (pre-migration user),
 * auto-creates one from their profile's agency_name.
 */
export async function ensureOrg(supabase: SupabaseClient, userId: string) {
  // Check if already has org
  const existing = await getCurrentOrg(supabase, userId);
  if (existing) return existing;

  // Get profile to find agency_name
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_name, full_name")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const agencyName = profile.agency_name || `${profile.full_name}'s Agency`;
  const slug = agencyName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + Date.now().toString(36); // ensure unique slug

  // Use admin client to bypass RLS for org creation
  const admin = createAdminClient();

  // Create org
  const { data: orgData, error: orgError } = await admin
    .from("organizations")
    .insert({ name: agencyName.trim(), slug })
    .select("id, name, slug")
    .single();

  if (orgError) {
    console.error("ensureOrg: failed to create org:", orgError.message);
    return null;
  }
  if (!orgData) return null;

  // Create membership
  await admin
    .from("org_members")
    .insert({ org_id: orgData.id, user_id: userId, role: "admin" });

  const result = await getCurrentOrg(supabase, userId);
  if (result) return result;

  // Final fallback: return a pseudo-org scoped to user's agent_id
  // This allows pre-migration users to still use the app
  console.warn("ensureOrg: falling back to agent_id scope for user", userId);
  return { orgId: "__agent__" + userId, role: "admin" as const, org: { id: "", name: "My Agency", slug: "", logo_url: null, contact_email: null, contact_phone: null, website: null, brand_color: null } };
}

/**
 * Returns Supabase filter params for org-scoped queries.
 * Falls back to agent_id if org isn't set up.
 */
export function orgFilter(orgId: string, userId: string): { column: string; value: string } {
  if (orgId.startsWith("__agent__")) {
    return { column: "agent_id", value: userId };
  }
  return { column: "org_id", value: orgId };
}

export async function getOrgDivisions(supabase: SupabaseClient, orgId: string) {
  const { data } = await supabase
    .from("divisions")
    .select("id, name")
    .eq("org_id", orgId)
    .order("name");
  return data ?? [];
}

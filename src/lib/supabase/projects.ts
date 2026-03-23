import type { SupabaseClient } from "@supabase/supabase-js";

export async function canAccessProject(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<{ canAccess: boolean; isOwner: boolean; role: string }> {
  // Check if owner
  const { data: project } = await supabase
    .from("projects")
    .select("client_id")
    .eq("id", projectId)
    .single();

  if (project?.client_id === userId) {
    return { canAccess: true, isOwner: true, role: "owner" };
  }

  // Check if collaborator
  const { data: collab } = await supabase
    .from("project_collaborators")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  if (collab) {
    return { canAccess: true, isOwner: false, role: collab.role };
  }

  return { canAccess: false, isOwner: false, role: "" };
}

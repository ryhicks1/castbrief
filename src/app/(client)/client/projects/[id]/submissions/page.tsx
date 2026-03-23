import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SubmissionsView from "@/components/client/SubmissionsView";

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, client_id, open_call_enabled")
    .eq("id", id)
    .eq("client_id", user.id)
    .single();

  if (!project) redirect("/client/projects");

  // Fetch submissions with role names
  const { data: submissions } = await supabase
    .from("open_call_submissions")
    .select("*, roles(name)")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  // Group by role
  const grouped: Record<string, { roleName: string; submissions: any[] }> = {};
  for (const sub of submissions || []) {
    const roleId = sub.role_id;
    const roleName = (sub.roles as any)?.name || "Unknown Role";
    if (!grouped[roleId]) {
      grouped[roleId] = { roleName, submissions: [] };
    }
    grouped[roleId].submissions.push(sub);
  }

  return (
    <SubmissionsView
      groupedSubmissions={grouped}
      projectId={id}
      projectName={project.name}
    />
  );
}

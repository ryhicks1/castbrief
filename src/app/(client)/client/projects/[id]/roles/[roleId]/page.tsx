import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RoleDetail from "@/components/client/RoleDetail";

export default async function RolePage({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>;
}) {
  const { id: projectId, roleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("client_id", user.id)
    .single();

  if (!project) redirect("/client/projects");

  const { data: role } = await supabase
    .from("roles")
    .select("id, name, brief")
    .eq("id", roleId)
    .eq("project_id", projectId)
    .single();

  if (!role) redirect(`/client/projects/${projectId}`);

  // Fetch role_packages separately
  const { data: rolePackages } = await supabase
    .from("role_packages")
    .select(`
      role_id, package_id,
      packages(
        id, name, token, agent_id,
        package_talents(
          id, talent_id, client_pick, client_comment, is_hidden_by_client, media_requested, upload_status,
          talents(
            id, full_name, age, location, cultural_background, height_cm, weight_kg, photo_url, links,
            talent_chips(chip_id, chips(id, label, color))
          )
        )
      )
    `)
    .eq("role_id", roleId);

  // Fetch agent profiles
  const agentIds = [...new Set((rolePackages || []).map((rp: any) => rp.packages?.agent_id).filter(Boolean))];
  let agentProfiles: Record<string, any> = {};
  if (agentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, agency_name")
      .in("id", agentIds);
    for (const p of profiles || []) {
      agentProfiles[p.id] = p;
    }
  }

  const assembledRole = {
    ...role,
    role_packages: (rolePackages || []).map((rp: any) => ({
      ...rp,
      packages: rp.packages ? {
        ...rp.packages,
        profiles: agentProfiles[rp.packages.agent_id] || { full_name: "Unknown", agency_name: null },
      } : null,
    })),
  };

  return (
    <RoleDetail
      role={assembledRole as any}
      projectId={projectId}
      projectName={project.name}
    />
  );
}

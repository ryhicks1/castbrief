import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectDetail from "@/components/client/ProjectDetail";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Simplified query - fetch project and roles separately
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      id, name, brand, type, status, deadline, client_id,
      open_call_enabled, open_call_token,
      open_call_form_url, open_call_show_project_docs, open_call_show_role_docs,
      roles(id, name, brief, folder_id, open_call_visible)
    `)
    .eq("id", id)
    .single();



  if (!project) redirect("/client/projects");

  // Check access: owner or collaborator
  const isOwner = project.client_id === user.id;
  if (!isOwner) {
    const { data: collab } = await supabase
      .from("project_collaborators")
      .select("role")
      .eq("project_id", id)
      .eq("user_id", user.id)
      .single();
    if (!collab) redirect("/client/projects");
  }

  // Fetch project folders
  const { data: folders } = await supabase
    .from("project_folders")
    .select("id, name, sort_order")
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  // Fetch package requests for this project
  const { data: requests } = await supabase
    .from("package_requests")
    .select("id, agent_email, role_id, brief, created_at, status")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  // Fetch role_packages for each role
  const roleIds = (project.roles || []).map((r: any) => r.id);
  let rolePackages: any[] = [];

  if (roleIds.length > 0) {
    const { data: rp, error: rpErr } = await supabase
      .from("role_packages")
      .select(`
        role_id, package_id,
        packages(
          id, name, agent_id, token,
          package_talents(
            id, talent_id, client_pick, client_comment, is_hidden_by_client, media_requested, upload_status,
            talents(id, full_name, age, location, cultural_background, height_cm, weight_kg, photo_url, links)
          )
        )
      `)
      .in("role_id", roleIds);


    rolePackages = rp || [];
  }

  // Fetch agent profiles for packages
  const agentIds = [...new Set(rolePackages.map((rp: any) => rp.packages?.agent_id).filter(Boolean))];
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

  // Fetch project-level documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  // Assemble the data
  const assembledProject = {
    ...project,
    roles: (project.roles || []).map((role: any) => ({
      ...role,
      role_packages: rolePackages
        .filter((rp: any) => rp.role_id === role.id)
        .map((rp: any) => ({
          ...rp,
          packages: rp.packages ? {
            ...rp.packages,
            profiles: agentProfiles[rp.packages.agent_id] || { full_name: "Unknown", agency_name: null },
          } : null,
        })),
    })),
  };

  return (
    <ProjectDetail
      project={assembledProject as any}
      userId={user.id}
      requests={requests || []}
      documents={documents || []}
      folders={folders || []}
      isOwner={isOwner}
    />
  );
}

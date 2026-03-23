import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import ProjectDashboard from "@/components/client/ProjectDashboard";
export const metadata = { title: "Dashboard — CastingBrief" };

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch projects with roles
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, brand, type, status, deadline, created_at, roles(id, name, brief)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch all role_packages for these projects
  const allRoleIds = (projects || []).flatMap((p: any) => (p.roles || []).map((r: any) => r.id));
  let rolePackages: any[] = [];

  if (allRoleIds.length > 0) {
    const { data: rp } = await supabase
      .from("role_packages")
      .select(`
        role_id, package_id,
        packages(
          id, name, agent_id, status, last_viewed_at,
          package_talents(id, talent_id, client_pick, media_requested, upload_status)
        )
      `)
      .in("role_id", allRoleIds);
    rolePackages = rp || [];
  }

  // Fetch agent profiles
  const agentIds = [...new Set(rolePackages.map((rp: any) => rp.packages?.agent_id).filter(Boolean))];
  let agentProfiles: Record<string, any> = {};
  if (agentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, agency_name")
      .in("id", agentIds as string[]);
    for (const p of profiles || []) {
      agentProfiles[p.id] = p;
    }
  }

  // Fetch all package requests
  const projectIds = (projects || []).map((p: any) => p.id);
  let allRequests: any[] = [];
  if (projectIds.length > 0) {
    const { data: requests } = await supabase
      .from("package_requests")
      .select("id, agent_email, project_id, role_id, brief, created_at, status")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });
    allRequests = requests || [];
  }

  // Fetch shared projects (where user is a collaborator)
  const { data: collabEntries } = await supabase
    .from("project_collaborators")
    .select("project_id, role, projects(id, name, brand, type, status, deadline, created_at, client_id, roles(id, name, brief))")
    .eq("user_id", user.id);

  // Fetch owner profiles for shared projects
  const sharedOwnerIds = [...new Set((collabEntries || []).map((c: any) => c.projects?.client_id).filter(Boolean))];
  let ownerProfiles: Record<string, string> = {};
  if (sharedOwnerIds.length > 0) {
    const { data: ownerData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", sharedOwnerIds as string[]);
    for (const p of ownerData || []) {
      ownerProfiles[p.id] = p.full_name;
    }
  }

  // Get role_packages for shared projects too
  const sharedRoleIds = (collabEntries || []).flatMap((c: any) =>
    (c.projects?.roles || []).map((r: any) => r.id)
  );
  let sharedRolePackages: any[] = [];
  if (sharedRoleIds.length > 0) {
    const { data: srp } = await supabase
      .from("role_packages")
      .select(`
        role_id, package_id,
        packages(
          id, name, agent_id, status, last_viewed_at,
          package_talents(id, talent_id, client_pick, media_requested, upload_status)
        )
      `)
      .in("role_id", sharedRoleIds);
    sharedRolePackages = srp || [];
  }

  // Fetch agent profiles for shared projects
  const sharedAgentIds = [...new Set(sharedRolePackages.map((rp: any) => rp.packages?.agent_id).filter(Boolean))];
  if (sharedAgentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, agency_name")
      .in("id", sharedAgentIds as string[]);
    for (const p of profiles || []) {
      agentProfiles[p.id] = p;
    }
  }

  // Fetch package requests for shared projects
  const sharedProjectIds = (collabEntries || []).map((c: any) => c.project_id).filter(Boolean);
  let sharedRequests: any[] = [];
  if (sharedProjectIds.length > 0) {
    const { data: sreqs } = await supabase
      .from("package_requests")
      .select("id, agent_email, project_id, role_id, brief, created_at, status")
      .in("project_id", sharedProjectIds)
      .order("created_at", { ascending: false });
    sharedRequests = sreqs || [];
  }

  function enrichProject(project: any, rps: any[], reqs: any[], isShared = false, ownerName = "") {
    const projectRequests = reqs.filter((r: any) => r.project_id === project.id);
    const roles = (project.roles || []).map((role: any) => {
      const roleRps = rps.filter((rp: any) => rp.role_id === role.id);
      const packages = roleRps.map((rp: any) => ({
        ...rp.packages,
        profiles: rp.packages?.agent_id ? agentProfiles[rp.packages.agent_id] : null,
      })).filter(Boolean);
      const allTalents = packages.flatMap((p: any) => p.package_talents || []);
      const picks = allTalents.filter((t: any) => t.client_pick);
      const mediaRequested = allTalents.filter((t: any) => t.media_requested);
      const mediaUploaded = allTalents.filter((t: any) => t.upload_status === "uploaded");

      return {
        ...role,
        packageCount: packages.length,
        talentCount: allTalents.length,
        pickCount: picks.length,
        mediaRequestedCount: mediaRequested.length,
        mediaUploadedCount: mediaUploaded.length,
        agentIds: [...new Set(packages.map((p: any) => p.agent_id).filter(Boolean))],
        agentProfiles: packages.reduce((acc: any, p: any) => {
          if (p.agent_id && p.profiles) acc[p.agent_id] = p.profiles;
          return acc;
        }, {}),
      };
    });

    const totalTalent = roles.reduce((s: number, r: any) => s + r.talentCount, 0);
    const totalPicks = roles.reduce((s: number, r: any) => s + r.pickCount, 0);
    const totalMediaRequested = roles.reduce((s: number, r: any) => s + r.mediaRequestedCount, 0);
    const totalMediaUploaded = roles.reduce((s: number, r: any) => s + r.mediaUploadedCount, 0);
    const pendingRequests = projectRequests.filter((r: any) => r.status !== "responded").length;
    const respondedRequests = projectRequests.filter((r: any) => r.status === "responded").length;

    return {
      ...project,
      roles,
      requests: projectRequests,
      isShared,
      ownerName,
      stats: {
        roleCount: roles.length,
        totalTalent,
        totalPicks,
        totalMediaRequested,
        totalMediaUploaded,
        pendingRequests,
        respondedRequests,
        totalRequests: projectRequests.length,
      },
    };
  }

  // Assemble enriched projects (owned)
  const enrichedProjects = (projects || []).map((project: any) =>
    enrichProject(project, rolePackages, allRequests)
  );

  // Assemble enriched shared projects
  const enrichedSharedProjects = (collabEntries || [])
    .filter((c: any) => c.projects)
    .map((c: any) => {
      const ownerName = ownerProfiles[c.projects.client_id] || "Unknown";
      return enrichProject(c.projects, sharedRolePackages, sharedRequests, true, ownerName);
    });

  return <ProjectDashboard projects={enrichedProjects} sharedProjects={enrichedSharedProjects} />;
}

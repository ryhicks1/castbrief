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

  // Assemble enriched projects
  const enrichedProjects = (projects || []).map((project: any) => {
    const projectRequests = allRequests.filter((r: any) => r.project_id === project.id);
    const roles = (project.roles || []).map((role: any) => {
      const rps = rolePackages.filter((rp: any) => rp.role_id === role.id);
      const packages = rps.map((rp: any) => ({
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
  });

  return <ProjectDashboard projects={enrichedProjects} />;
}

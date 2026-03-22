import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
export const metadata = { title: "Projects — CastingBrief" };

function agencyColor(agentId: string): string {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = agentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 55%)`;
}

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(`
      id, name, brand, type, status, deadline, created_at,
      roles(id)
    `)
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#E8E3D8]">Projects</h1>
        <Link
          href="/client/projects/new"
          className="inline-flex items-center justify-center rounded-lg bg-[#B8964C] px-4 py-2 text-sm font-semibold text-[#0F0F12] hover:bg-[#C9A64C] hover:shadow-lg hover:shadow-[#B8964C]/10 transition-all duration-300"
        >
          + New Project
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="text-5xl mb-4">&#9632;</div>
          <h2 className="text-xl font-semibold text-[#E8E3D8] mb-2">No projects yet</h2>
          <p className="text-[#8B8D93] mb-6 text-sm">Create your first project to start organizing talent.</p>
          <Link
            href="/client/projects/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#B8964C] px-4 py-2 text-sm font-semibold text-[#0F0F12] hover:bg-[#C9A64C] hover:shadow-lg hover:shadow-[#B8964C]/10 transition-all duration-300"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project: any) => {
            const roleCount = project.roles?.length || 0;
            const allPackages = project.roles?.flatMap((r: any) =>
              r.role_packages?.map((rp: any) => rp.packages) || []
            ) || [];
            const agentIds = [...new Set(allPackages.map((p: any) => p?.agent_id).filter(Boolean))] as string[];
            const talentCount = allPackages.reduce(
              (sum: number, p: any) => sum + (p?.package_talents?.length || 0), 0
            );
            const pickCount = allPackages.reduce(
              (sum: number, p: any) => sum + (p?.package_talents?.filter((pt: any) => pt.client_pick)?.length || 0), 0
            );

            const statusColors: Record<string, string> = {
              active: "text-green-400",
              casting: "text-[#C9A84C]",
              wrapped: "text-[#8B8D93]",
              archived: "text-[#6B7280]",
            };

            return (
              <Link
                key={project.id}
                href={`/client/projects/${project.id}`}
                className="rounded-xl border border-[#1E2128] bg-[#161920] p-5 hover:border-[#2A2D35] transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[#E8E3D8]">{project.name}</h3>
                  <span className={`text-xs capitalize ${statusColors[project.status] || "text-[#8B8D93]"}`}>
                    {project.status}
                  </span>
                </div>
                {project.brand && (
                  <p className="text-xs text-[#8B8D93] mb-3">{project.brand} &middot; {project.type}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8B8D93] mb-3">
                  <span>{roleCount} role{roleCount !== 1 ? "s" : ""}</span>
                  <span>{agentIds.length} agenc{agentIds.length !== 1 ? "ies" : "y"}</span>
                  <span>{talentCount} talent</span>
                  <span>{pickCount} pick{pickCount !== 1 ? "s" : ""}</span>
                </div>
                {agentIds.length > 0 && (
                  <div className="flex gap-1">
                    {agentIds.slice(0, 5).map((aid) => (
                      <span
                        key={aid}
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: agencyColor(aid) }}
                      />
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

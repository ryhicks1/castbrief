"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function agencyColor(agentId: string): string {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = agentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 55%)`;
}

interface ProjectDetailProps {
  project: {
    id: string;
    name: string;
    brand: string | null;
    type: string;
    status: string;
    deadline: string | null;
    roles: {
      id: string;
      name: string;
      brief: string | null;
      role_packages: {
        id: string;
        package_id: string;
        packages: {
          id: string;
          name: string;
          agent_id: string;
          token: string;
          profiles: { id: string; full_name: string; agency_name: string | null };
          package_talents: {
            id: string;
            talent_id: string;
            client_pick: boolean;
            talents: { id: string; full_name: string; photo_url: string | null };
          }[];
        };
      }[];
    }[];
  };
  userId: string;
}

export default function ProjectDetail({ project, userId }: ProjectDetailProps) {
  const router = useRouter();
  const [roleName, setRoleName] = useState("");
  const [roleBrief, setRoleBrief] = useState("");
  const [addingRole, setAddingRole] = useState(false);

  const statusColors: Record<string, string> = {
    active: "text-green-400 bg-green-400/10",
    casting: "text-[#C9A84C] bg-[#C9A84C]/10",
    wrapped: "text-[#8B8D93] bg-[#8B8D93]/10",
    archived: "text-[#6B7280] bg-[#6B7280]/10",
  };

  async function handleAddRole(e: React.FormEvent) {
    e.preventDefault();
    if (!roleName.trim()) return;
    setAddingRole(true);

    const supabase = createClient();
    await supabase.from("roles").insert({
      project_id: project.id,
      name: roleName.trim(),
      brief: roleBrief.trim() || null,
    });

    setRoleName("");
    setRoleBrief("");
    setAddingRole(false);
    router.refresh();
  }

  return (
    <div>
      {/* Project header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-bold text-[#E8E3D8]">{project.name}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs capitalize ${
              statusColors[project.status] || "text-[#8B8D93]"
            }`}
          >
            {project.status}
          </span>
        </div>
        {project.brand && (
          <p className="text-sm text-[#8B8D93]">
            {project.brand} &middot; {project.type}
          </p>
        )}
        <div className="flex gap-3 mt-4">
          <Link
            href={`/client/projects/${project.id}/request`}
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition"
          >
            Request Package from Agent
          </Link>
        </div>
      </div>

      {/* Add role form */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8B8D93] mb-3">
          Roles
        </h2>
        <form onSubmit={handleAddRole} className="flex gap-2 mb-4">
          <input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Role name..."
            className="flex-1 rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
          />
          <input
            type="text"
            value={roleBrief}
            onChange={(e) => setRoleBrief(e.target.value)}
            placeholder="Brief description..."
            className="flex-1 rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
          />
          <button
            type="submit"
            disabled={addingRole || !roleName.trim()}
            className="rounded-lg bg-[#1E2128] border border-[#2A2D35] px-4 py-2 text-sm text-[#E8E3D8] hover:bg-[#262930] transition disabled:opacity-50"
          >
            + Add Role
          </button>
        </form>
      </div>

      {/* Roles list */}
      <div className="space-y-3">
        {(project.roles || []).map((role) => {
          const allTalents = role.role_packages?.flatMap(
            (rp) => rp.packages?.package_talents || []
          ) || [];
          const talentCount = allTalents.length;
          const pickCount = allTalents.filter((t) => t.client_pick).length;
          const agentIds = [
            ...new Set(
              role.role_packages
                ?.map((rp) => rp.packages?.agent_id)
                .filter(Boolean) || []
            ),
          ];

          return (
            <div
              key={role.id}
              className="rounded-xl border border-[#1E2128] bg-[#161920] p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-[#E8E3D8]">{role.name}</h3>
                  {role.brief && (
                    <p className="text-xs text-[#8B8D93] mt-0.5">
                      {role.brief}
                    </p>
                  )}
                </div>
                <Link
                  href={`/client/projects/${project.id}/roles/${role.id}`}
                  className="text-xs text-[#C9A84C] hover:underline shrink-0"
                >
                  Review Role &rarr;
                </Link>
              </div>

              {/* Agency chips */}
              {agentIds.length > 0 && (
                <div className="flex gap-1 mb-2">
                  {agentIds.map((aid) => {
                    const pkg = role.role_packages?.find(
                      (rp) => rp.packages?.agent_id === aid
                    )?.packages;
                    const label =
                      pkg?.profiles?.agency_name ||
                      pkg?.profiles?.full_name ||
                      "Agency";
                    return (
                      <span
                        key={aid}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${agencyColor(aid)}20`,
                          color: agencyColor(aid),
                        }}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Talent strip */}
              {allTalents.length > 0 && (
                <div className="flex gap-1 overflow-x-auto pb-1 mb-2">
                  {allTalents.slice(0, 12).map((pt) => {
                    const pkg = role.role_packages?.find((rp) =>
                      rp.packages?.package_talents?.some(
                        (t) => t.id === pt.id
                      )
                    )?.packages;
                    const color = pkg?.agent_id
                      ? agencyColor(pkg.agent_id)
                      : "#8B8D93";
                    const initials = pt.talents?.full_name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "?";

                    return (
                      <div
                        key={pt.id}
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold border-2 ${
                          pt.client_pick
                            ? "border-[#C9A84C]"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: `${color}30`, color }}
                        title={pt.talents?.full_name}
                      >
                        {initials}
                      </div>
                    );
                  })}
                  {allTalents.length > 12 && (
                    <span className="text-xs text-[#8B8D93] self-center ml-1">
                      +{allTalents.length - 12}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-[#8B8D93]">
                <span>{talentCount} talent</span>
                <span>{pickCount} pick{pickCount !== 1 ? "s" : ""}</span>
                {pickCount > 0 && (
                  <button className="text-[#C9A84C] hover:underline">
                    Request Media ({pickCount})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

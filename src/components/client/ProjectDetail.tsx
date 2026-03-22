"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge, Button, Input } from "@/components/ui";
import {
  Users,
  Star,
  Clock,
  Send,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Image as ImageIcon,
  Calendar,
  FileDown,
} from "lucide-react";

function agencyColor(agentId: string): string {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = agentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 55%)`;
}

function daysUntil(date: string): number {
  const now = new Date();
  const target = new Date(date);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface PackageRequest {
  id: string;
  agent_email: string;
  role_id: string | null;
  brief: string | null;
  created_at: string;
  status: string | null;
}

interface ProjectDetailProps {
  requests?: PackageRequest[];
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
            media_requested?: boolean;
            upload_status?: string;
            talents: { id: string; full_name: string; photo_url: string | null };
          }[];
        };
      }[];
    }[];
  };
  userId: string;
}

export default function ProjectDetail({ project, userId, requests = [] }: ProjectDetailProps) {
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

  // Compute project-level stats
  const allTalents = project.roles.flatMap((r) =>
    (r.role_packages || []).flatMap((rp) => rp.packages?.package_talents || [])
  );
  const totalTalent = allTalents.length;
  const totalPicks = allTalents.filter((t) => t.client_pick).length;
  const totalMediaRequested = allTalents.filter((t: any) => t.media_requested).length;
  const totalMediaUploaded = allTalents.filter((t: any) => t.upload_status === "uploaded").length;
  const pendingRequests = requests.filter((r) => r.status !== "responded").length;
  const respondedRequests = requests.filter((r) => r.status === "responded").length;

  // Deadline info
  const deadlineInfo = project.deadline
    ? (() => {
        const days = daysUntil(project.deadline);
        if (days < 0) return { text: `${Math.abs(days)} days overdue`, color: "text-red-400", bgColor: "bg-red-500/5 border-red-500/20" };
        if (days === 0) return { text: "Due today", color: "text-red-400", bgColor: "bg-red-500/5 border-red-500/20" };
        if (days <= 3) return { text: `${days} days remaining`, color: "text-amber-400", bgColor: "bg-amber-500/5 border-amber-500/20" };
        return { text: `${days} days remaining`, color: "text-[#8B8D93]", bgColor: "bg-[#161920] border-[#1E2128]" };
      })()
    : null;

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
      {/* Breadcrumb */}
      <div className="text-xs text-[#8B8D93] mb-4">
        <Link href="/client/projects" className="hover:text-[#E8E3D8]">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#E8E3D8]">{project.name}</span>
      </div>

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

      {/* Stats bar + deadline */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <MiniStat icon={Users} label="Talent" value={totalTalent} />
        <MiniStat icon={Star} label="Picks" value={totalPicks} accent />
        <MiniStat icon={Send} label="Requests" value={`${respondedRequests}/${requests.length}`} />
        {totalMediaRequested > 0 && (
          <MiniStat icon={ImageIcon} label="Media" value={`${totalMediaUploaded}/${totalMediaRequested}`} />
        )}
        {deadlineInfo && (
          <div className={`rounded-xl border p-3 ${deadlineInfo.bgColor}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={13} className={deadlineInfo.color} />
              <span className="text-[10px] text-[#8B8D93] uppercase tracking-wider">Deadline</span>
            </div>
            <p className={`text-sm font-semibold ${deadlineInfo.color}`}>{deadlineInfo.text}</p>
          </div>
        )}
      </div>

      {/* Add role form */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8B8D93] mb-3">
          Roles
        </h2>
        <form onSubmit={handleAddRole} className="flex gap-2 mb-4">
          <Input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Role name..."
            className="flex-1"
          />
          <Input
            type="text"
            value={roleBrief}
            onChange={(e) => setRoleBrief(e.target.value)}
            placeholder="Brief description..."
            className="flex-1"
          />
          <Button
            variant="secondary"
            type="submit"
            disabled={addingRole || !roleName.trim()}
            loading={addingRole}
          >
            + Add Role
          </Button>
        </form>
      </div>

      {/* Roles list */}
      <div className="space-y-3">
        {(project.roles || []).map((role) => {
          const allRoleTalents = role.role_packages?.flatMap(
            (rp) => rp.packages?.package_talents || []
          ) || [];
          const talentCount = allRoleTalents.length;
          const pickCount = allRoleTalents.filter((t) => t.client_pick).length;
          const mediaRequested = allRoleTalents.filter((t: any) => t.media_requested).length;
          const mediaUploaded = allRoleTalents.filter((t: any) => t.upload_status === "uploaded").length;
          const agentIds = [
            ...new Set(
              role.role_packages
                ?.map((rp) => rp.packages?.agent_id)
                .filter(Boolean) || []
            ),
          ];
          const progress = talentCount > 0 ? (pickCount / talentCount) * 100 : 0;
          const roleRequests = requests.filter((r) => r.role_id === role.id);
          const rolePending = roleRequests.filter((r) => r.status !== "responded").length;

          return (
            <div
              key={role.id}
              className="rounded-xl border border-[#1E2128] bg-[#161920] p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#E8E3D8]">{role.name}</h3>
                    {rolePending > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400">
                        <Clock size={10} />
                        {rolePending} pending
                      </span>
                    )}
                  </div>
                  {role.brief && (
                    <p className="text-xs text-[#8B8D93] mt-0.5">
                      {role.brief}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {talentCount > 0 && (
                    <a
                      href={`/api/reports/role/${role.id}?format=pdf&projectId=${project.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#8B8D93] hover:text-[#E8E3D8] transition"
                      title="Export PDF"
                    >
                      <FileDown size={12} />
                    </a>
                  )}
                  <Link
                    href={`/client/projects/${project.id}/roles/${role.id}`}
                    className="flex items-center gap-1 text-xs text-[#C9A84C] hover:underline"
                  >
                    Review Talent
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Progress bar */}
              {talentCount > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] text-[#8B8D93] mb-1">
                    <span>Selection progress</span>
                    <span>{pickCount} of {talentCount} selected</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1E2128] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#B8943F] transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              )}

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
                    const agentTalentCount = role.role_packages
                      ?.filter((rp) => rp.packages?.agent_id === aid)
                      .reduce((s, rp) => s + (rp.packages?.package_talents?.length || 0), 0) || 0;
                    return (
                      <span
                        key={aid}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${agencyColor(aid)}20`,
                          color: agencyColor(aid),
                        }}
                      >
                        {label} ({agentTalentCount})
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Talent strip */}
              {allRoleTalents.length > 0 && (
                <div className="flex gap-1 overflow-x-auto pb-1 mb-2">
                  {allRoleTalents.slice(0, 12).map((pt) => {
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
                  {allRoleTalents.length > 12 && (
                    <span className="text-xs text-[#8B8D93] self-center ml-1">
                      +{allRoleTalents.length - 12}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-[#8B8D93]">
                <span>{talentCount} talent</span>
                <span className="text-[#C9A84C]">{pickCount} pick{pickCount !== 1 ? "s" : ""}</span>
                {mediaRequested > 0 && (
                  <span>{mediaUploaded}/{mediaRequested} media uploaded</span>
                )}
                {pickCount > 0 && mediaRequested === 0 && (
                  <button className="text-[#C9A84C] hover:underline">
                    Request Media ({pickCount})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Requests tracking section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8B8D93]">
            Request Tracking
          </h2>
          {requests.length > 0 && (
            <span className="text-xs text-[#8B8D93]">
              {respondedRequests} of {requests.length} responded
            </span>
          )}
        </div>
        {requests.length === 0 ? (
          <p className="text-sm text-[#8B8D93]">No requests sent yet.</p>
        ) : (
          <div className="rounded-xl border border-[#1E2128] bg-[#161920] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E2128] text-left text-xs text-[#8B8D93]">
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date Sent</th>
                  <th className="px-4 py-3 font-medium">Wait Time</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const role = project.roles?.find((r) => r.id === req.role_id);
                  const rName = role ? role.name : "All Roles";
                  const isResponded = req.status === "responded";
                  const waitDays = Math.floor(
                    (Date.now() - new Date(req.created_at).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const waitLabel = isResponded
                    ? "Responded"
                    : waitDays === 0
                    ? "Today"
                    : `${waitDays}d waiting`;
                  const waitColor = isResponded
                    ? "text-green-400"
                    : waitDays > 7
                    ? "text-red-400"
                    : waitDays > 3
                    ? "text-amber-400"
                    : "text-[#8B8D93]";

                  return (
                    <tr
                      key={req.id}
                      className="border-b border-[#1E2128] last:border-b-0"
                    >
                      <td className="px-4 py-3 text-[#E8E3D8]">
                        {req.agent_email}
                      </td>
                      <td className="px-4 py-3 text-[#8B8D93]">{rName}</td>
                      <td className="px-4 py-3">
                        <Badge
                          label={isResponded ? "Responded" : "Pending"}
                          color={isResponded ? "green" : "gold"}
                        />
                      </td>
                      <td className="px-4 py-3 text-[#8B8D93]">
                        {new Date(req.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className={`px-4 py-3 text-xs font-medium ${waitColor}`}>
                        {waitLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={13} className={accent ? "text-[#C9A84C]" : "text-[#8B8D93]"} />
        <span className="text-[10px] text-[#8B8D93] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-lg font-bold ${accent ? "text-[#C9A84C]" : "text-[#E8E3D8]"}`}>
        {value}
      </p>
    </div>
  );
}

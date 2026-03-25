"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Users,
  Star,
  Clock,
  Send,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Film,
  Tv,
  Clapperboard,
  Image as ImageIcon,
  Pencil,
  Copy,
  Archive,
  Trash2,
  Mail,
  X,
  Sparkles,
} from "lucide-react";
import { Badge, KebabMenu } from "@/components/ui";
import type { KebabMenuItem } from "@/components/ui";
import SmartProjectCreatorModal from "./SmartProjectCreatorModal";

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

function deadlineLabel(deadline: string | null): { text: string; color: string } | null {
  if (!deadline) return null;
  const days = daysUntil(deadline);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: "text-red-400" };
  if (days === 0) return { text: "Due today", color: "text-red-400" };
  if (days <= 3) return { text: `${days}d left`, color: "text-amber-400" };
  if (days <= 7) return { text: `${days}d left`, color: "text-[#C9A84C]" };
  return { text: `${days}d left`, color: "text-[#8B8D93]" };
}

const typeIcons: Record<string, any> = {
  film: Film,
  "tv series": Tv,
  commercial: Clapperboard,
  "music video": ImageIcon,
};

interface EnrichedProject {
  id: string;
  name: string;
  brand: string | null;
  type: string;
  status: string;
  deadline: string | null;
  created_at: string;
  isShared?: boolean;
  ownerName?: string;
  roles: {
    id: string;
    name: string;
    brief: string | null;
    packageCount: number;
    talentCount: number;
    pickCount: number;
    mediaRequestedCount: number;
    mediaUploadedCount: number;
    agentIds: string[];
    agentProfiles: Record<string, { full_name: string; agency_name: string | null }>;
  }[];
  requests: any[];
  stats: {
    roleCount: number;
    totalTalent: number;
    totalPicks: number;
    totalMediaRequested: number;
    totalMediaUploaded: number;
    pendingRequests: number;
    respondedRequests: number;
    totalRequests: number;
  };
}

export default function ProjectDashboard({
  projects: initialProjects,
  sharedProjects: initialSharedProjects = [],
}: {
  projects: EnrichedProject[];
  sharedProjects?: EnrichedProject[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [emailModalProject, setEmailModalProject] = useState<EnrichedProject | null>(null);
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showSmartCreator, setShowSmartCreator] = useState(false);

  const activeProjects = projects.filter((p) => p.status === "active" || p.status === "casting");
  const archivedProjects = projects.filter((p) => p.status === "archived" || p.status === "closed");
  const displayedProjects = showArchived
    ? projects
    : projects.filter((p) => p.status !== "archived" && p.status !== "closed");
  const totalTalent = projects.reduce((s, p) => s + p.stats.totalTalent, 0);
  const totalPicks = projects.reduce((s, p) => s + p.stats.totalPicks, 0);
  const pendingRequests = projects.reduce((s, p) => s + p.stats.pendingRequests, 0);
  const overdueProjects = projects.filter((p) => p.deadline && daysUntil(p.deadline) < 0 && p.status !== "wrapped" && p.status !== "archived" && p.status !== "closed");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function toggleExpand(id: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRename(projectId: string) {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    if (res.ok) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, name: renameValue.trim() } : p))
      );
      showToast("Project renamed");
    }
    setRenamingId(null);
  }

  async function handleArchive(projectId: string, currentStatus: string) {
    const newStatus = currentStatus === "archived" ? "active" : "archived";
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
      showToast(newStatus === "archived" ? "Project archived" : "Project unarchived");
      router.refresh();
    }
  }

  async function handleDuplicate(projectId: string) {
    const res = await fetch(`/api/projects/${projectId}/copy`, { method: "POST" });
    if (res.ok) {
      showToast("Project duplicated");
      router.refresh();
    }
  }

  async function handleDelete(projectId: string, projectName: string) {
    if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      showToast("Project deleted");
    }
  }

  async function handleEmailAgents() {
    if (!emailModalProject || !emailMessage.trim()) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/projects/${emailModalProject.id}/email-agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: emailMessage.trim() }),
      });
      if (res.ok) {
        showToast("Emails sent to agents");
        setEmailModalProject(null);
        setEmailMessage("");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to send emails");
      }
    } catch (err) {
      showToast("Failed to send emails");
    } finally {
      setSendingEmail(false);
    }
  }

  function getMenuItems(project: EnrichedProject): KebabMenuItem[] {
    return [
      {
        label: "Rename",
        icon: <Pencil size={14} />,
        onClick: () => {
          setRenameValue(project.name);
          setRenamingId(project.id);
        },
      },
      {
        label: "Email All Agents",
        icon: <Mail size={14} />,
        onClick: () => {
          setEmailModalProject(project);
          setEmailMessage("");
        },
      },
      {
        label: project.status === "archived" ? "Unarchive" : "Archive",
        icon: <Archive size={14} />,
        onClick: () => handleArchive(project.id, project.status),
      },
      {
        label: "Duplicate",
        icon: <Copy size={14} />,
        onClick: () => handleDuplicate(project.id),
      },
      {
        label: "Delete",
        icon: <Trash2 size={14} />,
        onClick: () => handleDelete(project.id, project.name),
        danger: true,
      },
    ];
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#E8E3D8]">Dashboard</h1>
          {archivedProjects.length > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`text-xs rounded-full px-3 py-1 transition ${
                showArchived
                  ? "bg-[#B8964C]/20 text-[#B8964C] border border-[#B8964C]/30"
                  : "bg-[#1E2128] text-[#8B8D93] border border-[#2A2D35] hover:text-[#E8E3D8]"
              }`}
            >
              {showArchived ? "Hide Archived" : `Show Archived (${archivedProjects.length})`}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSmartCreator(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-2 text-sm font-semibold text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all duration-300"
          >
            <Sparkles size={14} />
            Smart Create
          </button>
          <Link
            href="/client/projects/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#B8964C] px-4 py-2 text-sm font-semibold text-[#0F0F12] hover:bg-[#C9A64C] hover:shadow-lg hover:shadow-[#B8964C]/10 transition-all duration-300"
          >
            + New Project
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={FolderKanban} label="Active Projects" value={activeProjects.length} />
        <StatCard icon={Users} label="Total Talent" value={totalTalent} />
        <StatCard icon={Star} label="Picks Made" value={totalPicks} accent />
        <StatCard
          icon={pendingRequests > 0 ? Clock : CheckCircle}
          label="Pending Requests"
          value={pendingRequests}
          warning={pendingRequests > 0}
        />
      </div>

      {/* Overdue alert */}
      {overdueProjects.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">
              {overdueProjects.length} project{overdueProjects.length !== 1 ? "s" : ""} past deadline
            </p>
            <p className="text-xs text-red-400/70 mt-0.5">
              {overdueProjects.map((p) => p.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {displayedProjects.length === 0 && projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-full bg-[#1E2128] flex items-center justify-center mb-4">
            <FolderKanban size={28} className="text-[#8B8D93]" />
          </div>
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
        <div className="space-y-4">
          {displayedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isExpanded={expandedProjects.has(project.id)}
              isRenaming={renamingId === project.id}
              renameValue={renameValue}
              onRenameValueChange={setRenameValue}
              onRenameSubmit={() => handleRename(project.id)}
              onToggleExpand={() => toggleExpand(project.id)}
              menuItems={getMenuItems(project)}
            />
          ))}
        </div>
      )}

      {/* Shared with you section */}
      {initialSharedProjects.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8B8D93] mb-4">
            Shared with you
          </h2>
          <div className="space-y-4">
            {initialSharedProjects.map((project) => (
              <SharedProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}

      {/* Email All Agents Modal */}
      {emailModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEmailModalProject(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-[#1E2128] bg-[#13151A] p-6 shadow-2xl">
            <button
              onClick={() => setEmailModalProject(null)}
              className="absolute top-4 right-4 text-[#8B8D93] hover:text-[#E8E3D8] transition"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Mail size={18} className="text-[#C9A84C]" />
              <h2 className="text-lg font-bold text-[#E8E3D8]">Email All Agents</h2>
            </div>
            <p className="text-xs text-[#8B8D93] mb-4">
              Send a message to all agents associated with <span className="text-[#E8E3D8]">{emailModalProject.name}</span>.
            </p>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Type your message to agents..."
              rows={5}
              className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEmailModalProject(null)}
                className="rounded-lg bg-[#1E2128] px-4 py-2 text-sm text-[#8B8D93] hover:text-[#E8E3D8] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailAgents}
                disabled={sendingEmail || !emailMessage.trim()}
                className="rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50"
              >
                {sendingEmail ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Project Creator Modal */}
      <SmartProjectCreatorModal
        isOpen={showSmartCreator}
        onClose={() => setShowSmartCreator(false)}
        onProjectCreated={(projectId) => {
          setShowSmartCreator(false);
          router.push(`/client/projects/${projectId}`);
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-[#1E2128] bg-[#13151A] px-4 py-2.5 text-sm text-[#E8E3D8] shadow-xl shadow-black/40 animate-[fade-in_0.15s_ease-out]">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  warning,
}: {
  icon: any;
  label: string;
  value: number;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon
          size={16}
          className={warning ? "text-amber-400" : accent ? "text-[#C9A84C]" : "text-[#8B8D93]"}
        />
        <span className="text-xs text-[#8B8D93]">{label}</span>
      </div>
      <p
        className={`text-2xl font-bold ${
          warning ? "text-amber-400" : accent ? "text-[#C9A84C]" : "text-[#E8E3D8]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ProjectCard({
  project,
  isExpanded,
  isRenaming,
  renameValue,
  onRenameValueChange,
  onRenameSubmit,
  onToggleExpand,
  menuItems,
}: {
  project: EnrichedProject;
  isExpanded: boolean;
  isRenaming: boolean;
  renameValue: string;
  onRenameValueChange: (v: string) => void;
  onRenameSubmit: () => void;
  onToggleExpand: () => void;
  menuItems: KebabMenuItem[];
}) {
  const dl = deadlineLabel(project.deadline);
  const TypeIcon = typeIcons[project.type?.toLowerCase()] || Clapperboard;

  const statusConfig: Record<string, { label: string; color: "green" | "gold" | "muted" | "red" }> = {
    active: { label: "Active", color: "green" },
    casting: { label: "Casting", color: "gold" },
    wrapped: { label: "Wrapped", color: "muted" },
    archived: { label: "Archived", color: "muted" },
    closed: { label: "Closed", color: "muted" },
  };
  const sc = statusConfig[project.status] || { label: project.status, color: "muted" as const };

  return (
    <div className="rounded-xl border border-[#1E2128] bg-[#161920] hover:border-[#2A2D35] transition group">
      {/* Header row */}
      <div className="flex items-center justify-between p-5">
        <Link
          href={`/client/projects/${project.id}`}
          className="flex items-center gap-3 min-w-0 flex-1"
          onClick={(e) => {
            // Prevent navigation when renaming
            if (isRenaming) e.preventDefault();
          }}
        >
          <div className="w-9 h-9 rounded-lg bg-[#1E2128] flex items-center justify-center shrink-0">
            <TypeIcon size={18} className="text-[#8B8D93]" />
          </div>
          <div className="min-w-0">
            {isRenaming ? (
              <input
                autoFocus
                className="bg-[#1E2128] border border-[#2A2D35] rounded-md px-2 py-1 text-sm text-[#E8E3D8] font-semibold w-48 focus:outline-none focus:border-[#C9A84C]"
                value={renameValue}
                onChange={(e) => onRenameValueChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onRenameSubmit();
                  if (e.key === "Escape") onRenameSubmit();
                }}
                onBlur={onRenameSubmit}
                onClick={(e) => e.preventDefault()}
              />
            ) : (
              <h3 className="font-semibold text-[#E8E3D8] truncate">{project.name}</h3>
            )}
            {project.brand && (
              <p className="text-xs text-[#8B8D93] truncate">{project.brand} &middot; {project.type}</p>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs text-[#8B8D93]">
            {project.stats.roleCount} role{project.stats.roleCount !== 1 ? "s" : ""} &middot; {project.stats.totalTalent} talent
          </span>
          {dl && <span className={`text-xs font-medium ${dl.color}`}>{dl.text}</span>}
          <Badge label={sc.label} color={sc.color} />
          <KebabMenu items={menuItems} />
          <button
            onClick={onToggleExpand}
            className="p-1.5 text-[#8B8D93] hover:text-[#E8E3D8] transition"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-[#1E2128]">
          {/* Role progress rows */}
          {project.roles.length > 0 && (
            <div className="space-y-2 mt-4 mb-4">
              {project.roles.map((role) => {
                const progress = role.talentCount > 0 ? (role.pickCount / role.talentCount) * 100 : 0;
                return (
                  <div key={role.id} className="flex items-center gap-3">
                    <span className="text-xs text-[#E8E3D8] w-28 truncate shrink-0">{role.name}</span>
                    {/* Progress bar */}
                    <div className="flex-1 h-1.5 rounded-full bg-[#1E2128] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#B8943F] transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#8B8D93] shrink-0 w-32 justify-end">
                      <span>{role.talentCount} talent</span>
                      <span className="text-[#C9A84C]">{role.pickCount} picks</span>
                      {role.agentIds.length > 0 && (
                        <div className="flex -space-x-1">
                          {role.agentIds.slice(0, 3).map((aid) => (
                            <span
                              key={aid}
                              className="w-3 h-3 rounded-full border border-[#161920]"
                              style={{ backgroundColor: agencyColor(aid) }}
                              title={role.agentProfiles[aid]?.agency_name || role.agentProfiles[aid]?.full_name || ""}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer stats row */}
          <div className="flex items-center justify-between pt-3 border-t border-[#1E2128]">
            <div className="flex gap-4 text-xs text-[#8B8D93]">
              <span className="flex items-center gap-1">
                <Users size={12} />
                {project.stats.totalTalent} talent
              </span>
              <span className="flex items-center gap-1">
                <Star size={12} className="text-[#C9A84C]" />
                {project.stats.totalPicks} picks
              </span>
              {project.stats.totalMediaRequested > 0 && (
                <span className="flex items-center gap-1">
                  <ImageIcon size={12} />
                  {project.stats.totalMediaUploaded}/{project.stats.totalMediaRequested} media
                </span>
              )}
            </div>
            <div className="flex gap-3 text-xs">
              {project.stats.totalRequests > 0 && (
                <span className="flex items-center gap-1">
                  <Send size={11} className="text-[#8B8D93]" />
                  <span className="text-[#8B8D93]">
                    {project.stats.respondedRequests}/{project.stats.totalRequests} responded
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SharedProjectCard({ project }: { project: EnrichedProject }) {
  const dl = deadlineLabel(project.deadline);
  const TypeIcon = typeIcons[project.type?.toLowerCase()] || Clapperboard;

  const statusConfig: Record<string, { label: string; color: "green" | "gold" | "muted" | "red" }> = {
    active: { label: "Active", color: "green" },
    casting: { label: "Casting", color: "gold" },
    wrapped: { label: "Wrapped", color: "muted" },
    archived: { label: "Archived", color: "muted" },
    closed: { label: "Closed", color: "muted" },
  };
  const sc = statusConfig[project.status] || { label: project.status, color: "muted" as const };

  return (
    <Link
      href={`/client/projects/${project.id}`}
      className="block rounded-xl border border-[#1E2128] bg-[#161920] p-5 hover:border-[#2A2D35] transition group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#1E2128] flex items-center justify-center shrink-0">
            <TypeIcon size={18} className="text-[#8B8D93]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[#E8E3D8] truncate">{project.name}</h3>
            <div className="flex items-center gap-2">
              {project.brand && (
                <p className="text-xs text-[#8B8D93] truncate">{project.brand} &middot; {project.type}</p>
              )}
              {project.ownerName && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#C9A84C]/10 text-[#C9A84C]">
                  by {project.ownerName}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dl && <span className={`text-xs font-medium ${dl.color}`}>{dl.text}</span>}
          <Badge label={sc.label} color={sc.color} />
          <ChevronRight size={16} className="text-[#8B8D93] group-hover:text-[#C9A84C] transition" />
        </div>
      </div>

      {/* Footer stats row */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1E2128]">
        <div className="flex gap-4 text-xs text-[#8B8D93]">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {project.stats.totalTalent} talent
          </span>
          <span className="flex items-center gap-1">
            <Star size={12} className="text-[#C9A84C]" />
            {project.stats.totalPicks} picks
          </span>
        </div>
        <div className="flex gap-3 text-xs">
          {project.stats.totalRequests > 0 && (
            <span className="flex items-center gap-1">
              <Send size={11} className="text-[#8B8D93]" />
              <span className="text-[#8B8D93]">
                {project.stats.respondedRequests}/{project.stats.totalRequests} responded
              </span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

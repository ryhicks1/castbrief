"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge, Button, Input, KebabMenu } from "@/components/ui";
import type { KebabMenuItem } from "@/components/ui";
import {
  Users,
  Star,
  Clock,
  Send,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  Calendar,
  FileDown,
  FolderPlus,
  Folder,
  Trash2,
  Pencil,
  Copy,
  FolderInput,
  Globe,
  Eye,
  EyeOff,
  ClipboardList,
  Link as LinkIcon,
} from "lucide-react";
import DocumentSection from "./DocumentSection";
import ScriptBreakdownModal from "./ScriptBreakdownModal";
import ShareProjectModal from "./ShareProjectModal";
import OpenCallSetupModal from "./OpenCallSetupModal";
import { FileText } from "lucide-react";

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

interface DocumentRecord {
  id: string;
  name: string;
  url: string;
  file_type: string;
  size_bytes: number;
  created_at: string;
  created_by: string;
}

interface FolderRecord {
  id: string;
  name: string;
  sort_order: number;
}

interface ProjectDetailProps {
  documents?: DocumentRecord[];
  requests?: PackageRequest[];
  folders?: FolderRecord[];
  isOwner?: boolean;
  project: {
    id: string;
    name: string;
    brand: string | null;
    type: string;
    status: string;
    deadline: string | null;
    open_call_enabled?: boolean;
    open_call_token?: string | null;
    open_call_form_url?: string | null;
    open_call_show_project_docs?: boolean;
    open_call_show_role_docs?: boolean;
    roles: {
      id: string;
      name: string;
      brief: string | null;
      folder_id?: string | null;
      open_call_visible?: boolean;
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

export default function ProjectDetail({
  project,
  userId,
  requests = [],
  documents = [],
  folders = [],
  isOwner = true,
}: ProjectDetailProps) {
  const router = useRouter();
  const [roleName, setRoleName] = useState("");
  const [roleBrief, setRoleBrief] = useState("");
  const [roleFolderId, setRoleFolderId] = useState<string>("");
  const [addingRole, setAddingRole] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [openCallEnabled, setOpenCallEnabled] = useState(project.open_call_enabled ?? false);
  const [openCallToken, setOpenCallToken] = useState(project.open_call_token ?? null);
  const [openCallCopied, setOpenCallCopied] = useState(false);
  const [showOpenCallModal, setShowOpenCallModal] = useState(false);
  const [disablingOpenCall, setDisablingOpenCall] = useState(false);
  const [openCallFormUrl, setOpenCallFormUrl] = useState(project.open_call_form_url ?? null);
  const [openCallShowProjectDocs, setOpenCallShowProjectDocs] = useState(project.open_call_show_project_docs ?? true);
  const [openCallShowRoleDocs, setOpenCallShowRoleDocs] = useState(project.open_call_show_role_docs ?? true);
  const [dropboxConnected, setDropboxConnected] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkDropbox() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("dropbox_token")
        .eq("id", user.id)
        .single();
      setDropboxConnected(!!data?.dropbox_token);
    }
    checkDropbox();
  }, []);

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

  // Group roles by folder
  const ungroupedRoles = (project.roles || []).filter((r) => !r.folder_id);
  const folderRolesMap: Record<string, typeof project.roles> = {};
  for (const folder of folders) {
    folderRolesMap[folder.id] = (project.roles || []).filter((r) => r.folder_id === folder.id);
  }

  function toggleFolderCollapse(folderId: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }

  async function handleAddRole(e: React.FormEvent) {
    e.preventDefault();
    if (!roleName.trim()) return;
    setAddingRole(true);

    const supabase = createClient();
    await supabase.from("roles").insert({
      project_id: project.id,
      name: roleName.trim(),
      brief: roleBrief.trim() || null,
      folder_id: roleFolderId || null,
    });

    // Create Dropbox folder for the role (non-blocking)
    try {
      await fetch("/api/dropbox/create-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: `/CastingBrief/${project.name}/${roleName.trim()}`,
        }),
      });
    } catch (err) {
      console.error("Dropbox role folder creation failed (non-blocking):", err);
    }

    setRoleName("");
    setRoleBrief("");
    setRoleFolderId("");
    setAddingRole(false);
    router.refresh();
  }

  async function handleAddFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setAddingFolder(true);

    try {
      await fetch("/api/project-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.id,
          name: newFolderName.trim(),
        }),
      });

      // Create Dropbox folder for the episode/folder (non-blocking)
      try {
        await fetch("/api/dropbox/create-folder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: `/CastingBrief/${project.name}/${newFolderName.trim()}`,
          }),
        });
      } catch (err) {
        console.error("Dropbox folder creation failed (non-blocking):", err);
      }

      setNewFolderName("");
      setShowFolderInput(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to create folder:", err);
    } finally {
      setAddingFolder(false);
    }
  }

  async function handleDeleteFolder(folderId: string) {
    try {
      await fetch(`/api/project-folders?id=${folderId}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      console.error("Failed to delete folder:", err);
    }
  }

  async function handleDisableOpenCall() {
    setDisablingOpenCall(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open_call_enabled: false }),
      });
      if (res.ok) {
        setOpenCallEnabled(false);
      }
    } catch (err) {
      console.error("Failed to disable open call:", err);
    } finally {
      setDisablingOpenCall(false);
    }
  }

  function copyOpenCallLink() {
    if (!openCallToken) return;
    const link = `${window.location.origin}/open-call/${openCallToken}`;
    navigator.clipboard.writeText(link);
    setOpenCallCopied(true);
    setTimeout(() => setOpenCallCopied(false), 2000);
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
          {isOwner && (
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-1 text-xs text-[#8B8D93] hover:text-[#E8E3D8] hover:border-[#2A2D35] transition"
            >
              <Users size={13} />
              Share
            </button>
          )}
          {isOwner && !openCallEnabled && (
            <button
              onClick={() => setShowOpenCallModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-1 text-xs text-[#8B8D93] hover:text-[#E8E3D8] hover:border-[#2A2D35] transition"
            >
              <Globe size={13} />
              Create Open Call
            </button>
          )}
          {isOwner && openCallEnabled && (
            <button
              onClick={() => setShowOpenCallModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 text-xs text-[#C9A84C] transition hover:bg-[#C9A84C]/20"
            >
              <Globe size={13} />
              Edit Open Call
            </button>
          )}
          {dropboxConnected === true && (
            <span className="flex items-center gap-1 text-[10px] text-[#8B8D93]" title="Dropbox connected">
              <FolderInput size={12} className="text-[#B8964C]" />
              Dropbox
            </span>
          )}
          {dropboxConnected === false && (
            <Link
              href="/client/dropbox-connect"
              className="flex items-center gap-1 text-[10px] text-[#B8964C] hover:text-[#C9A64C] transition"
            >
              <FolderInput size={12} />
              Connect Dropbox
            </Link>
          )}
        </div>
        {project.brand && (
          <p className="text-sm text-[#8B8D93]">
            {project.brand} &middot; {project.type}
          </p>
        )}
        {openCallEnabled && openCallToken && (
          <div className="flex items-center gap-2 mt-3 p-2 rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/5">
            <Globe size={14} className="text-[#C9A84C] shrink-0" />
            <span className="text-xs text-[#8B8D93] truncate">
              {typeof window !== "undefined" ? `${window.location.origin}/open-call/${openCallToken}` : `/open-call/${openCallToken}`}
            </span>
            <button
              onClick={copyOpenCallLink}
              className="flex items-center gap-1 shrink-0 rounded border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-2 py-0.5 text-[10px] text-[#C9A84C] hover:bg-[#C9A84C]/20 transition"
            >
              <LinkIcon size={10} />
              {openCallCopied ? "Copied!" : "Copy Link"}
            </button>
            <Link
              href={`/client/projects/${project.id}/submissions`}
              className="flex items-center gap-1 shrink-0 rounded border border-[#1E2128] bg-[#161920] px-2 py-0.5 text-[10px] text-[#8B8D93] hover:text-[#E8E3D8] transition"
            >
              <ClipboardList size={10} />
              View Submissions
            </Link>
            <button
              onClick={handleDisableOpenCall}
              disabled={disablingOpenCall}
              className="flex items-center gap-1 shrink-0 rounded border border-red-500/20 bg-red-500/5 px-2 py-0.5 text-[10px] text-red-400 hover:bg-red-500/10 transition"
            >
              {disablingOpenCall ? "..." : "Disable"}
            </button>
          </div>
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

      {/* Documents */}
      <div className="mb-6">
        <DocumentSection projectId={project.id} documents={documents} />
      </div>

      {/* Roles section header */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8B8D93] mb-3">
          Roles
        </h2>
        <div className="flex gap-2 mb-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowScriptModal(true)}
          >
            <FileText size={14} />
            Upload Script
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFolderInput(true)}
          >
            <FolderPlus size={14} />
            Add Folder
          </Button>
        </div>

        {/* Add folder inline input */}
        {showFolderInput && (
          <form onSubmit={handleAddFolder} className="flex gap-2 mb-4">
            <Input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="flex-1"
              autoFocus
            />
            <Button
              variant="secondary"
              type="submit"
              disabled={addingFolder || !newFolderName.trim()}
              loading={addingFolder}
            >
              Create
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setShowFolderInput(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
          </form>
        )}

        {/* Add role form */}
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
          {folders.length > 0 && (
            <select
              value={roleFolderId}
              onChange={(e) => setRoleFolderId(e.target.value)}
              className="rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
            >
              <option value="">No Folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
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

      {/* Roles list - grouped by folders */}
      <div className="space-y-3">
        {/* Folder sections (appear first) */}
        {folders.map((folder) => {
          const folderRoles = folderRolesMap[folder.id] || [];
          const isCollapsed = collapsedFolders.has(folder.id);

          return (
            <div key={folder.id}>
              {/* Folder header */}
              <div className="flex items-center gap-2 mb-2 mt-4">
                <button
                  onClick={() => toggleFolderCollapse(folder.id)}
                  className="flex items-center gap-2 text-sm font-medium text-[#E8E3D8] hover:text-[#C9A84C] transition"
                >
                  {isCollapsed ? (
                    <ChevronRight size={14} className="text-[#8B8D93]" />
                  ) : (
                    <ChevronDown size={14} className="text-[#8B8D93]" />
                  )}
                  <Folder size={14} className="text-[#C9A84C]" />
                  {folder.name}
                  <span className="text-xs text-[#8B8D93] font-normal">
                    ({folderRoles.length})
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="text-[#8B8D93] hover:text-red-400 transition ml-auto"
                  title="Delete folder"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Folder roles */}
              {!isCollapsed && (
                <div className="space-y-3 ml-6">
                  {folderRoles.length === 0 ? (
                    <p className="text-xs text-[#8B8D93] italic py-2">
                      No roles in this folder
                    </p>
                  ) : (
                    folderRoles.map((role) => (
                      <RoleCard key={role.id} role={role} project={project} requests={requests} folders={folders} onRefresh={() => router.refresh()} openCallEnabled={openCallEnabled} />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Ungrouped roles (no folder) */}
        {ungroupedRoles.map((role) => (
          <RoleCard key={role.id} role={role} project={project} requests={requests} folders={folders} onRefresh={() => router.refresh()} openCallEnabled={openCallEnabled} />
        ))}
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

      {showScriptModal && (
        <ScriptBreakdownModal
          projectId={project.id}
          onClose={() => setShowScriptModal(false)}
          onComplete={() => {
            setShowScriptModal(false);
            router.refresh();
          }}
        />
      )}

      {showShareModal && (
        <ShareProjectModal
          projectId={project.id}
          projectName={project.name}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showOpenCallModal && (
        <OpenCallSetupModal
          projectId={project.id}
          projectName={project.name}
          roles={project.roles.map((r) => ({
            id: r.id,
            name: r.name,
            open_call_visible: r.open_call_visible,
          }))}
          isEnabled={openCallEnabled}
          token={openCallToken}
          openCallFormUrl={openCallFormUrl}
          openCallShowProjectDocs={openCallShowProjectDocs}
          openCallShowRoleDocs={openCallShowRoleDocs}
          onClose={() => setShowOpenCallModal(false)}
          onSave={(data) => {
            setOpenCallEnabled(data.open_call_enabled);
            if (data.open_call_token) setOpenCallToken(data.open_call_token);
            setOpenCallFormUrl(data.open_call_form_url);
            setOpenCallShowProjectDocs(data.open_call_show_project_docs);
            setOpenCallShowRoleDocs(data.open_call_show_role_docs);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function RoleCard({
  role,
  project,
  requests,
  folders = [],
  onRefresh,
  openCallEnabled = false,
}: {
  role: ProjectDetailProps["project"]["roles"][number];
  project: ProjectDetailProps["project"];
  requests: PackageRequest[];
  folders?: FolderRecord[];
  onRefresh?: () => void;
  openCallEnabled?: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState(role.name);
  const [editing, setEditing] = useState(false);
  const [editBrief, setEditBrief] = useState(role.brief || "");

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

  async function handleRename() {
    if (!renameName.trim() || renameName === role.name) { setRenaming(false); return; }
    await fetch(`/api/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameName.trim() }),
    });
    setRenaming(false);
    onRefresh?.();
  }

  async function handleSaveBrief() {
    await fetch(`/api/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameName.trim() || role.name, brief: editBrief.trim() || null }),
    });
    setEditing(false);
    onRefresh?.();
  }

  async function handleDelete() {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    await fetch(`/api/roles/${role.id}`, { method: "DELETE" });
    onRefresh?.();
  }

  async function handleDuplicate() {
    await fetch(`/api/roles/${role.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    onRefresh?.();
  }

  async function handleMoveToFolder(folderId: string | null) {
    await fetch(`/api/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_id: folderId }),
    });
    onRefresh?.();
  }

  async function handleToggleOpenCallVisible() {
    await fetch(`/api/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open_call_visible: !role.open_call_visible }),
    });
    onRefresh?.();
  }

  const folderMenuItems: KebabMenuItem[] = folders
    .filter((f) => f.id !== role.folder_id)
    .map((f) => ({
      label: `Move to ${f.name}`,
      icon: <FolderInput size={14} />,
      onClick: () => handleMoveToFolder(f.id),
    }));

  if (role.folder_id) {
    folderMenuItems.unshift({
      label: "Remove from folder",
      icon: <FolderInput size={14} />,
      onClick: () => handleMoveToFolder(null),
    });
  }

  const menuItems: KebabMenuItem[] = [
    { label: "Edit Role", icon: <Pencil size={14} />, onClick: () => { setEditing(true); setRenameName(role.name); setEditBrief(role.brief || ""); } },
    { label: "Duplicate", icon: <Copy size={14} />, onClick: handleDuplicate },
    ...folderMenuItems,
    ...(openCallEnabled
      ? [
          {
            label: role.open_call_visible ? "Hide from Open Call" : "Show in Open Call",
            icon: role.open_call_visible ? <EyeOff size={14} /> : <Eye size={14} />,
            onClick: handleToggleOpenCallVisible,
          },
        ]
      : []),
    { label: "Delete", icon: <Trash2 size={14} />, onClick: handleDelete, danger: true },
  ];

  return (
    <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-4">
      {/* Edit mode */}
      {editing && (
        <div className="mb-3 space-y-2">
          <input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Role name..."
            autoFocus
            className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-sm font-semibold text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
          />
          <textarea
            value={editBrief}
            onChange={(e) => setEditBrief(e.target.value)}
            placeholder="Role description / brief..."
            rows={3}
            className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-xs text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveBrief}
              className="rounded-lg bg-[#C9A84C] px-3 py-1 text-xs font-semibold text-[#0D0F14] hover:bg-[#D4B35C] transition"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg bg-[#1E2128] px-3 py-1 text-xs text-[#8B8D93] hover:text-[#E8E3D8] transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editing && (
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
          <KebabMenu items={menuItems} />
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
      )}

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

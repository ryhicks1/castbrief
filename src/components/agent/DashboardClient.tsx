"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Avatar, Badge, KebabMenu } from "@/components/ui";
import type { KebabMenuItem } from "@/components/ui";
import {
  ChevronRight,
  PackagePlus,
  Pencil,
  Copy,
  Link2,
  Trash2,
  MessageSquare,
  FileDown,
  FileSpreadsheet,
  Users,
} from "lucide-react";

interface PackageTalent {
  id: string;
  talent_id: string;
  client_pick: boolean;
  client_comment: string | null;
  client_status: string | null;
  client_rating: number | null;
  media_requested: boolean;
  upload_status: string;
  talents: { full_name: string; photo_url: string | null };
}

interface Package {
  id: string;
  name: string;
  token: string;
  client_name: string | null;
  status: string;
  dropbox_folder_url: string | null;
  last_viewed_at: string | null;
  created_at: string;
  package_talents: PackageTalent[];
}

interface Stats {
  activePackages: number;
  pendingMedia: number;
  uploadsReceived: number;
}

interface DashboardClientProps {
  packages: Package[];
  stats: Stats;
}

const statusColors: Record<string, "muted" | "gold" | "green" | "red"> = {
  draft: "muted",
  sent: "gold",
  viewed: "gold",
  media_requested: "gold",
  complete: "green",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  media_requested: "Media Req",
  complete: "Complete",
};

export default function DashboardClient({
  packages: initialPackages,
  stats,
}: DashboardClientProps) {
  const router = useRouter();
  const [packages, setPackages] = useState(initialPackages);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [copyTalentId, setCopyTalentId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRename(pkgId: string) {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    await fetch(`/api/packages/${pkgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, name: renameValue.trim() } : p))
    );
    setRenamingId(null);
    showToast("Package renamed");
  }

  function handleCopyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/p/${token}`);
    showToast("Link copied to clipboard");
  }

  async function handleDuplicate(pkgId: string) {
    const res = await fetch(`/api/packages/${pkgId}/copy`, { method: "POST" });
    if (res.ok) {
      showToast("Package duplicated");
      router.refresh();
    }
  }

  async function handleDelete(pkgId: string, pkgName: string) {
    if (!confirm(`Delete "${pkgName}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/packages/${pkgId}`, { method: "DELETE" });
    if (res.ok) {
      setPackages((prev) => prev.filter((p) => p.id !== pkgId));
      showToast("Package deleted");
    }
  }

  async function handleSendMessage(pkgId: string) {
    if (!messageContent.trim()) return;
    setMessageSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ package_id: pkgId, content: messageContent.trim() }),
    });
    setMessageSending(false);
    setMessagingId(null);
    setMessageContent("");
    showToast("Message sent to all talent");
  }

  function handleExport(pkgId: string, format: "pdf" | "csv") {
    window.open(`/api/reports/package/${pkgId}?format=${format}`, "_blank");
  }

  async function handleCopyTalent(sourceId: string, targetId: string) {
    const res = await fetch(`/api/packages/${sourceId}/copy-talent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetPackageId: targetId }),
    });
    const data = await res.json();
    setCopyTalentId(null);
    if (data.copied > 0) {
      showToast(`${data.copied} talent copied`);
    } else {
      showToast(data.message || "No talent to copy");
    }
  }

  function getMenuItems(pkg: Package): KebabMenuItem[] {
    return [
      {
        label: "Rename",
        icon: <Pencil size={14} />,
        onClick: () => {
          setRenameValue(pkg.name);
          setRenamingId(pkg.id);
        },
      },
      {
        label: "Copy Link",
        icon: <Link2 size={14} />,
        onClick: () => handleCopyLink(pkg.token),
      },
      {
        label: "Duplicate",
        icon: <Copy size={14} />,
        onClick: () => handleDuplicate(pkg.id),
      },
      {
        label: "Copy Talent to...",
        icon: <Users size={14} />,
        onClick: () => setCopyTalentId(pkg.id),
      },
      {
        label: "Message All Talent",
        icon: <MessageSquare size={14} />,
        onClick: () => {
          setMessagingId(pkg.id);
          setMessageContent("");
        },
      },
      {
        label: "Export PDF",
        icon: <FileDown size={14} />,
        onClick: () => handleExport(pkg.id, "pdf"),
      },
      {
        label: "Export CSV",
        icon: <FileSpreadsheet size={14} />,
        onClick: () => handleExport(pkg.id, "csv"),
      },
      {
        label: "Delete",
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => handleDelete(pkg.id, pkg.name),
      },
    ];
  }

  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-5xl mb-4">
          <PackagePlus size={48} className="text-[#8B8D93]" />
        </div>
        <h2 className="text-xl font-semibold text-[#E8E3D8] mb-2">
          No packages yet
        </h2>
        <p className="text-[#8B8D93] mb-6 text-sm">
          Create your first package to share talent with clients
        </p>
        <Link href="/agent/packages/new">
          <Button>Create Package</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-[#1E2128] border border-[#2A2D35] px-4 py-2.5 text-sm text-[#E8E3D8] shadow-xl shadow-black/40 animate-[fade-in_0.2s_ease-out]">
          {toast}
        </div>
      )}

      {/* Copy Talent Modal */}
      {copyTalentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl border border-[#1E2128] bg-[#13151A] p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-semibold text-[#E8E3D8] mb-4">Copy talent to which package?</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {packages
                .filter((p) => p.id !== copyTalentId)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleCopyTalent(copyTalentId, p.id)}
                    className="flex items-center w-full px-3 py-2 rounded-lg text-sm text-[#E8E3D8] hover:bg-[#1E2128] transition text-left"
                  >
                    <span className="truncate flex-1">{p.name}</span>
                    <span className="text-xs text-[#8B8D93] ml-2">{p.package_talents.length} talent</span>
                  </button>
                ))}
            </div>
            <button
              onClick={() => setCopyTalentId(null)}
              className="mt-4 w-full rounded-lg bg-[#1E2128] px-3 py-2 text-sm text-[#8B8D93] hover:text-[#E8E3D8] transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#E8E3D8]">Dashboard</h1>
        <Link href="/agent/packages/new">
          <Button size="sm">New Package</Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Active Packages" value={stats.activePackages} />
        <StatCard label="Pending Media" value={stats.pendingMedia} />
        <StatCard label="Uploads Received" value={stats.uploadsReceived} />
      </div>

      {/* Packages list */}
      <div className="space-y-2">
        {packages.map((pkg) => {
          const isExpanded = expanded.has(pkg.id);
          const talentCount = pkg.package_talents.length;
          const pickCount = pkg.package_talents.filter(
            (pt) => pt.client_status === "yes"
          ).length;
          const commentCount = pkg.package_talents.filter(
            (pt) => pt.client_comment
          ).length;

          return (
            <div
              key={pkg.id}
              className="rounded-xl bg-[#13151A] shadow-lg shadow-black/20"
            >
              {/* Collapsed row */}
              <div className="flex items-center w-full px-4 py-3 hover:bg-[#1E2128]/50 transition">
                <button
                  onClick={() => toggleExpand(pkg.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-2">
                    {renamingId === pkg.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRename(pkg.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(pkg.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#1E2128] border border-[#C9A84C] rounded px-2 py-0.5 text-sm text-[#E8E3D8] focus:outline-none w-48"
                      />
                    ) : (
                      <Link
                        href={`/agent/packages/${pkg.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-[#E8E3D8] truncate hover:text-[#B8964C] transition-colors"
                      >
                        {pkg.name}
                      </Link>
                    )}
                    <Badge
                      label={statusLabels[pkg.status] || pkg.status}
                      color={statusColors[pkg.status] || "muted"}
                    />
                  </div>
                  <div className="text-xs text-[#8B8D93] mt-0.5">
                    {pkg.client_name && `${pkg.client_name} · `}
                    {talentCount} talent ·{" "}
                    {new Date(pkg.created_at).toLocaleDateString()}
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <KebabMenu items={getMenuItems(pkg)} />
                  <button
                    onClick={() => toggleExpand(pkg.id)}
                    className="p-1.5 text-[#8B8D93] hover:text-[#E8E3D8] transition"
                  >
                    <ChevronRight
                      size={16}
                      className={`transition-transform duration-300 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Message input */}
              {messagingId === pkg.id && (
                <div className="border-t border-[#1E2128] px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-2">
                    Message All Talent
                  </div>
                  <textarea
                    autoFocus
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={3}
                    placeholder="Type your message..."
                    className="w-full rounded-lg border border-[#2A2D35] bg-[#0F0F12] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleSendMessage(pkg.id)}
                      loading={messageSending}
                      disabled={!messageContent.trim()}
                    >
                      Send to {talentCount} talent
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setMessagingId(null);
                        setMessageContent("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-[#1E2128] px-4 py-4">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left -- Talent status */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-3">
                        Talent Status
                      </div>
                      <div className="space-y-2">
                        {pkg.package_talents.map((pt) => (
                          <div
                            key={pt.id}
                            className="flex items-center gap-2"
                          >
                            <Avatar
                              src={pt.talents.photo_url}
                              name={pt.talents.full_name}
                              size="sm"
                            />
                            <span className="flex-1 text-sm text-[#E8E3D8] truncate">
                              {pt.talents.full_name}
                            </span>
                            <Badge
                              label={
                                pt.upload_status === "uploaded"
                                  ? "Uploaded"
                                  : pt.upload_status === "pending"
                                  ? "Pending"
                                  : "N/A"
                              }
                              color={
                                pt.upload_status === "uploaded"
                                  ? "green"
                                  : pt.upload_status === "pending"
                                  ? "gold"
                                  : "muted"
                              }
                            />
                            {pt.upload_status === "pending" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fetch("/api/email/send-upload-reminder", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ packageTalentId: pt.id }),
                                  });
                                }}
                                className="text-[10px] text-[#B8964C] hover:underline"
                              >
                                Send Reminder
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right -- Links & activity */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-3">
                        Links & Activity
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-[#8B8D93]">
                            Client Package Link
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-[#B8964C] truncate">
                              /p/{pkg.token}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyLink(pkg.token);
                              }}
                              className="text-xs text-[#8B8D93] hover:text-[#E8E3D8]"
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-[#8B8D93]">
                            Dropbox Folder
                          </div>
                          <div className="text-sm text-[#E8E3D8] mt-1">
                            {pkg.dropbox_folder_url || "Not yet created"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-[#8B8D93]">
                            Client Activity
                          </div>
                          <div className="text-sm text-[#E8E3D8] mt-1 space-y-0.5">
                            <div>
                              Last viewed:{" "}
                              {pkg.last_viewed_at
                                ? new Date(
                                    pkg.last_viewed_at
                                  ).toLocaleDateString()
                                : "Never"}
                            </div>
                            <div>Picks: {pickCount}</div>
                            <div>Comments: {commentCount}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#13151A] p-4 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300">
      <div className="text-2xl font-bold text-[#E8E3D8]">{value}</div>
      <div className="text-xs text-[#8B8D93] mt-1">{label}</div>
    </div>
  );
}

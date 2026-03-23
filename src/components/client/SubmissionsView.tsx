"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KebabMenu } from "@/components/ui";
import type { KebabMenuItem } from "@/components/ui";
import {
  Users,
  Star,
  Clock,
  XCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  FileDown,
  ExternalLink,
  X,
} from "lucide-react";

interface Submission {
  id: string;
  role_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  age: number | null;
  photo_url: string | null;
  media_url: string | null;
  notes: string | null;
  form_completed: boolean;
  status: string;
  created_at: string;
}

interface GroupedSubmissions {
  [roleId: string]: {
    roleName: string;
    submissions: Submission[];
  };
}

interface SubmissionsViewProps {
  groupedSubmissions: GroupedSubmissions;
  projectId: string;
  projectName: string;
}

export default function SubmissionsView({
  groupedSubmissions,
  projectId,
  projectName,
}: SubmissionsViewProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [collapsedRoles, setCollapsedRoles] = useState<Set<string>>(new Set());

  const allSubmissions = Object.values(groupedSubmissions).flatMap(
    (g) => g.submissions
  );
  const totalCount = allSubmissions.length;
  const pendingCount = allSubmissions.filter(
    (s) => s.status === "pending"
  ).length;
  const shortlistedCount = allSubmissions.filter(
    (s) => s.status === "shortlisted"
  ).length;
  const rejectedCount = allSubmissions.filter(
    (s) => s.status === "rejected"
  ).length;

  async function updateStatus(submissionId: string, status: string) {
    setUpdatingIds((prev) => new Set(prev).add(submissionId));
    try {
      await fetch(`/api/open-call/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(submissionId);
        return next;
      });
    }
  }

  async function bulkUpdateStatus(status: string) {
    const ids = Array.from(selectedIds);
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/open-call/submissions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
      )
    );
    setSelectedIds(new Set());
    router.refresh();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleRoleCollapse(roleId: string) {
    setCollapsedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  }

  const statusColor: Record<string, string> = {
    pending: "text-[#8B8D93] bg-[#8B8D93]/10",
    shortlisted: "text-green-400 bg-green-400/10",
    rejected: "text-red-400 bg-red-400/10",
    reviewed: "text-blue-400 bg-blue-400/10",
  };

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-[#8B8D93] mb-4">
        <Link href="/client/projects" className="hover:text-[#E8E3D8]">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/client/projects/${projectId}`}
          className="hover:text-[#E8E3D8]"
        >
          {projectName}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#E8E3D8]">Submissions</span>
      </div>

      <h1 className="text-xl font-bold text-[#E8E3D8] mb-6">
        Open Call Submissions
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label="Total" value={totalCount} />
        <StatCard icon={Clock} label="Pending" value={pendingCount} />
        <StatCard
          icon={Star}
          label="Shortlisted"
          value={shortlistedCount}
          accent
        />
        <StatCard icon={XCircle} label="Rejected" value={rejectedCount} />
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/5">
          <span className="text-xs text-[#E8E3D8]">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => bulkUpdateStatus("shortlisted")}
            className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs text-green-400 hover:bg-green-500/20 transition"
          >
            Shortlist
          </button>
          <button
            onClick={() => bulkUpdateStatus("rejected")}
            className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/20 transition"
          >
            Reject
          </button>
          <button
            onClick={() => bulkUpdateStatus("pending")}
            className="rounded-lg bg-[#8B8D93]/10 border border-[#8B8D93]/20 px-3 py-1 text-xs text-[#8B8D93] hover:bg-[#8B8D93]/20 transition"
          >
            Reset
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-[#8B8D93] hover:text-[#E8E3D8]"
          >
            Clear
          </button>
        </div>
      )}

      {totalCount === 0 ? (
        <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-8 text-center">
          <Users size={24} className="text-[#8B8D93] mx-auto mb-3" />
          <p className="text-sm text-[#8B8D93]">
            No submissions yet. Share your open call link to start receiving
            applications.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSubmissions).map(
            ([roleId, { roleName, submissions }]) => {
              const isCollapsed = collapsedRoles.has(roleId);

              return (
                <div key={roleId}>
                  <button
                    onClick={() => toggleRoleCollapse(roleId)}
                    className="flex items-center gap-2 mb-3 text-sm font-semibold text-[#E8E3D8] hover:text-[#C9A84C] transition"
                  >
                    {isCollapsed ? (
                      <ChevronRight size={14} className="text-[#8B8D93]" />
                    ) : (
                      <ChevronDown size={14} className="text-[#8B8D93]" />
                    )}
                    {roleName}
                    <span className="text-xs text-[#8B8D93] font-normal">
                      ({submissions.length})
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {submissions.map((sub) => (
                        <SubmissionCard
                          key={sub.id}
                          submission={sub}
                          isSelected={selectedIds.has(sub.id)}
                          isExpanded={expandedId === sub.id}
                          isUpdating={updatingIds.has(sub.id)}
                          statusColor={statusColor}
                          onToggleSelect={() => toggleSelect(sub.id)}
                          onExpand={() =>
                            setExpandedId(
                              expandedId === sub.id ? null : sub.id
                            )
                          }
                          onUpdateStatus={(status) =>
                            updateStatus(sub.id, status)
                          }
                          getInitials={getInitials}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Expanded submission overlay */}
      {expandedId && (
        <SubmissionDetail
          submission={allSubmissions.find((s) => s.id === expandedId)!}
          statusColor={statusColor}
          onClose={() => setExpandedId(null)}
          onUpdateStatus={(status) => updateStatus(expandedId, status)}
          getInitials={getInitials}
        />
      )}
    </div>
  );
}

function SubmissionCard({
  submission,
  isSelected,
  isExpanded,
  isUpdating,
  statusColor,
  onToggleSelect,
  onExpand,
  onUpdateStatus,
  getInitials,
}: {
  submission: Submission;
  isSelected: boolean;
  isExpanded: boolean;
  isUpdating: boolean;
  statusColor: Record<string, string>;
  onToggleSelect: () => void;
  onExpand: () => void;
  onUpdateStatus: (status: string) => void;
  getInitials: (name: string) => string;
}) {
  const menuItems: KebabMenuItem[] = [
    {
      label: "Shortlist",
      icon: <Star size={14} />,
      onClick: () => onUpdateStatus("shortlisted"),
    },
    {
      label: "Reject",
      icon: <XCircle size={14} />,
      onClick: () => onUpdateStatus("rejected"),
      danger: true,
    },
    {
      label: "Reset to Pending",
      icon: <Clock size={14} />,
      onClick: () => onUpdateStatus("pending"),
    },
  ];

  return (
    <div
      className={`rounded-xl border bg-[#161920] overflow-hidden cursor-pointer transition ${
        isSelected
          ? "border-[#C9A84C]"
          : "border-[#1E2128] hover:border-[#2A2D35]"
      }`}
    >
      {/* Photo / Initials */}
      <div className="relative aspect-[3/4] bg-[#1E2128]" onClick={onExpand}>
        {submission.photo_url ? (
          <img
            src={submission.photo_url}
            alt={submission.full_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl font-bold text-[#8B8D93]">
              {getInitials(submission.full_name)}
            </span>
          </div>
        )}

        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="text-xs font-semibold text-white truncate">
            {submission.full_name}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-white/70">
            {submission.age && <span>{submission.age}</span>}
            {submission.location && (
              <span className="truncate">{submission.location}</span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${
              statusColor[submission.status] || statusColor.pending
            }`}
          >
            {submission.status}
          </span>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between p-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-[#1E2128] bg-[#161920] text-[#C9A84C] focus:ring-[#C9A84C]"
        />
        <KebabMenu items={menuItems} />
      </div>
    </div>
  );
}

function SubmissionDetail({
  submission,
  statusColor,
  onClose,
  onUpdateStatus,
  getInitials,
}: {
  submission: Submission;
  statusColor: Record<string, string>;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
  getInitials: (name: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[#1E2128] bg-[#0D0F14] p-6 m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8B8D93] hover:text-[#E8E3D8]"
        >
          <X size={18} />
        </button>

        {/* Photo */}
        <div className="flex items-start gap-4 mb-6">
          {submission.photo_url ? (
            <img
              src={submission.photo_url}
              alt={submission.full_name}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-[#1E2128] flex items-center justify-center">
              <span className="text-xl font-bold text-[#8B8D93]">
                {getInitials(submission.full_name)}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-[#E8E3D8]">
              {submission.full_name}
            </h2>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs capitalize mt-1 ${
                statusColor[submission.status] || statusColor.pending
              }`}
            >
              {submission.status}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <DetailRow icon={Mail} label="Email" value={submission.email} />
          {submission.phone && (
            <DetailRow icon={Phone} label="Phone" value={submission.phone} />
          )}
          {submission.location && (
            <DetailRow
              icon={MapPin}
              label="Location"
              value={submission.location}
            />
          )}
          {submission.age && (
            <DetailRow icon={Users} label="Age" value={String(submission.age)} />
          )}
          {submission.notes && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#8B8D93] mb-1">
                Notes
              </p>
              <p className="text-sm text-[#E8E3D8]">{submission.notes}</p>
            </div>
          )}
          {submission.media_url && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#8B8D93] mb-1">
                Media
              </p>
              <a
                href={submission.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#C9A84C] hover:underline"
              >
                <ExternalLink size={12} />
                View self-tape / media
              </a>
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#8B8D93] mb-1">
              Submitted
            </p>
            <p className="text-sm text-[#E8E3D8]">
              {new Date(submission.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Status actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onUpdateStatus("shortlisted")}
            className="flex-1 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-400 hover:bg-green-500/20 transition"
          >
            Shortlist
          </button>
          <button
            onClick={() => onUpdateStatus("rejected")}
            className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 transition"
          >
            Reject
          </button>
          <button
            onClick={() => onUpdateStatus("pending")}
            className="flex-1 rounded-lg bg-[#8B8D93]/10 border border-[#8B8D93]/20 px-3 py-2 text-xs text-[#8B8D93] hover:bg-[#8B8D93]/20 transition"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={13} className="text-[#8B8D93] shrink-0" />
      <span className="text-xs text-[#8B8D93]">{label}:</span>
      <span className="text-sm text-[#E8E3D8]">{value}</span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon
          size={13}
          className={accent ? "text-[#C9A84C]" : "text-[#8B8D93]"}
        />
        <span className="text-[10px] text-[#8B8D93] uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p
        className={`text-lg font-bold ${
          accent ? "text-[#C9A84C]" : "text-[#E8E3D8]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

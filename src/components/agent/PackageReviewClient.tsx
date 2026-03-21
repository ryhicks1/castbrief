"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge, TalentPhoto } from "@/components/ui";
import MediaRequestModal from "@/components/shared/MediaRequestModal";
import MessageModal from "@/components/shared/MessageModal";
import {
  Copy,
  Send,
  MessageSquare,
  Mail,
  GripVertical,
  ChevronDown,
  StickyNote,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Bell,
  Loader2,
  CopyPlus,
} from "lucide-react";
import Link from "next/link";

interface PackageReviewProps {
  pkg: {
    id: string;
    name: string;
    token: string;
    client_name: string | null;
    client_email: string | null;
    status: string;
    agent_notes: string | null;
    created_at: string;
    last_viewed_at: string | null;
    dropbox_folder_url: string | null;
  };
  talents: Array<{
    packageTalentId: string;
    talentId: string;
    sortOrder: number;
    clientPick: boolean;
    clientComment: string | null;
    clientStatus: string | null;
    clientRating: number | null;
    isHiddenByClient: boolean;
    mediaRequested: boolean;
    uploadStatus: string;
    agentNote: string | null;
    groupLabel: string | null;
    full_name: string;
    age: number | null;
    location: string | null;
    cultural_background: string | null;
    photo_url: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    links: Record<string, string>;
    chips: Array<{ id: string; label: string; color: string }>;
  }>;
  agencyName: string;
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
  media_requested: "Media Requested",
  complete: "Complete",
};

export default function PackageReviewClient({
  pkg,
  talents: initialTalents,
  agencyName,
}: PackageReviewProps) {
  const router = useRouter();
  const [talents, setTalents] = useState(initialTalents);
  const [agentNotes, setAgentNotes] = useState(pkg.agent_notes || "");
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTalent, setMessageTalent] = useState<{ id: string; name: string } | null>(null);
  const [copyingSelected, setCopyingSelected] = useState(false);

  const pickCount = talents.filter((t) => t.clientPick).length;
  const commentCount = talents.filter((t) => t.clientComment).length;
  const hiddenCount = talents.filter((t) => t.isHiddenByClient).length;
  const selectedCount = talents.filter(
    (t) => t.clientStatus === "yes" || (t.clientRating != null && t.clientRating > 0)
  ).length;

  // Group talents by group_label
  const groups = new Map<string | null, typeof talents>();
  for (const t of talents) {
    const key = t.groupLabel;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const hasGroups =
    groups.size > 1 || (groups.size === 1 && !groups.has(null));

  const patchPackage = useCallback(
    async (updates: Record<string, any>) => {
      await fetch(`/api/packages/${pkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    },
    [pkg.id]
  );

  function handleNotesBlur() {
    patchPackage({ agent_notes: agentNotes });
  }

  function handleTalentNoteBlur(packageTalentId: string, note: string) {
    setTalents((prev) =>
      prev.map((t) =>
        t.packageTalentId === packageTalentId
          ? { ...t, agentNote: note }
          : t
      )
    );
    patchPackage({
      talent_updates: [{ id: packageTalentId, agent_note: note }],
    });
    setEditingNoteId(null);
  }

  function handleGroupLabelChange(
    packageTalentId: string,
    label: string
  ) {
    setTalents((prev) =>
      prev.map((t) =>
        t.packageTalentId === packageTalentId
          ? { ...t, groupLabel: label || null }
          : t
      )
    );
    patchPackage({
      talent_updates: [
        { id: packageTalentId, group_label: label || null },
      ],
    });
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/p/${pkg.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(dropIndex: number) {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      return;
    }

    const updated = [...talents];
    const [removed] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, removed);

    // Reassign sort orders
    const withOrder = updated.map((t, i) => ({
      ...t,
      sortOrder: i,
    }));
    setTalents(withOrder);
    setDragIndex(null);

    // Persist
    patchPackage({
      talent_updates: withOrder.map((t) => ({
        id: t.packageTalentId,
        sort_order: t.sortOrder,
      })),
    });
  }

  function handleMediaRequestSuccess() {
    setShowMediaModal(false);
    // Refresh talent states
    setTalents((prev) =>
      prev.map((t) =>
        t.clientPick
          ? { ...t, mediaRequested: true, uploadStatus: "pending" }
          : t
      )
    );
  }

  async function handleSendReminder(packageTalentId: string) {
    await fetch("/api/email/send-upload-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageTalentId }),
    });
  }

  async function handleCopySelected() {
    setCopyingSelected(true);
    try {
      const res = await fetch(`/api/packages/${pkg.id}/copy`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/agent/packages/${data.id}/review`);
      }
    } catch (err) {
      console.error("Copy selected failed:", err);
    } finally {
      setCopyingSelected(false);
    }
  }

  function openMessageModal(talentId?: string, talentName?: string) {
    if (talentId && talentName) {
      setMessageTalent({ id: talentId, name: talentName });
    } else {
      setMessageTalent(null);
    }
    setShowMessageModal(true);
  }

  const selectedForMedia = talents
    .filter((t) => t.clientPick)
    .map((t) => ({
      packageTalentId: t.packageTalentId,
      name: t.full_name,
      photoUrl: t.photo_url,
    }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
      {/* Back link */}
      <Link
        href="/agent/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[#8B8D93] hover:text-[#E8E3D8] transition mb-6"
      >
        <ArrowLeft size={14} />
        Dashboard
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left Column ── */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#E8E3D8]">
                {pkg.name}
              </h1>
              <Badge
                label={statusLabels[pkg.status] || pkg.status}
                color={statusColors[pkg.status] || "muted"}
              />
            </div>
            {pkg.client_name && (
              <p className="text-sm text-[#8B8D93]">
                Prepared for {pkg.client_name}
              </p>
            )}
            <p className="text-xs text-[#8B8D93] mt-1">
              Created{" "}
              {new Date(pkg.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-6 text-xs text-[#8B8D93] flex-wrap">
            <span>{talents.length} talent</span>
            <span className="text-[#1E2128]">|</span>
            <span className="text-emerald-400">
              {talents.filter((t) => t.clientStatus === "yes").length} Yes
            </span>
            <span className="text-red-400">
              {talents.filter((t) => t.clientStatus === "no").length} No
            </span>
            <span className="text-amber-400">
              {talents.filter((t) => t.clientStatus === "maybe").length} Maybe
            </span>
            {commentCount > 0 && (
              <>
                <span className="text-[#1E2128]">|</span>
                <span className="text-yellow-400">
                  {commentCount} comment{commentCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
            {hiddenCount > 0 && (
              <>
                <span className="text-[#1E2128]">|</span>
                <span className="text-red-400">
                  {hiddenCount} hidden
                </span>
              </>
            )}
          </div>

          {/* Talent grid — grouped or flat */}
          {hasGroups ? (
            Array.from(groups.entries()).map(([label, group]) => (
              <div key={label || "__ungrouped"} className="mb-8">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-3 px-1">
                  {label || "Ungrouped"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.map((talent) => {
                    const globalIndex = talents.indexOf(talent);
                    return (
                      <TalentReviewCard
                        key={talent.packageTalentId}
                        talent={talent}
                        index={globalIndex}
                        isEditingNote={
                          editingNoteId === talent.packageTalentId
                        }
                        onStartEditNote={() =>
                          setEditingNoteId(talent.packageTalentId)
                        }
                        onSaveNote={(note) =>
                          handleTalentNoteBlur(
                            talent.packageTalentId,
                            note
                          )
                        }
                        onGroupChange={(label) =>
                          handleGroupLabelChange(
                            talent.packageTalentId,
                            label
                          )
                        }
                        onDragStart={() => handleDragStart(globalIndex)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(globalIndex)}
                        onSendReminder={() =>
                          handleSendReminder(talent.packageTalentId)
                        }
                        onMessage={() =>
                          openMessageModal(talent.talentId, talent.full_name)
                        }
                      />
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {talents.map((talent, index) => (
                <TalentReviewCard
                  key={talent.packageTalentId}
                  talent={talent}
                  index={index}
                  isEditingNote={
                    editingNoteId === talent.packageTalentId
                  }
                  onStartEditNote={() =>
                    setEditingNoteId(talent.packageTalentId)
                  }
                  onSaveNote={(note) =>
                    handleTalentNoteBlur(
                      talent.packageTalentId,
                      note
                    )
                  }
                  onGroupChange={(label) =>
                    handleGroupLabelChange(
                      talent.packageTalentId,
                      label
                    )
                  }
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  onSendReminder={() =>
                    handleSendReminder(talent.packageTalentId)
                  }
                  onMessage={() =>
                    openMessageModal(talent.talentId, talent.full_name)
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right Column (Sidebar) ── */}
        <div className="w-full lg:w-72 lg:shrink-0">
          <div className="lg:sticky lg:top-20 space-y-4">
            {/* Share */}
            <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-3">
                Share
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 w-full rounded-lg bg-[#1E2128] border border-[#2A2D35] px-3 py-2 text-sm text-[#E8E3D8] hover:bg-[#262930] transition"
                >
                  <Copy size={14} />
                  {copiedLink ? "Copied!" : "Copy Link"}
                </button>
                {pkg.client_email && (
                  <button
                    onClick={() => {
                      window.location.href = `mailto:${pkg.client_email}?subject=${encodeURIComponent(pkg.name)}&body=${encodeURIComponent(`View your talent package: ${window.location.origin}/p/${pkg.token}`)}`;
                    }}
                    className="flex items-center gap-2 w-full rounded-lg bg-[#1E2128] border border-[#2A2D35] px-3 py-2 text-sm text-[#E8E3D8] hover:bg-[#262930] transition"
                  >
                    <Send size={14} />
                    Send Email
                  </button>
                )}
              </div>
            </div>

            {/* Package Notes */}
            <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-3">
                Package Notes
              </h3>
              <textarea
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add notes for your team..."
                rows={4}
                className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none"
              />
            </div>

            {/* Client Activity */}
            <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-3">
                Client Activity
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8B8D93]">Last viewed</span>
                  <span className="text-[#E8E3D8]">
                    {pkg.last_viewed_at
                      ? new Date(
                          pkg.last_viewed_at
                        ).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B8D93]">Yes</span>
                  <span className="text-emerald-400">{talents.filter((t) => t.clientStatus === "yes").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B8D93]">No</span>
                  <span className="text-red-400">{talents.filter((t) => t.clientStatus === "no").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B8D93]">Maybe</span>
                  <span className="text-amber-400">{talents.filter((t) => t.clientStatus === "maybe").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B8D93]">Comments</span>
                  <span className="text-[#E8E3D8]">
                    {commentCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B8D93]">Hidden</span>
                  <span className="text-[#E8E3D8]">
                    {hiddenCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-3">
                Actions
              </h3>
              <div className="space-y-2">
                {selectedForMedia.length > 0 && (
                  <button
                    onClick={() => setShowMediaModal(true)}
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition"
                  >
                    Request Media ({selectedForMedia.length})
                  </button>
                )}
                {selectedCount > 0 && (
                  <button
                    onClick={handleCopySelected}
                    disabled={copyingSelected}
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#1E2128] border border-[#2A2D35] px-4 py-2 text-sm text-[#E8E3D8] hover:bg-[#262930] transition disabled:opacity-50"
                  >
                    {copyingSelected ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CopyPlus size={14} />
                    )}
                    Copy Selected ({selectedCount})
                  </button>
                )}
                <button
                  onClick={() => openMessageModal()}
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#1E2128] border border-[#2A2D35] px-4 py-2 text-sm text-[#E8E3D8] hover:bg-[#262930] transition"
                >
                  <Mail size={14} />
                  Message All
                </button>
                {talents.some(
                  (t) =>
                    t.mediaRequested && t.uploadStatus === "pending"
                ) && (
                  <button
                    onClick={() => {
                      talents
                        .filter(
                          (t) =>
                            t.mediaRequested &&
                            t.uploadStatus === "pending"
                        )
                        .forEach((t) =>
                          handleSendReminder(t.packageTalentId)
                        );
                    }}
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#1E2128] border border-[#2A2D35] px-4 py-2 text-sm text-[#E8E3D8] hover:bg-[#262930] transition"
                  >
                    <Bell size={14} />
                    Send Upload Reminder
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Request Modal */}
      {showMediaModal && (
        <MediaRequestModal
          packageId={pkg.id}
          token={pkg.token}
          selectedTalents={selectedForMedia}
          onClose={() => setShowMediaModal(false)}
          onSuccess={handleMediaRequestSuccess}
        />
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <MessageModal
          packageId={pkg.id}
          talentId={messageTalent?.id}
          talentName={messageTalent?.name}
          onClose={() => setShowMessageModal(false)}
          onSuccess={() => setShowMessageModal(false)}
        />
      )}
    </div>
  );
}

/* ─── Talent Review Card ─── */

function TalentReviewCard({
  talent,
  index,
  isEditingNote,
  onStartEditNote,
  onSaveNote,
  onGroupChange,
  onDragStart,
  onDragOver,
  onDrop,
  onSendReminder,
  onMessage,
}: {
  talent: PackageReviewProps["talents"][number];
  index: number;
  isEditingNote: boolean;
  onStartEditNote: () => void;
  onSaveNote: (note: string) => void;
  onGroupChange: (label: string) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onSendReminder: () => void;
  onMessage: () => void;
}) {
  const [localNote, setLocalNote] = useState(talent.agentNote || "");
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [groupValue, setGroupValue] = useState(
    talent.groupLabel || ""
  );

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-xl overflow-hidden bg-[#161920] border border-[#1E2128] shadow-md hover:shadow-lg transition-shadow group ${
        talent.isHiddenByClient ? "opacity-50" : ""
      }`}
    >
      {/* Photo */}
      <div className="relative">
        <TalentPhoto
          photo_url={talent.photo_url}
          name={talent.full_name}
          aspectRatio="4/5"
        />

        {/* Drag handle */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <div className="rounded-md bg-black/50 p-1">
            <GripVertical size={16} className="text-white/80" />
          </div>
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-8">
          <h3 className="text-sm font-semibold text-white leading-tight">
            {talent.full_name}
          </h3>
        </div>

        {/* Client activity badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {talent.clientStatus === "yes" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <CheckCircle2 size={10} />
              Yes
            </span>
          )}
          {talent.clientStatus === "no" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              No
            </span>
          )}
          {talent.clientStatus === "maybe" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Maybe
            </span>
          )}
          {talent.clientRating != null && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#B8964C] text-[10px] font-bold text-[#0F0F12]">
              {talent.clientRating}
            </span>
          )}
          {talent.isHiddenByClient && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <EyeOff size={10} />
              Hidden
            </span>
          )}
          {talent.clientComment && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              <MessageSquare size={10} />
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        {/* Metadata */}
        <div className="text-xs text-[#8B8D93] truncate mb-2">
          {[
            talent.age ? `${talent.age}` : null,
            talent.location,
            talent.cultural_background,
          ]
            .filter(Boolean)
            .join(" \u00B7 ")}
        </div>

        {/* Chips */}
        {talent.chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {talent.chips.slice(0, 3).map((chip) => (
              <span
                key={chip.id}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${chip.color}20`,
                  color: chip.color,
                }}
              >
                {chip.label}
              </span>
            ))}
            {talent.chips.length > 3 && (
              <span className="text-[10px] text-[#8B8D93] self-center">
                +{talent.chips.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Client comment */}
        {talent.clientComment && (
          <div className="mb-2 rounded-lg bg-[#0D0F14] px-3 py-2 text-xs text-[#8B8D93]">
            <MessageSquare
              size={10}
              className="inline mr-1 text-yellow-400"
            />
            {talent.clientComment}
          </div>
        )}

        {/* Upload status + actions row */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1E2128]">
          <Badge
            label={
              talent.uploadStatus === "uploaded"
                ? "Uploaded"
                : talent.uploadStatus === "pending"
                ? "Pending"
                : "N/A"
            }
            color={
              talent.uploadStatus === "uploaded"
                ? "green"
                : talent.uploadStatus === "pending"
                ? "gold"
                : "muted"
            }
          />

          <div className="flex items-center gap-1">
            <button
              onClick={onMessage}
              className="rounded p-1 text-[#8B8D93] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition"
              title="Message talent"
            >
              <Mail size={14} />
            </button>
            {talent.uploadStatus === "pending" && (
              <button
                onClick={onSendReminder}
                className="rounded p-1 text-[#8B8D93] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition"
                title="Send reminder"
              >
                <Bell size={14} />
              </button>
            )}
            <button
              onClick={onStartEditNote}
              className="rounded p-1 text-[#8B8D93] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition"
              title="Add note"
            >
              <StickyNote size={14} />
            </button>
            <button
              onClick={() => setShowGroupInput(!showGroupInput)}
              className="rounded p-1 text-[#8B8D93] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition"
              title="Set group label"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Agent note editor */}
        {isEditingNote && (
          <div className="mt-2">
            <textarea
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
              onBlur={() => onSaveNote(localNote)}
              placeholder="Agent note..."
              rows={2}
              autoFocus
              className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-xs text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none"
            />
          </div>
        )}

        {/* Existing agent note (when not editing) */}
        {!isEditingNote && talent.agentNote && (
          <div className="mt-2 rounded-lg bg-[#0D0F14] px-3 py-2 text-xs text-[#C9A84C]/80">
            <StickyNote
              size={10}
              className="inline mr-1 text-[#C9A84C]"
            />
            {talent.agentNote}
          </div>
        )}

        {/* Group label input */}
        {showGroupInput && (
          <div className="mt-2">
            <input
              type="text"
              value={groupValue}
              onChange={(e) => setGroupValue(e.target.value)}
              onBlur={() => {
                onGroupChange(groupValue);
                setShowGroupInput(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onGroupChange(groupValue);
                  setShowGroupInput(false);
                }
              }}
              placeholder="Group label (e.g. Lead, Supporting)"
              autoFocus
              className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-xs text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

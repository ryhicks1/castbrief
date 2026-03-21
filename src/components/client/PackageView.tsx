"use client";

import { useState, useCallback } from "react";

interface TalentChip {
  id: string;
  label: string;
  color: string;
}

interface TalentData {
  packageTalentId: string;
  talentId: string;
  full_name: string;
  age: number | null;
  location: string | null;
  cultural_background: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  about: string | null;
  special_skills: string[] | null;
  photo_url: string | null;
  links: Record<string, string> | null;
  chips: TalentChip[];
  clientPick: boolean;
  clientComment: string | null;
  isHiddenByClient: boolean;
  mediaRequested: boolean;
  uploadStatus: string | null;
}

interface PackageViewProps {
  packageId: string;
  token: string;
  packageName: string;
  agencyName: string;
  recipientName: string | null;
  status: string;
  settings: Record<string, any>;
  talents: TalentData[];
}

const linkLabels: Record<string, string> = {
  casting_networks: "CN",
  actors_access: "AA",
  spotlight: "Spotlight",
  imdb: "IMDB",
  youtube: "YT",
  tiktok: "TT",
  instagram: "IG",
  showcast: "SC",
};

export default function PackageView({
  packageId,
  token,
  packageName,
  agencyName,
  recipientName,
  status,
  settings,
  talents: initialTalents,
}: PackageViewProps) {
  const [talents, setTalents] = useState(initialTalents);
  const [showHidden, setShowHidden] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaRequested, setMediaRequested] = useState(
    status === "media_requested"
  );
  const [commentingId, setCommentingId] = useState<string | null>(null);

  const picks = talents.filter((t) => t.clientPick);
  const hiddenCount = talents.filter((t) => t.isHiddenByClient).length;
  const visibleTalents = showHidden
    ? talents
    : talents.filter((t) => !t.isHiddenByClient);

  const patchTalent = useCallback(
    async (id: string, updates: Record<string, any>) => {
      await fetch(`/api/package-talents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...updates }),
      });
    },
    [token]
  );

  function togglePick(id: string) {
    setTalents((prev) =>
      prev.map((t) =>
        t.packageTalentId === id ? { ...t, clientPick: !t.clientPick } : t
      )
    );
    const talent = talents.find((t) => t.packageTalentId === id);
    patchTalent(id, { client_pick: !talent?.clientPick });
  }

  function hideTalent(id: string) {
    setTalents((prev) =>
      prev.map((t) =>
        t.packageTalentId === id ? { ...t, isHiddenByClient: true } : t
      )
    );
    patchTalent(id, { is_hidden_by_client: true });
  }

  function saveComment(id: string, comment: string) {
    setTalents((prev) =>
      prev.map((t) =>
        t.packageTalentId === id ? { ...t, clientComment: comment } : t
      )
    );
    patchTalent(id, { client_comment: comment });
    setCommentingId(null);
  }

  async function handleRequestMedia() {
    setShowMediaModal(false);
    try {
      const res = await fetch(`/api/packages/${packageId}/request-media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, clientName: recipientName }),
      });
      if (res.ok) {
        setMediaRequested(true);
      }
    } catch (e) {
      console.error("Media request failed:", e);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C] mb-2">
          Talent Package from {agencyName}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#E8E3D8] mb-1">
          {packageName}
        </h1>
        {recipientName && (
          <p className="text-sm text-[#8B8D93]">
            Prepared for {recipientName}
          </p>
        )}
        <div className="flex items-center gap-4 mt-4">
          <span className="text-xs text-[#8B8D93]">
            {talents.length} talent{" "}
            {hiddenCount > 0 && `(${hiddenCount} hidden)`}
          </span>
          {picks.length > 0 && !mediaRequested && (
            <button
              onClick={() => setShowMediaModal(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition"
            >
              Request Media ({picks.length})
            </button>
          )}
          {mediaRequested && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-green-900/30 border border-green-700/30 px-3 py-1.5 text-xs text-green-400">
              &#10003; Media Requested
            </span>
          )}
        </div>
      </div>

      {/* Hidden banner */}
      {hiddenCount > 0 && !showHidden && (
        <div className="mb-4 rounded-lg bg-[#161920] border border-[#1E2128] px-4 py-2 text-sm text-[#8B8D93]">
          {hiddenCount} talent hidden &mdash;{" "}
          <button
            onClick={() => setShowHidden(true)}
            className="text-[#C9A84C] hover:underline"
          >
            Show all
          </button>
        </div>
      )}
      {showHidden && hiddenCount > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowHidden(false)}
            className="text-xs text-[#C9A84C] hover:underline"
          >
            Hide hidden talent again
          </button>
        </div>
      )}

      {/* Talent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleTalents.map((talent) => (
          <TalentCard
            key={talent.packageTalentId}
            talent={talent}
            isCommenting={commentingId === talent.packageTalentId}
            onTogglePick={() => togglePick(talent.packageTalentId)}
            onHide={() => hideTalent(talent.packageTalentId)}
            onStartComment={() => setCommentingId(talent.packageTalentId)}
            onSaveComment={(c) => saveComment(talent.packageTalentId, c)}
            onCancelComment={() => setCommentingId(null)}
          />
        ))}
      </div>

      {/* Media request modal */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#161920] border border-[#1E2128] p-6">
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-4">
              Request Media
            </h2>
            <p className="text-sm text-[#8B8D93] mb-4">
              Request self-tapes or materials for {picks.length} selected
              talent:
            </p>
            <ul className="space-y-2 mb-6">
              {picks.map((t) => (
                <li
                  key={t.packageTalentId}
                  className="flex items-center gap-2 text-sm text-[#E8E3D8]"
                >
                  <InitialsAvatar name={t.full_name} size={28} />
                  {t.full_name}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button
                onClick={handleRequestMedia}
                className="flex-1 rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2 text-sm font-semibold text-[#0D0F14]"
              >
                Confirm Request
              </button>
              <button
                onClick={() => setShowMediaModal(false)}
                className="rounded-lg bg-[#1E2128] border border-[#2A2D35] px-4 py-2 text-sm text-[#E8E3D8]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TalentCard({
  talent,
  isCommenting,
  onTogglePick,
  onHide,
  onStartComment,
  onSaveComment,
  onCancelComment,
}: {
  talent: TalentData;
  isCommenting: boolean;
  onTogglePick: () => void;
  onHide: () => void;
  onStartComment: () => void;
  onSaveComment: (c: string) => void;
  onCancelComment: () => void;
}) {
  const [comment, setComment] = useState(talent.clientComment || "");

  const links = talent.links || {};
  const activeLinks = Object.entries(links).filter(
    ([, v]) => v && v.trim() !== ""
  );

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all ${
        talent.clientPick
          ? "border-2 border-[#C9A84C] shadow-[0_0_20px_rgba(201,168,76,0.15)]"
          : "border border-[#1E2128]"
      } ${talent.isHiddenByClient ? "opacity-50" : ""} bg-[#161920]`}
    >
      {/* Photo area — 4:5 aspect ratio headshot */}
      <div className="relative" style={{ aspectRatio: "4/5" }}>
        {talent.photo_url ? (
          <img
            src={talent.photo_url}
            alt={talent.full_name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "linear-gradient(160deg, #1E2128 0%, #2A2D35 100%)",
            }}
          >
            <span
              className="text-5xl font-bold"
              style={{
                background: "linear-gradient(135deg, #C9A84C, #8B6D1A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {talent.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
        )}

        {/* Name overlay at bottom of photo */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-8">
          <h3 className="text-sm font-semibold text-white leading-tight">
            {talent.full_name}
          </h3>
        </div>

        {/* Selected badge on photo */}
        {talent.clientPick && (
          <div className="absolute top-3 right-3 rounded-full bg-[#C9A84C] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0D0F14]">
            Selected
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        {/* Compact metadata line: age · location · background · height */}
        <div className="text-xs text-[#8B8D93] truncate mb-2">
          {[
            talent.age ? `${talent.age}` : null,
            talent.location,
            talent.cultural_background,
            talent.height_cm ? `${talent.height_cm}cm` : null,
            talent.weight_kg ? `${talent.weight_kg}kg` : null,
          ]
            .filter(Boolean)
            .join(" \u00B7 ")}
        </div>

        {/* Chips — max 3 */}
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

        {/* External links */}
        {activeLinks.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {activeLinks.map(([key, url]) => (
              <a
                key={key}
                href={url.startsWith("http") ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-[#1E2128] px-1.5 py-0.5 text-[10px] font-medium text-[#8B8D93] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition"
              >
                {linkLabels[key] || key}
              </a>
            ))}
          </div>
        )}

        {/* Existing comment */}
        {talent.clientComment && !isCommenting && (
          <div className="mb-3 rounded-lg bg-[#0D0F14] px-3 py-2 text-xs text-[#8B8D93]">
            &#128172; {talent.clientComment}
          </div>
        )}

        {/* Comment input */}
        {isCommenting && (
          <div className="mb-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment..."
              rows={2}
              autoFocus
              className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-xs text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none"
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => onSaveComment(comment)}
                className="text-xs text-[#C9A84C] hover:underline"
              >
                Save
              </button>
              <button
                onClick={onCancelComment}
                className="text-xs text-[#8B8D93] hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Actions — compact row */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-[#1E2128]">
          <button
            onClick={onTogglePick}
            className={`flex-1 rounded-lg px-3 min-h-[36px] text-sm font-medium transition ${
              talent.clientPick
                ? "bg-[#C9A84C] text-[#0D0F14]"
                : "bg-[#1E2128] text-[#E8E3D8] hover:bg-[#262930]"
            }`}
          >
            {talent.clientPick ? "\u2713 Selected" : "Select"}
          </button>
          <button
            onClick={onStartComment}
            className="rounded-lg bg-[#1E2128] min-h-[36px] min-w-[36px] flex items-center justify-center text-sm text-[#E8E3D8] hover:bg-[#262930] transition"
            title="Comment"
          >
            &#128172;
          </button>
          {!talent.isHiddenByClient && (
            <button
              onClick={onHide}
              className="rounded-lg bg-[#1E2128] min-h-[36px] min-w-[36px] flex items-center justify-center text-sm text-[#E8E3D8] hover:bg-red-900/20 hover:text-red-400 transition"
              title="Hide"
            >
              &#128683;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InitialsAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: "linear-gradient(135deg, #C9A84C, #8B6D1A)",
        color: "#0D0F14",
      }}
    >
      {initials}
    </div>
  );
}

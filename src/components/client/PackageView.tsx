"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { MessageSquare, EyeOff } from "lucide-react";
import { LOCATIONS } from "@/lib/constants/locations";

function getLocationCode(location: string): string {
  const match = LOCATIONS.find(
    (loc) => loc.city.toLowerCase() === location.toLowerCase()
  );
  if (match) return match.code;
  return location.slice(0, 3).toUpperCase();
}

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
  clientStatus: "yes" | "no" | "maybe" | null;
  clientRating: number | null;
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
  branding?: {
    logo_url: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    website: string | null;
    brand_color: string | null;
  };
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
  branding,
}: PackageViewProps) {
  const accentColor = branding?.brand_color || "#B8964C";
  const [talents, setTalents] = useState(initialTalents);
  const [showHidden, setShowHidden] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaRequested, setMediaRequested] = useState(
    status === "media_requested"
  );
  const [commentingId, setCommentingId] = useState<string | null>(null);

  const picks = talents.filter((t) => t.clientStatus === "yes");
  const hiddenCount = talents.filter((t) => t.isHiddenByClient).length;
  // Always show all talent — hidden ones are greyed out, not removed
  const visibleTalents = talents;

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

  function setStatus(id: string, newStatus: "yes" | "no" | "maybe") {
    setTalents((prev) =>
      prev.map((t) => {
        if (t.packageTalentId !== id) return t;
        const toggled = t.clientStatus === newStatus ? null : newStatus;
        return {
          ...t,
          clientStatus: toggled,
          clientPick: toggled === "yes",
        };
      })
    );
    const talent = talents.find((t) => t.packageTalentId === id);
    const toggled = talent?.clientStatus === newStatus ? null : newStatus;
    patchTalent(id, {
      client_status: toggled,
      client_pick: toggled === "yes",
    });
  }

  function setRating(id: string, rating: number) {
    setTalents((prev) =>
      prev.map((t) => {
        if (t.packageTalentId !== id) return t;
        const toggled = t.clientRating === rating ? null : rating;
        return { ...t, clientRating: toggled };
      })
    );
    const talent = talents.find((t) => t.packageTalentId === id);
    const toggled = talent?.clientRating === rating ? null : rating;
    patchTalent(id, { client_rating: toggled });
  }

  function hideTalent(id: string) {
    setTalents((prev) =>
      prev.map((t) =>
        t.packageTalentId === id ? { ...t, isHiddenByClient: true } : t
      )
    );
    patchTalent(id, { is_hidden_by_client: true });
  }

  function unhideTalent(id: string) {
    setTalents((prev) =>
      prev.map((t) =>
        t.packageTalentId === id ? { ...t, isHiddenByClient: false } : t
      )
    );
    patchTalent(id, { is_hidden_by_client: false });
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
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {branding?.logo_url && (
            <img
              src={branding.logo_url}
              alt={agencyName}
              className="h-10 w-auto object-contain"
            />
          )}
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
            Talent Package from {agencyName}
          </p>
        </div>
        {branding && (branding.contact_email || branding.contact_phone || branding.website) && (
          <p className="text-xs text-[#8B8D93] mb-2">
            {[
              branding.contact_email,
              branding.contact_phone,
              branding.website,
            ]
              .filter(Boolean)
              .join("  \u00B7  ")}
          </p>
        )}
        <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-[#E8E3D8] mb-1">
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
              className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-[#0F0F12] transition-all duration-300"
              style={{ backgroundColor: accentColor }}
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

      {/* Hidden count info */}
      {hiddenCount > 0 && (
        <div className="mb-4 rounded-lg bg-[#13151A] border border-[#1E2128] px-4 py-2 text-sm text-[#8B8D93]">
          {hiddenCount} talent hidden — greyed out below. Click the eye icon to unhide.
        </div>
      )}

      {/* Talent grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleTalents.map((talent, idx) => (
          <TalentCard
            key={talent.packageTalentId}
            talent={talent}
            index={idx}
            isCommenting={commentingId === talent.packageTalentId}
            onSetStatus={(s) => setStatus(talent.packageTalentId, s)}
            onSetRating={(r) => setRating(talent.packageTalentId, r)}
            onHide={() => hideTalent(talent.packageTalentId)}
            onUnhide={() => unhideTalent(talent.packageTalentId)}
            onStartComment={() => setCommentingId(talent.packageTalentId)}
            onSaveComment={(c) => saveComment(talent.packageTalentId, c)}
            onCancelComment={() => setCommentingId(null)}
          />
        ))}
      </div>

      {/* Media request modal */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md rounded-xl bg-[#13151A] border border-[#1E2128] p-6 shadow-2xl shadow-black/40 animate-[modal-enter_0.3s_ease-out]">
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
                className="flex-1 rounded-lg bg-[#B8964C] px-4 py-2 text-sm font-semibold text-[#0F0F12] hover:bg-[#C9A64C] transition-all duration-300"
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
  index = 0,
  isCommenting,
  onSetStatus,
  onSetRating,
  onHide,
  onUnhide,
  onStartComment,
  onSaveComment,
  onCancelComment,
}: {
  talent: TalentData;
  index?: number;
  isCommenting: boolean;
  onSetStatus: (s: "yes" | "no" | "maybe") => void;
  onSetRating: (r: number) => void;
  onHide: () => void;
  onUnhide: () => void;
  onStartComment: () => void;
  onSaveComment: (c: string) => void;
  onCancelComment: () => void;
}) {
  const [comment, setComment] = useState(talent.clientComment || "");

  const links = talent.links || {};
  const activeLinks = Object.entries(links).filter(
    ([, v]) => v && v.trim() !== ""
  );

  const statusBorder =
    talent.clientStatus === "yes"
      ? "ring-1 ring-emerald-500/30"
      : talent.clientStatus === "no"
      ? "ring-1 ring-red-500/20 opacity-60"
      : talent.clientStatus === "maybe"
      ? "ring-1 ring-amber-500/30"
      : "";

  return (
    <div
      className={`group rounded-xl overflow-hidden shadow-lg shadow-black/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 ${statusBorder} ${
        talent.isHiddenByClient ? "opacity-50" : ""
      } bg-[#13151A]`}
    >
      {/* Photo area -- 3:4 aspect ratio headshot */}
      <div className="relative bg-[#1E2128]" style={{ aspectRatio: "3/4" }}>
        {talent.photo_url ? (
          <Image
            src={talent.photo_url}
            alt={talent.full_name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            quality={80}
            priority={index < 5}
            loading={index < 5 ? "eager" : "lazy"}
            className="object-cover photo-cinematic transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "linear-gradient(160deg, #1E2128 0%, #2A2D35 100%)",
            }}
          >
            <span
              className="text-4xl font-bold"
              style={{
                background: "linear-gradient(135deg, #B8964C, #8B6D1A)",
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

        {/* Name / age / location overlay at bottom of photo */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-8">
          <p className="text-sm font-semibold text-white truncate">
            {talent.full_name}
          </p>
          <p className="text-xs text-white/70">
            {talent.age ? `${talent.age}` : ""}
            {talent.location ? ` \u00B7 ${getLocationCode(talent.location)}` : ""}
          </p>
        </div>

        {/* Rating badge on photo top-left */}
        {talent.clientRating != null && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#B8964C] flex items-center justify-center text-[10px] font-bold text-[#0F0F12]">
            {talent.clientRating}
          </div>
        )}

        {/* Status badge on photo top-right */}
        {talent.clientStatus === "yes" && (
          <div className="absolute top-2 right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            Yes
          </div>
        )}
        {talent.clientStatus === "maybe" && (
          <div className="absolute top-2 right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            Maybe
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-2">
        {/* Chips -- max 3 */}
        {talent.chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {talent.chips.slice(0, 3).map((chip) => (
              <span
                key={chip.id}
                className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                style={{
                  backgroundColor: `${chip.color}20`,
                  color: chip.color,
                }}
              >
                {chip.label}
              </span>
            ))}
            {talent.chips.length > 3 && (
              <span className="text-[9px] text-[#8B8D93] self-center">
                +{talent.chips.length - 3}
              </span>
            )}
          </div>
        )}

        {/* External links */}
        {activeLinks.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {activeLinks.map(([key, url]) => (
              <a
                key={key}
                href={url.startsWith("http") ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-[#1E2128] px-1.5 py-0.5 text-[9px] font-medium text-[#8B8D93] hover:text-[#B8964C] hover:bg-[#B8964C]/10 transition"
              >
                {linkLabels[key] || key}
              </a>
            ))}
          </div>
        )}

        {/* Existing comment */}
        {talent.clientComment && !isCommenting && (
          <div className="mb-1.5 rounded bg-[#0F0F12] px-2 py-1 text-[10px] text-[#8B8D93] flex items-start gap-1">
            <MessageSquare size={10} className="shrink-0 mt-0.5" />
            <span className="line-clamp-2">{talent.clientComment}</span>
          </div>
        )}

        {/* Comment input */}
        {isCommenting && (
          <div className="mb-1.5">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment..."
              rows={2}
              autoFocus
              className="w-full rounded border border-[#1E2128] bg-[#0F0F12] px-2 py-1 text-[10px] text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none resize-none"
            />
            <div className="flex gap-2 mt-0.5">
              <button
                onClick={() => onSaveComment(comment)}
                className="text-[10px] text-[#B8964C] hover:underline"
              >
                Save
              </button>
              <button
                onClick={onCancelComment}
                className="text-[10px] text-[#8B8D93] hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Status buttons row — icon-only on small cards */}
        <div className="flex items-center gap-1 pt-1.5 border-t border-[#1E2128]">
          <button
            onClick={() => onSetStatus("yes")}
            aria-label="Mark as yes"
            className={`flex-1 rounded min-h-[28px] text-[10px] font-medium transition-all duration-200 ${
              talent.clientStatus === "yes"
                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-[#1A1C22] text-[#8B8D93] hover:bg-[#262930]"
            }`}
          >
            &#10003;
          </button>
          <button
            onClick={() => onSetStatus("no")}
            aria-label="Mark as no"
            className={`flex-1 rounded min-h-[28px] text-[10px] font-medium transition-all duration-200 ${
              talent.clientStatus === "no"
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-[#1A1C22] text-[#8B8D93] hover:bg-[#262930]"
            }`}
          >
            &#10007;
          </button>
          <button
            onClick={() => onSetStatus("maybe")}
            aria-label="Mark as maybe"
            className={`flex-1 rounded min-h-[28px] text-[10px] font-medium transition-all duration-200 ${
              talent.clientStatus === "maybe"
                ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                : "bg-[#1A1C22] text-[#8B8D93] hover:bg-[#262930]"
            }`}
          >
            ?
          </button>
          <button
            onClick={onStartComment}
            aria-label="Add comment"
            className="rounded bg-[#1A1C22] min-h-[28px] min-w-[28px] flex items-center justify-center text-[#8B8D93] hover:bg-[#262930] hover:text-[#E8E3D8] transition"
            title="Comment"
          >
            <MessageSquare size={11} />
          </button>
          {talent.isHiddenByClient ? (
            <button
              onClick={onUnhide}
              aria-label="Unhide talent"
              className="rounded bg-[#1A1C22] min-h-[28px] min-w-[28px] flex items-center justify-center text-[#C9A84C] hover:bg-[#C9A84C]/20 hover:text-[#D4B35C] transition"
              title="Unhide"
            >
              <EyeOff size={11} />
            </button>
          ) : (
            <button
              onClick={onHide}
              aria-label="Hide talent"
              className="rounded bg-[#1A1C22] min-h-[28px] min-w-[28px] flex items-center justify-center text-[#8B8D93] hover:bg-red-900/20 hover:text-red-400 transition"
              title="Hide"
            >
              <EyeOff size={11} />
            </button>
          )}
        </div>

        {/* Rating row */}
        <div className="flex items-center gap-1 mt-1.5">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              onClick={() => onSetRating(num)}
              aria-label={`Rate ${num} out of 6`}
              className={`w-6 h-6 rounded-full text-[10px] font-semibold transition-all duration-200 ${
                talent.clientRating === num
                  ? "bg-[#B8964C] text-[#0F0F12]"
                  : "bg-[#1A1C22] text-[#8B8D93] hover:bg-[#262930]"
              }`}
            >
              {num}
            </button>
          ))}
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
        background: "linear-gradient(135deg, #B8964C, #8B6D1A)",
        color: "#0F0F12",
      }}
    >
      {initials}
    </div>
  );
}

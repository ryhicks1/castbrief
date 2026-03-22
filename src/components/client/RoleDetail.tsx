"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, EyeOff, FileDown, FileSpreadsheet } from "lucide-react";
import { LOCATIONS } from "@/lib/constants/locations";
import { Button } from "@/components/ui";

function getLocationCode(location: string): string {
  const match = LOCATIONS.find(
    (loc) => loc.city.toLowerCase() === location.toLowerCase()
  );
  if (match) return match.code;
  return location.slice(0, 3).toUpperCase();
}

function agencyColor(agentId: string): string {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = agentId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 55%)`;
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

interface RoleDetailProps {
  role: any;
  projectId: string;
  projectName: string;
}

export default function RoleDetail({
  role,
  projectId,
  projectName,
}: RoleDetailProps) {
  const [talents, setTalents] = useState<any[]>(() => {
    // Flatten all package_talents grouped by agency
    return (role.role_packages || []).flatMap((rp: any) => {
      const pkg = rp.packages;
      if (!pkg) return [];
      return (pkg.package_talents || []).map((pt: any) => ({
        ...pt,
        agentId: pkg.agent_id,
        agencyName:
          pkg.profiles?.agency_name || pkg.profiles?.full_name || "Agency",
        packageToken: pkg.token,
        packageId: pkg.id,
      }));
    });
  });

  const [mediaRequesting, setMediaRequesting] = useState(false);

  const picks = talents.filter((t) => t.client_pick);

  // Group talents by agency
  const agencyGroups = talents.reduce((groups: Record<string, any[]>, t) => {
    const key = t.agentId;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
    return groups;
  }, {});

  const patchTalent = useCallback(
    async (id: string, token: string, updates: Record<string, any>) => {
      await fetch(`/api/package-talents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...updates }),
      });
    },
    []
  );

  function togglePick(id: string, token: string) {
    setTalents((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, client_pick: !t.client_pick } : t
      )
    );
    const talent = talents.find((t) => t.id === id);
    patchTalent(id, token, { client_pick: !talent?.client_pick });
  }

  function hideTalent(id: string, token: string) {
    setTalents((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, is_hidden_by_client: true } : t
      )
    );
    patchTalent(id, token, { is_hidden_by_client: true });
  }

  function saveComment(id: string, token: string, comment: string) {
    setTalents((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, client_comment: comment } : t
      )
    );
    patchTalent(id, token, { client_comment: comment });
  }

  async function handleRequestMedia() {
    setMediaRequesting(true);
    // Group picks by package
    const picksByPackage = picks.reduce(
      (acc: Record<string, any[]>, t) => {
        if (!acc[t.packageId]) acc[t.packageId] = [];
        acc[t.packageId].push(t);
        return acc;
      },
      {}
    );

    for (const [packageId, packagePicks] of Object.entries(picksByPackage)) {
      const token = (packagePicks as any[])[0]?.packageToken;
      if (!token) continue;
      try {
        await fetch(`/api/packages/${packageId}/request-media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } catch (e) {
        console.error("Media request failed for package:", packageId, e);
      }
    }
    setMediaRequesting(false);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-xs text-[#8B8D93] mb-4">
        <Link
          href={`/client/projects/${projectId}`}
          className="hover:text-[#E8E3D8]"
        >
          {projectName}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#E8E3D8]">{role.name}</span>
      </div>

      {/* Role header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#E8E3D8]">{role.name}</h1>
          {role.brief && (
            <p className="text-sm text-[#8B8D93] mt-1">{role.brief}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <a
            href={`/api/reports/role/${role.id}?format=pdf&projectId=${projectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E2128] px-3 py-1.5 text-xs text-[#E8E3D8] hover:bg-[#262930] transition"
          >
            <FileDown size={13} />
            PDF
          </a>
          <a
            href={`/api/reports/role/${role.id}?format=csv&projectId=${projectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E2128] px-3 py-1.5 text-xs text-[#E8E3D8] hover:bg-[#262930] transition"
          >
            <FileSpreadsheet size={13} />
            CSV
          </a>
        </div>
      </div>

      {/* Agency legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(agencyGroups).map(([agentId, groupTalents]) => {
          const label = (groupTalents as any[])[0]?.agencyName || "Agency";
          return (
            <span
              key={agentId}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${agencyColor(agentId)}20`,
                color: agencyColor(agentId),
              }}
            >
              {label} ({(groupTalents as any[]).length})
            </span>
          );
        })}
      </div>

      {/* Talent grid grouped by agency */}
      {Object.entries(agencyGroups).map(([agentId, groupTalents]) => {
        const label = (groupTalents as any[])[0]?.agencyName || "Agency";
        const color = agencyColor(agentId);

        return (
          <div key={agentId} className="mb-8">
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-3 pb-2 border-b"
              style={{ color, borderColor: `${color}30` }}
            >
              {label}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {(groupTalents as any[])
                .filter((t) => !t.is_hidden_by_client)
                .map((t) => (
                  <RoleTalentCard
                    key={t.id}
                    talent={t}
                    onTogglePick={() =>
                      togglePick(t.id, t.packageToken)
                    }
                    onHide={() => hideTalent(t.id, t.packageToken)}
                    onSaveComment={(c: string) =>
                      saveComment(t.id, t.packageToken, c)
                    }
                  />
                ))}
            </div>
          </div>
        );
      })}

      {/* Sticky bottom bar */}
      {picks.length > 0 && (
        <div className="fixed bottom-0 left-56 right-0 bg-[#161920] border-t border-[#1E2128] px-6 py-3 flex items-center justify-between z-40">
          <span className="text-sm text-[#E8E3D8]">
            {picks.length} talent selected
          </span>
          <Button
            onClick={handleRequestMedia}
            loading={mediaRequesting}
          >
            {mediaRequesting ? "Requesting..." : `Request Media (${picks.length})`}
          </Button>
        </div>
      )}
    </div>
  );
}

function RoleTalentCard({
  talent,
  onTogglePick,
  onHide,
  onSaveComment,
}: {
  talent: any;
  onTogglePick: () => void;
  onHide: () => void;
  onSaveComment: (c: string) => void;
}) {
  const [commenting, setCommenting] = useState(false);
  const [comment, setComment] = useState(talent.client_comment || "");

  const t = talent.talents || {};
  const chips = t.talent_chips?.map((tc: any) => tc.chips) || [];
  const links = t.links || {};
  const activeLinks = Object.entries(links).filter(
    ([, v]) => v && (v as string).trim() !== ""
  );
  const initials = (t.full_name || "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`group rounded-xl overflow-hidden shadow-lg shadow-black/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 ${
        talent.client_pick
          ? "ring-1 ring-[#C9A84C]/50"
          : ""
      } bg-[#13151A]`}
    >
      {/* Photo area -- 3:4 aspect ratio */}
      <div className="relative bg-[#1E2128]" style={{ aspectRatio: "3/4" }}>
        {t.photo_url ? (
          <Image
            src={t.photo_url}
            alt={t.full_name || "Talent"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            quality={80}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                background: "linear-gradient(135deg, #C9A84C, #8B6D1A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {initials}
            </span>
          </div>
        )}

        {/* Name / age / location overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-8">
          <p className="text-sm font-semibold text-white truncate">
            {t.full_name}
          </p>
          <p className="text-xs text-white/70">
            {t.age ? `${t.age}` : ""}
            {t.location ? ` \u00B7 ${getLocationCode(t.location)}` : ""}
          </p>
        </div>

        {/* Selected badge on photo top-right */}
        {talent.client_pick && (
          <div className="absolute top-2 right-2 rounded-full bg-[#C9A84C] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#0D0F14]">
            Selected
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-2">
        {/* Chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {chips.slice(0, 3).map((chip: any) => (
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
            {chips.length > 3 && (
              <span className="text-[9px] text-[#8B8D93] self-center">
                +{chips.length - 3}
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
                href={(url as string).startsWith("http") ? (url as string) : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-[#1E2128] px-1.5 py-0.5 text-[9px] font-medium text-[#8B8D93] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition"
              >
                {linkLabels[key] || key}
              </a>
            ))}
          </div>
        )}

        {/* Existing comment */}
        {talent.client_comment && !commenting && (
          <div className="mb-1.5 rounded bg-[#0D0F14] px-2 py-1 text-[10px] text-[#8B8D93] flex items-start gap-1">
            <MessageSquare size={10} className="shrink-0 mt-0.5" />
            <span className="line-clamp-2">{talent.client_comment}</span>
          </div>
        )}

        {/* Comment input */}
        {commenting && (
          <div className="mb-1.5">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              autoFocus
              onBlur={() => {
                onSaveComment(comment);
                setCommenting(false);
              }}
              className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-[10px] text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none"
              placeholder="Leave a comment..."
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1 pt-1.5 border-t border-[#1E2128]">
          <button
            onClick={onTogglePick}
            aria-label={talent.client_pick ? "Deselect talent" : "Select talent"}
            className={`flex-1 rounded min-h-[28px] text-[10px] font-medium transition ${
              talent.client_pick
                ? "bg-[#C9A84C] text-[#0D0F14]"
                : "bg-[#1E2128] text-[#E8E3D8] hover:bg-[#262930]"
            }`}
          >
            {talent.client_pick ? "\u2713 Selected" : "Select"}
          </button>
          <button
            onClick={() => setCommenting(true)}
            aria-label="Add comment"
            className="rounded bg-[#1E2128] min-h-[28px] min-w-[28px] flex items-center justify-center text-[#8B8D93] hover:bg-[#262930] hover:text-[#E8E3D8] transition"
            title="Comment"
          >
            <MessageSquare size={11} />
          </button>
          <button
            onClick={onHide}
            aria-label="Hide talent"
            className="rounded bg-[#1E2128] min-h-[28px] min-w-[28px] flex items-center justify-center text-[#8B8D93] hover:bg-red-900/20 hover:text-red-400 transition"
            title="Hide"
          >
            <EyeOff size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

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
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#E8E3D8]">{role.name}</h1>
        {role.brief && (
          <p className="text-sm text-[#8B8D93] mt-1">{role.brief}</p>
        )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
          <button
            onClick={handleRequestMedia}
            disabled={mediaRequesting}
            className="rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-6 py-2 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50"
          >
            {mediaRequesting ? "Requesting..." : `Request Media (${picks.length})`}
          </button>
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
      className={`rounded-xl border p-3 transition-all ${
        talent.client_pick
          ? "border-[#C9A84C]/50 bg-[#C9A84C]/5"
          : "border-[#1E2128] bg-[#161920]"
      }`}
    >
      <div className="flex gap-2 mb-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
          style={{
            background: "linear-gradient(135deg, #C9A84C, #8B6D1A)",
            color: "#0D0F14",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-[#E8E3D8] truncate">
            {t.full_name}
          </h3>
          <div className="flex flex-wrap gap-x-2 text-[10px] text-[#8B8D93]">
            {t.age && <span>Age {t.age}</span>}
            {t.location && <span>{t.location}</span>}
            {t.cultural_background && <span>{t.cultural_background}</span>}
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {chips.map((chip: any) => (
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
        </div>
      )}

      {activeLinks.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {activeLinks.map(([key, url]) => (
            <a
              key={key}
              href={(url as string).startsWith("http") ? (url as string) : `https://${url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-[#1E2128] px-1 py-0.5 text-[9px] text-[#8B8D93] hover:text-[#C9A84C] transition"
            >
              {linkLabels[key] || key}
            </a>
          ))}
        </div>
      )}

      {talent.client_comment && !commenting && (
        <div className="mb-2 rounded bg-[#0D0F14] px-2 py-1 text-[10px] text-[#8B8D93]">
          &#128172; {talent.client_comment}
        </div>
      )}

      {commenting && (
        <div className="mb-2">
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

      <div className="flex items-center gap-1 pt-2 border-t border-[#1E2128]">
        <button
          onClick={onTogglePick}
          className={`flex-1 rounded px-2 py-1 text-[10px] font-medium transition ${
            talent.client_pick
              ? "bg-[#C9A84C] text-[#0D0F14]"
              : "bg-[#1E2128] text-[#E8E3D8] hover:bg-[#262930]"
          }`}
        >
          {talent.client_pick ? "\u2713 Selected" : "Select"}
        </button>
        <button
          onClick={() => setCommenting(true)}
          className="rounded bg-[#1E2128] px-2 py-1 text-[10px] text-[#E8E3D8] hover:bg-[#262930] transition"
        >
          &#128172;
        </button>
        <button
          onClick={onHide}
          className="rounded bg-[#1E2128] px-2 py-1 text-[10px] text-[#E8E3D8] hover:bg-red-900/20 hover:text-red-400 transition"
        >
          &#128683;
        </button>
      </div>
    </div>
  );
}

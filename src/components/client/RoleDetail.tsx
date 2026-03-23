"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageSquare,
  EyeOff,
  FileDown,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import DocumentSection from "./DocumentSection";
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

interface DocumentRecord {
  id: string;
  name: string;
  url: string;
  file_type: string;
  size_bytes: number;
  created_at: string;
  created_by: string;
}

interface RoleDetailProps {
  role: any;
  projectId: string;
  projectName: string;
  documents?: DocumentRecord[];
  initialView?: "all" | "new" | "selections";
}

type ViewTab = "all" | "new" | "selections";

export default function RoleDetail({
  role,
  projectId,
  projectName,
  documents = [],
  initialView = "all",
}: RoleDetailProps) {
  const [talents, setTalents] = useState<any[]>(() => {
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

  const [activeTab, setActiveTab] = useState<ViewTab>(initialView);
  const [mediaRequesting, setMediaRequesting] = useState(false);
  const [docsOpen, setDocsOpen] = useState(true);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAgency, setFilterAgency] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterEthnicity, setFilterEthnicity] = useState<string>("all");
  const [filterAgeMin, setFilterAgeMin] = useState<string>("");
  const [filterAgeMax, setFilterAgeMax] = useState<string>("");

  // Counts for tabs
  const allCount = talents.length;
  const newCount = talents.filter(
    (t) => !t.client_status && !t.is_hidden_by_client
  ).length;
  const selectionsCount = talents.filter(
    (t) => t.client_status === "yes" || t.client_pick || (t.client_rating && t.client_rating > 0)
  ).length;

  const picks = talents.filter(
    (t) => t.client_status === "yes" || t.client_pick
  );

  // Get unique filter options
  const agencies = useMemo(() => {
    const map = new Map<string, string>();
    talents.forEach((t) => {
      if (t.agentId) map.set(t.agentId, t.agencyName);
    });
    return Array.from(map.entries());
  }, [talents]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    talents.forEach((t) => {
      const loc = t.talents?.location;
      if (loc) set.add(loc);
    });
    return Array.from(set).sort();
  }, [talents]);

  const ethnicities = useMemo(() => {
    const set = new Set<string>();
    talents.forEach((t) => {
      const eth = t.talents?.cultural_background;
      if (eth) set.add(eth);
    });
    return Array.from(set).sort();
  }, [talents]);

  // Filter and tab logic
  const filteredTalents = useMemo(() => {
    let filtered = [...talents];

    // Tab filter
    if (activeTab === "new") {
      filtered = filtered.filter(
        (t) => !t.client_status && !t.is_hidden_by_client
      );
    } else if (activeTab === "selections") {
      filtered = filtered.filter(
        (t) => t.client_status === "yes" || t.client_pick || (t.client_rating && t.client_rating > 0)
      );
    }

    // Search by name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        (t.talents?.full_name || "").toLowerCase().includes(q)
      );
    }

    // Agency filter
    if (filterAgency !== "all") {
      filtered = filtered.filter((t) => t.agentId === filterAgency);
    }

    // Location filter
    if (filterLocation !== "all") {
      filtered = filtered.filter(
        (t) => t.talents?.location === filterLocation
      );
    }

    // Ethnicity filter
    if (filterEthnicity !== "all") {
      filtered = filtered.filter(
        (t) => t.talents?.cultural_background === filterEthnicity
      );
    }

    // Age range
    if (filterAgeMin) {
      const min = parseInt(filterAgeMin);
      if (!isNaN(min)) {
        filtered = filtered.filter(
          (t) => t.talents?.age != null && t.talents.age >= min
        );
      }
    }
    if (filterAgeMax) {
      const max = parseInt(filterAgeMax);
      if (!isNaN(max)) {
        filtered = filtered.filter(
          (t) => t.talents?.age != null && t.talents.age <= max
        );
      }
    }

    return filtered;
  }, [
    talents,
    activeTab,
    searchQuery,
    filterAgency,
    filterLocation,
    filterEthnicity,
    filterAgeMin,
    filterAgeMax,
  ]);

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

  function setStatus(id: string, token: string, newStatus: "yes" | "no" | "maybe") {
    setTalents((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const toggled = t.client_status === newStatus ? null : newStatus;
        return {
          ...t,
          client_status: toggled,
          client_pick: toggled === "yes",
        };
      })
    );
    const talent = talents.find((t) => t.id === id);
    const toggled = talent?.client_status === newStatus ? null : newStatus;
    patchTalent(id, token, {
      client_status: toggled,
      client_pick: toggled === "yes",
    });
  }

  function setRating(id: string, token: string, rating: number) {
    setTalents((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const toggled = t.client_rating === rating ? null : rating;
        return { ...t, client_rating: toggled };
      })
    );
    const talent = talents.find((t) => t.id === id);
    const toggled = talent?.client_rating === rating ? null : rating;
    patchTalent(id, token, { client_rating: toggled });
  }

  function hideTalent(id: string, token: string) {
    setTalents((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, is_hidden_by_client: true } : t
      )
    );
    patchTalent(id, token, { is_hidden_by_client: true });
  }

  function unhideTalent(id: string, token: string) {
    setTalents((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, is_hidden_by_client: false } : t
      )
    );
    patchTalent(id, token, { is_hidden_by_client: false });
  }

  function markAsReviewed(id: string, token: string) {
    setTalents((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return { ...t, client_status: "no", client_pick: false };
      })
    );
    patchTalent(id, token, { client_status: "no", client_pick: false });
  }

  function saveComment(id: string, token: string, comment: string) {
    setTalents((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, client_comment: comment } : t
      )
    );
    patchTalent(id, token, { client_comment: comment });
    setCommentingId(null);
  }

  async function handleRequestMedia() {
    setMediaRequesting(true);
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

  const hasActiveFilters =
    filterAgency !== "all" ||
    filterLocation !== "all" ||
    filterEthnicity !== "all" ||
    filterAgeMin !== "" ||
    filterAgeMax !== "";

  function clearFilters() {
    setFilterAgency("all");
    setFilterLocation("all");
    setFilterEthnicity("all");
    setFilterAgeMin("");
    setFilterAgeMax("");
    setSearchQuery("");
  }

  return (
    <div className="pb-20">
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

      {/* Sides & Documents collapsible */}
      <div className="mb-6">
        <button
          onClick={() => setDocsOpen(!docsOpen)}
          className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-[#8B8D93] hover:text-[#E8E3D8] transition mb-3"
        >
          {docsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Sides & Documents
          {documents.length > 0 && (
            <span className="text-[10px] font-normal normal-case tracking-normal text-[#8B8D93]">
              ({documents.length})
            </span>
          )}
        </button>
        {docsOpen && (
          <DocumentSection roleId={role.id} documents={documents} />
        )}
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[#1E2128]">
        {(
          [
            { key: "all" as ViewTab, label: "All Talent", count: allCount },
            { key: "new" as ViewTab, label: "New", count: newCount },
            {
              key: "selections" as ViewTab,
              label: "Selections",
              count: selectionsCount,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "text-[#E8E3D8] border-[#C9A84C]"
                : "text-[#8B8D93] border-transparent hover:text-[#E8E3D8]"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                activeTab === tab.key
                  ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                  : "bg-[#1E2128] text-[#8B8D93]"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8D93]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-lg border border-[#1E2128] bg-[#161920] pl-9 pr-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${
            showFilters || hasActiveFilters
              ? "border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]"
              : "border-[#1E2128] bg-[#161920] text-[#8B8D93] hover:text-[#E8E3D8]"
          }`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[#8B8D93] hover:text-[#E8E3D8] transition"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-4 rounded-xl border border-[#1E2128] bg-[#161920] p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Agency */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#8B8D93] mb-1">
              Agency
            </label>
            <select
              value={filterAgency}
              onChange={(e) => setFilterAgency(e.target.value)}
              className="w-full rounded-lg border border-[#1E2128] bg-[#0D0F14] px-2 py-1.5 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
            >
              <option value="all">All Agencies</option>
              {agencies.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#8B8D93] mb-1">
              Location
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full rounded-lg border border-[#1E2128] bg-[#0D0F14] px-2 py-1.5 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#8B8D93] mb-1">
              Age Range
            </label>
            <div className="flex gap-1">
              <input
                type="number"
                value={filterAgeMin}
                onChange={(e) => setFilterAgeMin(e.target.value)}
                placeholder="Min"
                className="w-full rounded-lg border border-[#1E2128] bg-[#0D0F14] px-2 py-1.5 text-xs text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
              />
              <input
                type="number"
                value={filterAgeMax}
                onChange={(e) => setFilterAgeMax(e.target.value)}
                placeholder="Max"
                className="w-full rounded-lg border border-[#1E2128] bg-[#0D0F14] px-2 py-1.5 text-xs text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
              />
            </div>
          </div>

          {/* Ethnicity */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[#8B8D93] mb-1">
              Ethnicity
            </label>
            <select
              value={filterEthnicity}
              onChange={(e) => setFilterEthnicity(e.target.value)}
              className="w-full rounded-lg border border-[#1E2128] bg-[#0D0F14] px-2 py-1.5 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
            >
              <option value="all">All</option>
              {ethnicities.map((eth) => (
                <option key={eth} value={eth}>
                  {eth}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Agency legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {agencies.map(([agentId, label]) => {
          const count = talents.filter((t) => t.agentId === agentId).length;
          return (
            <span
              key={agentId}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${agencyColor(agentId)}20`,
                color: agencyColor(agentId),
              }}
            >
              {label} ({count})
            </span>
          );
        })}
      </div>

      {/* Talent grid -- 5-column */}
      {filteredTalents.length === 0 ? (
        <div className="text-center py-12 text-[#8B8D93]">
          <p className="text-sm">
            {activeTab === "new"
              ? "No new talent to review."
              : activeTab === "selections"
              ? "No selections yet."
              : "No talent found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredTalents.map((t, idx) => (
            <RoleTalentCard
              key={t.id}
              talent={t}
              index={idx}
              isCommenting={commentingId === t.id}
              isNewView={activeTab === "new"}
              onSetStatus={(s) =>
                setStatus(t.id, t.packageToken, s)
              }
              onSetRating={(r) =>
                setRating(t.id, t.packageToken, r)
              }
              onHide={() => hideTalent(t.id, t.packageToken)}
              onUnhide={() => unhideTalent(t.id, t.packageToken)}
              onMarkReviewed={() =>
                markAsReviewed(t.id, t.packageToken)
              }
              onStartComment={() => setCommentingId(t.id)}
              onSaveComment={(c: string) =>
                saveComment(t.id, t.packageToken, c)
              }
              onCancelComment={() => setCommentingId(null)}
            />
          ))}
        </div>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-56 right-0 bg-[#161920] border-t border-[#1E2128] px-6 py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[#C9A84C] font-medium">
            {selectionsCount} selected
          </span>
          <span className="text-[#8B8D93]">&middot;</span>
          <span className="text-[#8B8D93]">
            {newCount} new
          </span>
          <span className="text-[#8B8D93]">&middot;</span>
          <span className="text-[#8B8D93]">
            {allCount} total
          </span>
        </div>
        {picks.length > 0 && (
          <Button onClick={handleRequestMedia} loading={mediaRequesting}>
            {mediaRequesting
              ? "Requesting..."
              : `Request Media (${picks.length})`}
          </Button>
        )}
      </div>
    </div>
  );
}

function RoleTalentCard({
  talent,
  index = 0,
  isCommenting,
  isNewView,
  onSetStatus,
  onSetRating,
  onHide,
  onUnhide,
  onMarkReviewed,
  onStartComment,
  onSaveComment,
  onCancelComment,
}: {
  talent: any;
  index?: number;
  isCommenting: boolean;
  isNewView: boolean;
  onSetStatus: (s: "yes" | "no" | "maybe") => void;
  onSetRating: (r: number) => void;
  onHide: () => void;
  onUnhide: () => void;
  onMarkReviewed: () => void;
  onStartComment: () => void;
  onSaveComment: (c: string) => void;
  onCancelComment: () => void;
}) {
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

  const statusBorder =
    talent.client_status === "yes"
      ? "ring-1 ring-emerald-500/30"
      : talent.client_status === "no"
      ? "ring-1 ring-red-500/20 opacity-60"
      : talent.client_status === "maybe"
      ? "ring-1 ring-amber-500/30"
      : "";

  const isReviewed = talent.client_status === "no";
  const agentColor = agencyColor(talent.agentId || "");

  return (
    <div
      className={`group rounded-xl overflow-hidden shadow-lg shadow-black/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 ${statusBorder} ${
        talent.is_hidden_by_client ? "opacity-50" : ""
      } ${isReviewed && isNewView ? "opacity-40" : ""} bg-[#13151A]`}
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
            priority={index < 5}
            loading={index < 5 ? "eager" : "lazy"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(160deg, #1E2128 0%, #2A2D35 100%)",
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

        {/* Rating badge on photo top-left */}
        {talent.client_rating != null && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center text-[10px] font-bold text-[#0D0F14]">
            {talent.client_rating}
          </div>
        )}

        {/* Status badge on photo top-right */}
        {talent.client_status === "yes" && (
          <div className="absolute top-2 right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            Yes
          </div>
        )}
        {talent.client_status === "maybe" && (
          <div className="absolute top-2 right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            Maybe
          </div>
        )}

        {/* Agency indicator - positioned below rating badge if present */}
        {talent.client_rating == null && (
          <div
            className="absolute top-2 left-2 w-2 h-2 rounded-full"
            style={{ backgroundColor: agentColor }}
            title={talent.agencyName}
          />
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
                href={
                  (url as string).startsWith("http")
                    ? (url as string)
                    : `https://${url}`
                }
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
        {talent.client_comment && !isCommenting && (
          <div className="mb-1.5 rounded bg-[#0D0F14] px-2 py-1 text-[10px] text-[#8B8D93] flex items-start gap-1">
            <MessageSquare size={10} className="shrink-0 mt-0.5" />
            <span className="line-clamp-2">{talent.client_comment}</span>
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
              className="w-full rounded border border-[#1E2128] bg-[#0D0F14] px-2 py-1 text-[10px] text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none"
            />
            <div className="flex gap-2 mt-0.5">
              <button
                onClick={() => onSaveComment(comment)}
                className="text-[10px] text-[#C9A84C] hover:underline"
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

        {/* Status buttons row */}
        <div className="flex items-center gap-1 pt-1.5 border-t border-[#1E2128]">
          <button
            onClick={() => onSetStatus("yes")}
            aria-label="Mark as yes"
            className={`flex-1 rounded min-h-[28px] text-[10px] font-medium transition-all duration-200 ${
              talent.client_status === "yes"
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
              talent.client_status === "no"
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
              talent.client_status === "maybe"
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
          {talent.is_hidden_by_client ? (
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
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => onSetRating(num)}
              aria-label={`Rate ${num} out of 5`}
              className={`w-6 h-6 rounded-full text-[10px] font-semibold transition-all duration-200 ${
                talent.client_rating != null && talent.client_rating >= num
                  ? "bg-[#C9A84C] text-[#0D0F14]"
                  : "bg-[#1A1C22] text-[#8B8D93] hover:bg-[#262930]"
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Mark as Reviewed button (new view only, for unreviewed talent) */}
        {isNewView && !talent.client_status && (
          <button
            onClick={onMarkReviewed}
            className="w-full mt-1.5 rounded bg-[#1A1C22] py-1.5 text-[10px] font-medium text-[#8B8D93] hover:bg-[#262930] hover:text-[#E8E3D8] transition"
          >
            Mark as Reviewed
          </button>
        )}
      </div>
    </div>
  );
}

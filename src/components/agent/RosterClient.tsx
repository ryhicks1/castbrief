"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Chip, Input, Pagination } from "@/components/ui";
import { TalentPhoto } from "@/components/ui/Avatar";
import { X, Upload, Mail, Loader2 } from "lucide-react";
import { LOCATIONS } from "@/lib/constants/locations";

interface TalentChip {
  chip_id: string;
  chips: { id: string; label: string; color: string };
}

interface Talent {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  location: string | null;
  cultural_background: string | null;
  special_skills: string[] | null;
  photo_url: string | null;
  links: Record<string, string>;
  talent_chips: TalentChip[];
}

const PLATFORM_LABELS: Record<string, string> = {
  casting_networks: "Casting Networks",
  actors_access: "Actors Access",
  spotlight: "Spotlight",
  showcast: "Showcast",
  imdb: "IMDb",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};

interface ChipData {
  id: string;
  label: string;
  color: string;
}

interface RosterClientProps {
  talents: Talent[];
  chips: ChipData[];
  totalCount: number;
}

const linkLabels: Record<string, string> = {
  casting_networks: "CN",
  actors_access: "AA",
  imdb: "IMDB",
  spotlight: "SL",
  showcast: "SC",
  youtube: "YT",
  tiktok: "TT",
  instagram: "IG",
};

const linkColorSchemes: Record<string, string> = {
  casting_networks: "orange",
  actors_access: "green",
  imdb: "default",
  spotlight: "purple",
  showcast: "teal",
  youtube: "pink",
  tiktok: "blue",
  instagram: "pink",
};

function getLocationCode(location: string): string {
  const match = LOCATIONS.find(
    (loc) => loc.city.toLowerCase() === location.toLowerCase()
  );
  if (match) return match.code;
  return location.slice(0, 3).toUpperCase();
}

export default function RosterClient({
  talents,
  chips,
  totalCount,
}: RosterClientProps) {
  const [search, setSearch] = useState("");
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [showFilters, setShowFilters] = useState(false);
  const [filterGender, setFilterGender] = useState("");
  const [filterAgeMin, setFilterAgeMin] = useState("");
  const [filterAgeMax, setFilterAgeMax] = useState("");
  const [filterEthnicity, setFilterEthnicity] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");

  const hasActiveFilters = filterGender || filterAgeMin || filterAgeMax || filterEthnicity || filterLocation || filterSkill || filterPlatform;

  const filtered = useMemo(() => {
    return talents.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.full_name.toLowerCase().includes(q) ||
        t.talent_chips.some((tc) =>
          tc.chips.label.toLowerCase().includes(q)
        );

      const matchesChips =
        activeChips.size === 0 ||
        t.talent_chips.some((tc) => activeChips.has(tc.chip_id));
      const matchesGender =
        !filterGender || (t.gender && t.gender.toLowerCase() === filterGender.toLowerCase());
      const matchesAgeMin =
        !filterAgeMin || (t.age != null && t.age >= parseInt(filterAgeMin));
      const matchesAgeMax =
        !filterAgeMax || (t.age != null && t.age <= parseInt(filterAgeMax));
      const matchesEthnicity =
        !filterEthnicity ||
        (t.cultural_background && t.cultural_background.toLowerCase().includes(filterEthnicity.toLowerCase()));
      const matchesLocation =
        !filterLocation ||
        (t.location && t.location.toLowerCase().includes(filterLocation.toLowerCase()));
      const matchesSkill =
        !filterSkill ||
        (t.special_skills && t.special_skills.some((s) => s.toLowerCase().includes(filterSkill.toLowerCase())));
      const matchesPlatform =
        !filterPlatform ||
        (t.links && t.links[filterPlatform] && t.links[filterPlatform].trim() !== "");

      return matchesSearch && matchesChips && matchesGender && matchesAgeMin && matchesAgeMax && matchesEthnicity && matchesLocation && matchesSkill && matchesPlatform;
    });
  }, [talents, search, activeChips, filterGender, filterAgeMin, filterAgeMax, filterEthnicity, filterLocation, filterSkill, filterPlatform]);

  const uniqueGenders = useMemo(() => [...new Set(talents.map((t) => t.gender).filter(Boolean) as string[])].sort(), [talents]);
  const uniqueLocations = useMemo(() => [...new Set(talents.map((t) => t.location).filter(Boolean) as string[])].sort(), [talents]);
  const uniqueEthnicities = useMemo(() => [...new Set(talents.map((t) => t.cultural_background).filter(Boolean) as string[])].sort(), [talents]);
  const uniqueSkills = useMemo(() => {
    const skills = new Set<string>();
    talents.forEach((t) => t.special_skills?.forEach((s) => skills.add(s)));
    return [...skills].sort();
  }, [talents]);
  const availablePlatforms = useMemo(() => {
    const platforms = new Set<string>();
    talents.forEach((t) => {
      if (t.links) {
        Object.entries(t.links).forEach(([key, val]) => {
          if (val && val.trim() !== "") platforms.add(key);
        });
      }
    });
    return [...platforms].sort();
  }, [talents]);

  function clearFilters() {
    setFilterGender("");
    setFilterAgeMin("");
    setFilterAgeMax("");
    setFilterEthnicity("");
    setFilterLocation("");
    setFilterSkill("");
    setFilterPlatform("");
    setPage(1);
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleChipFilter(chipId: string) {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(chipId)) next.delete(chipId);
      else next.add(chipId);
      return next;
    });
    setPage(1);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const generateInvite = useCallback(async () => {
    setInviteLoading(true);
    setInviteError(null);
    setInviteUrl(null);

    try {
      const res = await fetch("/api/roster/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talentName: inviteName || undefined,
          email: inviteEmail || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to generate invite");
        return;
      }

      setInviteUrl(data.url);
    } catch {
      setInviteError("Failed to generate invite");
    } finally {
      setInviteLoading(false);
    }
  }, [inviteName, inviteEmail]);

  function copyInviteUrl() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  }

  function resetInvite() {
    setShowInvite(false);
    setInviteName("");
    setInviteEmail("");
    setInviteUrl(null);
    setInviteError(null);
    setInviteCopied(false);
  }

  // Bulk import state
  const router = useRouter();
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTab, setBulkTab] = useState<"csv" | "invite">("csv");
  const csvFileRef = useRef<HTMLInputElement>(null);
  const [csvPreview, setCsvPreview] = useState<string[][] | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    imported?: number;
    skipped?: number;
    errors?: string[];
    sent?: number;
    failed?: number;
  } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkEmails, setBulkEmails] = useState("");

  function handleCsvSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setBulkResult(null);
    setBulkError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const rows = lines.slice(0, 11).map((line) => {
        const fields: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (inQuotes) {
            if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
            else if (char === '"') { inQuotes = false; }
            else { current += char; }
          } else {
            if (char === '"') { inQuotes = true; }
            else if (char === ",") { fields.push(current.trim()); current = ""; }
            else { current += char; }
          }
        }
        fields.push(current.trim());
        return fields;
      });
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  }

  async function handleBulkImport() {
    if (!csvFile) return;
    setBulkImporting(true);
    setBulkError(null);
    setBulkResult(null);

    try {
      const formData = new FormData();
      formData.append("file", csvFile);

      const res = await fetch("/api/roster/bulk-import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setBulkError(data.error || "Import failed");
      } else {
        setBulkResult(data);
        if (data.imported > 0) {
          router.refresh();
        }
      }
    } catch {
      setBulkError("Import failed");
    } finally {
      setBulkImporting(false);
    }
  }

  async function handleBulkInvite() {
    const emails = bulkEmails
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter((e) => e);
    if (emails.length === 0) return;

    setBulkImporting(true);
    setBulkError(null);
    setBulkResult(null);

    try {
      const res = await fetch("/api/roster/bulk-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBulkError(data.error || "Invite failed");
      } else {
        setBulkResult(data);
      }
    } catch {
      setBulkError("Invite failed");
    } finally {
      setBulkImporting(false);
    }
  }

  function resetBulkModal() {
    setShowBulkModal(false);
    setBulkTab("csv");
    setCsvPreview(null);
    setCsvFile(null);
    setBulkResult(null);
    setBulkError(null);
    setBulkEmails("");
  }

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-5xl mb-4">&#x25C9;</div>
        <h2 className="text-xl font-semibold text-[#E8E3D8] mb-2">
          No talent yet
        </h2>
        <p className="text-[#8B8D93] mb-6 text-sm">
          Add your first talent to get started
        </p>
        <Link href="/agent/roster/new">
          <Button>+ Add Talent</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#E8E3D8]">
            Roster{" "}
            <span className="text-[#8B8D93] font-normal text-base">
              ({totalCount})
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <Link
              href={`/agent/packages/new?talents=${Array.from(selected).join(",")}`}
            >
              <Button variant="secondary" size="sm">
                Create Package ({selected.size})
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowBulkModal(true)}
          >
            Bulk Import
          </Button>
          <div className="relative">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowInvite(!showInvite)}
            >
              Invite Talent
            </Button>

            {/* Invite modal/dropdown */}
            {showInvite && (
              <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl bg-[#13151A] p-4 shadow-xl shadow-black/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#E8E3D8]">
                    Invite Talent
                  </h3>
                  <button
                    onClick={resetInvite}
                    aria-label="Close invite modal"
                    className="text-[#8B8D93] hover:text-[#E8E3D8] text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>

                {!inviteUrl ? (
                  <div className="space-y-3">
                    <Input
                      id="invite-name"
                      label="Talent Name (optional)"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                    />
                    <Input
                      id="invite-email"
                      label="Email (optional)"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    {inviteError && (
                      <p className="text-xs text-red-400">{inviteError}</p>
                    )}
                    <Button
                      size="sm"
                      onClick={generateInvite}
                      loading={inviteLoading}
                    >
                      Generate Invite Link
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-[#0F0F12] p-2 border border-[#1E2128]">
                      <p className="text-xs text-[#E8E3D8] break-all select-all">
                        {inviteUrl}
                      </p>
                    </div>
                    <Button size="sm" onClick={copyInviteUrl}>
                      {inviteCopied ? "Copied!" : "Copy Link"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <Link href="/agent/roster/new">
            <Button size="sm">+ Add Talent</Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or tag..."
          aria-label="Search talent by name or tag"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-md rounded-lg border border-[#1E2128] bg-[#0F0F12] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none focus:ring-1 focus:ring-[#B8964C] transition-all duration-300"
        />
      </div>

      {/* Filter toggle + chips */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            showFilters || hasActiveFilters
              ? "bg-[#B8964C]/20 text-[#B8964C] border border-[#B8964C]/30"
              : "bg-[#1E2128] text-[#8B8D93] border border-[#2A2D35] hover:text-[#E8E3D8]"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
          Filters
          {hasActiveFilters && <span className="ml-1 text-[10px]">●</span>}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-[10px] text-[#8B8D93] hover:text-red-400 transition">
            Clear all
          </button>
        )}
        {chips.length > 0 && (
          <div className="flex-1 flex flex-wrap gap-1.5 overflow-hidden">
            {chips.map((chip) => (
              <Chip
                key={chip.id}
                label={chip.label}
                color={chip.color}
                active={activeChips.has(chip.id)}
                onClick={() => toggleChipFilter(chip.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-4 rounded-lg border border-[#1E2128] bg-[#13151A] p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <div>
            <label className="block text-[10px] text-[#8B8D93] mb-0.5">Gender</label>
            <select value={filterGender} onChange={(e) => { setFilterGender(e.target.value); setPage(1); }} className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#B8964C] focus:outline-none">
              <option value="">All</option>
              {(uniqueGenders.length > 0 ? uniqueGenders : ["Male", "Female", "Non-binary", "Other"]).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[#8B8D93] mb-0.5">Age Range</label>
            <div className="flex gap-1">
              <input type="number" placeholder="Min" value={filterAgeMin} onChange={(e) => { setFilterAgeMin(e.target.value); setPage(1); }} className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none" />
              <input type="number" placeholder="Max" value={filterAgeMax} onChange={(e) => { setFilterAgeMax(e.target.value); setPage(1); }} className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-[#8B8D93] mb-0.5">Ethnicity</label>
            <select value={filterEthnicity} onChange={(e) => { setFilterEthnicity(e.target.value); setPage(1); }} className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#B8964C] focus:outline-none">
              <option value="">All</option>
              {uniqueEthnicities.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[#8B8D93] mb-0.5">Location</label>
            <select value={filterLocation} onChange={(e) => { setFilterLocation(e.target.value); setPage(1); }} className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#B8964C] focus:outline-none">
              <option value="">All</option>
              {uniqueLocations.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[#8B8D93] mb-0.5">Skills</label>
            <select value={filterSkill} onChange={(e) => { setFilterSkill(e.target.value); setPage(1); }} className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#B8964C] focus:outline-none">
              <option value="">All</option>
              {uniqueSkills.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[#8B8D93] mb-0.5">Platform</label>
            <select value={filterPlatform} onChange={(e) => { setFilterPlatform(e.target.value); setPage(1); }} className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#B8964C] focus:outline-none">
              <option value="">All</option>
              {availablePlatforms.map((key) => <option key={key} value={key}>{PLATFORM_LABELS[key] || key}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Talent grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {paginated.map((talent, idx) => (
          <div
            key={talent.id}
            className={`group relative rounded-xl overflow-hidden shadow-lg shadow-black/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 bg-[#13151A] ${
              selected.has(talent.id)
                ? "ring-1 ring-[#B8964C] shadow-[0_0_24px_rgba(184,150,76,0.12)]"
                : ""
            }`}
          >
            {/* Photo area — 3:4 aspect ratio, clickable to profile */}
            <Link href={`/agent/roster/${talent.id}`} className="block relative">
              <TalentPhoto
                photo_url={talent.photo_url}
                name={talent.full_name}
                size="lg"
                aspectRatio="3/4"
                priority={idx < 5}
              />

              {/* Name/age/location overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-sm font-semibold text-white truncate">{talent.full_name}</p>
                <p className="text-xs text-white/70">
                  {talent.age ? `${talent.age}` : ""}{talent.location ? ` \u00B7 ${getLocationCode(talent.location)}` : ""}
                </p>
              </div>
            </Link>

            {/* Checkbox overlay on top-right corner of photo */}
            <div className="absolute top-3 right-3 z-10">
              <label className="flex items-center justify-center w-6 h-6 rounded border-2 cursor-pointer transition-colors"
                style={{
                  borderColor: selected.has(talent.id) ? "#B8964C" : "#8B8D93",
                  backgroundColor: selected.has(talent.id) ? "#B8964C" : "rgba(15,15,18,0.6)",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(talent.id)}
                  onChange={() => toggleSelect(talent.id)}
                  aria-label={`Select ${talent.full_name}`}
                  className="sr-only"
                />
                {selected.has(talent.id) && (
                  <svg className="w-4 h-4 text-[#0F0F12]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </label>
            </div>

            {/* Card body — chips and link badges only */}
            <div className="p-2">
              {/* Chips */}
              {talent.talent_chips.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {talent.talent_chips.slice(0, 2).map((tc) => (
                    <Chip
                      key={tc.chip_id}
                      label={tc.chips.label}
                      color={tc.chips.color}
                      active
                    />
                  ))}
                  {talent.talent_chips.length > 2 && (
                    <span className="text-[10px] text-[#8B8D93] self-center">
                      +{talent.talent_chips.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Profile link badges */}
              {talent.links && Object.keys(talent.links).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(talent.links)
                    .filter(([, url]) => url)
                    .map(([key, url]) => (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Chip
                          label={linkLabels[key] || key.toUpperCase()}
                          colorScheme={(linkColorSchemes[key] || "default") as any}
                        />
                      </a>
                    ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && totalCount > 0 && (
        <div className="text-center py-12 text-[#8B8D93]">
          No talents match your filters
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) resetBulkModal();
          }}
        >
          <div className="bg-[#13151A] rounded-xl border border-[#1E2128] shadow-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto animate-[modal-enter_0.2s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#E8E3D8]">
                Bulk Import
              </h2>
              <button
                onClick={resetBulkModal}
                aria-label="Close bulk import modal"
                className="rounded-lg p-1 text-[#8B8D93] hover:text-[#E8E3D8] hover:bg-[#1E2128] transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#1E2128] mb-4">
              <button
                onClick={() => { setBulkTab("csv"); setBulkResult(null); setBulkError(null); }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
                  bulkTab === "csv"
                    ? "border-[#B8964C] text-[#B8964C]"
                    : "border-transparent text-[#8B8D93] hover:text-[#E8E3D8]"
                }`}
              >
                <Upload size={14} />
                CSV Upload
              </button>
              <button
                onClick={() => { setBulkTab("invite"); setBulkResult(null); setBulkError(null); }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
                  bulkTab === "invite"
                    ? "border-[#B8964C] text-[#B8964C]"
                    : "border-transparent text-[#8B8D93] hover:text-[#E8E3D8]"
                }`}
              >
                <Mail size={14} />
                Bulk Invite
              </button>
            </div>

            {bulkTab === "csv" ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#8B8D93] mb-2">
                    Upload a CSV with columns: full_name (required), email, phone, age, location, cultural_background
                  </p>
                  <input
                    ref={csvFileRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => csvFileRef.current?.click()}
                  >
                    Choose CSV File
                  </Button>
                  {csvFile && (
                    <span className="ml-2 text-xs text-[#E8E3D8]">
                      {csvFile.name}
                    </span>
                  )}
                </div>

                {/* Preview table */}
                {csvPreview && csvPreview.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-[#1E2128]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#1E2128]">
                          {csvPreview[0].map((header, i) => (
                            <th
                              key={i}
                              className="px-3 py-2 text-left font-medium text-[#8B8D93] whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(1).map((row, ri) => (
                          <tr key={ri} className="border-t border-[#1E2128]">
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className="px-3 py-1.5 text-[#E8E3D8] whitespace-nowrap"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvPreview.length > 10 && (
                      <p className="px-3 py-1.5 text-[10px] text-[#8B8D93]">
                        Showing first 10 rows...
                      </p>
                    )}
                  </div>
                )}

                {csvFile && (
                  <Button
                    size="sm"
                    onClick={handleBulkImport}
                    loading={bulkImporting}
                  >
                    Import
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#8B8D93] mb-1">
                    Email addresses (one per line)
                  </label>
                  <textarea
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    placeholder={"talent1@example.com\ntalent2@example.com\ntalent3@example.com"}
                    rows={6}
                    className="w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none resize-none"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleBulkInvite}
                  loading={bulkImporting}
                  disabled={!bulkEmails.trim()}
                >
                  Send Invites
                </Button>
              </div>
            )}

            {/* Results */}
            {bulkResult && (
              <div className="mt-4 rounded-lg border border-[#1E2128] bg-[#0F0F12] p-3">
                {bulkResult.imported !== undefined && (
                  <p className="text-sm text-green-400">
                    Imported: {bulkResult.imported}
                  </p>
                )}
                {bulkResult.skipped !== undefined && bulkResult.skipped > 0 && (
                  <p className="text-sm text-yellow-400">
                    Skipped: {bulkResult.skipped}
                  </p>
                )}
                {bulkResult.sent !== undefined && (
                  <p className="text-sm text-green-400">
                    Invites sent: {bulkResult.sent}
                  </p>
                )}
                {bulkResult.failed !== undefined && bulkResult.failed > 0 && (
                  <p className="text-sm text-red-400">
                    Failed: {bulkResult.failed}
                  </p>
                )}
                {bulkResult.errors && bulkResult.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {bulkResult.errors.map((err, i) => (
                      <p key={i} className="text-[10px] text-red-400">
                        {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {bulkError && (
              <p className="mt-3 text-sm text-red-400">{bulkError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

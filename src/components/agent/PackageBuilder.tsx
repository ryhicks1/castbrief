"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Chip } from "@/components/ui";
import { TalentPhoto } from "@/components/ui/Avatar";
import { LOCATIONS } from "@/lib/constants/locations";

function getLocationCode(location: string): string {
  const match = LOCATIONS.find(
    (loc) => loc.city.toLowerCase() === location.toLowerCase()
  );
  if (match) return match.code;
  return location.slice(0, 3).toUpperCase();
}

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
  links: Record<string, string> | null;
  photo_url: string | null;
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

interface PackageBuilderProps {
  talents: Talent[];
  chips: ChipData[];
  agentId: string;
}

export default function PackageBuilder({
  talents,
  chips,
  agentId,
}: PackageBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("talents")?.split(",").filter(Boolean) ?? [];

  const [search, setSearch] = useState("");
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set(preselected));
  const [showFilters, setShowFilters] = useState(false);
  const [filterGender, setFilterGender] = useState<string>("");
  const [filterAgeMin, setFilterAgeMin] = useState<string>("");
  const [filterAgeMax, setFilterAgeMax] = useState<string>("");
  const [filterEthnicity, setFilterEthnicity] = useState<string>("");
  const [filterLocation, setFilterLocation] = useState<string>("");
  const [filterSkill, setFilterSkill] = useState<string>("");
  const [filterPlatform, setFilterPlatform] = useState<string>("");

  const [packageName, setPackageName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [allowComments, setAllowComments] = useState(true);
  const [allowHide, setAllowHide] = useState(true);
  const [allowMedia, setAllowMedia] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generatedPackageId, setGeneratedPackageId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const hasActiveFilters = filterGender || filterAgeMin || filterAgeMax || filterEthnicity || filterLocation || filterSkill || filterPlatform;

  const filtered = useMemo(() => {
    return talents.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.full_name.toLowerCase().includes(q) ||
        t.talent_chips.some((tc) => tc.chips.label.toLowerCase().includes(q));
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

  // Extract unique values for filter dropdowns
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
  }

  function toggleChipFilter(chipId: string) {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(chipId)) next.delete(chipId);
      else next.add(chipId);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((t) => next.add(t.id));
      return next;
    });
  }

  const selectedTalents = talents.filter((t) => selected.has(t.id));

  async function handleGenerate() {
    if (!packageName.trim()) {
      setError("Package name is required");
      return;
    }
    if (selected.size === 0) {
      setError("Select at least one talent");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data: pkg, error: pkgError } = await supabase
      .from("packages")
      .insert({
        agent_id: agentId,
        name: packageName,
        client_name: clientName || null,
        client_email: clientEmail || null,
        status: "sent",
        settings: {
          allow_comments: allowComments,
          allow_hide: allowHide,
          allow_media_requests: allowMedia,
        },
        expires_at: expiryEnabled && expiryDate ? expiryDate : null,
      })
      .select("id, token")
      .single();

    if (pkgError) {
      setError(pkgError.message);
      setLoading(false);
      return;
    }

    const talentRows = Array.from(selected).map((talent_id, i) => ({
      package_id: pkg.id,
      talent_id,
      sort_order: i,
    }));

    const { error: talentError } = await supabase
      .from("package_talents")
      .insert(talentRows);

    if (talentError) {
      setError(talentError.message);
      setLoading(false);
      return;
    }

    setGeneratedPackageId(pkg.id);
    setGeneratedLink(`${window.location.origin}/p/${pkg.token}`);
    setLoading(false);
  }

  async function handleSendEmail() {
    if (!generatedLink || !generatedPackageId) return;
    if (clientEmail) {
      setSendingEmail(true);
      try {
        const res = await fetch("/api/email/send-package", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            packageId: generatedPackageId,
            recipientEmail: clientEmail,
            recipientName: clientName,
          }),
        });
        if (res.ok) {
          setEmailSent(true);
        }
      } catch (e) {
        console.error("Failed to send email:", e);
      }
      setSendingEmail(false);
    } else {
      // Fallback to mailto
      const subject = encodeURIComponent("Your Talent Package");
      const body = encodeURIComponent(`Hi,\n\nHere's your talent package: ${generatedLink}\n\nBest regards`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  }

  async function copyLink() {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (generatedLink) {
    return (
      <div className="flex flex-col items-center justify-center py-16 max-w-md mx-auto">
        <div className="text-4xl mb-4">&#x2714;</div>
        <h2 className="text-xl font-bold text-[#E8E3D8] mb-2">
          Package Created
        </h2>
        <p className="text-sm text-[#8B8D93] mb-6 text-center">
          {selectedTalents.length} talent included. Share this link with your
          client.
        </p>
        <div className="w-full rounded-lg border border-[#1E2128] bg-[#1E2128] p-3 text-sm text-[#B8964C] break-all mb-4">
          {generatedLink}
        </div>
        <div className="flex gap-3 w-full">
          <Button onClick={copyLink} className="flex-1">
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleSendEmail}
            loading={sendingEmail}
            disabled={emailSent}
          >
            {emailSent ? "Email Sent \u2713" : "Send via Email"}
          </Button>
        </div>
        <button
          onClick={() => router.push("/agent/dashboard")}
          className="mt-6 text-sm text-[#8B8D93] hover:text-[#E8E3D8]"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#E8E3D8]">New Package</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#B8964C]">
            {selected.size} talent selected
          </span>
          <Button
            onClick={() => {
              if (selected.size === 0) {
                setError("Select at least one talent");
                return;
              }
              setShowSettings(true);
            }}
            size="sm"
          >
            Generate Package Link →
          </Button>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1E2128] bg-[#13151A] p-6 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#E8E3D8]">Package Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-[#8B8D93] hover:text-[#E8E3D8] transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-4">
              <Input id="pkg-name" label="Package Name *" value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="e.g. Netflix Pilot Selects" />
              <Input id="client-name" label="Client / Recipient" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              <Input id="client-email" label="Client Email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              <div className="space-y-3 pt-2">
                <Toggle label="Allow comments" checked={allowComments} onChange={setAllowComments} />
                <Toggle label="Allow client to hide talent" checked={allowHide} onChange={setAllowHide} />
                <Toggle label="Allow media / form requests" checked={allowMedia} onChange={setAllowMedia} />
              </div>
              <div className="pt-2 border-t border-[#2A2D35]">
                <Toggle label="Set expiry date" checked={expiryEnabled} onChange={setExpiryEnabled} />
                {expiryEnabled && (
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="mt-2 w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#B8964C] focus:outline-none" />
                )}
              </div>
              <div className="text-xs text-[#8B8D93]">{selected.size} talent selected</div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <Button onClick={handleGenerate} loading={loading} className="w-full">Generate Package Link</Button>
            </div>
          </div>
        </div>
      )}

      {/* Talent Selector - full width */}
      <div className="flex-1 flex flex-col min-w-0">

        <input
          type="text"
          placeholder="Search talent..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none transition-all duration-300"
        />

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
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-3 rounded-lg border border-[#1E2128] bg-[#13151A] p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <FilterSelect
              label="Gender"
              value={filterGender}
              onChange={setFilterGender}
              options={uniqueGenders.length > 0 ? uniqueGenders : ["Male", "Female", "Non-binary", "Other"]}
            />
            <div>
              <label className="block text-[10px] text-[#8B8D93] mb-0.5">Age Range</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={filterAgeMin}
                  onChange={(e) => setFilterAgeMin(e.target.value)}
                  className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filterAgeMax}
                  onChange={(e) => setFilterAgeMax(e.target.value)}
                  className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none"
                />
              </div>
            </div>
            <FilterSelect
              label="Ethnicity"
              value={filterEthnicity}
              onChange={setFilterEthnicity}
              options={uniqueEthnicities}
            />
            <FilterSelect
              label="Location"
              value={filterLocation}
              onChange={setFilterLocation}
              options={uniqueLocations}
            />
            <FilterSelect
              label="Skills"
              value={filterSkill}
              onChange={setFilterSkill}
              options={uniqueSkills}
            />
            <div>
              <label className="block text-[10px] text-[#8B8D93] mb-0.5">Platform</label>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#B8964C] focus:outline-none"
              >
                <option value="">All</option>
                {availablePlatforms.map((key) => (
                  <option key={key} value={key}>
                    {PLATFORM_LABELS[key] || key}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mb-2">
          <button
            onClick={selectAllVisible}
            className="text-xs text-[#B8964C] hover:underline"
          >
            Select All Visible ({filtered.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {filtered.map((talent) => (
              <div
                key={talent.id}
                onClick={() => toggleSelect(talent.id)}
                className={`group relative rounded-xl overflow-hidden cursor-pointer shadow-lg shadow-black/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 ${
                  selected.has(talent.id)
                    ? "ring-2 ring-[#B8964C] shadow-[0_0_24px_rgba(184,150,76,0.12)]"
                    : "ring-1 ring-[#1E2128] hover:ring-[#2A2D35]"
                } bg-[#13151A]`}
              >
                <div className="relative" style={{ aspectRatio: "3/4" }}>
                  <TalentPhoto
                    photo_url={talent.photo_url}
                    name={talent.full_name}
                    size="md"
                    aspectRatio="3/4"
                  />

                  {/* Checkbox overlay */}
                  <div className="absolute top-1.5 right-1.5 z-10">
                    <div
                      className="flex items-center justify-center w-6 h-6 rounded border-2 transition-colors"
                      style={{
                        borderColor: selected.has(talent.id) ? "#B8964C" : "#8B8D93",
                        backgroundColor: selected.has(talent.id) ? "#B8964C" : "rgba(15,15,18,0.6)",
                      }}
                    >
                      <input type="checkbox" checked={selected.has(talent.id)} onChange={() => {}} className="sr-only" />
                      {selected.has(talent.id) && (
                        <svg className="w-3 h-3 text-[#0F0F12]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Name/age/location overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                    <p className="text-xs font-semibold text-white truncate">{talent.full_name}</p>
                    <p className="text-[10px] text-white/70">
                      {talent.age ? `${talent.age}` : ""}{talent.location ? ` · ${getLocationCode(talent.location)}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && !showSettings && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-[#E8E3D8]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-[#B8964C]" : "bg-[#2A2D35]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
    </label>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-[10px] text-[#8B8D93] mb-0.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#B8964C] focus:outline-none"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

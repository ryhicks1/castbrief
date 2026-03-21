"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button, Chip, Input } from "@/components/ui";
import { TalentPhoto } from "@/components/ui/Avatar";

interface TalentChip {
  chip_id: string;
  chips: { id: string; label: string; color: string };
}

interface Talent {
  id: string;
  full_name: string;
  age: number | null;
  location: string | null;
  cultural_background: string | null;
  photo_url: string | null;
  links: Record<string, string>;
  talent_chips: TalentChip[];
}

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

export default function RosterClient({
  talents,
  chips,
  totalCount,
}: RosterClientProps) {
  const [search, setSearch] = useState("");
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

      return matchesSearch && matchesChips;
    });
  }, [talents, search, activeChips]);

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

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-5xl mb-4">◉</div>
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
              <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-[#2A2D35] bg-[#161920] p-4 shadow-xl shadow-black/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#E8E3D8]">
                    Invite Talent
                  </h3>
                  <button
                    onClick={resetInvite}
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
                    <div className="rounded-lg bg-[#0D0F14] p-2 border border-[#2A2D35]">
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
        />
      </div>

      {/* Chip filters */}
      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
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

      {/* Talent grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((talent) => (
          <div
            key={talent.id}
            className={`relative rounded-xl overflow-hidden border shadow-md shadow-black/10 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 transition-all duration-200 hover:border-[#2A2D35] bg-[#161920] ${
              selected.has(talent.id)
                ? "border-[#C9A84C] shadow-[0_0_16px_rgba(201,168,76,0.12)]"
                : "border-[#1E2128]"
            }`}
          >
            {/* Photo area — 4:5 aspect ratio */}
            <div className="relative">
              <TalentPhoto
                photo_url={talent.photo_url}
                name={talent.full_name}
                size="lg"
                aspectRatio="4/5"
              />

              {/* Checkbox overlay on top-right corner of photo */}
              <div className="absolute top-3 right-3 z-10">
                <label className="flex items-center justify-center w-6 h-6 rounded border-2 cursor-pointer transition-colors"
                  style={{
                    borderColor: selected.has(talent.id) ? "#C9A84C" : "#8B8D93",
                    backgroundColor: selected.has(talent.id) ? "#C9A84C" : "rgba(13,15,20,0.6)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(talent.id)}
                    onChange={() => toggleSelect(talent.id)}
                    className="sr-only"
                  />
                  {selected.has(talent.id) && (
                    <svg className="w-4 h-4 text-[#0D0F14]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </label>
              </div>
            </div>

            {/* Card body */}
            <div className="p-3">
              <h3 className="text-sm font-semibold text-[#E8E3D8] truncate mb-1">
                {talent.full_name}
              </h3>
              <div className="text-xs text-[#8B8D93] truncate mb-2">
                {[
                  talent.age ? `Age ${talent.age}` : null,
                  talent.location,
                  talent.cultural_background,
                ]
                  .filter(Boolean)
                  .join(" \u00B7 ")}
              </div>

              {/* Chips */}
              {talent.talent_chips.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
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
                <div className="flex flex-wrap gap-1 mb-2">
                  {Object.entries(talent.links)
                    .filter(([, url]) => url)
                    .map(([key]) => (
                      <span
                        key={key}
                        className="rounded bg-[#1E2128] px-1.5 py-0.5 text-[10px] font-medium text-[#8B8D93]"
                      >
                        {linkLabels[key] || key.toUpperCase()}
                      </span>
                    ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#1E2128]">
                <Link
                  href={`/agent/roster/${talent.id}`}
                  className="text-xs text-[#C9A84C] underline hover:text-[#D4B35C]"
                >
                  View
                </Link>
                <span className="flex-1" />
                <button
                  className="text-sm text-[#8B8D93] hover:text-[#E8E3D8] transition-colors px-1"
                  title="More options"
                >
                  &#x22EF;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && totalCount > 0 && (
        <div className="text-center py-12 text-[#8B8D93]">
          No talents match your filters
        </div>
      )}
    </div>
  );
}

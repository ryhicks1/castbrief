"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button, Avatar, Chip } from "@/components/ui";

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
            className="relative rounded-xl border border-[#1E2128] bg-[#161920] p-4 transition hover:border-[#2A2D35]"
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={selected.has(talent.id)}
              onChange={() => toggleSelect(talent.id)}
              className="absolute top-3 right-3 h-4 w-4 rounded border-[#2A2D35] bg-[#1E2128] accent-[#C9A84C]"
            />

            {/* Content */}
            <div className="flex items-start gap-3 mb-3">
              <Avatar
                src={talent.photo_url}
                name={talent.full_name}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[#E8E3D8] truncate">
                  {talent.full_name}
                </h3>
                <div className="text-xs text-[#8B8D93] space-y-0.5 mt-1">
                  {talent.age && <div>Age {talent.age}</div>}
                  {talent.location && <div>{talent.location}</div>}
                  {talent.cultural_background && (
                    <div>{talent.cultural_background}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Chips */}
            {talent.talent_chips.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {talent.talent_chips.slice(0, 3).map((tc) => (
                  <Chip
                    key={tc.chip_id}
                    label={tc.chips.label}
                    color={tc.chips.color}
                    active
                  />
                ))}
                {talent.talent_chips.length > 3 && (
                  <span className="text-xs text-[#8B8D93] self-center">
                    +{talent.talent_chips.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Profile link badges */}
            {talent.links && Object.keys(talent.links).length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
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
            <div className="flex gap-2 pt-2 border-t border-[#1E2128]">
              <Link
                href={`/agent/roster/${talent.id}`}
                className="flex-1"
              >
                <Button variant="secondary" size="sm" className="w-full">
                  View Profile
                </Button>
              </Link>
              <Link
                href={`/agent/roster/${talent.id}#notes`}
                className="flex-1"
              >
                <Button variant="ghost" size="sm" className="w-full">
                  + Note
                </Button>
              </Link>
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

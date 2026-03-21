"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Chip, Input } from "@/components/ui";
import { TalentPhoto } from "@/components/ui/Avatar";
import { X, Upload, Mail, Loader2 } from "lucide-react";

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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-[#1E2128] bg-[#0F0F12] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none focus:ring-1 focus:ring-[#B8964C] transition-all duration-300"
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((talent) => (
          <div
            key={talent.id}
            className={`group relative rounded-xl overflow-hidden shadow-lg shadow-black/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 bg-[#13151A] ${
              selected.has(talent.id)
                ? "ring-1 ring-[#B8964C] shadow-[0_0_24px_rgba(184,150,76,0.12)]"
                : ""
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
                    borderColor: selected.has(talent.id) ? "#B8964C" : "#8B8D93",
                    backgroundColor: selected.has(talent.id) ? "#B8964C" : "rgba(15,15,18,0.6)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(talent.id)}
                    onChange={() => toggleSelect(talent.id)}
                    className="sr-only"
                  />
                  {selected.has(talent.id) && (
                    <svg className="w-4 h-4 text-[#0F0F12]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                  className="text-xs text-[#B8964C] underline hover:text-[#C9A64C]"
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

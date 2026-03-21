"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Chip } from "@/components/ui";
import { TalentPhoto } from "@/components/ui/Avatar";

interface TalentChip {
  chip_id: string;
  chips: { id: string; label: string; color: string };
}

interface Talent {
  id: string;
  full_name: string;
  age: number | null;
  photo_url: string | null;
  talent_chips: TalentChip[];
}

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

  const [packageName, setPackageName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [allowComments, setAllowComments] = useState(true);
  const [allowHide, setAllowHide] = useState(false);
  const [allowMedia, setAllowMedia] = useState(false);
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generatedPackageId, setGeneratedPackageId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

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
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-7rem)]">
      {/* LEFT — Talent Selector */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#E8E3D8]">New Package</h1>
          <span className="text-sm text-[#B8964C]">
            {selected.size} talent selected
          </span>
        </div>

        <input
          type="text"
          placeholder="Search talent..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none transition-all duration-300"
        />

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
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

        <div className="mb-2">
          <button
            onClick={selectAllVisible}
            className="text-xs text-[#B8964C] hover:underline"
          >
            Select All Visible ({filtered.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((talent) => (
              <label
                key={talent.id}
                className={`group relative rounded-xl overflow-hidden cursor-pointer shadow-lg shadow-black/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 ${
                  selected.has(talent.id)
                    ? "ring-1 ring-[#B8964C] shadow-[0_0_24px_rgba(184,150,76,0.12)]"
                    : "ring-1 ring-[#1E2128] hover:ring-[#2A2D35]"
                } bg-[#13151A]`}
              >
                {/* Photo area */}
                <div className="relative">
                  <TalentPhoto
                    photo_url={talent.photo_url}
                    name={talent.full_name}
                    size="md"
                    aspectRatio="4/5"
                  />

                  {/* Checkbox overlay on top-right corner */}
                  <div className="absolute top-2 right-2 z-10">
                    <div
                      className="flex items-center justify-center w-8 h-8 md:w-6 md:h-6 rounded border-2 transition-colors"
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
                        <svg className="w-3 h-3 text-[#0F0F12]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name + details below photo */}
                <div className="p-1.5">
                  <div className="text-xs font-medium text-[#E8E3D8] truncate">
                    {talent.full_name}
                  </div>
                  {talent.age && (
                    <div className="text-[10px] text-[#8B8D93]">
                      Age {talent.age}
                    </div>
                  )}
                  {talent.talent_chips.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {talent.talent_chips.slice(0, 2).map((tc) => (
                        <Chip
                          key={tc.chip_id}
                          label={tc.chips.label}
                          color={tc.chips.color}
                          active
                        />
                      ))}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Package Config */}
      <div className="w-full lg:w-80 lg:shrink-0 order-first lg:order-none overflow-y-auto">
        <div className="sticky top-0 rounded-xl bg-[#13151A] p-5 space-y-4 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#B8964C]">
            Package Settings
          </div>

          <Input
            id="pkg-name"
            label="Package Name *"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            placeholder="e.g. Netflix Pilot Selects"
          />

          <Input
            id="client-name"
            label="Client / Recipient"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />

          <Input
            id="client-email"
            label="Client Email"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />

          <div className="space-y-3 pt-2">
            <Toggle
              label="Allow comments"
              checked={allowComments}
              onChange={setAllowComments}
            />
            <Toggle
              label="Allow client to hide talent"
              checked={allowHide}
              onChange={setAllowHide}
            />
            <Toggle
              label="Allow media / form requests"
              checked={allowMedia}
              onChange={setAllowMedia}
            />
          </div>

          {selectedTalents.length > 0 && (
            <div className="pt-2 border-t border-[#2A2D35]">
              <div className="text-xs text-[#8B8D93] mb-1">
                {selectedTalents.length} talent selected
              </div>
              <div className="text-xs text-[#E8E3D8]">
                {selectedTalents
                  .slice(0, 5)
                  .map((t) => t.full_name)
                  .join(", ")}
                {selectedTalents.length > 5 &&
                  ` +${selectedTalents.length - 5} more`}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-[#2A2D35]">
            <Toggle
              label="Set expiry date"
              checked={expiryEnabled}
              onChange={setExpiryEnabled}
            />
            {expiryEnabled && (
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#B8964C] focus:outline-none transition-all duration-300"
              />
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button
            onClick={handleGenerate}
            loading={loading}
            className="w-full"
          >
            Generate Package Link
          </Button>
        </div>
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

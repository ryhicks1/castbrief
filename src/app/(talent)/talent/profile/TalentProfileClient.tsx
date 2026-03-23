"use client";

import { useState } from "react";
import TalentForm from "@/components/agent/TalentForm";

interface ChipData {
  id: string;
  label: string;
  color: string;
}

interface TalentData {
  id: string;
  agent_id: string;
  full_name: string;
  age: number | null;
  location: string;
  cultural_background: string;
  height_cm: number | null;
  weight_kg: number | null;
  about: string;
  special_skills: string[];
  photo_url: string | null;
  links: Record<string, string>;
  email: string | null;
  phone: string | null;
  editing_locked: boolean;
  profile_slug: string | null;
  talent_chips?: { chip_id: string; chips: ChipData }[];
}

interface TalentProfileClientProps {
  talent: TalentData;
  chips: ChipData[];
  agencyName: string;
  isLocked: boolean;
}

export default function TalentProfileClient({
  talent,
  chips,
  agencyName,
  isLocked,
}: TalentProfileClientProps) {
  const [copied, setCopied] = useState(false);
  const [slugInput, setSlugInput] = useState(talent.profile_slug || "");
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState("");

  const profileUrl = talent.profile_slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/talent/${talent.profile_slug}`
    : `${typeof window !== "undefined" ? window.location.origin : ""}/talent/view/${talent.id}`;

  async function handleCopyLink() {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveSlug() {
    const slug = slugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!slug) { setSlugError("Please enter a valid URL"); return; }
    setSlugSaving(true);
    setSlugError("");
    try {
      const res = await fetch(`/api/talent/${talent.id}/slug`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSlugError(data.error || "Failed to save");
      } else {
        setEditingSlug(false);
        setSlugInput(slug);
        talent.profile_slug = slug;
      }
    } catch {
      setSlugError("Failed to save");
    }
    setSlugSaving(false);
  }

  // Strip email and phone from what is displayed
  const talentForForm = {
    ...talent,
    email: null,
    phone: null,
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Actions Header */}
      <div className="mb-6 rounded-xl border border-[#1E2128] bg-[#13151A] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#E8E3D8]">My Profile</h2>
          <span className="text-xs text-[#8B8D93]">{agencyName}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E2128] px-3 py-2 text-xs text-[#E8E3D8] hover:bg-[#262930] transition"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview Profile
          </a>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E2128] px-3 py-2 text-xs text-[#E8E3D8] hover:bg-[#262930] transition"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            {copied ? "Copied!" : "Copy Profile Link"}
          </button>
          <button
            onClick={() => setEditingSlug(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E2128] px-3 py-2 text-xs text-[#E8E3D8] hover:bg-[#262930] transition"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
            {talent.profile_slug ? "Edit Custom URL" : "Create Custom URL"}
          </button>
        </div>

        {/* Custom URL editor */}
        {editingSlug && (
          <div className="mt-3 flex gap-2 items-center">
            <span className="text-xs text-[#8B8D93] shrink-0">castingbrief.com/talent/</span>
            <input
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder="sam-rivera"
              className="flex-1 rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-2 py-1.5 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
            />
            <button
              onClick={handleSaveSlug}
              disabled={slugSaving}
              className="rounded-lg bg-[#C9A84C] px-3 py-1.5 text-xs font-semibold text-[#0D0F14] hover:bg-[#D4B35C] transition disabled:opacity-50"
            >
              {slugSaving ? "..." : "Save"}
            </button>
            <button
              onClick={() => { setEditingSlug(false); setSlugError(""); }}
              className="text-xs text-[#8B8D93] hover:text-[#E8E3D8]"
            >
              Cancel
            </button>
          </div>
        )}
        {slugError && <p className="mt-1 text-xs text-red-400">{slugError}</p>}
        {talent.profile_slug && !editingSlug && (
          <p className="mt-2 text-[10px] text-[#8B8D93]">
            Your profile: castingbrief.com/talent/{talent.profile_slug}
          </p>
        )}
      </div>

      {isLocked && (
        <div className="mb-6 rounded-lg border border-[#2A2D35] bg-[#1E2128] p-3">
          <p className="text-sm text-[#8B8D93]">
            Your profile is currently locked for editing by your agent.
            Contact your agent if you need to make changes.
          </p>
        </div>
      )}

      <TalentForm
        talent={talentForForm}
        chips={chips}
        agentId={talent.agent_id}
        isLocked={isLocked}
      />
    </div>
  );
}

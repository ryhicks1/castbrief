"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Chip, Avatar } from "@/components/ui";

interface ChipData {
  id: string;
  label: string;
  color: string;
}

interface TalentData {
  id?: string;
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
  talent_chips?: { chip_id: string; chips: ChipData }[];
}

interface TalentFormProps {
  talent?: TalentData;
  chips: ChipData[];
  agentId: string;
  isLocked?: boolean;
}

const linkFields = [
  { key: "casting_networks", label: "Casting Networks" },
  { key: "actors_access", label: "Actors Access" },
  { key: "spotlight", label: "Spotlight" },
  { key: "showcast", label: "Showcast" },
  { key: "imdb", label: "IMDB" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
];

export default function TalentForm({
  talent,
  chips: initialChips,
  agentId,
  isLocked = false,
}: TalentFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEditing = !!talent?.id;

  const [form, setForm] = useState({
    full_name: talent?.full_name ?? "",
    age: talent?.age ?? null,
    location: talent?.location ?? "",
    cultural_background: talent?.cultural_background ?? "",
    height_cm: talent?.height_cm ?? null,
    weight_kg: talent?.weight_kg ?? null,
    about: talent?.about ?? "",
    special_skills: talent?.special_skills ?? [],
    photo_url: talent?.photo_url ?? null,
    links: talent?.links ?? {},
    email: talent?.email ?? "",
    phone: talent?.phone ?? "",
    editing_locked: talent?.editing_locked ?? false,
  });

  const [selectedChips, setSelectedChips] = useState<Set<string>>(
    new Set(talent?.talent_chips?.map((tc) => tc.chip_id) ?? [])
  );
  const [allChips, setAllChips] = useState<ChipData[]>(initialChips);
  const [newChipLabel, setNewChipLabel] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    talent?.photo_url ?? null
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateLink(key: string, value: string) {
    setForm((prev) => ({ ...prev, links: { ...prev.links, [key]: value } }));
  }

  function addSkill(e: React.KeyboardEvent) {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!form.special_skills.includes(skillInput.trim())) {
        updateField("special_skills", [
          ...form.special_skills,
          skillInput.trim(),
        ]);
      }
      setSkillInput("");
    }
  }

  function removeSkill(skill: string) {
    updateField(
      "special_skills",
      form.special_skills.filter((s) => s !== skill)
    );
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function toggleChip(chipId: string) {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      if (next.has(chipId)) next.delete(chipId);
      else next.add(chipId);
      return next;
    });
  }

  async function createChip() {
    if (!newChipLabel.trim()) return;
    const { data, error } = await supabase
      .from("chips")
      .insert({ agent_id: agentId, label: newChipLabel.trim() })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }
    if (data) {
      setAllChips((prev) => [...prev, data]);
      setSelectedChips((prev) => new Set([...prev, data.id]));
      setNewChipLabel("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formDisabled) {
      setError("Profile editing is locked");
      return;
    }
    if (!form.full_name.trim()) {
      setError("Full name is required");
      return;
    }
    setLoading(true);
    setError(null);

    let photoUrl = form.photo_url;

    // Upload photo if new file selected
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${agentId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("talent-photos")
        .upload(path, photoFile);

      if (uploadError) {
        setError("Photo upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("talent-photos").getPublicUrl(path);
      photoUrl = publicUrl;
    }

    const talentData = {
      agent_id: agentId,
      full_name: form.full_name,
      age: form.age,
      location: form.location || null,
      cultural_background: form.cultural_background || null,
      height_cm: form.height_cm,
      weight_kg: form.weight_kg,
      about: form.about || null,
      special_skills: form.special_skills,
      photo_url: photoUrl,
      links: form.links,
      email: form.email || null,
      phone: form.phone || null,
      editing_locked: form.editing_locked,
      updated_at: new Date().toISOString(),
    };

    let talentId = talent?.id;

    if (isEditing) {
      const { error: updateError } = await supabase
        .from("talents")
        .update(talentData)
        .eq("id", talent!.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("talents")
        .insert(talentData)
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }
      talentId = data.id;
    }

    // Sync chips — delete existing, insert selected
    if (talentId) {
      await supabase
        .from("talent_chips")
        .delete()
        .eq("talent_id", talentId);

      if (selectedChips.size > 0) {
        const chipRows = Array.from(selectedChips).map((chip_id) => ({
          talent_id: talentId!,
          chip_id,
        }));
        await supabase.from("talent_chips").insert(chipRows);
      }
    }

    router.push("/agent/roster");
    router.refresh();
  }

  const formDisabled = isLocked;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-[#E8E3D8]">
        {isEditing ? "Edit Talent" : "Add Talent"}
      </h1>

      {/* Lock profile editing toggle — only shown when editing existing talent, agent view */}
      {isEditing && !isLocked && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.editing_locked}
            onChange={(e) => updateField("editing_locked", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[#2A2D35] bg-[#1E2128] text-[#C9A84C] focus:ring-[#C9A84C]"
          />
          <div>
            <span className="text-sm font-medium text-[#E8E3D8]">
              Lock profile editing
            </span>
            <p className="text-xs text-[#8B8D93]">
              When locked, talent cannot make changes to their profile
            </p>
          </div>
        </label>
      )}

      {/* Photo */}
      <div className="flex items-center gap-4">
        <Avatar
          src={photoPreview}
          name={form.full_name || "?"}
          size="lg"
        />
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            {photoPreview ? "Change Photo" : "Upload Photo"}
          </Button>
          <p className="text-xs text-[#8B8D93] mt-1">
            JPG, PNG or WebP. Max 25MB.
          </p>
        </div>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="full_name"
          label="Full Name *"
          value={form.full_name}
          onChange={(e) => updateField("full_name", e.target.value)}
          required
        />
        <Input
          id="age"
          label="Age"
          type="number"
          value={form.age ?? ""}
          onChange={(e) =>
            updateField("age", e.target.value ? Number(e.target.value) : null)
          }
        />
        <Input
          id="location"
          label="Location"
          value={form.location}
          onChange={(e) => updateField("location", e.target.value)}
        />
        <Input
          id="cultural_background"
          label="Cultural Background"
          value={form.cultural_background}
          onChange={(e) => updateField("cultural_background", e.target.value)}
        />
        <Input
          id="height_cm"
          label="Height (cm)"
          type="number"
          value={form.height_cm ?? ""}
          onChange={(e) =>
            updateField(
              "height_cm",
              e.target.value ? Number(e.target.value) : null
            )
          }
        />
        <Input
          id="weight_kg"
          label="Weight (kg)"
          type="number"
          value={form.weight_kg ?? ""}
          onChange={(e) =>
            updateField(
              "weight_kg",
              e.target.value ? Number(e.target.value) : null
            )
          }
          disabled={formDisabled}
        />
        <Input
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          disabled={formDisabled}
        />
        <Input
          id="phone"
          label="Phone"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          disabled={formDisabled}
        />
      </div>

      {/* About */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#E8E3D8]">
          About
        </label>
        <textarea
          value={form.about}
          onChange={(e) => updateField("about", e.target.value)}
          rows={3}
          className="block w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
        />
      </div>

      {/* Special Skills */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#E8E3D8]">
          Special Skills
        </label>
        <input
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={addSkill}
          placeholder="Type a skill and press Enter"
          className="block w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
        />
        {form.special_skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {form.special_skills.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                active
                onRemove={() => removeSkill(skill)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Chips / Tags */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#E8E3D8]">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {allChips.map((chip) => (
            <Chip
              key={chip.id}
              label={chip.label}
              color={chip.color}
              active={selectedChips.has(chip.id)}
              onClick={() => toggleChip(chip.id)}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newChipLabel}
            onChange={(e) => setNewChipLabel(e.target.value)}
            placeholder="New tag name"
            className="rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-1.5 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createChip();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={createChip}
          >
            + New Tag
          </Button>
        </div>
      </div>

      {/* Links */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#E8E3D8]">
          Profile Links
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {linkFields.map(({ key, label }) => (
            <Input
              key={key}
              id={`link-${key}`}
              label={label}
              type="url"
              placeholder="https://..."
              value={(form.links as Record<string, string>)[key] || ""}
              onChange={(e) => updateLink(key, e.target.value)}
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {isEditing ? "Save Changes" : "Add Talent"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/agent/roster")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const projectTypes = [
  "Film",
  "TV Series",
  "Commercial",
  "Music Video",
  "Theatre",
  "Short Film",
  "Vertical Short",
  "Web Series",
  "Other",
];

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [type, setType] = useState("Film");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({
        client_id: user.id,
        name: name.trim(),
        brand: brand.trim() || null,
        type: type.toLowerCase(),
        deadline: deadline || null,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/client/projects/${data.id}`);
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-[#E8E3D8] mb-6">New Project</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#E8E3D8] mb-1">
            Project Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Netflix Drama Pilot"
            className="w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-[#E8E3D8] mb-1">
            Brand / Studio / Client
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-[#E8E3D8] mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
          >
            {projectTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-[#E8E3D8] mb-1">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}

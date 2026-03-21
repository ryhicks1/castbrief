"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface TalentNotesProps {
  talentId: string;
  notes: Note[];
}

export default function TalentNotes({ talentId, notes }: TalentNotesProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("talent_notes").insert({
      talent_id: talentId,
      agent_id: user.id,
      content: content.trim(),
    });

    setContent("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div id="notes" className="mt-10 max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-[#E8E3D8]">Notes</h2>
        <span className="rounded bg-[#1E2128] px-1.5 py-0.5 text-[10px] font-medium text-[#8B8D93]">
          Agent only
        </span>
      </div>

      {/* Add note form */}
      <form onSubmit={addNote} className="mb-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a private note..."
          rows={3}
          className="mb-2 block w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
        />
        <Button type="submit" size="sm" loading={loading} disabled={!content.trim()}>
          Add Note
        </Button>
      </form>

      {/* Existing notes */}
      {notes.length === 0 ? (
        <p className="text-sm text-[#8B8D93] italic">No notes yet</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-lg border border-[#1E2128] bg-[#161920] p-3"
            >
              <p className="text-sm italic text-[#A8A4A0]">{note.content}</p>
              <p className="mt-1 text-xs text-[#6B7280]">
                {new Date(note.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

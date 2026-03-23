"use client";

import { useState, useEffect } from "react";
import { Button, Input, Badge } from "@/components/ui";
import { X, Users, Trash2, Loader2 } from "lucide-react";

interface Collaborator {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface ShareProjectModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export default function ShareProjectModal({
  projectId,
  projectName,
  onClose,
}: ShareProjectModalProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCollaborators();
  }, []);

  async function fetchCollaborators() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/share`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data);
      }
    } catch (err) {
      console.error("Failed to fetch collaborators:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add collaborator");
        return;
      }

      setCollaborators((prev) => [...prev, data]);
      setEmail("");
    } catch (err) {
      setError("Failed to add collaborator");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(userId: string) {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/share?userId=${userId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setCollaborators((prev) => prev.filter((c) => c.user_id !== userId));
      }
    } catch (err) {
      console.error("Failed to remove collaborator:", err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-[#1E2128] bg-[#13151A] shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E2128] px-6 py-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#C9A84C]" />
            <h2 className="text-lg font-semibold text-[#E8E3D8]">
              Share {projectName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8B8D93] hover:text-[#E8E3D8] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Invite form */}
          <form onSubmit={handleInvite} className="mb-6">
            <label className="text-xs text-[#8B8D93] mb-2 block">
              Add collaborator by email
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
                className="rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <Button
                variant="primary"
                type="submit"
                disabled={inviting || !email.trim()}
                loading={inviting}
              >
                Invite
              </Button>
            </div>
          </form>

          {/* Collaborators list */}
          <div>
            <label className="text-xs text-[#8B8D93] mb-2 block">
              People with access
            </label>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="text-[#C9A84C] animate-spin" />
              </div>
            ) : collaborators.length === 0 ? (
              <p className="text-sm text-[#8B8D93] py-4">
                No collaborators yet. Invite someone to share this project.
              </p>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between rounded-lg border border-[#1E2128] bg-[#161920] px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#E8E3D8] truncate">
                        {collab.full_name}
                      </p>
                      <p className="text-xs text-[#8B8D93] truncate">
                        {collab.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge
                        label={collab.role === "editor" ? "Editor" : "Viewer"}
                        color={collab.role === "editor" ? "gold" : "muted"}
                      />
                      <button
                        onClick={() => handleRemove(collab.user_id)}
                        className="text-[#8B8D93] hover:text-red-400 transition"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#1E2128] px-6 py-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

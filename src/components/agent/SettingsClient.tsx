"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { Trash2, Plus, UserPlus } from "lucide-react";

interface Division {
  id: string;
  name: string;
}

interface Member {
  id: string;
  userId: string;
  role: string;
  fullName: string;
  email: string;
}

interface Org {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface SettingsClientProps {
  org: Org;
  orgId: string;
  divisions: Division[];
  members: Member[];
}

const roleBadgeColors: Record<string, string> = {
  admin: "bg-[#B8964C]/20 text-[#B8964C]",
  agent: "bg-blue-500/20 text-blue-400",
  viewer: "bg-[#8B8D93]/20 text-[#8B8D93]",
};

export default function SettingsClient({
  org,
  orgId,
  divisions: initialDivisions,
  members: initialMembers,
}: SettingsClientProps) {
  const router = useRouter();
  const [orgName, setOrgName] = useState(org.name);
  const [divisions, setDivisions] = useState(initialDivisions);
  const [members, setMembers] = useState(initialMembers);
  const [newDivisionName, setNewDivisionName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"agent" | "viewer">("agent");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSaveOrgName() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/org/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
      } else {
        setSuccess("Organization name updated");
        setTimeout(() => setSuccess(null), 2000);
        router.refresh();
      }
    } catch {
      setError("Failed to update");
    }
    setSaving(false);
  }

  async function handleAddDivision() {
    if (!newDivisionName.trim()) return;
    setError(null);
    try {
      const res = await fetch("/api/org/divisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDivisionName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create division");
        return;
      }
      const data = await res.json();
      setDivisions((prev) => [...prev, data.division]);
      setNewDivisionName("");
    } catch {
      setError("Failed to create division");
    }
  }

  async function handleDeleteDivision(divisionId: string) {
    setError(null);
    try {
      const res = await fetch(`/api/org/divisions?id=${divisionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete division");
        return;
      }
      setDivisions((prev) => prev.filter((d) => d.id !== divisionId));
    } catch {
      setError("Failed to delete division");
    }
  }

  async function handleInviteMember() {
    if (!inviteEmail.trim()) return;
    setError(null);
    try {
      const res = await fetch("/api/org/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to invite member");
        return;
      }
      const data = await res.json();
      setMembers((prev) => [...prev, data.member]);
      setInviteEmail("");
      setSuccess("Member invited");
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Failed to invite member");
    }
  }

  async function handleUpdateMemberRole(memberId: string, newRole: string) {
    setError(null);
    try {
      const res = await fetch("/api/org/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update role");
        return;
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch {
      setError("Failed to update role");
    }
  }

  async function handleRemoveMember(memberId: string) {
    setError(null);
    try {
      const res = await fetch(`/api/org/members?id=${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to remove member");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      setError("Failed to remove member");
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-xl font-bold text-[#E8E3D8]">Organization Settings</h1>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Organization Name */}
      <section className="rounded-xl border border-[#1E2128] bg-[#161920] p-5">
        <h2 className="text-sm font-semibold text-[#E8E3D8] mb-4">Organization</h2>
        <div className="flex gap-3">
          <Input
            id="orgName"
            label="Name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
          <div className="flex items-end">
            <Button onClick={handleSaveOrgName} loading={saving} size="sm">
              Save
            </Button>
          </div>
        </div>
      </section>

      {/* Divisions */}
      <section className="rounded-xl border border-[#1E2128] bg-[#161920] p-5">
        <h2 className="text-sm font-semibold text-[#E8E3D8] mb-4">Divisions</h2>
        {divisions.length > 0 ? (
          <div className="space-y-2 mb-4">
            {divisions.map((div) => (
              <div
                key={div.id}
                className="flex items-center justify-between rounded-lg bg-[#0D0F14] px-3 py-2"
              >
                <span className="text-sm text-[#E8E3D8]">{div.name}</span>
                <button
                  onClick={() => handleDeleteDivision(div.id)}
                  className="text-[#8B8D93] hover:text-red-400 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#8B8D93] mb-4">No divisions yet</p>
        )}
        <div className="flex gap-2">
          <input
            value={newDivisionName}
            onChange={(e) => setNewDivisionName(e.target.value)}
            placeholder="Division name"
            className="flex-1 rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddDivision();
              }
            }}
          />
          <Button variant="secondary" size="sm" onClick={handleAddDivision}>
            <Plus size={14} />
            Add
          </Button>
        </div>
      </section>

      {/* Members */}
      <section className="rounded-xl border border-[#1E2128] bg-[#161920] p-5">
        <h2 className="text-sm font-semibold text-[#E8E3D8] mb-4">Members</h2>
        {members.length > 0 && (
          <div className="space-y-2 mb-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg bg-[#0D0F14] px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#E8E3D8] truncate">
                    {member.fullName}
                  </div>
                  <div className="text-xs text-[#8B8D93] truncate">
                    {member.email}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      roleBadgeColors[member.role] || roleBadgeColors.viewer
                    }`}
                  >
                    {member.role}
                  </span>
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleUpdateMemberRole(member.id, e.target.value)
                    }
                    className="rounded border border-[#2A2D35] bg-[#1E2128] px-1.5 py-0.5 text-xs text-[#E8E3D8] focus:outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-[#8B8D93] hover:text-red-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleInviteMember();
              }
            }}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "agent" | "viewer")}
            className="rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-2 py-2 text-sm text-[#E8E3D8] focus:outline-none"
          >
            <option value="agent">Agent</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button variant="secondary" size="sm" onClick={handleInviteMember}>
            <UserPlus size={14} />
            Invite
          </Button>
        </div>
      </section>
    </div>
  );
}

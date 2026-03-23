"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { X, Globe, Check, Link as LinkIcon, ExternalLink, Copy } from "lucide-react";

interface RoleInfo {
  id: string;
  name: string;
  open_call_visible?: boolean;
}

interface OpenCallSetupModalProps {
  projectId: string;
  projectName: string;
  roles: RoleInfo[];
  isEnabled: boolean;
  token: string | null;
  openCallFormUrl?: string | null;
  openCallShowProjectDocs?: boolean;
  openCallShowRoleDocs?: boolean;
  onClose: () => void;
  onSave: (data: {
    open_call_enabled: boolean;
    open_call_token: string | null;
    open_call_form_url: string | null;
    open_call_show_project_docs: boolean;
    open_call_show_role_docs: boolean;
    roles: { id: string; open_call_visible: boolean }[];
  }) => void;
}

export default function OpenCallSetupModal({
  projectId,
  projectName,
  roles,
  isEnabled,
  token,
  openCallFormUrl,
  openCallShowProjectDocs,
  openCallShowRoleDocs,
  onClose,
  onSave,
}: OpenCallSetupModalProps) {
  const [roleVisibility, setRoleVisibility] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      for (const role of roles) {
        map[role.id] = role.open_call_visible ?? true;
      }
      return map;
    }
  );
  const [showProjectDocs, setShowProjectDocs] = useState(openCallShowProjectDocs ?? true);
  const [showRoleDocs, setShowRoleDocs] = useState(openCallShowRoleDocs ?? true);
  const [formUrl, setFormUrl] = useState(openCallFormUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const allChecked = roles.length > 0 && roles.every((r) => roleVisibility[r.id]);
  const noneChecked = roles.length > 0 && roles.every((r) => !roleVisibility[r.id]);

  function toggleAll() {
    const newVal = !allChecked;
    const map: Record<string, boolean> = {};
    for (const role of roles) {
      map[role.id] = newVal;
    }
    setRoleVisibility(map);
  }

  async function handleSave() {
    const checkedRoles = roles.filter((r) => roleVisibility[r.id]);
    if (checkedRoles.length === 0) {
      setError("Select at least one role for the open call.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Update project settings
      const projectRes = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          open_call_enabled: true,
          open_call_form_url: formUrl.trim() || null,
          open_call_show_project_docs: showProjectDocs,
          open_call_show_role_docs: showRoleDocs,
        }),
      });

      if (!projectRes.ok) {
        const data = await projectRes.json();
        setError(data.error || "Failed to update project.");
        return;
      }

      const projectData = await projectRes.json();

      // Update each role's visibility
      await Promise.all(
        roles.map((role) =>
          fetch(`/api/roles/${role.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ open_call_visible: roleVisibility[role.id] }),
          })
        )
      );

      const newToken = projectData.open_call_token || token;
      setSuccessToken(newToken);

      onSave({
        open_call_enabled: true,
        open_call_token: newToken,
        open_call_form_url: formUrl.trim() || null,
        open_call_show_project_docs: showProjectDocs,
        open_call_show_role_docs: showRoleDocs,
        roles: roles.map((r) => ({
          id: r.id,
          open_call_visible: roleVisibility[r.id],
        })),
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function copyLink() {
    const t = successToken || token;
    if (!t) return;
    const link = `${window.location.origin}/open-call/${t}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const openCallLink = successToken || token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/open-call/${successToken || token}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-[#1E2128] bg-[#13151A] shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E2128] px-6 py-4">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-[#C9A84C]" />
            <h2 className="text-lg font-semibold text-[#E8E3D8]">
              {isEnabled ? "Edit Open Call" : "Set Up Open Call"}
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
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <p className="text-sm text-[#8B8D93]">
            Configure the open call for <span className="text-[#E8E3D8] font-medium">{projectName}</span>. Talent will be able to submit themselves for selected roles.
          </p>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Success state with link */}
          {successToken && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-sm font-medium text-green-400 mb-2">
                Open call is live!
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-xs text-[#8B8D93] truncate">
                  {openCallLink}
                </div>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1 shrink-0 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-2 text-xs text-[#C9A84C] hover:bg-[#C9A84C]/20 transition"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93]">
                Roles
              </label>
              <button
                onClick={toggleAll}
                className="text-[10px] text-[#C9A84C] hover:underline"
              >
                {allChecked ? "Deselect All" : "Select All"}
              </button>
            </div>
            {roles.length === 0 ? (
              <p className="text-sm text-[#8B8D93]">
                No roles in this project. Add roles first.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-3 rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2.5 cursor-pointer hover:border-[#2A2D35] transition"
                  >
                    <input
                      type="checkbox"
                      checked={roleVisibility[role.id] ?? true}
                      onChange={() =>
                        setRoleVisibility((prev) => ({
                          ...prev,
                          [role.id]: !prev[role.id],
                        }))
                      }
                      className="rounded border-[#1E2128] bg-[#161920] text-[#C9A84C] focus:ring-[#C9A84C]"
                    />
                    <span className="text-sm text-[#E8E3D8]">{role.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] block mb-2">
              Documents
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2.5 cursor-pointer hover:border-[#2A2D35] transition">
                <input
                  type="checkbox"
                  checked={showProjectDocs}
                  onChange={(e) => setShowProjectDocs(e.target.checked)}
                  className="rounded border-[#1E2128] bg-[#161920] text-[#C9A84C] focus:ring-[#C9A84C]"
                />
                <span className="text-sm text-[#E8E3D8]">Show project documents on open call</span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2.5 cursor-pointer hover:border-[#2A2D35] transition">
                <input
                  type="checkbox"
                  checked={showRoleDocs}
                  onChange={(e) => setShowRoleDocs(e.target.checked)}
                  className="rounded border-[#1E2128] bg-[#161920] text-[#C9A84C] focus:ring-[#C9A84C]"
                />
                <span className="text-sm text-[#E8E3D8]">Show role documents (sides) on open call</span>
              </label>
            </div>
          </div>

          {/* External form link */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] block mb-2">
              External Form Link <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://forms.google.com/... or JotForm link"
              className="w-full rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#555] focus:border-[#C9A84C] focus:outline-none"
            />
            <p className="text-[10px] text-[#8B8D93] mt-1">
              If provided, talent will be directed to this form instead of the built-in submission form.
            </p>
          </div>

          {/* Preview URL */}
          {!successToken && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] block mb-2">
                Open Call URL Preview
              </label>
              <div className="rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-xs text-[#8B8D93]">
                {openCallLink || (
                  <span className="italic">A unique link will be generated when you create the open call.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#1E2128] px-6 py-4 flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {successToken ? "Done" : "Cancel"}
          </Button>
          {!successToken && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving || roles.length === 0}
              loading={saving}
            >
              {isEnabled ? "Update Open Call" : "Create Open Call"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

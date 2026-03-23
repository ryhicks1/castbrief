"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { X, FileText, Check, Pencil, Loader2 } from "lucide-react";

interface ExtractedRole {
  name: string;
  description: string;
  pageNumbers: number[];
  include: boolean;
}

interface ScriptBreakdownModalProps {
  projectId: string;
  onClose: () => void;
  onComplete: () => void;
}

type Stage = "upload" | "analyzing" | "review" | "confirming" | "done";

export default function ScriptBreakdownModal({
  projectId,
  onClose,
  onComplete,
}: ScriptBreakdownModalProps) {
  const [stage, setStage] = useState<Stage>("upload");
  const [title, setTitle] = useState("");
  const [roles, setRoles] = useState<ExtractedRole[]>([]);
  const [scriptUrl, setScriptUrl] = useState("");
  const [scriptFileName, setScriptFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [createdCount, setCreatedCount] = useState(0);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF document");
      return;
    }

    setError(null);
    setStage("analyzing");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("project_id", projectId);

      const res = await fetch("/api/scripts/breakdown", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();
      setTitle(data.title || "Untitled Script");
      setRoles(
        (data.roles || []).map((r: any) => ({
          ...r,
          include: true,
        }))
      );
      setScriptUrl(data.scriptUrl || "");
      setScriptFileName(data.scriptFileName || file.name);
      setStage("review");
    } catch (err: any) {
      setError(err.message || "Failed to analyze script");
      setStage("upload");
    }
  }

  async function handleConfirm() {
    setStage("confirming");
    setError(null);

    try {
      const res = await fetch("/api/scripts/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          script_url: scriptUrl,
          script_file_name: scriptFileName,
          roles,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create roles");
      }

      const data = await res.json();
      setCreatedCount(data.rolesCreated);
      setStage("done");
    } catch (err: any) {
      setError(err.message);
      setStage("review");
    }
  }

  function toggleRole(idx: number) {
    setRoles((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, include: !r.include } : r))
    );
  }

  function updateRole(idx: number, field: "name" | "description", value: string) {
    setRoles((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  }

  const includedCount = roles.filter((r) => r.include).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-[#1E2128] bg-[#13151A] shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E2128] px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#C9A84C]" />
            <h2 className="text-lg font-semibold text-[#E8E3D8]">
              Script Breakdown
            </h2>
          </div>
          <button
            onClick={stage === "done" ? onComplete : onClose}
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

          {/* Upload Stage */}
          {stage === "upload" && (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-[#8B8D93] mb-4" />
              <h3 className="text-lg font-medium text-[#E8E3D8] mb-2">
                Upload your script
              </h3>
              <p className="text-sm text-[#8B8D93] mb-6 max-w-sm mx-auto">
                Upload a PDF script. AI will analyze it and extract all
                speaking roles with descriptions.
              </p>
              <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg bg-[#C9A84C] px-5 py-2.5 text-sm font-medium text-[#0D0F14] hover:bg-[#D4B35C] transition">
                Choose File
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Analyzing Stage */}
          {stage === "analyzing" && (
            <div className="text-center py-16">
              <Loader2
                size={40}
                className="mx-auto text-[#C9A84C] animate-spin mb-4"
              />
              <h3 className="text-lg font-medium text-[#E8E3D8] mb-2">
                Analyzing script...
              </h3>
              <p className="text-sm text-[#8B8D93]">
                AI is reading the script and extracting character roles. This may
                take 15-30 seconds.
              </p>
            </div>
          )}

          {/* Review Stage */}
          {stage === "review" && (
            <div>
              <div className="mb-4">
                <h3 className="text-base font-medium text-[#E8E3D8]">
                  {title}
                </h3>
                <p className="text-xs text-[#8B8D93] mt-1">
                  {roles.length} roles extracted · {includedCount} selected
                </p>
              </div>

              <div className="space-y-2">
                {roles.map((role, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 transition ${
                      role.include
                        ? "border-[#2A2D35] bg-[#161920]"
                        : "border-[#1E2128] bg-[#0D0F14] opacity-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleRole(idx)}
                        className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition ${
                          role.include
                            ? "border-[#C9A84C] bg-[#C9A84C]"
                            : "border-[#3A3D45] bg-transparent"
                        }`}
                      >
                        {role.include && (
                          <Check size={12} className="text-[#0D0F14]" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        {editingIdx === idx ? (
                          <div className="space-y-2">
                            <input
                              value={role.name}
                              onChange={(e) =>
                                updateRole(idx, "name", e.target.value)
                              }
                              className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                            />
                            <textarea
                              value={role.description}
                              onChange={(e) =>
                                updateRole(idx, "description", e.target.value)
                              }
                              rows={2}
                              className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#8B8D93] focus:border-[#C9A84C] focus:outline-none resize-none"
                            />
                            <button
                              onClick={() => setEditingIdx(null)}
                              className="text-xs text-[#C9A84C] hover:underline"
                            >
                              Done editing
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#E8E3D8]">
                                {role.name}
                              </span>
                              <button
                                onClick={() => setEditingIdx(idx)}
                                className="text-[#8B8D93] hover:text-[#C9A84C] transition"
                              >
                                <Pencil size={11} />
                              </button>
                            </div>
                            <p className="text-xs text-[#8B8D93] mt-0.5">
                              {role.description}
                            </p>
                            {role.pageNumbers?.length > 0 && (
                              <p className="text-[10px] text-[#6B7280] mt-1">
                                Pages:{" "}
                                {role.pageNumbers.slice(0, 15).join(", ")}
                                {role.pageNumbers.length > 15 && "..."}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirming Stage */}
          {stage === "confirming" && (
            <div className="text-center py-16">
              <Loader2
                size={40}
                className="mx-auto text-[#C9A84C] animate-spin mb-4"
              />
              <h3 className="text-lg font-medium text-[#E8E3D8] mb-2">
                Creating roles & generating sides...
              </h3>
              <p className="text-sm text-[#8B8D93]">
                Setting up {includedCount} roles and extracting sides from the
                script.
              </p>
            </div>
          )}

          {/* Done Stage */}
          {stage === "done" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium text-[#E8E3D8] mb-2">
                Script breakdown complete!
              </h3>
              <p className="text-sm text-[#8B8D93]">
                {createdCount} roles created with sides attached. You can now
                send casting requests to agents.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {stage === "review" && (
          <div className="border-t border-[#1E2128] px-6 py-4 flex justify-between items-center">
            <span className="text-xs text-[#8B8D93]">
              {includedCount} of {roles.length} roles selected
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirm}
                disabled={includedCount === 0}
              >
                Create {includedCount} Roles
              </Button>
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className="border-t border-[#1E2128] px-6 py-4 flex justify-end">
            <Button variant="primary" size="sm" onClick={onComplete}>
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

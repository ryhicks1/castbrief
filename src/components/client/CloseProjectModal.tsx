"use client";

import { useState } from "react";
import { X, XCircle } from "lucide-react";

interface CloseProjectModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function CloseProjectModal({
  projectId,
  projectName,
  onClose,
  onComplete,
}: CloseProjectModalProps) {
  const [message, setMessage] = useState("");
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClose() {
    setClosing(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (res.ok) {
        onComplete();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to close project");
      }
    } catch (err) {
      setError("Failed to close project");
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-[#1E2128] bg-[#13151A] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8B8D93] hover:text-[#E8E3D8] transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <XCircle size={18} className="text-red-400" />
          <h2 className="text-lg font-bold text-[#E8E3D8]">
            Close Project &amp; Release Talent
          </h2>
        </div>

        <p className="text-sm text-[#8B8D93] mb-4">
          This will notify all agents and talent that{" "}
          <span className="text-[#E8E3D8] font-medium">{projectName}</span> has
          been cast and roles are no longer available.
        </p>

        <label className="block text-xs font-medium text-[#8B8D93] uppercase tracking-wider mb-2">
          Message to agents and talent
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Thank you for your submissions..."
          rows={5}
          className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none mb-4"
        />

        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#1E2128] px-4 py-2 text-sm text-[#8B8D93] hover:text-[#E8E3D8] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleClose}
            disabled={closing}
            className="rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50"
          >
            {closing ? "Closing..." : "Close Project & Send Notifications"}
          </button>
        </div>
      </div>
    </div>
  );
}

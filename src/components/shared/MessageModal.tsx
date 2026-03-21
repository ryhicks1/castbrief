"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface MessageModalProps {
  packageId: string;
  talentId?: string;
  talentName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MessageModal({
  packageId,
  talentId,
  talentName,
  onClose,
  onSuccess,
}: MessageModalProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSend() {
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: packageId,
          talent_id: talentId || undefined,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send message");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch {
      setError("Failed to send message");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#161920] rounded-xl border border-[#1E2128] shadow-2xl p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-lg animate-[modal-enter_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#E8E3D8]">
            {talentName ? `Message ${talentName}` : "Message All Talent"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#8B8D93] hover:text-[#E8E3D8] hover:bg-[#1E2128] transition"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <p className="text-green-400 text-sm font-medium">
              Message sent successfully
            </p>
          </div>
        ) : (
          <>
            {/* Message input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#8B8D93] mb-1">
                Message
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message..."
                rows={5}
                autoFocus
                className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 mb-3">{error}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSend}
                disabled={submitting || !content.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2.5 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50"
              >
                {submitting && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Send Message
              </button>
              <button
                onClick={onClose}
                className="rounded-lg bg-[#1E2128] border border-[#2A2D35] px-4 py-2.5 text-sm text-[#E8E3D8] hover:bg-[#262930] transition"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

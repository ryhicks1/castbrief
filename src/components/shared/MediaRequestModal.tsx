"use client";

import { useState, useRef } from "react";
import { X, Paperclip, Loader2 } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/Avatar";

interface MediaRequestModalProps {
  packageId: string;
  token: string;
  selectedTalents: Array<{
    packageTalentId: string;
    name: string;
    photoUrl: string | null;
  }>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MediaRequestModal({
  packageId,
  token,
  selectedTalents,
  onClose,
  onSuccess,
}: MediaRequestModalProps) {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/attachment", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachmentUrl(data.url);
        setAttachmentName(file.name);
      }
    } catch (err) {
      console.error("File upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/packages/${packageId}/request-media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          message: message || undefined,
          link: link || undefined,
          attachmentUrl: attachmentUrl || undefined,
        }),
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error("Media request failed:", err);
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
            Request Media
            <span className="ml-2 text-sm font-normal text-[#8B8D93]">
              ({selectedTalents.length} talent)
            </span>
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#8B8D93] hover:text-[#E8E3D8] hover:bg-[#1E2128] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Talent preview */}
        <div className="mb-4 max-h-32 overflow-y-auto space-y-1.5">
          {selectedTalents.map((t) => (
            <div
              key={t.packageTalentId}
              className="flex items-center gap-2"
            >
              {t.photoUrl ? (
                <img
                  src={t.photoUrl}
                  alt={t.name}
                  className="h-7 w-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <InitialsAvatar name={t.name} size={28} />
              )}
              <span className="text-sm text-[#E8E3D8] truncate">
                {t.name}
              </span>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-[#8B8D93] mb-1">
            Instructions for talent
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what you need: self-tape scene, wardrobe notes, deadline..."
            rows={4}
            className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none"
          />
        </div>

        {/* Link */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-[#8B8D93] mb-1">
            Link to script, brief, or form (optional)
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
          />
        </div>

        {/* File attachment */}
        <div className="mb-5">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          />
          {attachmentName ? (
            <div className="flex items-center gap-2 rounded-lg bg-[#0D0F14] border border-[#2A2D35] px-3 py-2 text-sm">
              <Paperclip size={14} className="text-[#C9A84C] shrink-0" />
              <span className="text-[#E8E3D8] truncate">
                {attachmentName}
              </span>
              <button
                onClick={() => {
                  setAttachmentUrl(null);
                  setAttachmentName(null);
                }}
                className="ml-auto text-[#8B8D93] hover:text-red-400 transition"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg bg-[#1E2128] border border-[#2A2D35] px-3 py-2 text-sm text-[#8B8D93] hover:text-[#E8E3D8] hover:bg-[#262930] transition disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Paperclip size={14} />
              )}
              {uploading ? "Uploading..." : "Attach file (optional)"}
            </button>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2.5 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50"
          >
            {submitting && (
              <Loader2 size={14} className="animate-spin" />
            )}
            Send Request
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-[#1E2128] border border-[#2A2D35] px-4 py-2.5 text-sm text-[#E8E3D8] hover:bg-[#262930] transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

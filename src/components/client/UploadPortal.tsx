"use client";

import { useState, useRef } from "react";
import {
  Download,
  Upload,
  FileText,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  FileVideo,
  Circle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UploadPortalProps {
  talentName: string;
  talentEmail: string;
  packageName: string;
  agencyName: string;
  uploadToken: string;
  uploadUrl: string | null;
  uploadStatus: string;
  hasDropbox: boolean;
  mediaRequestMessage: string | null;
  mediaRequestLink: string | null;
  formUrl: string | null;
  formStatus: string | null;
  documents: { id: string; name: string; file_type: string }[];
}

export default function UploadPortal({
  talentName,
  talentEmail,
  packageName,
  agencyName,
  uploadToken,
  uploadUrl,
  uploadStatus,
  hasDropbox,
  mediaRequestMessage,
  mediaRequestLink,
  formUrl,
  formStatus,
  documents,
}: UploadPortalProps) {
  const alreadySubmitted = uploadStatus === "uploaded";

  // Step 1: Materials reviewed
  const [materialsReviewed, setMaterialsReviewed] = useState(false);

  // Step 2: Upload
  const [dropboxUploaded, setDropboxUploaded] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Form
  const [formCompleted, setFormCompleted] = useState(formStatus === "completed");

  // Step 4: Finalise
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(alreadySubmitted);

  const hasDocuments = documents.length > 0;
  const hasForm = !!formUrl;
  const useDropbox = hasDropbox && !!uploadUrl;

  // Upload is confirmed if: Dropbox checkbox checked, or file uploaded directly
  const selfTapeConfirmed = useDropbox ? dropboxUploaded : !!uploadedFileUrl;

  // Can finalise if: self-tape confirmed AND (no form OR form completed)
  const canFinalise = selfTapeConfirmed && (!hasForm || formCompleted);

  async function handleDirectUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Upload via API route (uses admin client, bypasses RLS/bucket issues)
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/attachment", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setUploadedFileUrl(data.url);
      setUploadProgress(100);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFinalise() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/upload/${uploadToken}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_completed: hasForm ? formCompleted : undefined,
          file_url: uploadedFileUrl || undefined,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        console.error("Finalise failed");
      }
    } catch (e) {
      console.error("Finalise error:", e);
    }
    setSubmitting(false);
  }

  // -- Determine step numbers dynamically --
  let stepNum = 1;
  const documentsStep = hasDocuments ? stepNum++ : null;
  const uploadStep = stepNum++;
  const formStep = hasForm ? stepNum++ : null;
  const finaliseStep = stepNum++;

  if (submitted) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <div className="rounded-xl border border-[#1E2128] bg-[#13151A] p-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-[#E8E3D8] mb-2">
              Your submission has been received!
            </h2>
            <p className="text-sm text-[#8B8D93]">
              Confirmation email sent to you and your agent.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[#1E2128] bg-[#13151A] p-6">
        <p className="text-xs text-[#8B8D93] uppercase tracking-widest mb-3 font-medium">
          Upload Request
        </p>
        <h1 className="text-2xl font-bold text-[#E8E3D8] mb-1">{talentName}</h1>
        <p className="text-sm text-[#A0A3AB] mb-0.5">{packageName}</p>
        <p className="text-xs text-[#6B6E76]">{agencyName}</p>

        {mediaRequestMessage && (
          <div className="mt-5 rounded-lg bg-[#0D0F14] border border-[#1E2128] p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-3.5 w-3.5 text-[#C9A84C]" />
              <p className="text-xs text-[#C9A84C] font-semibold uppercase tracking-wider">
                Message from your agent
              </p>
            </div>
            <p className="text-sm text-[#E8E3D8] whitespace-pre-wrap leading-relaxed">
              {mediaRequestMessage}
            </p>
          </div>
        )}

        {mediaRequestLink && (
          <div className="mt-3">
            <a
              href={mediaRequestLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#C9A84C] hover:text-[#D4B35C] transition-colors"
            >
              Reference: View
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Step 1: Sides & Documents */}
      {hasDocuments && (
        <div className="rounded-xl border border-[#1E2128] bg-[#13151A] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold">
              {documentsStep}
            </div>
            <h2 className="text-base font-semibold text-[#E8E3D8]">
              Sides &amp; Documents
            </h2>
          </div>

          <div className="space-y-2 mb-4">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={`/api/upload/${uploadToken}/documents/${doc.id}?watermark=${encodeURIComponent(talentEmail)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg bg-[#0D0F14] border border-[#1E2128] px-4 py-3 hover:border-[#2A2D35] transition-colors group"
              >
                <Download className="h-4 w-4 text-[#C9A84C] group-hover:text-[#D4B35C] transition-colors flex-shrink-0" />
                <span className="text-sm text-[#E8E3D8] truncate flex-1">
                  {doc.name}
                </span>
                <span className="text-xs text-[#6B6E76] uppercase">
                  {doc.file_type}
                </span>
              </a>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#A0A3AB] hover:text-[#E8E3D8] transition-colors">
            <input
              type="checkbox"
              checked={materialsReviewed}
              onChange={(e) => setMaterialsReviewed(e.target.checked)}
              className="rounded border-[#2A2D35] bg-[#0D0F14] text-[#C9A84C] focus:ring-[#C9A84C]/50 h-4 w-4"
            />
            I have reviewed the materials
          </label>
        </div>
      )}

      {/* Step 2: Upload Self-Tape */}
      <div className="rounded-xl border border-[#1E2128] bg-[#13151A] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold">
            {uploadStep}
          </div>
          <h2 className="text-base font-semibold text-[#E8E3D8]">
            Upload Self-Tape
          </h2>
        </div>

        {useDropbox ? (
          /* Mode A: Dropbox */
          <div>
            <p className="text-sm text-[#8B8D93] mb-4">
              Your files will be uploaded to {agencyName}&apos;s secure storage.
            </p>

            <a
              href={uploadUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-6 py-4 text-sm font-semibold text-[#0F0F12] hover:from-[#D4B35C] hover:to-[#C9A84C] hover:shadow-lg hover:shadow-[#B8964C]/10 transition-all duration-300 mb-4"
            >
              <Upload className="h-4 w-4" />
              Upload to Dropbox
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </a>

            <p className="text-xs text-[#6B6E76] mb-4">
              Supported formats: MOV, MP4, AVI &mdash; max 10GB
            </p>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#A0A3AB] hover:text-[#E8E3D8] transition-colors">
              <input
                type="checkbox"
                checked={dropboxUploaded}
                onChange={(e) => setDropboxUploaded(e.target.checked)}
                className="rounded border-[#2A2D35] bg-[#0D0F14] text-[#C9A84C] focus:ring-[#C9A84C]/50 h-4 w-4"
              />
              I have uploaded my files to Dropbox
            </label>
          </div>
        ) : (
          /* Mode B: Direct upload */
          <div>
            <p className="text-sm text-[#8B8D93] mb-4">
              Upload your self-tape directly. Supported formats: MOV, MP4, AVI.
            </p>

            {uploadedFileUrl ? (
              <div className="flex items-center gap-3 rounded-lg bg-green-500/5 border border-green-500/20 px-4 py-3 mb-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-400">
                  File uploaded successfully
                </span>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,.mov,.mp4,.avi,.m4v,.mkv"
                  onChange={handleDirectUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed border-[#2A2D35] bg-[#0D0F14] px-6 py-8 hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/5 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileVideo className="h-8 w-8 text-[#6B6E76] mb-3" />
                  <span className="text-sm text-[#A0A3AB] font-medium">
                    {uploading ? "Uploading..." : "Click to select your self-tape"}
                  </span>
                  <span className="text-xs text-[#6B6E76] mt-1">
                    MOV, MP4, AVI &mdash; max 10GB
                  </span>
                </button>

                {uploading && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-[#1E2128] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C9A84C] transition-all duration-500"
                        style={{ width: `${uploadProgress || 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#8B8D93] mt-1.5">Uploading...</p>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-red-400 mt-2">{uploadError}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Complete Form (if exists) */}
      {hasForm && (
        <div className="rounded-xl border border-[#1E2128] bg-[#13151A] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold">
              {formStep}
            </div>
            <h2 className="text-base font-semibold text-[#E8E3D8]">
              Complete Form
            </h2>
          </div>

          <a
            href={formUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#1E2128] border border-[#2A2D35] px-6 py-3.5 text-sm font-semibold text-[#E8E3D8] hover:bg-[#262930] transition-all duration-300 mb-4"
          >
            <FileText className="h-4 w-4" />
            Open Form
            <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </a>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#A0A3AB] hover:text-[#E8E3D8] transition-colors">
            <input
              type="checkbox"
              checked={formCompleted}
              onChange={(e) => setFormCompleted(e.target.checked)}
              className="rounded border-[#2A2D35] bg-[#0D0F14] text-[#C9A84C] focus:ring-[#C9A84C]/50 h-4 w-4"
            />
            I have completed the form
          </label>
        </div>
      )}

      {/* Step 4: Finalise Submission */}
      <div className="rounded-xl border border-[#1E2128] bg-[#13151A] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold">
            {finaliseStep}
          </div>
          <h2 className="text-base font-semibold text-[#E8E3D8]">
            Finalise Submission
          </h2>
        </div>

        {/* Checklist */}
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center gap-2.5">
            {selfTapeConfirmed ? (
              <CheckCircle className="h-[18px] w-[18px] text-green-400 flex-shrink-0" />
            ) : (
              <Circle className="h-[18px] w-[18px] text-[#3A3D45] flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                selfTapeConfirmed ? "text-green-400" : "text-[#6B6E76]"
              }`}
            >
              Self-tape uploaded
            </span>
          </div>

          {hasForm && (
            <div className="flex items-center gap-2.5">
              {formCompleted ? (
                <CheckCircle className="h-[18px] w-[18px] text-green-400 flex-shrink-0" />
              ) : (
                <Circle className="h-[18px] w-[18px] text-[#3A3D45] flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  formCompleted ? "text-green-400" : "text-[#6B6E76]"
                }`}
              >
                Form completed
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleFinalise}
          disabled={!canFinalise || submitting}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-6 py-4 text-base font-semibold text-[#0F0F12] hover:from-[#D4B35C] hover:to-[#C9A84C] hover:shadow-lg hover:shadow-[#B8964C]/10 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {submitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="h-[18px] w-[18px]" />
              Finalise Submission
            </>
          )}
        </button>
      </div>
    </div>
  );
}

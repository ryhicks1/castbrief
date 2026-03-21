"use client";

import { useState } from "react";

interface UploadPortalProps {
  token: string;
  talentName: string;
  packageName: string;
  agencyName: string;
  uploadUrl: string | null; // Dropbox File Request URL, or null for manual
  alreadyUploaded: boolean;
}

export default function UploadPortal({
  token,
  talentName,
  packageName,
  agencyName,
  uploadUrl,
  alreadyUploaded,
}: UploadPortalProps) {
  const [confirmed, setConfirmed] = useState(alreadyUploaded);
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    try {
      const res = await fetch(`/api/upload/${token}/confirm`, {
        method: "PATCH",
      });
      if (res.ok) {
        setConfirmed(true);
      }
    } catch (e) {
      console.error("Confirm failed:", e);
    }
    setConfirming(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-lg font-bold text-[#C9A84C]">CastBrief</span>
        </div>

        <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-8">
          <p className="text-xs text-[#8B8D93] uppercase tracking-wider mb-2">
            Upload Request
          </p>
          <h1 className="text-xl font-bold text-[#E8E3D8] mb-1">
            {talentName}
          </h1>
          <p className="text-sm text-[#8B8D93] mb-1">{packageName}</p>
          <p className="text-xs text-[#8B8D93] mb-6">{agencyName}</p>

          {confirmed ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">&#10003;</div>
              <h2 className="text-lg font-semibold text-green-400 mb-2">
                Upload Complete
              </h2>
              <p className="text-sm text-[#8B8D93]">
                Your agent has been notified. You&apos;re all done!
              </p>
            </div>
          ) : (
            <>
              {uploadUrl ? (
                <>
                  <a
                    href={uploadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-6 py-3 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition mb-4"
                  >
                    Upload to Dropbox
                  </a>
                  <p className="text-xs text-[#8B8D93] mb-4">
                    Click the button above to upload your self-tape directly.
                    Supported formats: MOV, MP4, AVI — max 10GB.
                  </p>
                </>
              ) : (
                <p className="text-sm text-[#8B8D93] mb-4">
                  Your agent will provide upload instructions separately.
                  Once you&apos;ve finished uploading your materials, click below to
                  confirm.
                </p>
              )}

              <p className="text-xs text-[#8B8D93] mb-4">
                Once you&apos;ve uploaded, click below to let your agent know
                you&apos;re done.
              </p>

              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full rounded-lg bg-[#1E2128] border border-[#2A2D35] px-4 py-3 text-sm font-medium text-[#E8E3D8] hover:bg-[#262930] transition disabled:opacity-50"
              >
                {confirming ? "Confirming..." : "I've Finished Uploading"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

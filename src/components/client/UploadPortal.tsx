"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

interface UploadPortalProps {
  token: string;
  talentName: string;
  packageName: string;
  agencyName: string;
  uploadUrl: string | null; // Dropbox File Request URL, or null for manual
  alreadyUploaded: boolean;
  formUrl?: string | null;
  formStatus?: string | null;
}

export default function UploadPortal({
  token,
  talentName,
  packageName,
  agencyName,
  uploadUrl,
  alreadyUploaded,
  formUrl,
  formStatus,
}: UploadPortalProps) {
  const [confirmed, setConfirmed] = useState(alreadyUploaded);
  const [confirming, setConfirming] = useState(false);
  const [formChecked, setFormChecked] = useState(formStatus === "completed");

  async function handleConfirm() {
    setConfirming(true);
    try {
      const res = await fetch(`/api/upload/${token}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_completed: formUrl ? formChecked : undefined,
        }),
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
          <span className="text-lg font-bold text-[#C9A84C]">CastingBrief</span>
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
              {formUrl && (
                <div className="mb-5">
                  <a
                    href={formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-6 py-3 text-sm font-semibold text-[#0F0F12] hover:from-[#D4B35C] hover:to-[#C9A84C] hover:shadow-lg hover:shadow-[#B8964C]/10 transition-all duration-300 mb-3"
                  >
                    Complete Required Form &rarr;
                  </a>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[#E8E3D8]">
                    <input
                      type="checkbox"
                      checked={formChecked}
                      onChange={(e) => setFormChecked(e.target.checked)}
                      className="rounded border-[#1E2128] bg-[#0F0F12] text-[#C9A84C] focus:ring-[#B8964C]"
                    />
                    I have completed the form
                  </label>
                </div>
              )}

              {uploadUrl ? (
                <>
                  <a
                    href={uploadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full rounded-lg bg-[#B8964C] px-6 py-3 text-sm font-semibold text-[#0F0F12] hover:bg-[#C9A64C] hover:shadow-lg hover:shadow-[#B8964C]/10 transition-all duration-300 mb-4"
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

              <Button
                variant="secondary"
                size="lg"
                onClick={handleConfirm}
                loading={confirming}
                disabled={!!formUrl && !formChecked}
                className="w-full"
              >
                {confirming ? "Confirming..." : "I've Finished Uploading"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

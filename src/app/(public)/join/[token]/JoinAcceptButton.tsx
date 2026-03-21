"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinAcceptButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAccept() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/roster/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to accept invite");
        setLoading(false);
        return;
      }

      router.push("/talent/profile");
      router.refresh();
    } catch {
      setError("Failed to accept invite");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2.5 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50"
      >
        {loading ? "Accepting..." : "Accept Invite"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

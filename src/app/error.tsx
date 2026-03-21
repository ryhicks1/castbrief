"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0F14] px-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">&#9888;</div>
        <h1 className="text-xl font-semibold text-[#E8E3D8] mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-[#8B8D93] mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-6 py-2 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

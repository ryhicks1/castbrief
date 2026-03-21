export default function PackageLoading() {
  return (
    <div className="min-h-screen bg-[#0D0F14]">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
        <div className="mb-8">
          <div className="h-3 w-48 animate-pulse rounded bg-[#1E2128] mb-3" />
          <div className="h-8 w-72 animate-pulse rounded bg-[#1E2128] mb-2" />
          <div className="h-4 w-40 animate-pulse rounded bg-[#1E2128] mb-4" />
          <div className="h-3 w-20 animate-pulse rounded bg-[#1E2128]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#1E2128] bg-[#161920] p-4"
            >
              <div className="flex gap-3 mb-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-[#1E2128]" />
                <div className="flex-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-[#1E2128] mb-2" />
                  <div className="h-3 w-48 animate-pulse rounded bg-[#1E2128]" />
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                <div className="h-5 w-12 animate-pulse rounded-full bg-[#1E2128]" />
                <div className="h-5 w-14 animate-pulse rounded-full bg-[#1E2128]" />
              </div>
              <div className="flex gap-2 pt-3 border-t border-[#1E2128]">
                <div className="h-8 flex-1 animate-pulse rounded-lg bg-[#1E2128]" />
                <div className="h-8 w-10 animate-pulse rounded-lg bg-[#1E2128]" />
                <div className="h-8 w-10 animate-pulse rounded-lg bg-[#1E2128]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

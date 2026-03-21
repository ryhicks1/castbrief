export default function RosterLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-32 animate-pulse rounded bg-[#1E2128]" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-[#1E2128]" />
      </div>
      <div className="h-10 w-full animate-pulse rounded-lg bg-[#1E2128] mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#1E2128] bg-[#161920] p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 animate-pulse rounded-full bg-[#1E2128]" />
              <div className="flex-1">
                <div className="h-4 w-28 animate-pulse rounded bg-[#1E2128] mb-2" />
                <div className="h-3 w-20 animate-pulse rounded bg-[#1E2128]" />
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <div className="h-5 w-14 animate-pulse rounded-full bg-[#1E2128]" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-[#1E2128]" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 flex-1 animate-pulse rounded-lg bg-[#1E2128]" />
              <div className="h-8 flex-1 animate-pulse rounded-lg bg-[#1E2128]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

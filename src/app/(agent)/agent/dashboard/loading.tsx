export default function DashboardLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-32 animate-pulse rounded bg-[#1E2128]" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-[#1E2128]" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#1E2128] bg-[#161920] p-4"
          >
            <div className="h-8 w-12 animate-pulse rounded bg-[#1E2128] mb-2" />
            <div className="h-3 w-24 animate-pulse rounded bg-[#1E2128]" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#1E2128] bg-[#161920] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-4 w-40 animate-pulse rounded bg-[#1E2128] mb-2" />
                <div className="h-3 w-56 animate-pulse rounded bg-[#1E2128]" />
              </div>
              <div className="h-5 w-14 animate-pulse rounded-full bg-[#1E2128]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

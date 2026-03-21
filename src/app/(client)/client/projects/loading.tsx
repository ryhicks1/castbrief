export default function ProjectsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-24 animate-pulse rounded bg-[#1E2128]" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-[#1E2128]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#1E2128] bg-[#161920] p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-5 w-36 animate-pulse rounded bg-[#1E2128]" />
              <div className="h-4 w-14 animate-pulse rounded bg-[#1E2128]" />
            </div>
            <div className="h-3 w-28 animate-pulse rounded bg-[#1E2128] mb-3" />
            <div className="flex gap-4">
              <div className="h-3 w-16 animate-pulse rounded bg-[#1E2128]" />
              <div className="h-3 w-16 animate-pulse rounded bg-[#1E2128]" />
              <div className="h-3 w-16 animate-pulse rounded bg-[#1E2128]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PackageNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0F14] px-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">&#128274;</div>
        <h1 className="text-xl font-semibold text-[#E8E3D8] mb-2">
          This package is unavailable
        </h1>
        <p className="text-sm text-[#8B8D93]">
          The link may have expired or been removed. Contact your agent for a
          new link.
        </p>
      </div>
    </div>
  );
}

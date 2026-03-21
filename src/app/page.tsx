import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0D0F14] px-4">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <span className="text-3xl sm:text-4xl font-bold text-[#C9A84C]">
            CastBrief
          </span>
        </div>

        <p className="text-lg sm:text-xl text-[#E8E3D8] font-light mb-2">
          Talent packaging for the modern casting workflow
        </p>
        <p className="text-sm text-[#8B8D93] mb-12">
          Send curated talent packages. Collect self-tapes. Manage your entire casting pipeline.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-8 py-3 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition"
          >
            I&apos;m an Agent &rarr;
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-[#2A2D35] bg-[#161920] px-8 py-3 text-sm font-medium text-[#E8E3D8] hover:bg-[#1E2128] transition"
          >
            I received a package &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}

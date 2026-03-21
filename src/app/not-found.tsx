import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0F14] px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl font-bold text-[#C9A84C] mb-4">404</div>
        <h1 className="text-xl font-semibold text-[#E8E3D8] mb-2">
          Page not found
        </h1>
        <p className="text-sm text-[#8B8D93] mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-6 py-2 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

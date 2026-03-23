import Link from "next/link";

const audienceCards = [
  {
    emoji: "🎭",
    title: "For Agents",
    description:
      "Build and manage your roster. Send curated talent packages to clients with one link. Track client feedback in real time.",
    cta: "Agent Sign Up",
  },
  {
    emoji: "🎬",
    title: "For Casting Directors",
    description:
      "Create projects with roles. Request talent from agents. Review with yes/no/maybe, ratings, and comments. Run open calls for self-submissions.",
    cta: "Client Sign Up",
  },
  {
    emoji: "⭐",
    title: "For Talent",
    description:
      "Get discovered and submit directly. Upload self-tapes, fill out forms, download sides — all from one portal. Build your public profile.",
    cta: "Actor Sign Up",
  },
];

const steps = [
  {
    number: "01",
    title: "Create",
    description:
      "Agents build talent packages. Clients create projects with roles and open calls.",
  },
  {
    number: "02",
    title: "Share",
    description:
      "Send one link — no PDFs, no logins needed for clients. Talent get upload portals via email.",
  },
  {
    number: "03",
    title: "Review",
    description:
      "Clients review talent with yes/no/maybe, star ratings, comments, and side-by-side comparisons.",
  },
  {
    number: "04",
    title: "Submit",
    description:
      "Talent upload self-tapes to Dropbox or direct. Fill out forms. Download watermarked sides.",
  },
  {
    number: "05",
    title: "Decide",
    description:
      "Filter by agency, location, age, skills. Export PDF/CSV reports. Share projects with collaborators.",
  },
  {
    number: "06",
    title: "Cast",
    description:
      "Close roles, notify all agents and talent, and archive the project. Done.",
  },
];

const features = [
  {
    title: "Talent Packages",
    description:
      "Curated selections with one shareable link. Clients review instantly — no account required.",
  },
  {
    title: "AI Script Breakdown",
    description:
      "Upload a PDF script and AI extracts every speaking role with casting descriptions and sides.",
  },
  {
    title: "Open Calls",
    description:
      "Post a link on social media. Talent self-submit with headshots, reels, and forms directly.",
  },
  {
    title: "Self-Tape Collection",
    description:
      "Talent upload via Dropbox or direct. Auto-organized into project folders. Zero storage cost.",
  },
  {
    title: "Reports & Export",
    description:
      "PDF talent reports with photos. CSV data export. Everything you need for stakeholder reviews.",
  },
  {
    title: "Project Collaboration",
    description:
      "Share projects with other producers and casting directors. Real-time synced selections.",
  },
  {
    title: "Dropbox Integration",
    description:
      "Auto folder structure mirrors your projects. Self-tapes go straight to your Dropbox. Zero storage costs.",
  },
  {
    title: "External Forms",
    description:
      "Attach JotForm or Google Forms to requests. Track completion per talent automatically.",
  },
  {
    title: "Watermarked Sides",
    description:
      "Sides auto-watermarked with talent email to prevent leaks. Downloaded securely from the portal.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F0F12] text-[#E8E3D8]">
      {/* ─── Nav ─── */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-[#B8964C]"
        >
          CastingBrief
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[#B8964C] px-4 py-2 text-sm font-semibold text-[#0F0F12] hover:bg-[#C9A64C] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-28 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight">
          <span className="text-[#B8964C]">The modern</span>
          <br />
          <span className="text-[#E8E3D8]">casting platform</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[#8B8D93] leading-relaxed">
          Connecting agents, casting directors, and talent — seamlessly. From
          talent packaging to open calls, self-tape submissions to casting
          decisions — all in one place.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto rounded-lg bg-[#B8964C] px-8 py-3.5 text-sm font-semibold text-[#0F0F12] hover:bg-[#C9A64C] transition-all duration-300 active:scale-[0.98]"
          >
            Get Started Free
          </Link>
          <Link
            href="#how-it-works"
            className="w-full sm:w-auto rounded-lg border border-[#2A2D35] bg-[#13151A] px-8 py-3.5 text-sm font-medium text-[#E8E3D8] hover:bg-[#1E2128] transition-colors"
          >
            See How It Works
          </Link>
        </div>
      </section>

      {/* ─── Audience Cards ─── */}
      <section className="border-t border-[#1E2128]">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="font-[family-name:var(--font-display)] text-center text-2xl sm:text-3xl tracking-tight mb-14">
            Built for everyone in casting
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {audienceCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-[#1E2128] bg-[#13151A] p-6 hover:border-[#2A2D35] transition-colors group"
              >
                <span className="text-3xl">{card.emoji}</span>
                <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8B8D93]">
                  {card.description}
                </p>
                <Link
                  href="/signup"
                  className="mt-5 inline-block rounded-lg bg-[#B8964C] px-5 py-2 text-xs font-semibold text-[#0F0F12] hover:bg-[#C9A64C] transition-colors"
                >
                  {card.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="border-t border-[#1E2128]">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="font-[family-name:var(--font-display)] text-center text-2xl sm:text-3xl tracking-tight">
            How it works
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number}>
                <span className="text-xs font-mono text-[#B8964C]">
                  {step.number}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8B8D93]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="border-t border-[#1E2128] bg-[#0F0F12]">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="font-[family-name:var(--font-display)] text-center text-2xl sm:text-3xl tracking-tight">
            Platform features
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-[#13151A] p-6 border border-transparent hover:border-[#1E2128] transition-colors"
              >
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8B8D93]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-[#1E2128]">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-tight">
            Ready to streamline your casting?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#8B8D93] leading-relaxed">
            Free to start. No credit card required.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3 max-w-2xl mx-auto">
            <Link
              href="/signup"
              className="rounded-xl border border-[#1E2128] bg-[#13151A] p-5 text-center hover:border-[#B8964C]/30 transition group"
            >
              <p className="text-xs text-[#8B8D93] mb-1">I&apos;m an</p>
              <p className="text-lg font-semibold text-[#E8E3D8]">Agent</p>
              <p className="mt-2 text-xs text-[#B8964C] group-hover:underline">
                Sign Up →
              </p>
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-[#1E2128] bg-[#13151A] p-5 text-center hover:border-[#B8964C]/30 transition group"
            >
              <p className="text-xs text-[#8B8D93] mb-1">I&apos;m a</p>
              <p className="text-lg font-semibold text-[#E8E3D8]">
                Casting Director
              </p>
              <p className="mt-2 text-xs text-[#B8964C] group-hover:underline">
                Sign Up →
              </p>
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-[#1E2128] bg-[#13151A] p-5 text-center hover:border-[#B8964C]/30 transition group"
            >
              <p className="text-xs text-[#8B8D93] mb-1">I&apos;m an</p>
              <p className="text-lg font-semibold text-[#E8E3D8]">Actor</p>
              <p className="mt-2 text-xs text-[#B8964C] group-hover:underline">
                Sign Up →
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#1E2128] bg-[#0F0F12]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Link href="/" className="text-sm font-semibold text-[#B8964C]">
            CastingBrief
          </Link>
          <div className="flex gap-6 text-xs text-[#8B8D93]">
            <Link
              href="/privacy"
              className="hover:text-[#E8E3D8] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#E8E3D8] transition-colors"
            >
              Terms
            </Link>
            <a
              href="mailto:support@castingbrief.com"
              className="hover:text-[#E8E3D8] transition-colors"
            >
              Contact
            </a>
          </div>
          <span className="text-xs text-[#8B8D93]">
            &copy; 2026 CastingBrief. All rights reserved.
          </span>
        </div>
      </footer>
    </main>
  );
}

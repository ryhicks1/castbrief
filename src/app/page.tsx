import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Build",
    description:
      "Add talent to your roster with headshots, reels, and key details. Organize by type, skill, or project.",
  },
  {
    number: "02",
    title: "Send",
    description:
      "Create curated packages and share a single link with casting directors. No logins, no downloads, no friction.",
  },
  {
    number: "03",
    title: "Review",
    description:
      "Clients browse your selections, leave comments, flag favorites, and hide talent that aren't right for the role.",
  },
  {
    number: "04",
    title: "Collect",
    description:
      "Request self-tapes from selected talent. They receive a simple upload link. You get notified when files land.",
  },
];

const features = [
  {
    title: "Shareable Package Links",
    description:
      "Send one link instead of bulky PDFs. Clients open it instantly — no account required.",
  },
  {
    title: "Client Selections & Feedback",
    description:
      "Casting directors pick favorites, hide passes, and leave notes — all in one place you can see in real time.",
  },
  {
    title: "Self-Tape Requests",
    description:
      "Trigger upload requests to talent with a click. They submit via Dropbox, you track completion automatically.",
  },
  {
    title: "Talent Roster Management",
    description:
      "Maintain a living roster with headshots, reels, credits, and notes. Pull talent into packages in seconds.",
  },
  {
    title: "Real-Time Notifications",
    description:
      "Know the moment a client opens your package, makes selections, or when talent complete their self-tape uploads.",
  },
  {
    title: "No More Email Chains",
    description:
      "Stop digging through inboxes for feedback. Every comment, pick, and pass lives on the package itself.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0D0F14] text-[#E8E3D8]">
      {/* ─── Nav ─── */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-bold tracking-tight text-[#C9A84C]">
          CastBrief
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D0F14] hover:bg-[#D4B35C] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-32 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          <span className="text-[#C9A84C]">CastBrief</span>
          <br />
          <span className="text-[#E8E3D8]">
            Talent packaging,
            <br className="hidden sm:block" /> built for how you actually work.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[#8B8D93] leading-relaxed">
          Build curated talent packages. Share them with a single link. Let
          clients pick favorites, request self-tapes, and give feedback — all
          without a single PDF or email thread.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-8 py-3.5 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition-all"
          >
            Start Packaging Talent
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto rounded-lg border border-[#2A2D35] bg-[#161920] px-8 py-3.5 text-sm font-medium text-[#E8E3D8] hover:bg-[#1E2128] transition-colors"
          >
            I received a package
          </Link>
        </div>
      </section>

      {/* ─── Problem ─── */}
      <section className="border-t border-[#1E2128] bg-[#0D0F14]">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight">
            The casting workflow is broken
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[#8B8D93] leading-relaxed">
            Talent agents still rely on emailed PDFs, scattered text threads,
            and spreadsheets to manage submissions. Feedback gets lost. Files go
            missing. Nobody knows who picked whom.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "PDFs that go nowhere",
                body: "You spend hours assembling talent decks that get buried in inboxes or forwarded without context.",
              },
              {
                title: "Scattered communication",
                body: "Feedback arrives via email, text, DM, and voicemail. Piecing it together wastes hours every week.",
              },
              {
                title: "Zero visibility",
                body: "You have no idea if a client opened your submission, who they liked, or what happened next.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[#1E2128] bg-[#161920] p-6"
              >
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#C9A84C]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#8B8D93]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="border-t border-[#1E2128]">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[#8B8D93]">
            Four steps. One platform. No PDFs.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number}>
                <span className="text-xs font-mono text-[#C9A84C]">
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
      <section className="border-t border-[#1E2128] bg-[#0D0F14]">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight">
            Everything you need to manage submissions
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-[#1E2128] bg-[#161920] p-6"
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

      {/* ─── CTA: Agents ─── */}
      <section className="border-t border-[#1E2128]">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Ready to modernize your workflow?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#8B8D93] leading-relaxed">
            Set up your roster, build your first package, and send it to a
            client in minutes. Free to start — no credit card required.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-10 py-3.5 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition-all"
          >
            Create Your Agent Account
          </Link>
        </div>
      </section>

      {/* ─── CTA: Clients ─── */}
      <section className="border-t border-[#1E2128] bg-[#161920]">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Are you a casting director or client?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[#8B8D93] leading-relaxed">
            If you received a package link from an agent, you can open it
            directly — no account needed. If you want to sign in and manage your
            selections, use the link below.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-8 py-3 text-sm font-medium text-[#E8E3D8] hover:bg-[#1E2128] transition-colors"
          >
            Sign In to Your Account
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#1E2128] bg-[#0D0F14]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <span className="text-sm font-semibold text-[#C9A84C]">
            CastBrief
          </span>
          <div className="flex gap-6 text-xs text-[#8B8D93]">
            <Link href="/privacy" className="hover:text-[#E8E3D8] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#E8E3D8] transition-colors">
              Terms
            </Link>
            <a
              href="mailto:support@castbrief.com"
              className="hover:text-[#E8E3D8] transition-colors"
            >
              Contact
            </a>
          </div>
          <span className="text-xs text-[#8B8D93]">
            &copy; 2026 CastBrief. All rights reserved.
          </span>
        </div>
      </footer>
    </main>
  );
}

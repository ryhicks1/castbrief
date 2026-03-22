import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — CastingBrief",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0F0F12] text-[#E8E3D8]">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="text-xs font-semibold text-[#B8964C] hover:text-[#c9a85e] transition-colors"
        >
          CastingBrief
        </Link>

        <h1 className="mt-8 text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[#8B8D93]">
          Last updated: March 22, 2026
        </p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-[#c4c0b8]">
          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly when creating an
              account, including your name, email address, agency or company
              name, and profile details. When you use CastingBrief to manage
              talent packages, we store talent profiles, media files, and
              package-related data you upload. We also automatically collect
              usage data such as IP addresses, browser type, and pages visited.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              2. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-[#8B8D93]">
              <li>Provide, maintain, and improve CastingBrief</li>
              <li>Process and manage talent packages and client sharing</li>
              <li>Send transactional emails and service updates</li>
              <li>Monitor usage patterns and prevent abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              3. Cookies &amp; Tracking
            </h2>
            <p>
              We use essential cookies to maintain your session and
              authentication state. We may use analytics tools to understand how
              the service is used. You can disable non-essential cookies through
              your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              4. Data Retention
            </h2>
            <p>
              We retain your account data for as long as your account is active.
              Talent data and package information are retained until you delete
              them or close your account. Upon account deletion, we remove your
              data within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              5. Third-Party Services
            </h2>
            <p>
              We use third-party services to operate CastingBrief, including
              cloud hosting, authentication, file storage, and analytics
              providers. These services may process your data in accordance with
              their own privacy policies. We do not sell your personal
              information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              6. Data Security
            </h2>
            <p>
              We implement industry-standard security measures to protect your
              data, including encryption in transit and at rest, secure
              authentication, and role-based access controls. However, no method
              of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              7. Your Rights
            </h2>
            <p>
              You may access, update, or delete your personal data at any time
              through your account settings. You may also request a copy of your
              data or ask us to restrict processing by contacting us at the
              address below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              8. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
              at{" "}
              <a
                href="mailto:support@castingbrief.com"
                className="text-[#B8964C] hover:underline"
              >
                support@castingbrief.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16 border-t border-white/5 pt-8">
          <Link
            href="/"
            className="text-sm text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — CastingBrief",
};

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[#8B8D93]">
          Last updated: March 22, 2026
        </p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-[#c4c0b8]">
          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using CastingBrief, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, you may not
              use the service. We reserve the right to update these terms at any
              time, and continued use constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              2. Service Description
            </h2>
            <p>
              CastingBrief is a casting and talent management platform that
              allows agents and agencies to organize talent profiles, create
              shareable packages for clients, and manage the casting workflow.
              Features may change as we continue to develop the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              3. Accounts
            </h2>
            <p>
              You are responsible for maintaining the security of your account
              credentials and for all activity that occurs under your account.
              You must provide accurate and complete information when creating an
              account. You must notify us immediately of any unauthorized use of
              your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              4. Intellectual Property
            </h2>
            <p>
              You retain ownership of all content you upload to CastingBrief,
              including talent profiles, photos, and media. By uploading content,
              you grant CastingBrief a limited license to store, display, and
              transmit that content as necessary to provide the service. The
              CastingBrief platform, branding, and underlying technology remain
              our exclusive property.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              5. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-[#8B8D93]">
              <li>Use the service for any unlawful purpose</li>
              <li>Upload content that infringes on others&apos; rights</li>
              <li>Attempt to gain unauthorized access to the service</li>
              <li>Interfere with or disrupt the service infrastructure</li>
              <li>Share account credentials with unauthorized parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              6. Limitation of Liability
            </h2>
            <p>
              CastingBrief is provided &ldquo;as is&rdquo; without warranties of
              any kind, express or implied. To the fullest extent permitted by
              law, CastingBrief shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of profits
              or revenues, whether incurred directly or indirectly, arising from
              your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              7. Termination
            </h2>
            <p>
              We may suspend or terminate your access to CastingBrief at any
              time, with or without cause, upon reasonable notice. You may
              terminate your account at any time by contacting us. Upon
              termination, your right to use the service ceases immediately, and
              we may delete your data in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              8. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the State of California, United States, without regard
              to its conflict of law provisions. Any disputes arising under
              these terms shall be resolved in the courts located in Los
              Angeles County, California.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-3">
              9. Contact Us
            </h2>
            <p>
              If you have questions about these Terms of Service, please contact
              us at{" "}
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

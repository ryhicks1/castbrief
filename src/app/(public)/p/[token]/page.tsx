import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import PackageView from "@/components/client/PackageView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: pkg } = await supabase
    .from("packages")
    .select("name, profiles:agent_id(full_name, agency_name), package_talents(id)")
    .eq("token", token)
    .single();

  if (!pkg) {
    return { title: "Package Not Found — CastingBrief" };
  }

  const agentProfile = pkg.profiles as any;
  const agencyName =
    agentProfile?.agency_name || agentProfile?.full_name || "CastingBrief";
  const talentCount = pkg.package_talents?.length ?? 0;

  return {
    title: `${pkg.name} — ${agencyName}`,
    description: `Talent package with ${talentCount} ${talentCount === 1 ? "talent" : "talents"} from ${agencyName}. View on CastingBrief.`,
  };
}

export default async function PublicPackagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Look up package by token

  const { data: pkg, error } = await supabase
    .from("packages")
    .select(
      `
      id,
      name,
      token,
      client_name,
      client_email,
      status,
      settings,
      expires_at,
      agent_id,
      profiles:agent_id(full_name, agency_name),
      package_talents(
        id,
        talent_id,
        sort_order,
        client_pick,
        client_comment,
        client_status,
        client_rating,
        is_hidden_by_client,
        media_requested,
        upload_status,
        upload_token,
        talents(
          id,
          full_name,
          age,
          location,
          cultural_background,
          height_cm,
          weight_kg,
          about,
          special_skills,
          photo_url,
          links,
          talent_chips(chip_id, chips(id, label, color))
        )
      )
    `
    )
    .eq("token", token)
    .single();

  // Check if expired
  const isExpired = pkg?.expires_at && new Date(pkg.expires_at) < new Date();


  if (error || !pkg || isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F14]">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">&#128274;</div>
          <h1 className="text-xl font-semibold text-[#E8E3D8] mb-2">
            This package is no longer available
          </h1>
          <p className="text-sm text-[#8B8D93]">
            The link may have expired or been removed. Contact your agent for a
            new link.
          </p>
        </div>
      </div>
    );
  }

  const agentProfile = pkg.profiles as any;
  const agencyName =
    agentProfile?.agency_name || agentProfile?.full_name || "Agency";

  // Fetch org branding for the agent
  const { data: orgMember } = await supabase
    .from("org_members")
    .select("organizations(logo_url, contact_email, contact_phone, website, brand_color)")
    .eq("user_id", pkg.agent_id)
    .single();

  const orgData = orgMember?.organizations as any;
  const branding = orgData
    ? {
        logo_url: orgData.logo_url ?? null,
        contact_email: orgData.contact_email ?? null,
        contact_phone: orgData.contact_phone ?? null,
        website: orgData.website ?? null,
        brand_color: orgData.brand_color ?? null,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-[#0D0F14]">
      <div className="max-w-5xl mx-auto px-4 pt-4 sm:px-6">
        <Link href="/" className="text-xs font-semibold text-[#C9A84C] hover:text-[#D4B35C] transition-colors">
          CastingBrief
        </Link>
      </div>
      <PackageView
        packageId={pkg.id}
        token={pkg.token}
        packageName={pkg.name}
        agencyName={agencyName}
        recipientName={pkg.client_name}
        status={pkg.status}
        settings={pkg.settings || {}}
        branding={branding}
        talents={(pkg.package_talents || [])
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((pt: any) => ({
            packageTalentId: pt.id,
            talentId: pt.talent_id,
            clientPick: pt.client_pick ?? false,
            clientStatus: pt.client_status ?? null,
            clientRating: pt.client_rating ?? null,
            clientComment: pt.client_comment,
            isHiddenByClient: pt.is_hidden_by_client ?? false,
            mediaRequested: pt.media_requested ?? false,
            uploadStatus: pt.upload_status,
            ...pt.talents,
            chips: (pt.talents?.talent_chips || []).map(
              (tc: any) => tc.chips
            ),
          }))}
      />
    </div>
  );
}

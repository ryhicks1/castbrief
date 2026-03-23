import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import UploadPortal from "@/components/client/UploadPortal";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Find package_talent by upload_token with related data
  const { data: pt, error } = await supabase
    .from("package_talents")
    .select(
      `id, upload_token, upload_url, upload_status, form_url, form_status,
       talent_id,
       talents(full_name, email),
       packages(
         id, name, agent_id, form_url,
         media_request_message, media_request_link, media_request_attachment_url,
         profiles:agent_id(id, full_name, agency_name, dropbox_token, dropbox_refresh_token)
       )`
    )
    .eq("upload_token", token)
    .single();

  if (error || !pt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F14]">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">&#128274;</div>
          <h1 className="text-xl font-semibold text-[#E8E3D8] mb-2">
            This upload link is not valid or has expired
          </h1>
          <p className="text-sm text-[#8B8D93]">
            Contact your agent if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const talent = (pt as any).talents;
  const pkg = (pt as any).packages;
  const agentProfile = pkg?.profiles;
  const agencyName =
    agentProfile?.agency_name || agentProfile?.full_name || "Your Agency";
  const hasDropbox = !!(agentProfile?.dropbox_token || agentProfile?.dropbox_refresh_token);

  // Determine form URL: package_talent level overrides package level
  const formUrl = (pt as any).form_url || pkg?.form_url || null;

  // Fetch role documents via role_packages -> roles -> documents
  let documents: { id: string; name: string; file_type: string }[] = [];
  try {
    // Find which roles this package is linked to
    const { data: rolePackages } = await supabase
      .from("role_packages")
      .select("role_id")
      .eq("package_id", pkg.id);

    if (rolePackages && rolePackages.length > 0) {
      const roleIds = rolePackages.map((rp: any) => rp.role_id);
      const { data: docs } = await supabase
        .from("documents")
        .select("id, name, file_type")
        .in("role_id", roleIds);

      if (docs) {
        documents = docs;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch role documents:", e);
  }

  return (
    <div className="min-h-screen bg-[#0D0F14]">
      <div className="max-w-2xl mx-auto px-4 pt-4 sm:px-6">
        <Link href="/" className="text-xs font-semibold text-[#C9A84C] hover:text-[#D4B35C] transition-colors">
          CastingBrief
        </Link>
      </div>
      <UploadPortal
        talentName={talent.full_name}
        talentEmail={talent.email || ""}
        packageName={pkg.name}
        agencyName={agencyName}
        uploadToken={token}
        uploadUrl={pt.upload_url?.startsWith("http") ? pt.upload_url : null}
        uploadStatus={pt.upload_status || "pending"}
        hasDropbox={hasDropbox}
        mediaRequestMessage={pkg.media_request_message || null}
        mediaRequestLink={pkg.media_request_link || null}
        formUrl={formUrl}
        formStatus={(pt as any).form_status || null}
        documents={documents}
      />
    </div>
  );
}

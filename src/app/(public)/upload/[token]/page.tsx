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

  // Find package_talent by upload_token
  const { data: pt, error } = await supabase
    .from("package_talents")
    .select(
      "id, upload_token, upload_url, upload_status, talents(full_name), packages(name, agent_id, profiles:agent_id(full_name, agency_name))"
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
  const uploadUrl = pt.upload_url;
  const isDropboxUrl = uploadUrl?.startsWith("http");

  return (
    <div className="min-h-screen bg-[#0D0F14]">
      <div className="max-w-2xl mx-auto px-4 pt-4 sm:px-6">
        <Link href="/" className="text-xs font-semibold text-[#C9A84C] hover:text-[#D4B35C] transition-colors">
          CastBrief
        </Link>
      </div>
      <UploadPortal
        token={token}
        talentName={talent.full_name}
        packageName={pkg.name}
        agencyName={agencyName}
        uploadUrl={isDropboxUrl ? uploadUrl : null}
        alreadyUploaded={pt.upload_status === "uploaded"}
      />
    </div>
  );
}

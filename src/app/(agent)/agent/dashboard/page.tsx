import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/agent/DashboardClient";
import { getCurrentOrg } from "@/lib/supabase/org";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orgMembership = await getCurrentOrg(supabase, user.id);
  if (!orgMembership) redirect("/onboarding");

  const { data: packages } = await supabase
    .from("packages")
    .select(
      "id, name, token, client_name, status, dropbox_folder_url, last_viewed_at, created_at, package_talents(id, talent_id, client_pick, client_comment, client_status, client_rating, media_requested, upload_status, talents(full_name, photo_url))"
    )
    .eq("org_id", orgMembership.orgId)
    .order("created_at", { ascending: false });

  // Supabase returns joined talents as an array; flatten to single object
  const normalized = (packages ?? []).map((p) => ({
    ...p,
    package_talents: p.package_talents.map(
      (pt: {
        id: string;
        talent_id: string;
        client_pick: boolean;
        client_comment: string | null;
        client_status: string | null;
        client_rating: number | null;
        media_requested: boolean;
        upload_status: string;
        talents: { full_name: string; photo_url: string | null } | { full_name: string; photo_url: string | null }[];
      }) => ({
        ...pt,
        talents: Array.isArray(pt.talents) ? pt.talents[0] : pt.talents,
      })
    ),
  }));

  const allPkgTalents = normalized.flatMap((p) => p.package_talents);

  const stats = {
    activePackages: normalized.filter((p) => p.status !== "draft").length,
    pendingMedia: allPkgTalents.filter(
      (pt) => pt.media_requested && pt.upload_status === "pending"
    ).length,
    uploadsReceived: allPkgTalents.filter(
      (pt) => pt.upload_status === "uploaded"
    ).length,
  };

  return (
    <DashboardClient
      packages={normalized as Parameters<typeof DashboardClient>[0]["packages"]}
      stats={stats}
    />
  );
}

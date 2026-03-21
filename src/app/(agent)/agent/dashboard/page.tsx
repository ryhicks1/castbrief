import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/agent/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: packages } = await supabase
    .from("packages")
    .select(
      "id, name, token, client_name, status, dropbox_folder_url, last_viewed_at, created_at, package_talents(id, talent_id, client_pick, client_comment, media_requested, upload_status, talents(full_name, photo_url))"
    )
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false });

  const allPkgTalents =
    packages?.flatMap((p) => p.package_talents) ?? [];

  const stats = {
    activePackages:
      packages?.filter((p) => p.status !== "draft").length ?? 0,
    pendingMedia: allPkgTalents.filter(
      (pt) => pt.media_requested && pt.upload_status === "pending"
    ).length,
    uploadsReceived: allPkgTalents.filter(
      (pt) => pt.upload_status === "uploaded"
    ).length,
  };

  return <DashboardClient packages={packages ?? []} stats={stats} />;
}

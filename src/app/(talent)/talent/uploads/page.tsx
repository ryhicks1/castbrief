import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TalentUploadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Find the talent record for this user
  const { data: talent } = await supabase
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!talent) {
    return (
      <div className="flex items-center justify-center py-24 px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-xl border border-[#1E2128] bg-[#13151A] p-6 sm:p-8">
            <h1 className="text-xl font-bold text-[#E8E3D8] mb-2">
              No Roster Yet
            </h1>
            <p className="text-sm text-[#8B8D93]">
              You haven&apos;t been added to any roster yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch all package_talents for this talent, with package info
  const { data: packageTalents } = await supabase
    .from("package_talents")
    .select(
      "id, upload_status, upload_token, created_at, packages(id, name, agent_id, profiles:agent_id(full_name, agency_name))"
    )
    .eq("talent_id", talent.id)
    .order("created_at", { ascending: false });

  const items = packageTalents ?? [];

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-xl border border-[#1E2128] bg-[#13151A] p-6 sm:p-8">
            <h1 className="text-xl font-bold text-[#E8E3D8] mb-2">
              No Uploads Yet
            </h1>
            <p className="text-sm text-[#8B8D93]">
              You haven&apos;t been added to any packages yet. Your agent will
              notify you when materials are needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-[#E8E3D8] mb-6">My Uploads</h1>

      <div className="space-y-3">
        {items.map((pt) => {
          const pkg = Array.isArray(pt.packages) ? pt.packages[0] : pt.packages;
          const agentProfile = pkg?.profiles
            ? Array.isArray(pkg.profiles)
              ? pkg.profiles[0]
              : pkg.profiles
            : null;

          const statusLabel =
            pt.upload_status === "uploaded"
              ? "Uploaded"
              : pt.upload_status === "pending"
              ? "Pending"
              : "N/A";

          const statusColor =
            pt.upload_status === "uploaded"
              ? "text-green-400 bg-green-400/10 border-green-400/20"
              : pt.upload_status === "pending"
              ? "text-[#B8964C] bg-[#B8964C]/10 border-[#B8964C]/20"
              : "text-[#8B8D93] bg-[#8B8D93]/10 border-[#8B8D93]/20";

          return (
            <div
              key={pt.id}
              className="rounded-xl border border-[#1E2128] bg-[#13151A] p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-[#E8E3D8] truncate">
                  {pkg?.name || "Unknown Package"}
                </h3>
                <p className="text-xs text-[#8B8D93] mt-0.5">
                  {agentProfile?.agency_name || agentProfile?.full_name || ""}
                  {pt.created_at && (
                    <span className="ml-2">
                      {new Date(pt.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColor}`}
                >
                  {statusLabel}
                </span>
                {pt.upload_token && pt.upload_status !== "uploaded" && (
                  <Link
                    href={`/upload/${pt.upload_token}`}
                    className="rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-3 py-1.5 text-xs font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition"
                  >
                    Upload
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import JoinAcceptButton from "./JoinAcceptButton";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Look up the invite
  const { data: invite } = await supabase
    .from("roster_invites")
    .select("*, profiles!roster_invites_agent_id_fkey(full_name, agency_name)")
    .eq("token", token)
    .single();

  if (!invite || invite.status !== "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F14] px-4">
        <div className="w-full max-w-md text-center">
          <span className="text-2xl font-bold text-[#C9A84C]">CastingBrief</span>
          <div className="mt-8 rounded-xl border border-[#1E2128] bg-[#161920] p-6 sm:p-8">
            <h1 className="text-xl font-bold text-[#E8E3D8] mb-2">
              Invalid Invite
            </h1>
            <p className="text-sm text-[#8B8D93]">
              This invite link is no longer valid. It may have already been used
              or expired.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm text-[#C9A84C] hover:underline"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const agentProfile = invite.profiles;
  const agencyName =
    agentProfile?.agency_name || agentProfile?.full_name || "an agency";

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0F14] px-4">
      <div className="w-full max-w-md text-center">
        <span className="text-2xl font-bold text-[#C9A84C]">CastingBrief</span>
        <div className="mt-8 rounded-xl border border-[#1E2128] bg-[#161920] p-6 sm:p-8">
          <h1 className="text-xl font-bold text-[#E8E3D8] mb-2">
            You&apos;ve been invited
          </h1>
          <p className="text-sm text-[#8B8D93] mb-6">
            You&apos;ve been invited to join{" "}
            <span className="text-[#E8E3D8] font-medium">{agencyName}</span>
            &apos;s roster on CastingBrief.
          </p>

          {invite.talent_name && (
            <p className="text-sm text-[#8B8D93] mb-4">
              Invited as:{" "}
              <span className="text-[#E8E3D8]">{invite.talent_name}</span>
            </p>
          )}

          {user ? (
            <JoinAcceptButton token={token} />
          ) : (
            <Link
              href={`/signup?invite=${token}`}
              className="inline-block w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2.5 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition"
            >
              Sign up to accept this invite
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

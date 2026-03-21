import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAuthUrl } from "@/lib/dropbox/client";

export default async function DropboxConnectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("dropbox_token")
    .eq("id", user.id)
    .single();

  const isConnected = !!profile?.dropbox_token;
  const dropboxConfigured = process.env.DROPBOX_APP_KEY && process.env.DROPBOX_APP_KEY !== "placeholder";
  const authUrl = dropboxConfigured ? getAuthUrl() : null;

  return (
    <div className="max-w-md mx-auto py-16">
      <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-8 text-center">
        {isConnected ? (
          <>
            <div className="text-4xl mb-4">&#x2714;</div>
            <h1 className="text-xl font-bold text-[#E8E3D8] mb-2">
              Dropbox Connected
            </h1>
            <p className="text-sm text-[#8B8D93]">
              Your Dropbox account is linked. Media collection folders will be
              created automatically when you send packages.
            </p>
          </>
        ) : !dropboxConfigured ? (
          <>
            <div className="text-4xl mb-4">&#x1F527;</div>
            <h1 className="text-xl font-bold text-[#E8E3D8] mb-2">
              Dropbox Not Configured
            </h1>
            <p className="text-sm text-[#8B8D93]">
              Dropbox integration is not set up yet. Contact your administrator
              to configure the Dropbox API credentials.
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">&#x1F4E6;</div>
            <h1 className="text-xl font-bold text-[#E8E3D8] mb-2">
              Connect your Dropbox
            </h1>
            <p className="text-sm text-[#8B8D93] mb-6">
              Connect Dropbox to automatically create folders and file request
              links for media collection from talent.
            </p>
            <a
              href={authUrl!}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-6 py-3 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition-colors"
            >
              Connect Dropbox
            </a>
          </>
        )}
      </div>
    </div>
  );
}

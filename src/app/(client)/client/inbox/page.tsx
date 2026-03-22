import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InboxClient from "@/components/client/InboxClient";

export const metadata = { title: "Inbox — CastingBrief" };

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's email
  const email = user.email;

  // Fetch packages sent to this client email
  const { data: packages } = await supabase
    .from("packages")
    .select(`
      id, name, token, status, created_at, client_name,
      agent_id,
      profiles:agent_id(full_name, agency_name),
      package_talents(id, client_pick, client_comment)
    `)
    .eq("client_email", email)
    .order("created_at", { ascending: false });

  // Get client's projects and roles for assignment
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, roles(id, name)")
    .eq("client_id", user.id);

  return (
    <InboxClient
      packages={(packages as any[]) || []}
      projects={(projects as any[]) || []}
    />
  );
}

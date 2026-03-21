import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PackageBuilder from "@/components/agent/PackageBuilder";

export default async function NewPackagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: talents } = await supabase
    .from("talents")
    .select("id, full_name, age, photo_url, talent_chips(chip_id, chips(id, label, color))")
    .eq("agent_id", user.id)
    .order("full_name");

  const { data: chips } = await supabase
    .from("chips")
    .select("*")
    .eq("agent_id", user.id)
    .order("label");

  return (
    <PackageBuilder
      talents={talents ?? []}
      chips={chips ?? []}
      agentId={user.id}
    />
  );
}

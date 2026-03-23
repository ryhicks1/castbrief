import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import OpenCallView from "@/components/public/OpenCallView";

export default async function OpenCallPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Fetch project by open_call_token
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, brand, type, open_call_enabled, open_call_token")
    .eq("open_call_token", token)
    .single();

  if (error || !project || !project.open_call_enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F14]">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">&#128274;</div>
          <h1 className="text-xl font-semibold text-[#E8E3D8] mb-2">
            This open call is no longer available
          </h1>
          <p className="text-sm text-[#8B8D93]">
            The link may have expired or been disabled. Contact the casting
            director for more information.
          </p>
        </div>
      </div>
    );
  }

  // Fetch roles where open_call_visible is true
  const { data: roles } = await supabase
    .from("roles")
    .select("id, name, brief")
    .eq("project_id", project.id)
    .eq("open_call_visible", true)
    .order("name");

  // Fetch role-level documents
  const roleIds = (roles || []).map((r) => r.id);
  let roleDocuments: Record<string, any[]> = {};
  if (roleIds.length > 0) {
    const { data: docs } = await supabase
      .from("documents")
      .select("id, name, url, file_type, role_id")
      .in("role_id", roleIds);

    for (const doc of docs || []) {
      if (!roleDocuments[doc.role_id]) roleDocuments[doc.role_id] = [];
      roleDocuments[doc.role_id].push(doc);
    }
  }

  // Fetch project-level documents
  const { data: projectDocuments } = await supabase
    .from("documents")
    .select("id, name, url, file_type")
    .eq("project_id", project.id)
    .is("role_id", null);

  const rolesWithDocs = (roles || []).map((role) => ({
    ...role,
    documents: roleDocuments[role.id] || [],
  }));

  return (
    <div className="min-h-screen bg-[#0D0F14]">
      <div className="max-w-3xl mx-auto px-4 pt-4 sm:px-6">
        <Link
          href="/"
          className="text-xs font-semibold text-[#C9A84C] hover:text-[#D4B35C] transition-colors"
        >
          CastingBrief
        </Link>
      </div>
      <OpenCallView
        project={{
          id: project.id,
          name: project.name,
          brand: project.brand,
          type: project.type,
        }}
        roles={rolesWithDocs}
        projectDocuments={projectDocuments || []}
        token={token}
      />
    </div>
  );
}

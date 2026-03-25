import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import FormRenderer from "@/components/public/FormRenderer";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Fetch form
  const { data: form, error } = await supabase
    .from("project_forms")
    .select("id, project_id, role_id, name, fields")
    .eq("id", id)
    .single();

  if (error || !form) {
    notFound();
  }

  // Fetch project name
  let projectName: string | undefined;
  if (form.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", form.project_id)
      .single();
    projectName = project?.name || undefined;
  }

  // Fetch role name
  let roleName: string | undefined;
  if (form.role_id) {
    const { data: role } = await supabase
      .from("roles")
      .select("name")
      .eq("id", form.role_id)
      .single();
    roleName = role?.name || undefined;
  }

  return (
    <div className="min-h-screen bg-[#0D0F14]">
      <div className="max-w-2xl mx-auto px-4 pt-4 sm:px-6">
        <Link
          href="/"
          className="text-xs font-semibold text-[#C9A84C] hover:text-[#D4B35C] transition-colors"
        >
          CastingBrief
        </Link>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <FormRenderer
          formId={form.id}
          formName={form.name}
          fields={form.fields as any[]}
          projectName={projectName}
          roleName={roleName}
        />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

interface InboxPackage {
  id: string;
  name: string;
  token: string;
  status: string;
  created_at: string;
  client_name: string | null;
  agent_id: string;
  profiles: { full_name: string; agency_name: string | null };
  package_talents: { id: string; client_pick: boolean; client_comment: string | null }[];
}

interface Project {
  id: string;
  name: string;
  roles: { id: string; name: string }[];
}

interface InboxClientProps {
  packages: InboxPackage[];
  projects: Project[];
}

const statusLabels: Record<string, string> = {
  sent: "New",
  viewed: "Viewed",
  media_requested: "Media Req",
  complete: "Complete",
};

const statusColors: Record<string, string> = {
  sent: "text-[#C9A84C] bg-[#C9A84C]/10",
  viewed: "text-blue-400 bg-blue-400/10",
  media_requested: "text-purple-400 bg-purple-400/10",
  complete: "text-green-400 bg-green-400/10",
};

export default function InboxClient({ packages, projects }: InboxClientProps) {
  const router = useRouter();
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [assigning, setAssigning] = useState(false);

  const currentProject = projects.find((p) => p.id === selectedProject);

  async function handleAssign() {
    if (!selectedProject || !selectedRole || !assignModal) return;
    setAssigning(true);

    const supabase = createClient();
    await supabase.from("role_packages").insert({
      role_id: selectedRole,
      package_id: assignModal,
    });

    setAssigning(false);
    setAssignModal(null);
    setSelectedProject("");
    setSelectedRole("");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-[#E8E3D8] mb-6">Inbox</h1>

      {packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="text-5xl mb-4">&#9993;</div>
          <h2 className="text-xl font-semibold text-[#E8E3D8] mb-2">
            No packages received yet
          </h2>
          <p className="text-sm text-[#8B8D93] max-w-md text-center mb-6">
            When agents send you talent packages, they will appear here for
            review. You can browse talent, leave picks, and assign packages to
            your projects.
          </p>
          {projects.length > 0 ? (
            <Link href={`/client/projects/${projects[0].id}`}>
              <Button variant="secondary">Request a Package</Button>
            </Link>
          ) : (
            <p className="text-xs text-[#8B8D93]">
              Create a project first, then request packages from your agents.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {packages.map((pkg) => {
            const pickCount = pkg.package_talents.filter(
              (pt) => pt.client_pick
            ).length;
            const agencyName =
              pkg.profiles?.agency_name || pkg.profiles?.full_name || "Agency";

            return (
              <div
                key={pkg.id}
                className="rounded-xl border border-[#1E2128] bg-[#161920] p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/p/${pkg.token}`}
                        className="font-medium text-[#E8E3D8] hover:text-[#C9A84C] transition truncate"
                      >
                        {pkg.name}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          statusColors[pkg.status] || "text-[#8B8D93]"
                        }`}
                      >
                        {statusLabels[pkg.status] || pkg.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#8B8D93]">
                      {agencyName} &middot;{" "}
                      {new Date(pkg.created_at).toLocaleDateString()} &middot;{" "}
                      {pkg.package_talents.length} talent &middot; {pickCount}{" "}
                      pick{pickCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <Link
                      href={`/p/${pkg.token}`}
                      className="rounded-lg bg-[#1E2128] border border-[#2A2D35] px-3 py-1.5 text-xs text-[#E8E3D8] hover:bg-[#262930] transition"
                    >
                      View
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssignModal(pkg.id)}
                      className="bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/20"
                    >
                      Assign to Project
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-[#161920] border border-[#1E2128] p-6">
            <h2 className="text-lg font-semibold text-[#E8E3D8] mb-4">
              Assign to Project
            </h2>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs text-[#8B8D93] mb-1">
                  Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    setSelectedRole("");
                  }}
                  className="w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {currentProject && (
                <div>
                  <label className="block text-xs text-[#8B8D93] mb-1">
                    Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                  >
                    <option value="">Select role...</option>
                    {currentProject.roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleAssign}
                disabled={!selectedProject || !selectedRole || assigning}
                loading={assigning}
              >
                {assigning ? "Assigning..." : "Assign"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setAssignModal(null);
                  setSelectedProject("");
                  setSelectedRole("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RequestPackagePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [agents, setAgents] = useState<{ email: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get project + roles
      const { data: project } = await supabase
        .from("projects")
        .select("name, roles(id, name)")
        .eq("id", projectId)
        .single();

      if (project) {
        setProjectName(project.name);
        setRoles((project as any).roles || []);
      }

      // Get agents who have sent packages to this client
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      // Find packages sent to this user's email
      const { data: packages } = await supabase
        .from("packages")
        .select("agent_id, profiles:agent_id(full_name, agency_name)")
        .not("agent_id", "is", null);

      if (packages) {
        const uniqueAgents = new Map<string, { email: string; name: string }>();
        for (const pkg of packages) {
          const p = (pkg as any).profiles;
          if (p && !uniqueAgents.has(pkg.agent_id)) {
            uniqueAgents.set(pkg.agent_id, {
              email: pkg.agent_id,
              name: p.agency_name || p.full_name,
            });
          }
        }
        setAgents(Array.from(uniqueAgents.values()));
      }
    }
    load();
  }, [projectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const agentEmail = selectedAgent || manualEmail;
    if (!agentEmail.trim()) return;

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("package_requests").insert({
      client_id: user.id,
      agent_email: agentEmail,
      project_id: projectId,
      role_id: selectedRole || null,
      brief: brief || null,
    });

    setLoading(false);
    router.push(`/client/projects/${projectId}`);
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-[#E8E3D8] mb-2">
        Request Package
      </h1>
      <p className="text-sm text-[#8B8D93] mb-6">
        for {projectName}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {agents.length > 0 && (
          <div>
            <label className="block text-sm text-[#E8E3D8] mb-1">
              Select Agent
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
            >
              <option value="">Choose an agent...</option>
              {agents.map((a) => (
                <option key={a.email} value={a.email}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm text-[#E8E3D8] mb-1">
            Or add agent by email
          </label>
          <input
            type="email"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            placeholder="agent@agency.com"
            className="w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none"
          />
        </div>

        {roles.length > 0 && (
          <div>
            <label className="block text-sm text-[#E8E3D8] mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
            >
              <option value="">Select a role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm text-[#E8E3D8] mb-1">Brief</label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={4}
            placeholder="Describe what kind of talent you're looking for..."
            className="w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#C9A84C] focus:outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || (!selectedAgent && !manualEmail)}
          className="w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Request"}
        </button>
      </form>
    </div>
  );
}

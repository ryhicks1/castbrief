"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, MultiSelect, Chip } from "@/components/ui";
import { FileText } from "lucide-react";

interface Agent {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
}

interface ProjectDocument {
  id: string;
  name: string;
  file_type: string;
  size_bytes: number;
}

interface AgentListWithMembers {
  id: string;
  name: string;
  agent_list_members: { agent_email: string; agent_name: string | null }[];
}

export default function RequestPackagePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [agentLists, setAgentLists] = useState<AgentListWithMembers[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [projectDocs, setProjectDocs] = useState<ProjectDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const { data: packages } = await supabase
        .from("packages")
        .select("agent_id, profiles:agent_id(full_name, agency_name)")
        .not("agent_id", "is", null);

      if (packages) {
        const uniqueAgents = new Map<string, Agent>();
        for (const pkg of packages) {
          const p = (pkg as any).profiles;
          if (p && !uniqueAgents.has(pkg.agent_id)) {
            uniqueAgents.set(pkg.agent_id, {
              id: pkg.agent_id,
              name: p.agency_name || p.full_name,
            });
          }
        }
        setAgents(Array.from(uniqueAgents.values()));
      }

      // Fetch agent lists with members
      const { data: lists } = await supabase
        .from("agent_lists")
        .select("id, name, agent_list_members(agent_email, agent_name)")
        .eq("client_id", user.id);

      if (lists) {
        setAgentLists(lists as AgentListWithMembers[]);
      }

      // Fetch project-level documents
      const { data: docs } = await supabase
        .from("documents")
        .select("id, name, file_type, size_bytes")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (docs && docs.length > 0) {
        setProjectDocs(docs);
        setSelectedDocIds(docs.map((d: any) => d.id));
      }
    }
    load();
  }, [projectId]);

  function addEmail() {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (manualEmails.includes(email)) return;
    setManualEmails((prev) => [...prev, email]);
    setEmailInput("");
  }

  function removeEmail(email: string) {
    setManualEmails((prev) => prev.filter((e) => e !== email));
  }

  function handleEmailKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  }

  // Collect emails from selected lists
  const listEmails = agentLists
    .filter((l) => selectedListIds.includes(l.id))
    .flatMap((l) => l.agent_list_members.map((m) => m.agent_email));

  const hasRecipients =
    selectedAgentIds.length > 0 ||
    manualEmails.length > 0 ||
    listEmails.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasRecipients) return;

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const rows: {
      client_id: string;
      agent_email: string;
      project_id: string;
      role_id: string | null;
      brief: string | null;
    }[] = [];

    // Collect all agent emails (selected agent IDs + manual emails + list emails), deduplicated
    const allAgentEmails = [
      ...new Set([
        ...selectedAgentIds,
        ...manualEmails,
        ...listEmails,
      ]),
    ];

    for (const agentEmail of allAgentEmails) {
      if (selectedRoleIds.length === 0) {
        // No roles selected: one row per agent with null role_id
        rows.push({
          client_id: user.id,
          agent_email: agentEmail,
          project_id: projectId,
          role_id: null,
          brief: brief || null,
        });
      } else {
        // Cartesian product: one row per agent x role
        for (const roleId of selectedRoleIds) {
          rows.push({
            client_id: user.id,
            agent_email: agentEmail,
            project_id: projectId,
            role_id: roleId,
            brief: brief || null,
          });
        }
      }
    }

    if (rows.length > 0) {
      const { data: insertedRequests } = await supabase
        .from("package_requests")
        .insert(rows)
        .select("id");

      // Insert request_documents junction rows
      if (insertedRequests && selectedDocIds.length > 0) {
        const docRows = insertedRequests.flatMap((req: any) =>
          selectedDocIds.map((docId) => ({
            request_id: req.id,
            document_id: docId,
          }))
        );
        await supabase.from("request_documents").insert(docRows);
      }

      // Send email notifications to each unique agent
      const uniqueEmails = [...new Set(rows.map((r) => r.agent_email))];
      const roleMap = new Map(roles.map((r) => [r.id, r.name]));

      for (const agentEmail of uniqueEmails) {
        const agentRows = rows.filter((r) => r.agent_email === agentEmail);
        const roleNames = agentRows
          .map((r) => (r.role_id ? roleMap.get(r.role_id) : null))
          .filter(Boolean);

        try {
          await fetch("/api/email/send-package-request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agentEmail,
              projectName,
              roleName: roleNames.length > 0 ? roleNames.join(", ") : null,
              brief: brief || null,
            }),
          });
        } catch (e) {
          console.error("Failed to send request email to:", agentEmail, e);
        }
      }
    }

    setLoading(false);
    router.push(`/client/projects/${projectId}`);
  }

  const agentOptions = agents.map((a) => ({ value: a.id, label: a.name }));
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-[#E8E3D8] mb-2">
        Request Package
      </h1>
      <p className="text-sm text-[#8B8D93] mb-6">for {projectName}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Agent lists checkboxes */}
        {agentLists.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#E8E3D8]">
              Agent Lists
            </label>
            <div className="space-y-1.5">
              {agentLists.map((list) => (
                <label
                  key={list.id}
                  className="flex items-center gap-2 cursor-pointer text-sm text-[#E8E3D8] hover:text-[#C9A84C] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedListIds.includes(list.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedListIds((prev) => [...prev, list.id]);
                      } else {
                        setSelectedListIds((prev) =>
                          prev.filter((id) => id !== list.id)
                        );
                      }
                    }}
                    className="rounded border-[#1E2128] bg-[#0F0F12] text-[#C9A84C] focus:ring-[#B8964C]"
                  />
                  <span>{list.name}</span>
                  <span className="text-xs text-[#8B8D93]">
                    ({list.agent_list_members.length} agent
                    {list.agent_list_members.length !== 1 ? "s" : ""})
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Agent multi-select */}
        {agents.length > 0 && (
          <MultiSelect
            label="Select Agents"
            options={agentOptions}
            selected={selectedAgentIds}
            onChange={setSelectedAgentIds}
            placeholder="Choose agents..."
          />
        )}

        {/* Manual email input */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#E8E3D8]">
            Add agents by email
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                placeholder="agent@agency.com"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={addEmail}
            >
              Add
            </Button>
          </div>
          {manualEmails.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {manualEmails.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  active
                  onRemove={() => removeEmail(email)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Role multi-select */}
        {roles.length > 0 && (
          <MultiSelect
            label="Roles"
            options={roleOptions}
            selected={selectedRoleIds}
            onChange={setSelectedRoleIds}
            placeholder="Select roles..."
          />
        )}

        {/* Brief */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#E8E3D8]">
            Brief
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={4}
            placeholder="Describe what kind of talent you're looking for..."
            className="w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none focus:ring-1 focus:ring-[#B8964C] transition-all duration-300 resize-none"
          />
        </div>

        {/* Documents to include */}
        {projectDocs.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#E8E3D8]">
              Documents to Include
            </label>
            <div className="space-y-1.5 rounded-lg border border-[#1E2128] bg-[#0F0F12] p-3">
              {projectDocs.map((doc) => (
                <label
                  key={doc.id}
                  className="flex items-center gap-2 cursor-pointer text-sm text-[#E8E3D8] hover:text-[#C9A84C] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedDocIds.includes(doc.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocIds((prev) => [...prev, doc.id]);
                      } else {
                        setSelectedDocIds((prev) =>
                          prev.filter((id) => id !== doc.id)
                        );
                      }
                    }}
                    className="rounded border-[#1E2128] bg-[#0F0F12] text-[#C9A84C] focus:ring-[#B8964C]"
                  />
                  <FileText size={14} className={doc.file_type === "pdf" ? "text-red-400" : "text-blue-400"} />
                  <span className="truncate">{doc.name}</span>
                  <span className="text-xs text-[#8B8D93] shrink-0">
                    {doc.file_type.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          disabled={!hasRecipients}
          className="w-full"
        >
          {loading ? "Sending..." : "Send Requests"}
        </Button>
      </form>
    </div>
  );
}

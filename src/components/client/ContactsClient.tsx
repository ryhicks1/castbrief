"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Users,
  ClipboardPaste,
  Building2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface AgentList {
  id: string;
  name: string;
  created_at: string;
  agent_list_members: { count: number }[];
}

interface Member {
  id: string;
  agent_email: string;
  agent_name: string | null;
  created_at: string;
}

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  location: string | null;
  agentEmail: string | null;
  agentName: string | null;
  agentCount: number;
}

export default function ContactsClient() {
  const [lists, setLists] = useState<AgentList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Create list state
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);

  // Rename list state
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Delete confirmation
  const [deletingListId, setDeletingListId] = useState<string | null>(null);

  // Add member state
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  // Bulk paste state
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkAdding, setBulkAdding] = useState(false);

  // Agency browser state
  const [showAgencyBrowser, setShowAgencyBrowser] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [groupedAgencies, setGroupedAgencies] = useState<Record<string, Agency[]>>({});
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<Set<string>>(new Set());
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [addingAgencies, setAddingAgencies] = useState(false);
  const [agencySearch, setAgencySearch] = useState("");

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    if (selectedListId) {
      fetchMembers(selectedListId);
    } else {
      setMembers([]);
    }
  }, [selectedListId]);

  async function fetchLists() {
    setLoadingLists(true);
    const res = await fetch("/api/agent-lists");
    if (res.ok) {
      const { lists: data } = await res.json();
      setLists(data || []);
    }
    setLoadingLists(false);
  }

  async function fetchMembers(listId: string) {
    setLoadingMembers(true);
    const res = await fetch(`/api/agent-lists/${listId}/members`);
    if (res.ok) {
      const { members: data } = await res.json();
      setMembers(data || []);
    }
    setLoadingMembers(false);
  }

  async function fetchAgencies() {
    setLoadingAgencies(true);
    const res = await fetch("/api/agencies");
    if (res.ok) {
      const data = await res.json();
      setAgencies(data.agencies || []);
      setGroupedAgencies(data.grouped || {});
      // Auto-expand all regions
      setExpandedRegions(new Set(Object.keys(data.grouped || {})));
    }
    setLoadingAgencies(false);
  }

  async function handleCreateList() {
    if (!newListName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/agent-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newListName.trim() }),
    });
    if (res.ok) {
      setNewListName("");
      setShowCreateInput(false);
      await fetchLists();
    }
    setCreating(false);
  }

  async function handleRenameList(listId: string) {
    if (!renameValue.trim()) return;
    const res = await fetch(`/api/agent-lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    if (res.ok) {
      setRenamingListId(null);
      setRenameValue("");
      await fetchLists();
    }
  }

  async function handleDeleteList(listId: string) {
    const res = await fetch(`/api/agent-lists/${listId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeletingListId(null);
      if (selectedListId === listId) {
        setSelectedListId(null);
        setMembers([]);
      }
      await fetchLists();
    }
  }

  async function handleAddMember() {
    if (!addEmail.trim() || !selectedListId) return;
    setAddingMember(true);
    const res = await fetch(`/api/agent-lists/${selectedListId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_email: addEmail.trim(),
        agent_name: addName.trim() || null,
      }),
    });
    if (res.ok) {
      setAddEmail("");
      setAddName("");
      await fetchMembers(selectedListId);
      await fetchLists(); // refresh count
    }
    setAddingMember(false);
  }

  async function handleRemoveMember(memberId: string) {
    if (!selectedListId) return;
    const res = await fetch(
      `/api/agent-lists/${selectedListId}/members?memberId=${memberId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      await fetchMembers(selectedListId);
      await fetchLists(); // refresh count
    }
  }

  async function handleBulkAdd() {
    if (!bulkText.trim() || !selectedListId) return;
    setBulkAdding(true);

    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      // Parse "Name <email>" or just "email"
      const angleMatch = line.match(/^(.+?)\s*<([^>]+)>$/);
      let email: string;
      let name: string | null = null;

      if (angleMatch) {
        name = angleMatch[1].trim();
        email = angleMatch[2].trim().toLowerCase();
      } else {
        email = line.trim().toLowerCase();
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;

      await fetch(`/api/agent-lists/${selectedListId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_email: email, agent_name: name }),
      });
    }

    setBulkText("");
    setBulkMode(false);
    await fetchMembers(selectedListId);
    await fetchLists();
    setBulkAdding(false);
  }

  function toggleAgency(agencyId: string) {
    setSelectedAgencyIds((prev) => {
      const next = new Set(prev);
      if (next.has(agencyId)) {
        next.delete(agencyId);
      } else {
        next.add(agencyId);
      }
      return next;
    });
  }

  function toggleRegion(region: string) {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
  }

  function selectAllInRegion(region: string) {
    const regionAgencies = groupedAgencies[region] || [];
    const allSelected = regionAgencies.every((a) => selectedAgencyIds.has(a.id));

    setSelectedAgencyIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        // Deselect all in region
        regionAgencies.forEach((a) => next.delete(a.id));
      } else {
        // Select all in region
        regionAgencies.forEach((a) => next.add(a.id));
      }
      return next;
    });
  }

  async function handleAddSelectedAgencies() {
    if (!selectedListId || selectedAgencyIds.size === 0) return;
    setAddingAgencies(true);

    const selected = agencies.filter((a) => selectedAgencyIds.has(a.id));
    for (const agency of selected) {
      if (!agency.agentEmail) continue;
      await fetch(`/api/agent-lists/${selectedListId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_email: agency.agentEmail,
          agent_name: agency.name,
        }),
      });
    }

    setSelectedAgencyIds(new Set());
    setShowAgencyBrowser(false);
    await fetchMembers(selectedListId);
    await fetchLists();
    setAddingAgencies(false);
  }

  function openAgencyBrowser() {
    setShowAgencyBrowser(true);
    setSelectedAgencyIds(new Set());
    setAgencySearch("");
    if (agencies.length === 0) {
      fetchAgencies();
    }
  }

  function getFilteredGrouped(): Record<string, Agency[]> {
    if (!agencySearch.trim()) return groupedAgencies;
    const q = agencySearch.toLowerCase();
    const filtered: Record<string, Agency[]> = {};
    for (const [region, regionAgencies] of Object.entries(groupedAgencies)) {
      const matches = regionAgencies.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.location && a.location.toLowerCase().includes(q)) ||
          (a.agentName && a.agentName.toLowerCase().includes(q))
      );
      if (matches.length > 0) {
        filtered[region] = matches;
      }
    }
    return filtered;
  }

  function getMemberCount(list: AgentList): number {
    return list.agent_list_members?.[0]?.count ?? 0;
  }

  const selectedList = lists.find((l) => l.id === selectedListId);

  return (
    <div className="flex h-full gap-6">
      {/* Left sidebar - Lists */}
      <div className="w-72 shrink-0 rounded-xl border border-[#1E2128] bg-[#161920] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#E8E3D8]">Agent Lists</h2>
          <button
            onClick={() => setShowCreateInput(true)}
            className="text-[#C9A84C] hover:text-[#E8E3D8] transition-colors"
            title="Create list"
          >
            <Plus size={18} />
          </button>
        </div>

        {showCreateInput && (
          <div className="mb-3 flex gap-2">
            <div className="flex-1">
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateList();
                  if (e.key === "Escape") {
                    setShowCreateInput(false);
                    setNewListName("");
                  }
                }}
                autoFocus
              />
            </div>
            <button
              onClick={handleCreateList}
              disabled={creating}
              className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => {
                setShowCreateInput(false);
                setNewListName("");
              }}
              className="text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1">
          {loadingLists ? (
            <p className="text-xs text-[#8B8D93] px-2">Loading...</p>
          ) : lists.length === 0 ? (
            <p className="text-xs text-[#8B8D93] px-2">
              No lists yet. Create one to get started.
            </p>
          ) : (
            lists.map((list) => (
              <div key={list.id} className="group relative">
                {renamingListId === list.id ? (
                  <div className="flex gap-1 p-1">
                    <div className="flex-1">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameList(list.id);
                          if (e.key === "Escape") {
                            setRenamingListId(null);
                            setRenameValue("");
                          }
                        }}
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => handleRenameList(list.id)}
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setRenamingListId(null);
                        setRenameValue("");
                      }}
                      className="text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : deletingListId === list.id ? (
                  <div className="p-2 rounded-lg bg-red-900/20 border border-red-800/30">
                    <p className="text-xs text-red-300 mb-2">
                      Delete &quot;{list.name}&quot;?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteList(list.id)}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingListId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedListId(list.id)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      selectedListId === list.id
                        ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                        : "text-[#E8E3D8] hover:bg-[#1E2128]"
                    }`}
                  >
                    <span className="truncate">{list.name}</span>
                    <span className="text-xs text-[#8B8D93] ml-2 shrink-0">
                      {getMemberCount(list)}
                    </span>
                  </button>
                )}

                {/* Action icons on hover */}
                {renamingListId !== list.id && deletingListId !== list.id && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingListId(list.id);
                        setRenameValue(list.name);
                      }}
                      className="p-1 text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
                      title="Rename"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingListId(list.id);
                      }}
                      className="p-1 text-[#8B8D93] hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right side - Members */}
      <div className="flex-1 rounded-xl border border-[#1E2128] bg-[#161920] p-6 flex flex-col">
        {!selectedList ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users size={48} className="mx-auto text-[#2A2D35] mb-3" />
              <p className="text-[#8B8D93] text-sm">
                Select a list to view its members
              </p>
            </div>
          </div>
        ) : showAgencyBrowser ? (
          /* Agency Browser Panel */
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#E8E3D8] flex items-center gap-2">
                <Building2 size={20} />
                Browse Agencies
              </h2>
              <button
                onClick={() => {
                  setShowAgencyBrowser(false);
                  setSelectedAgencyIds(new Set());
                }}
                className="text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <Input
                value={agencySearch}
                onChange={(e) => setAgencySearch(e.target.value)}
                placeholder="Search agencies by name or location..."
              />
            </div>

            {/* Selection summary */}
            {selectedAgencyIds.size > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 px-4 py-2.5">
                <span className="text-sm text-[#C9A84C]">
                  {selectedAgencyIds.size} agenc{selectedAgencyIds.size === 1 ? "y" : "ies"} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAgencyIds(new Set())}
                    className="text-xs text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
                  >
                    Clear
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddSelectedAgencies}
                    loading={addingAgencies}
                  >
                    Add to List
                  </Button>
                </div>
              </div>
            )}

            {/* Agency list grouped by region */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {loadingAgencies ? (
                <p className="text-sm text-[#8B8D93]">Loading agencies...</p>
              ) : Object.keys(getFilteredGrouped()).length === 0 ? (
                <p className="text-sm text-[#8B8D93]">
                  {agencySearch ? "No agencies match your search." : "No agencies found."}
                </p>
              ) : (
                Object.entries(getFilteredGrouped())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([region, regionAgencies]) => {
                    const allSelected = regionAgencies.every((a) =>
                      selectedAgencyIds.has(a.id)
                    );
                    const isExpanded = expandedRegions.has(region);

                    return (
                      <div
                        key={region}
                        className="rounded-lg border border-[#1E2128] bg-[#13151A] overflow-hidden"
                      >
                        {/* Region header */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1E2128]/50">
                          <button
                            onClick={() => toggleRegion(region)}
                            className="flex items-center gap-2 text-sm font-medium text-[#E8E3D8] hover:text-[#C9A84C] transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                            {region}
                            <span className="text-xs text-[#8B8D93] font-normal">
                              ({regionAgencies.length})
                            </span>
                          </button>
                          <button
                            onClick={() => selectAllInRegion(region)}
                            className={`text-xs px-2 py-0.5 rounded transition-colors ${
                              allSelected
                                ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                                : "text-[#8B8D93] hover:text-[#E8E3D8]"
                            }`}
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </button>
                        </div>

                        {/* Agency rows */}
                        {isExpanded && (
                          <div className="divide-y divide-[#1E2128]/50">
                            {regionAgencies.map((agency) => (
                              <label
                                key={agency.id}
                                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#1E2128]/30 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedAgencyIds.has(agency.id)}
                                  onChange={() => toggleAgency(agency.id)}
                                  className="rounded border-[#2A2D35] bg-[#0D0F14] text-[#C9A84C] focus:ring-[#C9A84C] focus:ring-offset-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-[#E8E3D8] truncate">
                                    {agency.name}
                                  </div>
                                  <div className="text-xs text-[#8B8D93] truncate">
                                    {agency.agentEmail || "No email"}
                                    {agency.location && ` \u00B7 ${agency.location}`}
                                  </div>
                                </div>
                                <span className="text-xs text-[#8B8D93] shrink-0">
                                  {agency.agentCount} agent{agency.agentCount !== 1 ? "s" : ""}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#E8E3D8]">
                {selectedList.name}
              </h2>
              <span className="text-sm text-[#8B8D93]">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Members table */}
            <div className="flex-1 overflow-y-auto mb-6">
              {loadingMembers ? (
                <p className="text-sm text-[#8B8D93]">Loading members...</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-[#8B8D93]">
                  No members yet. Add agents below or browse agencies.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1E2128]">
                      <th className="text-left text-xs font-medium text-[#8B8D93] pb-2 pr-4">
                        Name
                      </th>
                      <th className="text-left text-xs font-medium text-[#8B8D93] pb-2 pr-4">
                        Email
                      </th>
                      <th className="w-10 pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-[#1E2128]/50 group"
                      >
                        <td className="py-2.5 pr-4 text-sm text-[#E8E3D8]">
                          {member.agent_name || "--"}
                        </td>
                        <td className="py-2.5 pr-4 text-sm text-[#8B8D93]">
                          {member.agent_email}
                        </td>
                        <td className="py-2.5">
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="opacity-0 group-hover:opacity-100 text-[#8B8D93] hover:text-red-400 transition-all"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Add member form */}
            <div className="border-t border-[#1E2128] pt-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-[#E8E3D8]">
                  Add Agent
                </h3>
                <button
                  onClick={() => setBulkMode(!bulkMode)}
                  className={`text-xs px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    bulkMode
                      ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                      : "text-[#8B8D93] hover:text-[#E8E3D8]"
                  }`}
                  title="Bulk paste mode"
                >
                  <ClipboardPaste size={12} />
                  Bulk
                </button>
                <button
                  onClick={openAgencyBrowser}
                  className="text-xs px-2 py-0.5 rounded transition-colors flex items-center gap-1 text-[#8B8D93] hover:text-[#E8E3D8]"
                  title="Browse agencies"
                >
                  <Building2 size={12} />
                  Browse Agencies
                </button>
              </div>

              {bulkMode ? (
                <div className="space-y-2">
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={4}
                    placeholder={
                      'Paste one per line:\nJohn Smith <john@agency.com>\njane@agency.com\nBob Jones <bob@talent.com>'
                    }
                    className="w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#6B7280] focus:border-[#B8964C] focus:outline-none focus:ring-1 focus:ring-[#B8964C] transition-all duration-300 resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleBulkAdd}
                      loading={bulkAdding}
                      disabled={!bulkText.trim()}
                    >
                      Add All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBulkMode(false);
                        setBulkText("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="agent@agency.com"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddMember();
                        }
                      }}
                    />
                  </div>
                  <div className="w-40">
                    <Input
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder="Name (optional)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddMember();
                        }
                      }}
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleAddMember}
                    loading={addingMember}
                    disabled={!addEmail.trim()}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

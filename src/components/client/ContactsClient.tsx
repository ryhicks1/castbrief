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
                  No members yet. Add agents below.
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

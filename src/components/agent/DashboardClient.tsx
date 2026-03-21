"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Avatar, Badge } from "@/components/ui";
import { ChevronRight, PackagePlus } from "lucide-react";

interface PackageTalent {
  id: string;
  talent_id: string;
  client_pick: boolean;
  client_comment: string | null;
  media_requested: boolean;
  upload_status: string;
  talents: { full_name: string; photo_url: string | null };
}

interface Package {
  id: string;
  name: string;
  token: string;
  client_name: string | null;
  status: string;
  dropbox_folder_url: string | null;
  last_viewed_at: string | null;
  created_at: string;
  package_talents: PackageTalent[];
}

interface Stats {
  activePackages: number;
  pendingMedia: number;
  uploadsReceived: number;
}

interface DashboardClientProps {
  packages: Package[];
  stats: Stats;
}

const statusColors: Record<string, "muted" | "gold" | "green" | "red"> = {
  draft: "muted",
  sent: "gold",
  viewed: "gold",
  media_requested: "gold",
  complete: "green",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  media_requested: "Media Req",
  complete: "Complete",
};

export default function DashboardClient({
  packages,
  stats,
}: DashboardClientProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-5xl mb-4">
          <PackagePlus size={48} className="text-[#8B8D93]" />
        </div>
        <h2 className="text-xl font-semibold text-[#E8E3D8] mb-2">
          No packages yet
        </h2>
        <p className="text-[#8B8D93] mb-6 text-sm">
          Create your first package to share talent with clients
        </p>
        <Link href="/agent/packages/new">
          <Button>Create Package</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#E8E3D8]">Dashboard</h1>
        <Link href="/agent/packages/new">
          <Button size="sm">New Package</Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Active Packages" value={stats.activePackages} />
        <StatCard label="Pending Media" value={stats.pendingMedia} />
        <StatCard label="Uploads Received" value={stats.uploadsReceived} />
      </div>

      {/* Packages list */}
      <div className="space-y-2">
        {packages.map((pkg) => {
          const isExpanded = expanded.has(pkg.id);
          const talentCount = pkg.package_talents.length;
          const pickCount = pkg.package_talents.filter(
            (pt) => pt.client_pick
          ).length;
          const commentCount = pkg.package_talents.filter(
            (pt) => pt.client_comment
          ).length;

          return (
            <div
              key={pkg.id}
              className="rounded-xl border border-[#1E2128] bg-[#161920] overflow-hidden"
            >
              {/* Collapsed row */}
              <button
                onClick={() => toggleExpand(pkg.id)}
                className="flex items-center w-full px-4 py-3 text-left hover:bg-[#1E2128] transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/agent/packages/${pkg.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-[#E8E3D8] truncate hover:text-[#C9A84C] transition-colors"
                    >
                      {pkg.name}
                    </Link>
                    <Badge
                      label={statusLabels[pkg.status] || pkg.status}
                      color={statusColors[pkg.status] || "muted"}
                    />
                  </div>
                  <div className="text-xs text-[#8B8D93] mt-0.5">
                    {pkg.client_name && `${pkg.client_name} · `}
                    {talentCount} talent ·{" "}
                    {new Date(pkg.created_at).toLocaleDateString()}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className={`text-[#8B8D93] transition-transform duration-200 ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-[#1E2128] px-4 py-4">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left -- Talent status */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-3">
                        Talent Status
                      </div>
                      <div className="space-y-2">
                        {pkg.package_talents.map((pt) => (
                          <div
                            key={pt.id}
                            className="flex items-center gap-2"
                          >
                            <Avatar
                              src={pt.talents.photo_url}
                              name={pt.talents.full_name}
                              size="sm"
                            />
                            <span className="flex-1 text-sm text-[#E8E3D8] truncate">
                              {pt.talents.full_name}
                            </span>
                            <Badge
                              label={
                                pt.upload_status === "uploaded"
                                  ? "Uploaded"
                                  : pt.upload_status === "pending"
                                  ? "Pending"
                                  : "N/A"
                              }
                              color={
                                pt.upload_status === "uploaded"
                                  ? "green"
                                  : pt.upload_status === "pending"
                                  ? "gold"
                                  : "muted"
                              }
                            />
                            {pt.upload_status === "pending" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fetch("/api/email/send-upload-reminder", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ packageTalentId: pt.id }),
                                  });
                                }}
                                className="text-[10px] text-[#C9A84C] hover:underline"
                              >
                                Send Reminder
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right -- Links & activity */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-3">
                        Links & Activity
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-[#8B8D93]">
                            Client Package Link
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-[#C9A84C] truncate">
                              /p/{pkg.token}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/p/${pkg.token}`
                                );
                              }}
                              className="text-xs text-[#8B8D93] hover:text-[#E8E3D8]"
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-[#8B8D93]">
                            Dropbox Folder
                          </div>
                          <div className="text-sm text-[#E8E3D8] mt-1">
                            {pkg.dropbox_folder_url || "Not yet created"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-[#8B8D93]">
                            Client Activity
                          </div>
                          <div className="text-sm text-[#E8E3D8] mt-1 space-y-0.5">
                            <div>
                              Last viewed:{" "}
                              {pkg.last_viewed_at
                                ? new Date(
                                    pkg.last_viewed_at
                                  ).toLocaleDateString()
                                : "Never"}
                            </div>
                            <div>Picks: {pickCount}</div>
                            <div>Comments: {commentCount}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-4 shadow-md shadow-black/10 hover:border-[#2A2D35] transition-all duration-200">
      <div className="text-2xl font-bold text-[#E8E3D8]">{value}</div>
      <div className="text-xs text-[#8B8D93] mt-1">{label}</div>
    </div>
  );
}

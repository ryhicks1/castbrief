"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, PackagePlus, Menu, X } from "lucide-react";

const navItems = [
  { href: "/agent/dashboard", label: "Dashboard", icon: LayoutDashboard, primary: false },
  { href: "/agent/roster", label: "Roster", icon: Users, primary: false },
  { href: "/agent/packages/new", label: "New Package", icon: PackagePlus, primary: true },
];

interface AgentShellProps {
  children: React.ReactNode;
}

export default function AgentShell({ children }: AgentShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [agencyName, setAgencyName] = useState("");
  const [dropboxConnected, setDropboxConnected] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("agency_name, full_name, dropbox_token")
        .eq("id", user.id)
        .single();

      if (data) {
        setAgencyName(data.agency_name || data.full_name || "Agent");
        setDropboxConnected(!!data.dropbox_token);
      }
    }
    loadProfile();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center border-b border-[#1E2128] px-4">
        <Link
          href="/agent/dashboard"
          className="text-lg font-bold text-[#C9A84C] hover:text-[#D4B35C] transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          CastBrief
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-l-2 border-[#C9A84C] bg-[#C9A84C]/5 text-[#C9A84C]"
                  : item.primary
                  ? "text-[#C9A84C] hover:bg-[#C9A84C]/5"
                  : "text-[#8B8D93] hover:bg-[#161920] hover:text-[#E8E3D8]"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {!dropboxConnected && (
        <div className="mx-2 mb-3">
          <Link
            href="/agent/dashboard/dropbox-connect"
            onClick={() => setSidebarOpen(false)}
            className="block rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 px-3 py-2 text-xs text-[#C9A84C] hover:bg-[#C9A84C]/15 transition"
          >
            &#x26A0; Connect your Dropbox to enable media collection{" "}
            <span className="underline">Connect now</span>
          </Link>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-[#0D0F14]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-[#1E2128]">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar drawer */}
          <aside className="relative flex w-56 h-full flex-col bg-[#0D0F14] border-r border-[#1E2128] animate-[slide-in-left_0.2s_ease-out]">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-3 text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-[#1E2128] px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-medium text-[#E8E3D8]">
              {agencyName}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
          >
            Log out
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

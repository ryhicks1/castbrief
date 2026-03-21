"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User, Upload, Menu, X } from "lucide-react";

const navItems = [
  { href: "/talent/profile", label: "Profile", icon: User },
  { href: "/talent/uploads", label: "My Uploads", icon: Upload },
];

interface TalentShellProps {
  children: React.ReactNode;
}

export default function TalentShell({ children }: TalentShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [talentName, setTalentName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: talent } = await supabase
        .from("talents")
        .select("full_name, agent_id")
        .eq("user_id", user.id)
        .single();

      if (talent) {
        setTalentName(talent.full_name || "Talent");

        const { data: agentProfile } = await supabase
          .from("profiles")
          .select("agency_name, full_name")
          .eq("id", talent.agent_id)
          .single();

        if (agentProfile) {
          setAgencyName(agentProfile.agency_name || agentProfile.full_name || "");
        }
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
          href="/talent/profile"
          className="text-lg font-bold text-[#C9A84C] hover:text-[#D4B35C] transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          CastingBrief
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
                  : "text-[#8B8D93] hover:bg-[#161920] hover:text-[#E8E3D8]"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex h-screen bg-[#0F0F12]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-[#1E2128] bg-[#0F0F12]">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex w-56 h-full flex-col bg-[#0F0F12] border-r border-[#1E2128] animate-[slide-in-left_0.2s_ease-out]">
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#E8E3D8]">
                {talentName}
              </span>
              {agencyName && (
                <>
                  <span className="text-[#1E2128]">|</span>
                  <span className="text-xs text-[#8B8D93]">{agencyName}</span>
                </>
              )}
            </div>
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

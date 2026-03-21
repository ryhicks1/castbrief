"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { FolderKanban, Inbox, Menu, X } from "lucide-react";

const navItems = [
  { href: "/client/projects", label: "Projects", icon: FolderKanban },
  { href: "/client/inbox", label: "Inbox", icon: Inbox },
];

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (data) setName(data.full_name || "Client");
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
          href="/client/projects"
          className="text-lg font-bold text-[#B8964C] hover:text-[#C9A64C] transition-colors"
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
                  ? "relative before:content-[''] before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:rounded-full before:bg-[#B8964C] bg-[#B8964C]/5 text-[#B8964C]"
                  : "text-[#8B8D93] hover:bg-[#13151A] hover:text-[#E8E3D8]"
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
      <aside className="hidden md:flex w-56 flex-col border-r border-[#1E2128]">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex w-56 h-full flex-col bg-[#0F0F12] border-r border-[#1E2128] animate-[slide-in-left_0.3s_ease-out]">
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

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-[#1E2128] px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-medium text-[#E8E3D8]">{name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
          >
            Log out
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/client/projects", label: "Projects", icon: "&#9632;" },
  { href: "/client/inbox", label: "Inbox", icon: "&#9993;" },
];

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");

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

  return (
    <div className="flex h-screen bg-[#0D0F14]">
      <aside className="flex w-56 flex-col border-r border-[#1E2128]">
        <div className="flex h-14 items-center border-b border-[#1E2128] px-4">
          <span className="text-lg font-bold text-[#C9A84C]">CastBrief</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-l-2 border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
                    : "text-[#8B8D93] hover:bg-[#161920] hover:text-[#E8E3D8]"
                }`}
              >
                <span className="text-base" dangerouslySetInnerHTML={{ __html: item.icon }} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-[#1E2128] px-6">
          <span className="text-sm font-medium text-[#E8E3D8]">{name}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-[#8B8D93] hover:text-[#E8E3D8] transition-colors"
          >
            Log out
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

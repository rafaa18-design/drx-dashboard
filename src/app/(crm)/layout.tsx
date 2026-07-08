"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getUsername } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import type { Conversation } from "@/types";

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("drx_token");
    if (!token) {
      router.replace("/login");
    } else {
      setAuthed(true);
      setUsername(getUsername());
    }
  }, [router]);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  const { data: pending } = useQuery({
    queryKey: ["conversations", "human_required"],
    queryFn: () => api.getConversations("human_required") as Promise<{ items: Conversation[]; total: number }>,
    refetchInterval: 15_000,
    enabled: authed,
  });

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>Verificando acesso...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — fixa/drawer no mobile, colapsável no desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out lg:relative lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          attentionCount={pending?.total ?? 0}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header username={username} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8 animate-fadeIn overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

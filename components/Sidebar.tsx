"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = { href: string; label: string };

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function SearchForm() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) router.push(`/dashboard/routes?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-3">
      <div className="relative">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Route zoeken…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-7 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white transition-colors"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base leading-none"
          >
            ×
          </button>
        )}
      </div>
    </form>
  );
}

export default function Sidebar({
  navItems,
  userName,
  unreadCount,
}: {
  navItems: NavItem[];
  userName: string;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    function onResize() { if (window.innerWidth >= 1024) setOpen(false); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const sidebarInner = (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Brand header */}
      <div className="shrink-0 border-b border-slate-100 px-5 py-5">
        <Image
          src="/bannerlogo.png"
          alt="RET"
          width={180}
          height={56}
          priority
          className="h-auto w-auto max-w-full"
        />
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Routebeheer
        </p>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4">
        <SearchForm />
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-100 px-3 py-4 space-y-1">
        <Link
          href="/dashboard/account"
          className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <span className="truncate">{userName}</span>
          {unreadCount > 0 && (
            <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <form action="/logout" method="POST">
          <button
            type="submit"
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            Uitloggen
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile / tablet top bar ── */}
      <header className="lg:hidden fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Menu openen"
        >
          <MenuIcon />
        </button>

        <span className="text-sm font-semibold text-slate-900 tracking-tight">
          RET Routebeheer
        </span>

        <Link
          href="/dashboard/account"
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Account"
        >
          <UserIcon />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </header>

      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shadow-none lg:border-r lg:border-slate-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button – tablet/mobile only */}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
          aria-label="Menu sluiten"
        >
          <CloseIcon />
        </button>

        {sidebarInner}
      </aside>
    </>
  );
}

"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  SquarePen,
  Search,
  X,
  LogOut,
  Square,
  Settings,
  LogIn,
} from "lucide-react";
import ChatItem from "./ChatItem";
import SearchModal from "./SearchModal";
import SettingsModal from "./SettingsModal";

export default function Sidebar() {
  const { chats, sidebarOpen, setSidebarOpen } = useStore();
  const { data: session, status } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const activeId = pathname.startsWith("/chat/") ? pathname.slice(6) : null;
  const isAuthed = status === "authenticated";

  const displayName = isAuthed
    ? session?.user?.name ||
      (session?.user as any)?.phone ||
      session?.user?.email ||
      "کاربر"
    : "مهمان";
  const initial = displayName.trim().charAt(0) || "؟";

  const handleNewChat = () => {
    setSidebarOpen(false);
    router.push("/");
  };

  const handleLogin = () => {
    setSidebarOpen(false);
    router.push("/login");
  };

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed inset-y-0 right-0 z-99 flex h-full w-[280px] max-w-[85vw] shrink-0 flex-col
          border-l border-white/[0.06] bg-[var(--bg-sidebar)]
          transition-transform duration-300 ease-out
          md:static md:w-[260px] md:max-w-none md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
        `}
      >
        {/* header */}
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.06]">
              <Square size={14} className="text-white/70" />
            </div>
            <span className="text-sm font-medium text-white/80">نویار</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-white/[0.06]"
              title="جستجو"
            >
              <Search size={17} className="text-white/70" />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-white/[0.06] md:hidden"
              title="بستن"
            >
              <X size={17} className="text-white/70" />
            </button>
          </div>
        </div>

        {/* new chat */}
        <div className="px-2">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2.5 text-sm text-white/90 transition hover:bg-white/[0.08]"
          >
            <SquarePen size={17} />
            <span>گفتگوی جدید</span>
          </button>
        </div>

        {/* history */}
        <div className="mt-3 flex min-h-0 flex-1 flex-col px-2">
          <div className="px-3 pb-1.5 text-[11px] font-medium text-white/40">
            تاریخچه
          </div>
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence initial={false}>
              {chats.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChatItem chat={c} active={c.id === activeId} />
                </motion.div>
              ))}
            </AnimatePresence>
            {chats.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-white/30">
                هنوز گفتگویی نداری
              </p>
            )}
          </div>
        </div>

        {/* bottom */}
        <div className="border-t border-white/[0.06] p-2">
          {isAuthed ? (
            <div className="flex items-center gap-1 rounded-lg px-1 py-1 transition hover:bg-white/[0.04]">
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-right transition hover:bg-white/[0.04]"
              >
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-xs text-white/90">
                  {initial}
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="truncate text-xs text-white/85">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-white/40">تنظیمات</div>
                </div>
              </button>

              <button
                onClick={() => setSettingsOpen(true)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/50 transition hover:bg-white/[0.08] hover:text-white/90"
                title="تنظیمات"
              >
                <Settings size={14} />
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/50 transition hover:bg-white/[0.08] hover:text-white/90"
                title="خروج"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              <LogIn size={16} />
              <span>ورود / ثبت‌نام</span>
            </button>
          )}
        </div>
      </aside>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
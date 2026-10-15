"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2, Check, X, Ghost } from "lucide-react";
import { useStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { Chat } from "@/lib/types";

type MenuPos = { x: number; y: number } | null;

export default function ChatItem({
  chat,
  active,
}: {
  chat: Chat;
  active: boolean;
}) {
  const { deleteChat, renameChat } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<MenuPos>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chat.title);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setCtxMenu(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!ctxMenu) return;
    const onScroll = () => setCtxMenu(null);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [ctxMenu]);

  const commitRename = () => {
    const v = draft.trim();
    if (v && v !== chat.title) renameChat(chat.id, v);
    setEditing(false);
    setMenuOpen(false);
    setCtxMenu(null);
  };

  const handleDelete = () => {
    const isCurrent = pathname === `/chat/${chat.id}`;
    deleteChat(chat.id);
    setMenuOpen(false);
    setCtxMenu(null);
    if (isCurrent) router.push("/chat");
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY });
    setMenuOpen(false);
  };

  const startEdit = () => {
    setDraft(chat.title);
    setEditing(true);
    setMenuOpen(false);
    setCtxMenu(null);
  };

  const menuItems = (
    <>
      <button
        onClick={startEdit}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
      >
        <Pencil size={13} />
        ویرایش نام
      </button>
      <button
        onClick={handleDelete}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
      >
        <Trash2 size={13} />
        حذف
      </button>
    </>
  );

  return (
    <div
      ref={ref}
      onContextMenu={onContextMenu}
      className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition ${
        active
          ? "bg-white/[0.08] text-white"
          : "text-white/70 hover:bg-white/[0.06]"
      }`}
    >
      {editing ? (
        <div className="flex w-full items-center gap-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setEditing(false);
                setMenuOpen(false);
                setCtxMenu(null);
              }
            }}
            className="min-w-0 flex-1 rounded-md bg-white/[0.06] px-2 py-1 text-xs outline-none"
          />
          <button
            onClick={commitRename}
            className="grid h-6 w-6 place-items-center rounded-md hover:bg-white/[0.08]"
          >
            <Check size={13} className="text-emerald-400" />
          </button>
          <button
            onClick={() => setEditing(false)}
            className="grid h-6 w-6 place-items-center rounded-md hover:bg-white/[0.08]"
          >
            <X size={13} className="text-white/50" />
          </button>
        </div>
      ) : (
        <>
          <Link
            href={`/chat/${chat.id}`}
            className="flex min-w-0 flex-1 items-center gap-2 truncate text-right"
            onClick={() => setCtxMenu(null)}
          >
            {chat.ephemeral && (
              <Ghost size={11} className="shrink-0 text-indigo-400" />
            )}
            <span className="truncate">{chat.title}</span>
          </Link>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
              setCtxMenu(null);
            }}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md opacity-0 transition hover:bg-white/[0.08] group-hover:opacity-100 data-[open=true]:opacity-100"
            data-open={menuOpen}
          >
            <MoreHorizontal size={16} className="text-white/60" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute left-2 top-full z-30 mt-1 w-36 overflow-hidden rounded-lg border border-white/10 bg-[#1a1a22] shadow-xl"
              >
                {menuItems}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.1 }}
            style={{
              position: "fixed",
              top: Math.min(ctxMenu.y, window.innerHeight - 90),
              left: Math.min(ctxMenu.x, window.innerWidth - 150),
            }}
            className="z-[200] w-36 overflow-hidden rounded-lg border border-white/10 bg-[#1a1a22] shadow-2xl"
            onContextMenu={(e) => e.preventDefault()}
          >
            {menuItems}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
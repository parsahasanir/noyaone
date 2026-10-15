"use client";
import {
  createContext, useContext, useEffect, useState, ReactNode, useMemo,
} from "react";
import { Chat, Message } from "./types";
import type { ModelId } from "./plans";
import type { PersonalityId } from "./personalities";

const uid = () => Math.random().toString(36).slice(2, 10);

interface StoreValue {
  chats: Chat[];
  credits: number;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  getChat: (id: string) => Chat | undefined;
  createChat: (modelId: ModelId, personality: PersonalityId) => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  setChatModel: (id: string, modelId: ModelId) => void;
  setChatPersonality: (id: string, personality: PersonalityId) => void;
  setChatEphemeral: (id: string, ephemeral: boolean) => void;
  touchEphemeral: (id: string) => void;
  appendMessage: (chatId: string, msg: Message) => void;
  patchMessage: (chatId: string, msgId: string, patch: Partial<Message>) => void;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [credits, setCredits] = useState(1000);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("app_state");
      if (raw) {
        const p = JSON.parse(raw);
        setChats(p.chats ?? []);
        setCredits(p.credits ?? 1000);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("app_state", JSON.stringify({ chats, credits }));
  }, [chats, credits, hydrated]);

  const value = useMemo<StoreValue>(
    () => ({
      chats,
      credits,
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar: () => setSidebarOpen((v) => !v),
      getChat: (id) => chats.find((c) => c.id === id),
      createChat: (modelId, personality) => {
        const c: Chat = {
          id: uid(),
          title: "گفتگوی جدید",
          messages: [],
          modelId,
          personality,
          createdAt: Date.now(),
        };
        setChats((prev) => [c, ...prev]);
        setSidebarOpen(false);
        return c.id;
      },
      deleteChat: (id) =>
        setChats((prev) => prev.filter((c) => c.id !== id)),
      renameChat: (id, title) =>
        setChats((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title } : c))
        ),
      setChatModel: (id, modelId) =>
        setChats((prev) =>
          prev.map((c) => (c.id === id ? { ...c, modelId } : c))
        ),
      setChatPersonality: (id, personality) =>
        setChats((prev) =>
          prev.map((c) => (c.id === id ? { ...c, personality } : c))
        ),
      setChatEphemeral: (id, ephemeral) =>
        setChats((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ephemeral,
                  expiresAt: ephemeral
                    ? Date.now() + 10 * 60 * 1000
                    : undefined,
                }
              : c
          )
        ),
      touchEphemeral: (id) =>
        setChats((prev) =>
          prev.map((c) =>
            c.id === id && c.ephemeral
              ? { ...c, expiresAt: Date.now() + 10 * 60 * 1000 }
              : c
          )
        ),
      appendMessage: (chatId, msg) =>
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId ? { ...c, messages: [...c.messages, msg] } : c
          )
        ),
      patchMessage: (chatId, msgId, patch) =>
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === msgId ? { ...m, ...patch } : m
                  ),
                }
              : c
          )
        ),
    }),
    [chats, credits, sidebarOpen]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useMe } from "@/lib/use-me";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import ModelPicker from "./ModelPicker";
import PersonalityPicker from "./PersonalityPicker";
import LoginPromptModal from "./LoginPromptModal";
import { AnimatePresence, motion } from "framer-motion";
import {
  Image as ImageIcon,
  PenLine,
  Globe,
  Menu,
  Ghost,
  Timer,
  X,
} from "lucide-react";
import type { ModelId } from "@/lib/plans";
import type { AttachedFile } from "@/lib/types";
import { getPersonality, PersonalityId } from "@/lib/personalities";

const uid = () => Math.random().toString(36).slice(2, 10);
const EPHEMERAL_TTL = 10 * 60 * 1000;

const suggestions = [
  { icon: ImageIcon, label: "ساخت تصویر یا استیکر" },
  { icon: PenLine, label: "نوشتن یا ویرایش" },
  { icon: Globe, label: "جستجو در وب" },
];

type StreamState = {
  chatId: string;
  msgId: string;
  target: string;
  displayed: string;
  controller: AbortController;
  timer: ReturnType<typeof setInterval> | null;
  done: boolean;
  error: string | null;
};

let G: StreamState | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());

function composeApiContent(msg: {
  content: string;
  attachments?: AttachedFile[];
}): string {
  if (!msg.attachments?.length) return msg.content || "";
  const filesBlock = msg.attachments
    .map((f) => `\n\n<file name="${f.name}">\n${f.content}\n</file>`)
    .join("");
  return (msg.content || "") + filesBlock;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00";
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ChatArea() {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const {
    getChat,
    createChat,
    appendMessage,
    patchMessage,
    renameChat,
    toggleSidebar,
    setChatPersonality,
    setChatEphemeral,
    touchEphemeral,
    deleteChat,
  } = useStore();
  const { me, refresh } = useMe();

  const routeChatId = pathname.startsWith("/chat/") ? pathname.slice(6) : null;
  const activeChat = routeChatId ? getChat(routeChatId) : null;

  const [draftModel, setDraftModel] = useState<ModelId>("gpt-5-nano");
  const [draftPersonality, setDraftPersonality] =
    useState<PersonalityId>("default");
  const [draftEphemeral, setDraftEphemeral] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const [ripple, setRipple] = useState<{
    x: number;
    y: number;
    key: number;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const [now, setNow] = useState(Date.now());

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const loading = !!G && !G.done && activeChat?.id === G.chatId;
  const error = G && activeChat?.id === G.chatId ? G.error : null;
  const isAuthed = status === "authenticated";

  const isEphemeral = !!(activeChat?.ephemeral || draftEphemeral);

  useEffect(() => {
    if (!isEphemeral) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isEphemeral]);

  useEffect(() => {
    if (!activeChat?.ephemeral || !activeChat.expiresAt) return;
    if (now >= activeChat.expiresAt) {
      const id = activeChat.id;
      deleteChat(id);
      router.replace("/chat");
    }
  }, [now, activeChat, deleteChat, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, loading]);

  const secondsLeft =
    activeChat?.ephemeral && activeChat.expiresAt
      ? Math.max(0, activeChat.expiresAt - now)
      : EPHEMERAL_TTL;

  /* 🎬 فعال‌سازی چت مخفی */
  function activateEphemeral() {
    const area = areaRef.current;
    const btn = btnRef.current;
    if (!area || !btn) return;
    const aRect = area.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    const x = bRect.left - aRect.left + bRect.width / 2;
    const y = bRect.top - aRect.top + bRect.height / 2;
    setRipple({ x, y, key: Date.now() });
    setDraftEphemeral(true);
    setTimeout(() => setRipple(null), 900);
  }

  /* 🛑 غیرفعال‌سازی چت مخفی */
  function deactivateEphemeral() {
    if (activeChat?.id && activeChat.messages.length === 0) {
      setChatEphemeral(activeChat.id, false);
    }
    setDraftEphemeral(false);
  }

  async function generateTitle(chatId: string, firstText: string) {
    try {
      const res = await fetch("/api/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: firstText }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.title) renameChat(chatId, data.title);
    } catch {}
  }

  function stop() {
    if (!G) return;
    try {
      G.controller.abort();
    } catch {}
    G.displayed = G.target;
    patchMessage(G.chatId, G.msgId, { content: G.target });
    if (G.timer) {
      clearInterval(G.timer);
      G.timer = null;
    }
    G.done = true;
    notify();
  }

  async function send(text: string, attachedFiles: AttachedFile[] = []) {
    if (!isAuthed) {
      setLoginPromptOpen(true);
      return;
    }
    if (G && !G.done) return;

    let chatId = activeChat?.id;
    const modelToUse = activeChat?.modelId ?? draftModel;
    const personalityToUse = activeChat?.personality ?? draftPersonality;
    let isFirst = false;

    if (!chatId) {
      chatId = createChat(modelToUse, personalityToUse);
      if (draftEphemeral) {
        setChatEphemeral(chatId, true);
      }
      isFirst = true;
    } else {
      isFirst = activeChat!.messages.length === 0;
    }

    const userMsg = {
      id: uid(),
      role: "user" as const,
      content: text,
      attachments: attachedFiles.length > 0 ? attachedFiles : undefined,
    };
    appendMessage(chatId, userMsg);

    if (activeChat?.ephemeral || draftEphemeral) {
      touchEphemeral(chatId);
    }

    if (isFirst) {
      renameChat(
        chatId,
        text.slice(0, 40) || attachedFiles[0]?.name || "گفتگوی جدید",
      );
      generateTitle(chatId, text || attachedFiles[0]?.name || "گفتگوی جدید");
    }

    const aiMsgId = uid();
    appendMessage(chatId, { id: aiMsgId, role: "assistant", content: "" });

    G = {
      chatId,
      msgId: aiMsgId,
      target: "",
      displayed: "",
      controller: new AbortController(),
      timer: null,
      done: false,
      error: null,
    };
    notify();

    G.timer = setInterval(() => {
      if (!G) return;
      if (G.displayed.length >= G.target.length) return;
      const remaining = G.target.length - G.displayed.length;
      const step = Math.max(1, Math.min(6, Math.ceil(remaining / 15)));
      G.displayed = G.target.slice(0, G.displayed.length + step);
      patchMessage(G.chatId, G.msgId, { content: G.displayed });
      notify();
    }, 20);

    if (!activeChat?.id) {
      router.push(`/chat/${chatId}`);
    }

    const controller = G.controller;

    try {
      const personality = getPersonality(personalityToUse);

      const history = [
        {
          role: "system",
          content: `${personality.systemPrompt}

قواعد کلی:
- پاسخ‌ها را کوتاه، روشن و کاربردی بده.
- از مارک‌داون استفاده کن: **بولد**، *ایتالیک*، \`کد\`، لیست، جدول و بلاک کد.
- برای کد، همیشه زبان رو مشخص کن: \`\`\`python ... \`\`\`
- فرمول‌های ریاضی رو داخل $...$ یا $$...$$ بنویس.
- اگر فایل پیوست شده، محتوای آن را در نظر بگیر.`,
        },
        ...(activeChat?.messages ?? []).map((m) => ({
          role: m.role,
          content: composeApiContent(m),
        })),
        {
          role: "user",
          content: composeApiContent({
            content: text,
            attachments: attachedFiles,
          }),
        },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, modelId: modelToUse }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "خطای ناشناخته");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const data = t.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta && G) G.target += delta;
          } catch {}
        }
      }

      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (!G || G.displayed.length >= G.target.length) {
            clearInterval(check);
            resolve();
          }
        }, 30);
        setTimeout(() => {
          clearInterval(check);
          resolve();
        }, 5000);
      });

      if (activeChat?.ephemeral || draftEphemeral) {
        touchEphemeral(chatId);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError" && G) {
        const msg = e?.message ?? "خطای نامشخص";
        G.error = msg;
        patchMessage(G.chatId, G.msgId, { content: `خطا: ${msg}` });
        notify();
      }
    } finally {
      if (G) {
        if (G.timer) {
          clearInterval(G.timer);
          G.timer = null;
        }
        G.done = true;
        notify();
      }
      refresh();
    }
  }

  if (routeChatId && !activeChat) {
    return (
      <main className="flex h-full min-w-0 flex-1 flex-col items-center justify-center px-4 text-white/60">
        <p className="text-sm">این گفتگو پیدا نشد.</p>
        <button
          onClick={() => router.push("/chat")}
          className="mt-3 rounded-lg bg-white/[0.06] px-4 py-2 text-sm hover:bg-white/[0.1]"
        >
          بازگشت به خانه
        </button>
      </main>
    );
  }

  const hasMessages = (activeChat?.messages.length ?? 0) > 0;
  const currentModel = activeChat?.modelId ?? draftModel;
  const currentPersonality = activeChat?.personality ?? draftPersonality;
  const modelLocked = hasMessages;

  return (
    <main
      ref={areaRef}
      className="relative flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden"
    >
      {/* 🎬 لایه‌ی گرادینت چت مخفی */}
      <AnimatePresence>
        {isEphemeral && (
          <motion.div
            key={ripple ? `ripple-${ripple.key}` : "ephemeral-bg"}
            initial={
              ripple
                ? { clipPath: `circle(0px at ${ripple.x}px ${ripple.y}px)` }
                : false
            }
            animate={{
              clipPath: ripple
                ? `circle(150% at ${ripple.x}px ${ripple.y}px)`
                : `circle(150% at 50% 50%)`,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(86,134,254,0.22), rgba(86,134,254,0.06) 60%, rgba(86,134,254,0.02) 100%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* header موبایل */}
      <header className="relative z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] px-3 md:hidden">
        <button
          onClick={toggleSidebar}
          className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/[0.06]"
        >
          <Menu size={18} className="text-white/80" />
        </button>
        <span className="truncate px-2 text-xs text-white/60">
          {activeChat?.title ?? "گفتگوی جدید"}
        </span>
        <div className="w-9" />
      </header>

      {/* 🕵️ دکمه‌ی چت مخفی — فقط قبل از اولین پیام */}
      {!hasMessages && (
        <div className="relative z-20 flex shrink-0 items-center justify-end px-4 pt-4">
          <div className="group/eph relative">
            <AnimatePresence mode="wait" initial={false}>
              {!isEphemeral ? (
                <motion.button
                  key="ephemeral-off"
                  ref={btnRef}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.18 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={activateEphemeral}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/70 transition hover:border-indigo-500/40 hover:bg-indigo-500/[0.1] hover:text-indigo-300"
                  aria-label="فعال‌سازی چت مخفی"
                >
                  <Ghost size={16} className="text-indigo-400" />
                </motion.button>
              ) : (
                <motion.button
                  key="ephemeral-on"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.18 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={deactivateEphemeral}
                  className="group/off relative grid h-9 w-9 place-items-center rounded-full border border-indigo-500/50 bg-indigo-500/[0.15] text-indigo-200 shadow-[0_0_18px_-4px_rgba(99,102,241,0.6)] transition hover:border-red-500/50 hover:bg-red-500/[0.15] hover:text-red-300"
                  aria-label="غیرفعال‌سازی چت مخفی"
                >
                  <Ghost size={16} />
                  {/* نشانگر فعال — نقطه‌ی کوچیک بالا */}
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-indigo-400 ring-2 ring-[var(--bg)] animate-pulse" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* 🏷️ Tooltip — کناری */}
            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2.5 hidden -translate-y-1/2 group-hover/eph:block">
              <div className="relative whitespace-nowrap rounded-lg border border-white/10 bg-[#1a1a22] px-3 py-2 text-[11.5px] text-white/85 shadow-2xl">
                {!isEphemeral ? (
                  <>
                    <span className="font-medium text-white">
                      فعال‌سازی چت مخفی
                    </span>
                    <span className="mx-1 text-white/30">·</span>
                    <span className="text-white/55">
                      پس از ۱۰ دقیقه سکوت، از تاریخچه حذف می‌شود
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-indigo-300">
                      چت مخفی فعال است
                    </span>
                    <span className="mx-1 text-white/30">·</span>
                    <span className="text-white/55">
                      برای غیرفعال کردن کلیک کن
                    </span>
                  </>
                )}

                {/* فلش سمت راست tooltip (اشاره به دکمه) */}
                <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-l border-b border-white/10 bg-[#1a1a22]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* شمارش معکوس */}
      {activeChat?.ephemeral && hasMessages && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex shrink-0 items-center justify-center gap-1.5 px-4 pt-3"
        >
          <div className="flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/[0.08] px-3 py-1">
            <Ghost size={12} className="text-indigo-400" />
            <span className="text-[11px] font-medium text-indigo-200">
              چت مخفی
            </span>
            <span className="h-3 w-px bg-indigo-500/30" />
            <Timer size={11} className="text-indigo-300/80" />
            <span className="font-mono text-[11px] tabular-nums text-indigo-100">
              {formatCountdown(secondsLeft)}
            </span>
          </div>
        </motion.div>
      )}

      {/* ModelPicker */}
      <div className="relative z-10 flex shrink-0 items-center justify-center px-4 pt-4 pb-1">
        <ModelPicker
          value={currentModel}
          onChange={(m) => {
            if (!modelLocked) setDraftModel(m);
          }}
          disabled={modelLocked}
        />
      </div>

      {!hasMessages ? (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-3 pb-24 sm:px-4 sm:pb-28">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mb-6"
            >
              <PersonalityPicker
                value={currentPersonality}
                onChange={setDraftPersonality}
                hideLabel
                avatarSize={72}
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="mb-6 text-center text-xl font-normal text-white/90 sm:mb-8 sm:text-2xl"
            >
              {draftEphemeral ? "چت مخفی فعال شد" : "امروز چی توی ذهنته؟"}
            </motion.h1>

            {draftEphemeral && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-5 max-w-md text-center text-[12px] leading-6 text-indigo-200/70"
              >
                این چت پس از ۱۰ دقیقه سکوت، به‌طور خودکار از تاریخچه پاک می‌شود.
              </motion.p>
            )}

            <ChatInput
              onSend={send}
              onStop={stop}
              disabled={loading}
              loading={loading}
              variant="centered"
              ephemeral={isEphemeral}
            />

            {error && (
              <p className="mt-2 text-center text-[11px] text-red-400">
                {error}
              </p>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-5 flex w-full max-w-3xl flex-col gap-1 sm:mt-6"
            >
              {suggestions.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => send(label)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.04] hover:text-white/90"
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-3 pt-5 pb-40 sm:gap-6 sm:px-4 sm:pt-8 sm:pb-44">
              {activeChat?.messages.map((m) => (
                <MessageBubble key={m.id} msg={m} />
              ))}
              {loading && !activeChat?.messages.at(-1)?.content && (
                <div className="text-sm text-white/40">در حال فکر کردن…</div>
              )}
              {error && (
                <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <ChatInput
            onSend={send}
            onStop={stop}
            disabled={loading}
            loading={loading}
            variant="bottom"
            ephemeral={isEphemeral}
            topSlot={
              <PersonalityPicker
                value={currentPersonality}
                onChange={(p) => {
                  if (activeChat) setChatPersonality(activeChat.id, p);
                  else setDraftPersonality(p);
                }}
                disabled={loading}
              />
            }
          />
        </div>
      )}

      <p className="pointer-events-none absolute bottom-1.5 left-0 right-0 z-40 px-4 text-center text-[10.5px] leading-5 text-white/30">
        هوش مصنوعی ممکن است اشتباه کند؛ اطلاعات مهم را بررسی کنید.
      </p>

      <LoginPromptModal
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
      />
    </main>
  );
}

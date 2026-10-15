"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  User, CreditCard, Palette, MessageSquare, Brain, Lock, Info, Mail, X,
} from "lucide-react";
import ProfileTab from "./settings/ProfileTab";
import SubscriptionTab from "./settings/SubscriptionTab";

export type SettingsTab =
  | "profile"
  | "subscription"
  | "appearance"
  | "prompts"
  | "memory"
  | "privacy"
  | "about"
  | "contact";

const TABS: { id: SettingsTab; label: string; icon: any; badge?: string }[] = [
  { id: "profile", label: "پروفایل", icon: User },
  { id: "subscription", label: "اشتراک و اعتبار", icon: CreditCard },
  { id: "appearance", label: "ظاهر", icon: Palette },
  { id: "prompts", label: "پرامپت‌های من", icon: MessageSquare, badge: "به‌زودی" },
  { id: "memory", label: "حافظه", icon: Brain },
  { id: "privacy", label: "حریم شخصی", icon: Lock },
  { id: "about", label: "درباره نویا وان", icon: Info },
  { id: "contact", label: "تماس با ما", icon: Mail },
];

const TabCtx = createContext<{
  active: SettingsTab;
  setActive: (t: SettingsTab) => void;
} | null>(null);

export default function SettingsModal({
  open,
  onClose,
  initialTab = "profile",
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
}) {
  const [active, setActive] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    if (open) setActive(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const activeTab = TABS.find((t) => t.id === active);

  return (
    <TabCtx.Provider value={{ active, setActive }}>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-[301] flex items-center justify-center p-2 sm:p-6"
              onClick={onClose}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
                className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416] shadow-2xl sm:flex-row"
              >
                {/* tabs */}
                <aside className="flex w-full shrink-0 flex-col border-b border-white/[0.06] bg-[#101012] sm:w-64 sm:border-b-0 sm:border-l">
                  <div className="flex items-center justify-between px-4 py-4">
                    <h2 className="text-sm font-semibold text-white/95">
                      تنظیمات
                      {activeTab && (
                        <span className="text-white/40">
                          {" "}
                          › {activeTab.label}
                        </span>
                      )}
                    </h2>
                    <button
                      onClick={onClose}
                      className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <nav className="flex gap-1 overflow-x-auto px-2 pb-3 sm:flex-1 sm:flex-col sm:overflow-y-auto sm:pb-2">
                    {TABS.map(({ id, label, icon: Icon, badge }) => (
                      <TabButton
                        key={id}
                        id={id}
                        label={label}
                        Icon={Icon}
                        badge={badge}
                      />
                    ))}
                  </nav>
                </aside>

                {/* content */}
                <section className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                  <TabContent />
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TabCtx.Provider>
  );
}

function TabButton({
  id,
  label,
  Icon,
  badge,
}: {
  id: SettingsTab;
  label: string;
  Icon: any;
  badge?: string;
}) {
  const ctx = useContext(TabCtx);
  if (!ctx) return null;
  const isActive = ctx.active === id;
  return (
    <button
      onClick={() => ctx.setActive(id)}
      className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition sm:w-full ${
        isActive
          ? "bg-white/[0.08] text-white"
          : "text-white/60 hover:bg-white/[0.04] hover:text-white/90"
      }`}
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 text-right">{label}</span>
      {badge && (
        <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[9px] font-medium text-red-300">
          {badge}
        </span>
      )}
    </button>
  );
}

function TabContent() {
  const ctx = useContext(TabCtx);
  if (!ctx) return null;
  switch (ctx.active) {
    case "profile":
      return <ProfileTab />;
    case "subscription":
      return <SubscriptionTab />;
    default:
      return (
        <Placeholder
          title={TABS.find((t) => t.id === ctx.active)?.label ?? ""}
          note="این بخش به‌زودی فعال می‌شود."
        />
      );
  }
}

function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
      <h3 className="text-base font-semibold text-white/90">{title}</h3>
      <p className="text-xs text-white/40">{note}</p>
    </div>
  );
}
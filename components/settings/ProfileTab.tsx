"use client";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Pencil, ChevronLeft, Check, LogOut, Trash2 } from "lucide-react";

export default function ProfileTab() {
  const { data: session } = useSession();
  const user = session?.user as any;

  /* تشخیص نوع حساب */
  const isPhoneAccount = !!user?.email?.endsWith("@phone.local");
  const accountPhone = isPhoneAccount ? user?.phone ?? user?.name ?? "" : "";
  const accountEmail = !isPhoneAccount ? user?.email ?? "" : "";

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const displayInitial =
    (name || accountPhone || accountEmail || "؟").trim().charAt(0) || "؟";

  async function handleSave() {
    setSaving(true);
    // TODO: ارسال به API /api/me/update
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* avatar */}
      <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4">
        <div className="relative">
          <div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-500/20 ring-2 ring-white/[0.06] sm:h-28 sm:w-28">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full -rotate-90"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="3"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeDasharray="80 300"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-2xl font-semibold text-white/90">
              {displayInitial}
            </span>
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 left-0 grid h-8 w-8 place-items-center rounded-full bg-[#2a2a30] text-white/70 ring-2 ring-[#141416] transition hover:bg-[#34343c] hover:text-white sm:h-9 sm:w-9"
          >
            <Pencil size={13} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* banner */}
      <div className="mx-4 mb-5 flex items-start gap-3 rounded-xl bg-white/[0.04] p-3 sm:mx-6">
        <button className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/50 hover:text-white">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-right">
          <p className="text-[13px] font-medium text-white/90">
            کاتگوری پر نشده داری!
          </p>
          <p className="mt-0.5 text-[11.5px] leading-5 text-white/50">
            درمورد تفریحات، شغل و حرفه، غذا و خوراکی و ... به هوشنگ بگو.
          </p>
        </div>
        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-indigo-500/40">
          <div className="h-4 w-4 rounded-full border-2 border-indigo-400/60" />
        </div>
      </div>

      {/* form */}
      <div className="flex flex-col gap-4 px-4 pb-6 sm:px-6">
        {/* نام */}
        <Field label="نام و نام خانوادگی">
          <div className="relative">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلا هوشنگ هوشنگ"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-sm outline-none placeholder:text-white/25 focus:border-white/[0.16]"
            />
            {name && (
              <button
                onClick={() => setName("")}
                className="absolute left-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-indigo-500/30 text-white/90 hover:bg-indigo-500/50"
              >
                ×
              </button>
            )}
          </div>
        </Field>

        {/* فقط یکی از شماره یا ایمیل بر اساس نوع حساب */}
        {isPhoneAccount ? (
          <Field label="شماره تلفن">
            <input
              dir="ltr"
              value={accountPhone}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-3 text-right text-sm text-white/60 outline-none"
            />
          </Field>
        ) : (
          <Field label="ایمیل">
            <input
              dir="ltr"
              value={accountEmail}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-3 text-right text-sm text-white/60 outline-none"
            />
          </Field>
        )}

        {/* ذخیره */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check size={14} />
                ذخیره شد
              </>
            ) : saving ? (
              "در حال ذخیره..."
            ) : (
              "ذخیره"
            )}
          </button>
        </div>

        <div className="my-3 h-px bg-white/[0.06]" />

        {/* actions */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5">
            <span className="text-sm text-white/85">خروج از حساب</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
            >
              <LogOut size={13} />
              خروج
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5">
            <span className="text-sm text-white/85">حذف حساب کاربری</span>
            <button className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300">
              <Trash2 size={13} />
              حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-right text-[11.5px] text-white/50">
        {label}
      </label>
      {children}
    </div>
  );
}
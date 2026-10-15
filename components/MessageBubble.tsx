"use client";
import { motion } from "framer-motion";
import { Message } from "@/lib/types";
import Markdown from "./Markdown";
import { useState } from "react";
import { Check, Copy, FileText } from "lucide-react";

export default function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (isUser) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col items-start gap-1.5"
    >
      {msg.attachments && msg.attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {msg.attachments.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1 text-[11px] text-white/80 ring-1 ring-white/[0.05]"
            >
              <FileText size={11} className="text-white/50" />
              <span className="max-w-[180px] truncate" dir="auto">
                {f.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {msg.content && (
        <div
          className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl bg-white/[0.08] px-3.5 py-2 text-[14.5px] leading-7 text-white/95 sm:max-w-[80%] sm:rounded-3xl sm:px-4 sm:py-2.5 sm:text-[15px]"
          dir="auto"
        >
          {msg.content}
        </div>
      )}
    </motion.div>
  );
}

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="group relative w-full"
    >
      <div className="w-full min-w-0">
        <Markdown content={msg.content || "…"} />

        {msg.content && (
          <div className="mt-1.5 flex items-center gap-2 opacity-0 transition group-hover:opacity-100 md:mt-2">
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-white/50 hover:bg-white/[0.06] hover:text-white/80"
            >
              {copied ? (
                <>
                  <Check size={12} /> کپی شد
                </>
              ) : (
                <>
                  <Copy size={12} /> کپی پاسخ
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
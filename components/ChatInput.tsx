"use client";
import {
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
  ChangeEvent,
  ClipboardEvent,
} from "react";
import {
  Plus,
  Mic,
  ArrowUp,
  Square,
  X,
  FileText,
  RotateCcw,
  Loader2,
} from "lucide-react";
import type { AttachedFile } from "@/lib/types";
import ImageViewer from "./ImageViewer";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);

const TEXT_EXTENSIONS = [
  ".txt", ".md", ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp",
  ".cs", ".go", ".rs", ".rb", ".php", ".html", ".css", ".scss", ".json",
  ".xml", ".yaml", ".yml", ".sh", ".sql", ".vue", ".svelte", ".kt", ".swift",
  ".dart", ".lua", ".r", ".ipynb", ".csv", ".log", ".env", ".ini", ".toml",
];

function isTextFile(file: File): boolean {
  if (file.type.startsWith("text/")) return true;
  if (["application/json", "application/xml", "application/javascript"].includes(file.type))
    return true;
  const n = file.name.toLowerCase();
  return TEXT_EXTENSIONS.some((ext) => n.endsWith(ext));
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const AUTO_FILE_LINE_THRESHOLD = 25;

interface PendingImage {
  id: string;
  name: string;
  size: number;
  type: string;
  reader: FileReader;
}

export default function ChatInput({
  onSend,
  onStop,
  disabled,
  loading,
  variant = "bottom",
  topSlot,
  ephemeral = false,
}: {
  onSend: (t: string, files: AttachedFile[]) => void;
  onStop?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "centered" | "bottom";
  topSlot?: React.ReactNode;
  ephemeral?: boolean;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");

  const uploading = pending.length > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [text]);

  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { setSpeechSupported(false); return; }
    setSpeechSupported(true);

    const r = new SR();
    r.lang = "fa-IR";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => setListening(true);
    r.onresult = (e: any) => {
      let interim = "";
      let final = finalTranscriptRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      finalTranscriptRef.current = final;
      interimTranscriptRef.current = interim;
      setText(final + interim);
    };
    r.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setListening(false);
    };
    r.onend = () => setListening(false);

    recognitionRef.current = r;
    return () => {
      try { r.stop(); } catch {}
      recognitionRef.current = null;
    };
  }, []);

  const toggleListening = () => {
    const r = recognitionRef.current;
    if (!r) return;
    if (listening) {
      try { r.stop(); } catch {}
      setListening(false);
      interimTranscriptRef.current = "";
      setText(finalTranscriptRef.current);
    } else {
      finalTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      try { r.start(); } catch {}
    }
  };

  const openPicker = () => {
    if (!disabled && !uploading) fileInputRef.current?.click();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) continue;

      if (isImageFile(file)) {
        const id = uid();
        const reader = new FileReader();

        setPending((prev) => [
          ...prev,
          { id, name: file.name, size: file.size, type: file.type, reader },
        ]);

        reader.onload = () => {
          setPending((prev) => {
            const still = prev.find((p) => p.id === id);
            if (!still) return prev;
            const dataUrl = reader.result as string;
            setFiles((f) => [
              ...f,
              {
                id,
                name: file.name,
                size: file.size,
                type: file.type,
                content: dataUrl,
                kind: "image",
              },
            ]);
            return prev.filter((p) => p.id !== id);
          });
        };

        reader.onerror = () => {
          setPending((prev) => prev.filter((p) => p.id !== id));
        };

        reader.readAsDataURL(file);
      } else if (isTextFile(file)) {
        file.text().then((content) => {
          setFiles((prev) => [
            ...prev,
            {
              id: uid(),
              name: file.name,
              size: file.size,
              type: file.type || "text/plain",
              content,
              kind: "text",
            },
          ]);
        }).catch(() => {});
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelPending = (id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) {
        try { item.reader.abort(); } catch {}
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (!pasted) return;
    const lines = pasted.split("\n").length;
    if (lines >= AUTO_FILE_LINE_THRESHOLD) {
      e.preventDefault();
      const name = `pasted-${new Date().toISOString().slice(11, 19).replace(/:/g, "")}.txt`;
      setFiles((prev) => [
        ...prev,
        {
          id: uid(), name,
          size: new Blob([pasted]).size,
          type: "text/plain", content: pasted,
          kind: "text", autoConverted: true,
        },
      ]);
    }
  };

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const extractFile = (id: string) => {
    const f = files.find((x) => x.id === id);
    if (!f || f.kind !== "text") return;
    setText((prev) => (prev ? prev + "\n" + f.content : f.content));
    removeFile(id);
    requestAnimationFrame(() => ref.current?.focus());
  };

  const submit = () => {
    if (uploading) return;
    const t = text.trim();
    if ((!t && files.length === 0) || disabled) return;
    onSend(t, files);
    setText("");
    setFiles([]);
    setPending([]);
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    if (listening) {
      try { recognitionRef.current?.stop(); } catch {}
      setListening(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const hasContent = text.trim().length > 0 || files.length > 0;
  const canSend = hasContent && !disabled && !uploading;
  const totalPreviews = pending.length + files.length;

  const box = (
    <div className="relative w-full">
      {topSlot && (
        <div className="relative z-20 mb-2 flex items-center justify-start">
          {topSlot}
        </div>
      )}

      <div
        className={`relative flex w-full flex-col rounded-[28px] bg-[#1c1c1e] transition-all duration-300 ${
          listening || ephemeral
            ? "ring-1 ring-transparent"
            : "ring-1 ring-white/[0.06] focus-within:ring-white/[0.14]"
        }`}
        style={
          ephemeral && !listening
            ? {
                border: "1.5px dashed rgba(129,140,248,0.55)",
                boxShadow: "0 0 24px -8px rgba(129,140,248,0.35)",
              }
            : undefined
        }
      >
        {listening && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-[2px] rounded-[30px] opacity-90 blur-[8px]"
              style={{
                background:
                  "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 40%, #06b6d4 70%, #8b5cf6 100%)",
                backgroundSize: "300% 300%",
                animation: "gradient-shift 4s ease infinite",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[28px] bg-[#1c1c1e]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-[1px] rounded-[29px]"
              style={{
                background:
                  "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 40%, #06b6d4 70%, #8b5cf6 100%)",
                backgroundSize: "300% 300%",
                animation: "gradient-shift 4s ease infinite",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: "1.5px",
              }}
            />
          </>
        )}

        <div className="relative z-10 flex w-full flex-col">
          {totalPreviews > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-3 pb-1">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]"
                >
                  <Loader2 size={20} className="animate-spin text-white/60" />
                  <button
                    type="button"
                    onClick={() => cancelPending(p.id)}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white/80 transition hover:bg-black hover:text-white"
                    title="کنسل"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}

              {files.map((f) =>
                f.kind === "image" ? (
                  <div
                    key={f.id}
                    className="group relative h-20 w-20 overflow-hidden rounded-xl border border-white/[0.08]"
                  >
                    <img
                      src={f.content}
                      alt={f.name}
                      onClick={() => setViewing(f.content)}
                      className="h-full w-full cursor-zoom-in object-cover transition group-hover:opacity-90"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white/80 transition hover:bg-black hover:text-white"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <div
                    key={f.id}
                    className="flex max-w-[200px] items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1 text-[11px] text-white/85 ring-1 ring-white/[0.04]"
                  >
                    <FileText size={12} className="shrink-0 text-white/50" />
                    <span className="max-w-[120px] truncate" dir="auto">{f.name}</span>
                    <span className="shrink-0 text-white/40">{formatSize(f.size)}</span>
                    {f.autoConverted && (
                      <button
                        type="button"
                        onClick={() => extractFile(f.id)}
                        className="shrink-0 text-white/50 transition hover:text-white"
                        title="بازگرداندن به ورودی"
                      >
                        <RotateCcw size={11} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="shrink-0 text-white/50 transition hover:text-white"
                      title="حذف"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          <div className="flex w-full items-center gap-1.5 px-2.5 py-2 sm:gap-2 sm:px-3">
            <button
              type="button"
              onClick={openPicker}
              disabled={disabled || uploading}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/[0.08] disabled:opacity-40"
              title="افزودن فایل یا عکس"
            >
              <Plus size={20} />
            </button>

            <textarea
              ref={ref}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              onPaste={handlePaste}
              rows={1}
              placeholder={
                uploading
                  ? "در حال بارگذاری تصویر…"
                  : listening
                  ? "در حال گوش دادن..."
                  : "هرچی می‌خوای بپرس!"
              }
              className="min-h-[36px] min-w-0 flex-1 resize-none self-center bg-transparent px-1 py-2 text-right text-[15px] leading-6 outline-none placeholder:text-white/35"
            />

            <button
              type="button"
              onClick={toggleListening}
              disabled={!speechSupported || loading}
              className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                listening
                  ? "bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/40"
                  : "text-white/70 hover:bg-white/[0.08]"
              } ${!speechSupported ? "cursor-not-allowed opacity-30" : ""}`}
              title={listening ? "توقف ضبط" : "ضبط صدا"}
            >
              <Mic size={18} />
              {listening && (
                <span className="absolute -inset-0.5 animate-ping rounded-full bg-violet-500/30" />
              )}
            </button>

            {loading ? (
              <button
                type="button"
                onClick={onStop}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-black transition hover:opacity-90"
                title="توقف"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!canSend}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                  canSend
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "bg-white/[0.08] text-white/40"
                }`}
                title={uploading ? "منتظر بارگذاری…" : "ارسال"}
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.go,.rs,.rb,.php,.html,.css,.scss,.json,.xml,.yaml,.yml,.sh,.sql,.vue,.svelte,.kt,.swift,.dart,.lua,.r,.ipynb,.csv,.log,image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <ImageViewer
        src={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
      />
    </div>
  );

  if (variant === "centered") {
    return <div className="w-full max-w-3xl">{box}</div>;
  }

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30">
      <div
        className="pointer-events-auto w-full"
        style={{
          background:
            "linear-gradient(to top, var(--bg) 0%, var(--bg) 40%, rgba(13,13,13,0.85) 65%, rgba(13,13,13,0.4) 85%, rgba(13,13,13,0) 100%)",
          paddingTop: "60px",
        }}
      >
        <div className="mx-auto w-full max-w-3xl px-2 pb-2 sm:px-4 sm:pb-4">
          {box}
        </div>
      </div>
    </div>
  );
}
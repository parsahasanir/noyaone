"use client";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

export default function CodeBlock({
  language,
  value,
}: {
  language: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const lang = (language || "text").toLowerCase();
  const showLang = lang !== "text" && lang !== "plain";

  return (
    <div className="code-block w-full min-w-0" dir="ltr">
      <div className="code-head">
        {showLang && <span className="lang">{lang}</span>}
        <button
          onClick={copy}
          className="copy-btn"
          title={copied ? "کپی شد" : "کپی"}
          aria-label="copy code"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
      <SyntaxHighlighter
        language={showLang ? lang : "text"}
        style={oneDark}
        PreTag="pre"
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "12px 14px",
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'var(--font-mono), ui-monospace, "Cascadia Code", "Fira Code", Menlo, Consolas, monospace',
            fontSize: "13px",
          },
        }}
        wrapLongLines={false}
      >
        {value.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}
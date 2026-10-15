"use client";
import { useEffect, useRef, useState } from "react";

type MouseFn = (x: number, y: number) => void;
const mouseFns = new Set<MouseFn>();
let mouseAttached = false;
function attachMouse() {
  if (mouseAttached) return;
  mouseAttached = true;
  window.addEventListener(
    "mousemove",
    (e) => {
      for (const fn of mouseFns) fn(e.clientX, e.clientY);
    },
    { passive: true }
  );
}

const MAX_OFFSET_RATIO = 0.28;
const MAX_DIST = 900;
const LID_SAFETY = 80;

const BODY_COLORS = [
  "rgb(86,134,254)",
  "#5686fe",
  "rgb(245,132,187)",
  "#f584bb",
];

function isBodyColor(fill: string): boolean {
  const f = fill.replace(/\s/g, "").toLowerCase();
  return BODY_COLORS.includes(f);
}

function isWhiteColor(fill: string): boolean {
  const f = fill.replace(/\s/g, "").toLowerCase();
  return (
    f === "rgb(255,255,255)" ||
    f === "#fff" ||
    f === "#ffffff" ||
    f === "white"
  );
}

/* 🔧 استخراج bbox از d attribute — مقاوم در برابر رندر نشدن */
function bboxFromD(d: string) {
  const nums = d.match(/-?\d+\.?\d*/g)?.map(Number) || [];
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i];
    const y = nums[i + 1];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export default function PersonalityLogo({
  src,
  size = 48,
  className = "",
  bgColor,
}: {
  src: string;
  size?: number;
  className?: string;
  bgColor: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [svgText, setSvgText] = useState<string | null>(null);

  /* ۱) لود SVG */
  useEffect(() => {
    let cancelled = false;
    setSvgText(null);
    (async () => {
      try {
        const url = `${src}?v=${Date.now()}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          console.warn("[Logo] fetch failed:", url, res.status);
          return;
        }
        const text = await res.text();
        if (cancelled) return;
        console.log("[Logo] loaded:", src, "length:", text.length);
        setSvgText(text);
      } catch (e) {
        console.warn("[Logo] fetch error:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  /* ۲) پردازش پس از mount */
  useEffect(() => {
    if (!svgText || !wrapRef.current) return;

    const wrap = wrapRef.current;
    wrap.innerHTML = svgText;

    /* 🔧 صبر کن تا یه فریم رندر بشه، بعد getBBox صدا بزن */
    const rafId = requestAnimationFrame(() => {
      const svg = wrap.querySelector("svg") as SVGSVGElement | null;
      if (!svg) return;

      const ns = "http://www.w3.org/2000/svg";

      const wAttr = svg.getAttribute("width") || "1920";
      const hAttr = svg.getAttribute("height") || "1918";
      const w = parseFloat(wAttr.replace("px", "")) || 1920;
      const h = parseFloat(hAttr.replace("px", "")) || 1918;

      if (!svg.getAttribute("viewBox")) {
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      }
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      (svg as any).style.display = "block";

      const allPaths = Array.from(svg.querySelectorAll("path"));

      /* 🎨 لاگ برای دیباگ */
      console.log(
        "[Logo] fills:",
        allPaths.map((p) => p.getAttribute("fill"))
      );

      /* بدنه */
      const bodyPath = allPaths.find((p) =>
        isBodyColor(p.getAttribute("fill") || "")
      );
      if (bodyPath) {
        bodyPath.setAttribute("fill", bgColor);
      } else {
        console.warn("[Logo] body path پیدا نشد");
      }

      /* path های سفید (چشم‌ها) */
      const eyePaths = allPaths.filter((p) =>
        isWhiteColor(p.getAttribute("fill") || "")
      );

      console.log("[Logo] سفیدها:", eyePaths.length);
      if (eyePaths.length === 0) return;

      /* 🔧 استفاده از bboxFromD به جای getBBox */
      const withBbox = eyePaths.map((p) => ({
        path: p,
        bb: bboxFromD(p.getAttribute("d") || ""),
      }));

      /* مرتب‌سازی بر اساس x */
      withBbox.sort((a, b) => a.bb.x - b.bb.x);

      /* 🎯 گروه‌بندی با همپوشانی افقی */
      type Group = { paths: SVGPathElement[]; bb: any; right: number };
      const groups: Group[] = [];

      for (const item of withBbox) {
        const itemLeft = item.bb.x;
        const itemRight = item.bb.x + item.bb.width;
        const last = groups[groups.length - 1];

        if (last && itemLeft < last.right) {
          last.paths.push(item.path);
          last.right = Math.max(last.right, itemRight);
          last.bb = {
            x: Math.min(last.bb.x, item.bb.x),
            y: Math.min(last.bb.y, item.bb.y),
            width: Math.max(
              last.bb.x + last.bb.width,
              item.bb.x + item.bb.width
            ) - Math.min(last.bb.x, item.bb.x),
            height: Math.max(
              last.bb.y + last.bb.height,
              item.bb.y + item.bb.height
            ) - Math.min(last.bb.y, item.bb.y),
          };
        } else {
          groups.push({
            paths: [item.path],
            bb: { ...item.bb },
            right: itemRight,
          });
        }
      }

      console.log("[Logo] گروه‌ها:", groups.length);

      /* defs clipPath = بدنه */
      let defs = svg.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS(ns, "defs");
        svg.insertBefore(defs, svg.firstChild);
      }
      const rawId = Math.random().toString(36).slice(2, 8);
      const bodyClipId = `body-${rawId}`;
      const bodyClip = document.createElementNS(ns, "clipPath");
      bodyClip.setAttribute("id", bodyClipId);
      const bodyClipPath = document.createElementNS(ns, "path");
      bodyClipPath.setAttribute("d", bodyPath?.getAttribute("d") || "");
      bodyClip.appendChild(bodyClipPath);
      defs.appendChild(bodyClip);

      const runtime: any = { svg, eyes: [] };
      const blinkJobs: { el: SVGRectElement; travel: number }[] = [];

      groups.forEach((group) => {
        const bbox = group.bb;

        const outerG = document.createElementNS(ns, "g");
        outerG.setAttribute("clip-path", `url(#${bodyClipId})`);

        const eyeG = document.createElementNS(ns, "g");
        for (const p of group.paths) {
          const clone = document.createElementNS(ns, "path");
          clone.setAttribute("d", p.getAttribute("d") || "");
          clone.setAttribute("fill", "#ffffff");
          clone.setAttribute("fill-rule", "evenodd");
          eyeG.appendChild(clone);
        }
        outerG.appendChild(eyeG);

        const maxOffsetY = (bbox.height / 2) * MAX_OFFSET_RATIO;
        const lidRestBottom = bbox.y - maxOffsetY - LID_SAFETY;
        const lidHeight = bbox.height + 600;
        const lidY = lidRestBottom - lidHeight;

        const lid = document.createElementNS(ns, "rect");
        lid.setAttribute("x", String(bbox.x - 30));
        lid.setAttribute("y", String(lidY));
        lid.setAttribute("width", String(bbox.width + 60));
        lid.setAttribute("height", String(lidHeight));
        lid.setAttribute("fill", bgColor);
        outerG.appendChild(lid);

        const targetBottom = bbox.y + bbox.height + maxOffsetY + 20;
        const travel = targetBottom - lidRestBottom;
        blinkJobs.push({ el: lid, travel });

        for (const p of group.paths) p.style.display = "none";
        svg.appendChild(outerG);

        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        runtime.eyes.push({
          eyeG,
          center: {
            x: cx,
            y: cy,
            rx: (bbox.width / 2) * MAX_OFFSET_RATIO,
            ry: (bbox.height / 2) * MAX_OFFSET_RATIO,
          },
        });
      });

      /* ۳) موس */
      attachMouse();
      const onMouse: MouseFn = (clientX, clientY) => {
        const rect = wrap.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const vb = (svg.getAttribute("viewBox") || `0 0 ${w} ${h}`)
          .split(/[\s,]+/)
          .map(Number);
        const [vbX, vbY, vbW, vbH] = vb;
        const scaleX = vbW / rect.width;
        const scaleY = vbH / rect.height;
        const mx = (clientX - rect.left) * scaleX + vbX;
        const my = (clientY - rect.top) * scaleY + vbY;

        for (const e of runtime.eyes) {
          moveEye(e.eyeG, e.center, mx, my);
        }
      };
      mouseFns.add(onMouse);

      /* ۴) پلک */
      let timerId: ReturnType<typeof setTimeout> | null = null;
      let alive = true;
      const blink = () => {
        for (const job of blinkJobs) {
          try {
            job.el.animate(
              [
                { transform: "translateY(0)" },
                { transform: `translateY(${job.travel}px)` },
                { transform: "translateY(0)" },
              ],
              { duration: 170, easing: "ease-in-out" }
            );
          } catch {}
        }
        scheduleNext();
      };
      const scheduleNext = () => {
        if (!alive) return;
        const delay = 2500 + Math.random() * 3500;
        timerId = setTimeout(blink, delay);
      };
      scheduleNext();

      /* ذخیره‌ی cleanup */
      (wrap as any).__cleanup = () => {
        alive = false;
        if (timerId) clearTimeout(timerId);
        mouseFns.delete(onMouse);
      };
    });

    return () => {
      cancelAnimationFrame(rafId);
      if ((wrap as any).__cleanup) {
        (wrap as any).__cleanup();
        (wrap as any).__cleanup = null;
      }
    };
  }, [svgText, bgColor]);

  return (
    <div
      ref={wrapRef}
      className={`inline-block select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

function moveEye(
  eye: SVGGElement | null,
  center: { x: number; y: number; rx: number; ry: number },
  mouseX: number,
  mouseY: number
) {
  if (!eye) return;
  const dx = mouseX - center.x;
  const dy = mouseY - center.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) {
    eye.style.transform = "translate(0px, 0px)";
    return;
  }
  const ratio = Math.min(1, dist / MAX_DIST);
  const angle = Math.atan2(dy, dx);
  const ox = Math.cos(angle) * center.rx * ratio;
  const oy = Math.sin(angle) * center.ry * ratio;
  eye.style.transform = `translate(${ox}px, ${oy}px)`;
}
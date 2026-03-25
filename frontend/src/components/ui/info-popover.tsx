import { CircleHelp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type InfoPopoverProps = {
  content: string;
  title?: string;
  align?: "left" | "right";
};

export function InfoPopover({ content, title = "About this section", align = "right" }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={title}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300/90 bg-white/80 text-slate-500 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-brand-500 dark:hover:text-brand-300"
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div
          className={`absolute top-full z-[70] mt-2 w-64 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-[0_20px_40px_-24px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="mt-1.5 leading-5 text-slate-600 dark:text-slate-300">{content}</p>
        </div>
      ) : null}
    </div>
  );
}

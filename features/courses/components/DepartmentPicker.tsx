"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { ChevronIcon } from "@/components/ui/icons";

// Below this width the departments fold away behind a toggle above the results.
const NARROW = "(max-width: 899px)";
function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(NARROW);
  query.addEventListener("change", onChange);
  return () => {
    query.removeEventListener("change", onChange);
  };
}
const isNarrow = () => window.matchMedia(NARROW).matches;
const isWide = () => false;
const CELL =
  "relative z-10 h-10 cursor-pointer rounded-[9px] font-display text-sm leading-none font-medium tracking-[0.01em] transition-colors duration-200";

interface DepartmentPickerProps {
  departments: string[];
  current: string;
  onSelect: (department: string) => void;
}

/**
 * Every department as a grid of toggle buttons, A to Z. A blue block slides to
 * the chosen one. On narrow screens the grid folds behind a toggle.
 */
export default function DepartmentPicker({
  departments,
  current,
  onSelect,
}: DepartmentPickerProps) {
  const narrow = useSyncExternalStore(subscribeToWidth, isNarrow, isWide);
  const [open, setOpen] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);
  // The URL can name a department the catalogue no longer lists; keep it selectable.
  const options =
    current && !departments.includes(current)
      ? [current, ...departments]
      : departments;

  useLayoutEffect(() => {
    const block = highlight.current;
    const container = grid.current;
    if (!block || !container) {
      return;
    }
    function place(animate: boolean) {
      const button = container?.querySelector<HTMLButtonElement>(
        `[data-department="${current}"]`,
      );
      if (!block) {
        return;
      }
      if (!button) {
        block.style.opacity = "0";
        return;
      }
      if (!animate) {
        block.style.transition = "none";
      }
      block.style.opacity = "1";
      block.style.width = `${String(button.offsetWidth)}px`;
      block.style.height = `${String(button.offsetHeight)}px`;
      block.style.transform = `translate(${String(button.offsetLeft)}px, ${String(button.offsetTop)}px)`;
      if (!animate) {
        block.getBoundingClientRect(); // Force a reflow so the transition restarts.
        block.style.transition = "";
      }
    }
    place(placed.current);
    placed.current = true;
    const observer = new ResizeObserver(() => {
      place(false);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
    };
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- re-place the block once the department buttons replace the loading placeholders.
  }, [current, options.length]);

  function choose(department: string) {
    onSelect(department);
    if (narrow) {
      setOpen(false);
    }
  }

  const folded = narrow && !open;

  return (
    <nav
      aria-labelledby="departments-heading"
      className="min-[900px]:sticky min-[900px]:top-[226px]"
    >
      <h2
        id="departments-heading"
        className="mb-2.5 font-display text-[13px] leading-none font-medium text-subtle max-[899px]:sr-only"
      >
        Departments
      </h2>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="department-grid"
        onClick={() => {
          setOpen((value) => !value);
        }}
        className="flex h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-line bg-surface px-3.5 font-display text-[15px] leading-none font-medium text-ink-2 min-[900px]:hidden"
      >
        <span>
          Department:{" "}
          <b className="font-semibold text-brand-strong">{current || "All"}</b>
        </span>
        <ChevronIcon
          className={`size-[18px] transition-transform duration-250 ease-soft ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id="department-grid"
        inert={folded}
        className={`grid transition-[grid-template-rows] duration-[380ms] ease-soft ${folded ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}
      >
        <div className="min-h-0 overflow-hidden min-[900px]:max-h-[calc(100dvh-246px)] min-[900px]:overflow-y-auto min-[900px]:overscroll-contain min-[900px]:pr-1">
          <div
            ref={grid}
            role="group"
            aria-label="Filter by department"
            className="relative mt-2.5 grid grid-cols-4 gap-1 max-[899px]:grid-cols-[repeat(auto-fill,minmax(64px,1fr))] min-[900px]:mt-0"
          >
            <span
              ref={highlight}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 z-0 rounded-[9px] bg-brand opacity-0 shadow-[0_8px_18px_-10px_rgb(37_99_235/0.8)] transition-[transform,width,height] duration-[380ms] ease-soft"
            />
            {["", ...options].map((department) => {
              const selected = department === current;
              return (
                <button
                  key={department || "all"}
                  type="button"
                  data-department={department}
                  aria-pressed={selected}
                  onClick={() => {
                    choose(department);
                  }}
                  className={`${CELL} ${department ? "" : "col-span-full px-3 text-left"} ${
                    selected
                      ? "font-semibold text-white"
                      : "text-muted hover:bg-well hover:text-ink"
                  }`}
                >
                  {department || "All departments"}
                </button>
              );
            })}
            {departments.length === 0 &&
              Array.from({ length: 16 }, (_, index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className="h-10 animate-pulse rounded-[9px] bg-well"
                />
              ))}
          </div>
          <p className="mt-3 text-[13px] leading-snug text-subtle max-[899px]:hidden">
            Every department in the catalogue, A to Z.
          </p>
        </div>
      </div>
    </nav>
  );
}

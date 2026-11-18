import { ArrowIcon } from "@/components/ui/icons";

/** Page numbers around the current page, with gaps: 1 … 4 5 6 … 116. */
function pageItems(page: number, count: number): (number | "gap")[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1);
  const shown = new Set([1, count, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((value) => shown.add(value));
  if (page >= count - 2) [count - 3, count - 2, count - 1].forEach((value) => shown.add(value));
  const sorted = [...shown].filter((value) => value >= 1 && value <= count).sort((a, b) => a - b);
  return sorted.flatMap((value, index) => (index && value - sorted[index - 1] > 1 ? ["gap" as const, value] : [value]));
}

const STEP =
  "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-ctl border border-line-strong bg-surface px-3 font-display text-sm leading-none font-medium text-ink-2 transition-[background-color,scale] duration-150 hover:not-disabled:bg-well active:not-disabled:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45";

type PaginationProps = {
  page: number;
  pageCount: number;
  firstShown: number;
  lastShown: number;
  total: number;
  disabled: boolean;
  onPage: (page: number) => void;
};

export default function Pagination({ page, pageCount, firstShown, lastShown, total, disabled, onPage }: PaginationProps) {
  return (
    <nav aria-label="Course results pages" className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 max-sm:justify-center">
      <p className="text-sm text-subtle tabular-nums max-sm:w-full max-sm:text-center">
        Showing {firstShown.toLocaleString()}–{lastShown.toLocaleString()} of {total.toLocaleString()}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1.5">
          <button type="button" className={STEP} disabled={disabled || page === 1} aria-label="Previous page" onClick={() => onPage(page - 1)}>
            <ArrowIcon className="size-4 rotate-180" />
            <span className="max-sm:hidden">Previous</span>
          </button>
          <ol className="flex items-center gap-1">
            {pageItems(page, pageCount).map((item, index) =>
              item === "gap" ? (
                <li key={`gap-${index}`} aria-hidden="true" className="w-6 text-center text-faint">…</li>
              ) : (
                <li key={item} className={item === page ? "" : "max-sm:hidden"}>
                  <button
                    type="button"
                    disabled={disabled && item !== page}
                    aria-current={item === page ? "page" : undefined}
                    aria-label={`Page ${item}`}
                    onClick={() => item !== page && onPage(item)}
                    className="size-10 cursor-pointer rounded-ctl border border-transparent font-display text-[15px] leading-none font-medium text-muted tabular-nums transition-colors duration-150 hover:not-aria-[current]:bg-well hover:not-aria-[current]:text-ink disabled:cursor-not-allowed aria-[current]:cursor-default aria-[current]:border-brand-200 aria-[current]:bg-brand-50 aria-[current]:font-semibold aria-[current]:text-brand-strong max-sm:w-auto max-sm:px-3"
                  >
                    {item}
                    {item === page && <span className="sm:hidden"> of {pageCount}</span>}
                  </button>
                </li>
              ),
            )}
          </ol>
          <button type="button" className={STEP} disabled={disabled || page === pageCount} aria-label="Next page" onClick={() => onPage(page + 1)}>
            <span className="max-sm:hidden">Next</span>
            <ArrowIcon className="size-4" />
          </button>
        </div>
      )}
    </nav>
  );
}

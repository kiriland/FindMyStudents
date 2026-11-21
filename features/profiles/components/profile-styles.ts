/** Layout and type styles shared by the Profile page's server and client parts. */
export const PROFILE_GRID =
  "grid items-start gap-[clamp(28px,4vw,56px)] lg:grid-cols-[320px_minmax(0,1fr)]";
export const ID_CARD =
  "flex flex-col gap-5 rounded-panel border border-line bg-surface p-[22px] sm:p-7 lg:sticky lg:top-[92px]";
export const SECTION_TITLE =
  "font-display text-[22px] leading-[1.25] font-semibold tracking-[-0.02em]";
/** A titled white panel in edit mode. */
export const PANEL = "rounded-card border border-line bg-surface";
export const PANEL_HEAD =
  "flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-line px-4 py-[18px] sm:px-[22px]";
export const PANEL_TITLE =
  "font-display text-[17px] leading-[1.3] font-semibold tracking-[-0.01em]";
export const PANEL_BODY =
  "flex flex-col gap-4 px-4 pt-5 pb-[22px] sm:px-[22px]";
/** A Connection Request's message, shown only to its recipient. */
export const REQUEST_MESSAGE =
  "rounded-ctl bg-well px-3 py-2.5 text-[15px] leading-[1.55] whitespace-pre-wrap text-ink-2 [overflow-wrap:anywhere]";
/** A confirmation dialog; set its width alongside. */
export const DIALOG =
  "m-auto rounded-card border border-line bg-surface p-6 text-ink shadow-float backdrop:bg-ink/40";

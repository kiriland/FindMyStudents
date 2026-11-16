// Complete class names keep Tailwind's source detection reliable.
export const focusScope =
  "[&_:is(a,button,input,select):focus-visible]:outline-3 [&_:is(a,button,input,select):focus-visible]:outline-indigo-500 [&_:is(a,button,input,select):focus-visible]:outline-offset-3";

export const actionStyles = {
  secondary:
    "inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-[9px] text-sm font-semibold text-inherit no-underline enabled:hover:bg-zinc-100 [&:is(a):hover]:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:enabled:hover:bg-zinc-800 dark:[&:is(a):hover]:bg-zinc-800",
  auth: "cursor-pointer rounded-lg bg-[#a9a9a9] px-4 py-3 font-semibold text-white hover:bg-[#808080]",
  text: "cursor-pointer text-[13px] underline underline-offset-4",
  close:
    "cursor-pointer rounded-[7px] border border-zinc-300 px-3 py-1.5 text-[13px] dark:border-zinc-600",
  navigation:
    "inline-block shrink-0 cursor-pointer bg-transparent px-3 py-2 text-inherit no-underline whitespace-nowrap focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-3",
  signup:
    "inline-block shrink-0 rounded-md border border-current/25 px-4 py-2 text-inherit no-underline whitespace-nowrap focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-3",
};

export type ActionVariant = keyof typeof actionStyles;

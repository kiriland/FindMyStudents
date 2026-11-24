import type { InputHTMLAttributes, ReactNode, Ref } from "react";

import { SearchIcon } from "./icons";

type SearchBarProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  ref?: Ref<HTMLInputElement>;
  /** Shown after the input inside the bar, such as a clear button. */
  trailing?: ReactNode;
};

/** The bordered course search bar used on the landing page, the course directory and the profile editor. */
export default function SearchBar({
  ref,
  trailing,
  className = "",
  ...input
}: SearchBarProps) {
  return (
    <div
      role="search"
      className={`group relative flex h-14 items-center rounded-2xl border-[1.5px] border-line-strong bg-surface pr-2.5 pl-[50px] text-left transition-[border-color,box-shadow] duration-250 ease-soft focus-within:border-brand focus-within:shadow-[0_0_0_5px_rgb(37_99_235/0.12),0_18px_40px_-24px_rgb(30_58_138/0.45)] hover:border-faint focus-within:hover:border-brand sm:h-16 sm:pl-[58px] ${className}`}
    >
      <SearchIcon className="absolute left-4 size-6 text-subtle transition-[color,scale] duration-250 ease-soft group-focus-within:scale-105 group-focus-within:text-brand sm:left-5" />
      <input
        ref={ref}
        type="search"
        maxLength={300}
        autoComplete="off"
        enterKeyHint="search"
        className="h-full min-w-0 flex-1 border-0 bg-transparent text-[17px] placeholder:text-subtle focus:outline-none sm:text-[19px]"
        {...input}
      />
      {trailing}
    </div>
  );
}

import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentProps,
} from "react";
import { actionStyles, type ActionVariant } from "./ui/styles";

export default function Button({
  type = "button",
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ActionVariant }) {
  return (
    <button
      type={type}
      className={`${actionStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "secondary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: ActionVariant }) {
  return (
    <Link className={`${actionStyles[variant]} ${className}`} {...props} />
  );
}

export function TextLink({
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={`${actionStyles.text} ${className}`} {...props} />;
}

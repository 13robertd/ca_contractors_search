"use client";

import { forwardRef } from "react";

/**
 * 32px circle icon button. Mirrors the home nav menu button + the saved
 * bookmark toggle on /search cards. Pass a lucide icon as children.
 *
 * Tones:
 *   neutral  white surface + line-subtle border (default)
 *   accent   soft-blue surface, white icon (used for "saved" active state)
 *   brand    crimson surface, white icon (kept for legacy call sites)
 *   ghost    transparent, no border, hover → surface-subtle
 */

type Tone = "neutral" | "accent" | "brand" | "ghost";
type Size = "sm" | "md";

interface Props
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  size?: Size;
  tone?: Tone;
  children: React.ReactNode;
}

const SIZE_CLS: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
};

const TONE_CLS: Record<Tone, string> = {
  neutral:
    "bg-white border border-line-subtle text-ink-hero hover:bg-surface-subtle",
  accent:
    "bg-accent border border-accent text-white hover:bg-accent-hover",
  brand:
    "bg-brand border border-brand text-white hover:bg-brand-hover",
  ghost: "bg-transparent text-ink-hero hover:bg-surface-subtle",
};

const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { size = "sm", tone = "neutral", className = "", children, type, ...rest },
  ref
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type ?? "button"}
      className={`inline-flex items-center justify-center rounded-full transition-colors focus-brand ${SIZE_CLS[size]} ${TONE_CLS[tone]} ${className}`}
    >
      {children}
    </button>
  );
});

export default IconButton;

"use client";

import { forwardRef } from "react";

/**
 * h-9 pill-shaped button shared by the /search Filters chip and the mobile
 * list/map toggle. "neutral" is the default hover-surface-subtle style
 * (also the shape/size of the home nav Saved link — see PillLink for
 * the anchor version). "active" is the inverted dark chip.
 */

type Variant = "neutral" | "active";
type Size = "sm" | "md";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

const VARIANT_CLS: Record<Variant, string> = {
  neutral:
    "bg-white border border-line-subtle text-ink-hero hover:bg-surface-subtle",
  active: "bg-ink-hero text-white",
};

const SIZE_CLS: Record<Size, string> = {
  sm: "h-8 px-4",
  md: "h-9 px-4",
};

const PillButton = forwardRef<HTMLButtonElement, Props>(function PillButton(
  { variant = "neutral", size = "md", className = "", children, type, ...rest },
  ref
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type ?? "button"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-colors focus-brand ${SIZE_CLS[size]} ${VARIANT_CLS[variant]} ${className}`}
    >
      {children}
    </button>
  );
});

export default PillButton;

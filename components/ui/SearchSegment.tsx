"use client";

import { useSearchDividerFade, useSearchSegmentState } from "./SearchPill";

/**
 * Segment primitives used inside <SearchPill>. All three consume the pill's
 * hover-state context so parents only pass plain value/onChange props.
 *
 *   <SearchSegment id="where" label="Where" value={…} onChange={…} rounded="left" />
 *   <SearchSegmentSelect id="when" label="When" value={…} onChange={…} options={…} />
 *   <SearchSegmentDivider between={["where","trade"]} />
 */

interface BaseProps {
  id: string;
  label: string;
  rounded?: "left" | "right";
  /** Utility class override for the right-edge padding (e.g. "pr-2"). */
  paddingRight?: string;
}

function rootClasses({
  isHovered,
  isDimmed,
  rounded,
  paddingRight,
  cursor,
}: {
  isHovered: boolean;
  isDimmed: boolean;
  rounded?: "left" | "right";
  paddingRight?: string;
  cursor: "text" | "pointer";
}) {
  const rounding =
    rounded === "left"
      ? "rounded-l-full"
      : rounded === "right"
      ? "rounded-r-full"
      : "";
  const cursorCls = cursor === "text" ? "cursor-text" : "cursor-pointer";
  return `group flex-1 min-w-0 h-full flex flex-col justify-center px-6 ${
    paddingRight ?? ""
  } ${rounding} ${cursorCls} transition-colors ${
    isHovered ? "bg-surface-subtle" : ""
  } ${isDimmed ? "opacity-60" : ""}`;
}

function valueFontFor(size: "md" | "lg") {
  return size === "lg" ? "text-[14px]" : "text-[13px]";
}

/* ---------- Text segment ---------- */

interface TextProps extends BaseProps {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}

export function SearchSegment({
  id,
  label,
  rounded,
  paddingRight,
  placeholder,
  value,
  onChange,
}: TextProps) {
  const { isHovered, isDimmed, onEnter, size } = useSearchSegmentState(id);

  return (
    <label
      onMouseEnter={onEnter}
      className={rootClasses({
        isHovered,
        isDimmed,
        rounded,
        paddingRight,
        cursor: "text",
      })}
    >
      <span className="text-[11px] font-medium text-ink-hero">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-0.5 w-full bg-transparent border-0 outline-none ${valueFontFor(
          size
        )} text-ink-hero placeholder:text-ink-tertiary`}
      />
    </label>
  );
}

/* ---------- Select segment ---------- */

interface SelectProps extends BaseProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export function SearchSegmentSelect({
  id,
  label,
  rounded,
  paddingRight,
  value,
  onChange,
  options,
}: SelectProps) {
  const { isHovered, isDimmed, onEnter, size } = useSearchSegmentState(id);

  return (
    <label
      onMouseEnter={onEnter}
      className={rootClasses({
        isHovered,
        isDimmed,
        rounded,
        paddingRight,
        cursor: "pointer",
      })}
    >
      <span className="text-[11px] font-medium text-ink-hero">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-0.5 w-full bg-transparent border-0 outline-none ${valueFontFor(
          size
        )} text-ink-hero cursor-pointer appearance-none`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ---------- Divider ---------- */

export function SearchSegmentDivider({
  between,
}: {
  between: [string, string];
}) {
  const touchesHover = useSearchDividerFade(between);
  return (
    <span
      aria-hidden
      className={`h-8 w-px bg-line-subtle transition-opacity ${
        touchesHover ? "opacity-0" : "opacity-100"
      }`}
    />
  );
}

interface Props {
  labels?: string[] | null;
  max?: number;
}

export default function ClassificationTags({ labels, max }: Props) {
  const list = labels ?? [];
  if (list.length === 0) {
    return <span className="text-xs text-slate-400">No classifications listed</span>;
  }
  const shown = typeof max === "number" ? list.slice(0, max) : list;
  const remaining = list.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((label) => (
        <span key={label} className="chip">
          {label}
        </span>
      ))}
      {remaining > 0 ? (
        <span className="chip bg-white text-slate-500">+{remaining} more</span>
      ) : null}
    </div>
  );
}

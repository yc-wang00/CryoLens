interface ConfidenceBarProps {
  value: number;
  label?: string;
}

export function ConfidenceBar({ value, label }: ConfidenceBarProps) {
  const color =
    value >= 80 ? "bg-secondary text-secondary"
    : value >= 50 ? "bg-primary text-primary"
    : "bg-outline text-outline";
  const [barColor, textColor] = color.split(" ");

  return (
    <div className="flex items-center gap-2">
      <span className={`tabular-nums text-[11px] font-medium ${textColor}`}>
        {value}%
      </span>
      <div className="w-14 h-[3px] bg-surface-container rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {label && (
        <span className="text-[10px] text-outline-variant uppercase tracking-[0.04em]">
          {label}
        </span>
      )}
    </div>
  );
}

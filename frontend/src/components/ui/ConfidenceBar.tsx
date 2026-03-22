interface ConfidenceBarProps {
  value: number;
  label?: string;
}

export function ConfidenceBar({ value, label }: ConfidenceBarProps) {
  const color =
    value >= 80 ? "bg-success text-success"
    : value >= 50 ? "bg-accent text-accent"
    : "bg-text-tertiary text-text-tertiary";

  const [barColor, textColor] = color.split(" ");

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs font-headline font-bold tabular-nums ${textColor}`}>
        {value}%
      </span>
      {label && (
        <span className="text-[11px] text-text-tertiary">{label}</span>
      )}
    </div>
  );
}

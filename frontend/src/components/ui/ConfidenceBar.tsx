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
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-1">
        <span className={`text-xs font-headline font-bold ${textColor}`}>
          {value}%
        </span>
        <div className="w-16 h-1 bg-surface-container">
          <div
            className={`h-full ${barColor}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
      {label && (
        <span className="text-[9px] font-label font-bold text-on-surface-variant uppercase">
          {label}
        </span>
      )}
    </div>
  );
}

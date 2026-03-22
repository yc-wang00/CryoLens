import { cn } from "../../lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({
  value,
  className,
}: ProgressBarProps) {
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}

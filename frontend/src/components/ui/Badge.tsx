interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "warning";
}

const variants = {
  default: "bg-surface-muted text-text-secondary",
  accent: "bg-accent-subtle text-accent",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`${variants[variant]} text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide`}
    >
      {children}
    </span>
  );
}

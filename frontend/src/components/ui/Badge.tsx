interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "neutral" | "terracotta";
}

const variants = {
  primary: "bg-primary-container/60 text-on-primary-container",
  secondary: "bg-secondary-container/60 text-on-secondary-container",
  tertiary: "bg-tertiary-container/60 text-on-tertiary-container",
  neutral: "bg-surface-high text-on-surface-variant",
  terracotta: "bg-terracotta-muted text-terracotta",
};

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return (
    <span
      className={`${variants[variant]} text-[10px] font-medium px-1.5 py-0.5 rounded-xs uppercase tracking-[0.04em] leading-none inline-flex items-center`}
    >
      {children}
    </span>
  );
}

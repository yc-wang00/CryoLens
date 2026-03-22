interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "neutral" | "terracotta";
}

const variants = {
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
  neutral: "bg-surface-highest text-on-surface-variant",
  terracotta: "bg-terracotta/10 text-terracotta",
};

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return (
    <span
      className={`${variants[variant]} text-[10px] font-label font-bold px-2 py-0.5 rounded-sm uppercase tracking-tighter`}
    >
      {children}
    </span>
  );
}

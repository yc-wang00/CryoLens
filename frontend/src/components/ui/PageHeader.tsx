interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  count?: number;
}

export function PageHeader({ title, description, actions, count }: PageHeaderProps) {
  return (
    <header className="flex items-end justify-between mb-8">
      <div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-on-surface">
            {title}
          </h1>
          {count !== undefined && (
            <span className="tabular-nums text-[12px] text-outline-variant">
              {count}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[13px] text-on-surface-variant mt-1 max-w-xl leading-relaxed tracking-[-0.006em]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </header>
  );
}

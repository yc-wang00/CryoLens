interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-on-surface-variant text-sm leading-relaxed font-body">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </header>
  );
}

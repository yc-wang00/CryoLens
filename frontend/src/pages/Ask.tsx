import { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { Icon } from "../components/ui/Icon";

function EvidenceSidebar() {
  const stats = [
    { icon: "description", label: "Papers", value: "379" },
    { icon: "labs", label: "Findings", value: "760" },
    { icon: "science", label: "Compounds", value: "53" },
    { icon: "experiment", label: "Formulations", value: "41" },
  ];

  return (
    <div className="p-5 space-y-6">
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-4">
          Database
        </h3>
        <div className="space-y-1">
          {stats.map(({ icon, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-bg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Icon name={icon} className="text-text-tertiary !text-[18px]" />
                <span className="text-[13px] text-text-secondary font-medium">
                  {label}
                </span>
              </div>
              <span className="text-[13px] font-headline font-bold text-text-primary tabular-nums">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          Connected
        </h3>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[12px] text-text-secondary">
            MCP Server — Railway
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[12px] text-text-secondary">
            Database — Supabase
          </span>
        </div>
      </div>
    </div>
  );
}

export function AskPage() {
  const [message, setMessage] = useState("");

  const suggestions = [
    "Compare VS55 vs M22 formulations",
    "Best CPAs for kidney vitrification at 4°C?",
    "What gaps exist in permeability data?",
    "Design a low-toxicity cocktail for brain tissue",
  ];

  return (
    <Layout sidebar={<EvidenceSidebar />}>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-3.5rem)] px-6">
        {/* Welcome state */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mb-5">
            <Icon name="ac_unit" className="text-white !text-[22px]" />
          </div>
          <h2 className="text-[22px] font-headline font-bold tracking-tight text-text-primary mb-2">
            Ask CryoLens
          </h2>
          <p className="text-[14px] text-text-secondary max-w-md leading-relaxed mb-10">
            Query the cryopreservation knowledge base. Grounded in real
            experimental data from 100+ papers.
          </p>

          <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => setMessage(q)}
                className="px-4 py-3 bg-surface border border-border rounded-lg text-[13px] text-text-secondary text-left hover:border-border-hover hover:shadow-sm transition-all leading-snug"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="pb-6 pt-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about cryopreservation..."
                rows={1}
                className="w-full bg-surface border border-border focus:border-accent focus:ring-2 focus:ring-accent/10 text-[14px] py-3 px-4 rounded-lg resize-none font-body text-text-primary placeholder:text-text-tertiary outline-none transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
            <button className="bg-accent hover:bg-accent-hover text-white px-5 py-3 rounded-lg text-[13px] font-semibold transition-colors flex items-center gap-2 shrink-0">
              <Icon name="send" className="!text-[16px]" />
              Send
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

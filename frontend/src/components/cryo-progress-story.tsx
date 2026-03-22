/**
 * CRYO PROGRESS STORY
 * ===================
 * Compact year-based visualization for the CryoSight Sources page.
 *
 * KEY CONCEPTS:
 * - keep formulation chronology separate from literature-growth chronology
 * - show evidence growth without turning the page into a generic dashboard
 * - preserve the compact control-room visual density from the hackathon shell
 *
 * USAGE:
 * - render on the Sources page with live `storyStats`
 *
 * MEMORY REFERENCES:
 * - MEM-0004
 * - MEM-0005
 * - MEM-0007
 */

import { Badge } from "./ui/badge";
import type { CryoLensStoryStats, CryoLensStoryYear } from "../data/cryo-lens";

const CHART_WIDTH = 960;
const CHART_HEIGHT = 320;
const CHART_PADDING = {
  bottom: 42,
  left: 52,
  right: 18,
  top: 54,
};

function buildTickYears(yearly: CryoLensStoryYear[]): number[] {
  const years = yearly.map((point) => point.year);
  if (years.length <= 8) {
    return years;
  }

  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const interval = years.length > 24 ? 4 : 3;
  const tickYears = years.filter((year) => year === firstYear || year === lastYear || (year - firstYear) % interval === 0);
  return Array.from(new Set(tickYears));
}

function selectMilestoneHighlights(storyStats: CryoLensStoryStats) {
  const firstPaperYear = storyStats.firstPaperYear ?? Number.POSITIVE_INFINITY;
  const lastYear = storyStats.lastYear ?? Number.NEGATIVE_INFINITY;

  return storyStats.milestones
    .map((milestone) => ({
      milestone,
      score:
        milestone.linkedFindings * 4
        + (milestone.type === "benchmark" ? 7 : 0)
        + (milestone.year <= firstPaperYear ? 5 : 0)
        + (milestone.year >= lastYear - 2 ? 3 : 0),
    }))
    .sort((left, right) => right.score - left.score || left.milestone.year - right.milestone.year || left.milestone.name.localeCompare(right.milestone.name))
    .slice(0, 7)
    .map((entry) => entry.milestone)
    .sort((left, right) => left.year - right.year || left.name.localeCompare(right.name))
    .slice(0, 5);
}

function formatMilestoneSupport(linkedFindings: number): string {
  if (linkedFindings === 1) {
    return "1 linked finding";
  }

  return `${linkedFindings} linked findings`;
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

export function CryoProgressStory({ storyStats }: { storyStats: CryoLensStoryStats }) {
  if (!storyStats.yearly.length) {
    return null;
  }

  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const baselineY = CHART_PADDING.top + plotHeight;
  const yearCount = Math.max(storyStats.yearly.length - 1, 1);
  const xStep = plotWidth / yearCount;
  const maxFindings = Math.max(...storyStats.yearly.map((point) => point.findings), 1);
  const maxPapers = Math.max(...storyStats.yearly.map((point) => point.papers), 1);
  const maxExperiments = Math.max(...storyStats.yearly.map((point) => point.experiments), 1);
  const findingsBarWidth = Math.max(Math.min((plotWidth / Math.max(storyStats.yearly.length, 1)) * 0.62, 18), 6);
  const papersBarWidth = Math.max(findingsBarWidth * 0.34, 3);
  const tickYears = buildTickYears(storyStats.yearly);
  const highlightedMilestones = selectMilestoneHighlights(storyStats);
  const highlightedMilestoneIds = new Set(highlightedMilestones.map((milestone) => milestone.id));
  const peakFindingsYear = storyStats.yearly.reduce((best, point) => (
    point.findings > best.findings ? point : best
  ), storyStats.yearly[0]);

  function getX(year: number): number {
    const offset = year - storyStats.yearly[0].year;
    return CHART_PADDING.left + offset * xStep;
  }

  return (
    <section className="rounded-sm border border-border/70 bg-white p-4 shadow-[0_8px_24px_rgba(43,52,55,0.035)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Story layer</Badge>
            <Badge>{storyStats.firstFormulationYear ?? "?"} to {storyStats.lastYear ?? "?"}</Badge>
          </div>
          <h2 className="font-headline text-[1.55rem] font-extrabold tracking-tight text-hero">
            Cryopreservation progress story
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Formulation milestones begin in {storyStats.firstFormulationYear ?? "the early benchmark era"}, while the current linked paper corpus starts in {storyStats.firstPaperYear ?? "the current live corpus"}. Evidence activity peaks in {peakFindingsYear.year} with {peakFindingsYear.findings} linked findings.
          </p>
        </div>
        <div className="grid min-w-[16rem] flex-1 grid-cols-2 gap-2 text-left sm:max-w-md">
          <div className="rounded-sm border border-border/70 bg-muted/40 px-3 py-2">
            <p className="table-header">First formulation</p>
            <p className="mt-1 font-headline text-lg font-extrabold text-hero">{storyStats.firstFormulationYear ?? "n/a"}</p>
          </div>
          <div className="rounded-sm border border-border/70 bg-muted/40 px-3 py-2">
            <p className="table-header">Live paper corpus</p>
            <p className="mt-1 font-headline text-lg font-extrabold text-hero">{storyStats.firstPaperYear ?? "n/a"}</p>
          </div>
          <div className="rounded-sm border border-border/70 bg-muted/40 px-3 py-2">
            <p className="table-header">Peak findings year</p>
            <p className="mt-1 font-headline text-lg font-extrabold text-hero">{peakFindingsYear.year}</p>
          </div>
          <div className="rounded-sm border border-border/70 bg-muted/40 px-3 py-2">
            <p className="table-header">Cumulative findings</p>
            <p className="mt-1 font-headline text-lg font-extrabold text-hero">
              {storyStats.yearly[storyStats.yearly.length - 1]?.cumulativeFindings ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(18rem,0.95fr)]">
        <div className="rounded-sm border border-border/70 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-3 pb-3">
            <span className="table-header">Legend</span>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-3 w-3 rounded-sm bg-accent" />
              findings per year
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-3 w-2 rounded-sm bg-hero/70" />
              papers per year
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-highlight" />
              experiments per year
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full border border-hero bg-white" />
              formulation milestone
            </span>
          </div>

          <svg
            aria-label="Cryo progress timeline"
            className="h-[20rem] w-full"
            role="img"
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          >
            <rect
              fill="rgba(255,255,255,0.72)"
              height={CHART_HEIGHT}
              rx="6"
              width={CHART_WIDTH}
              x="0"
              y="0"
            />

            {[0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = baselineY - plotHeight * ratio;
              return (
                <g key={ratio}>
                  <line
                    stroke="rgba(121, 133, 141, 0.18)"
                    strokeDasharray="3 5"
                    x1={CHART_PADDING.left}
                    x2={CHART_WIDTH - CHART_PADDING.right}
                    y1={y}
                    y2={y}
                  />
                  <text
                    fill="rgba(107, 118, 128, 0.9)"
                    fontSize="11"
                    textAnchor="end"
                    x={CHART_PADDING.left - 10}
                    y={y + 4}
                  >
                    {Math.round(maxFindings * ratio)}
                  </text>
                </g>
              );
            })}

            <line
              stroke="rgba(79, 96, 115, 0.7)"
              x1={CHART_PADDING.left}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y1={baselineY}
              y2={baselineY}
            />

            {storyStats.milestones.map((milestone) => {
              const x = getX(milestone.year);
              const isHighlighted = highlightedMilestoneIds.has(milestone.id);

              return (
                <g key={milestone.id}>
                  <line
                    stroke={isHighlighted ? "rgba(79, 96, 115, 0.35)" : "rgba(107, 118, 128, 0.16)"}
                    x1={x}
                    x2={x}
                    y1="36"
                    y2={CHART_PADDING.top - 8}
                  />
                  <circle
                    cx={x}
                    cy="28"
                    fill={isHighlighted ? "rgba(234, 123, 77, 0.92)" : "white"}
                    r={isHighlighted ? "5" : "3.2"}
                    stroke="rgba(26, 43, 60, 0.8)"
                    strokeWidth="1.2"
                  />
                </g>
              );
            })}

            {storyStats.yearly.map((point) => {
              const x = getX(point.year);
              const findingsHeight = (point.findings / maxFindings) * plotHeight;
              const papersHeight = (point.papers / maxPapers) * plotHeight * 0.54;
              const experimentY = baselineY - (point.experiments / maxExperiments) * plotHeight;

              return (
                <g key={point.year}>
                  <rect
                    fill="rgba(224, 240, 252, 0.96)"
                    height={Math.max(findingsHeight, point.findings > 0 ? 2 : 0)}
                    rx="1.5"
                    width={findingsBarWidth}
                    x={x - findingsBarWidth / 2}
                    y={baselineY - findingsHeight}
                  />
                  <rect
                    fill="rgba(26, 43, 60, 0.74)"
                    height={Math.max(papersHeight, point.papers > 0 ? 2 : 0)}
                    rx="1"
                    width={papersBarWidth}
                    x={x - papersBarWidth / 2}
                    y={baselineY - papersHeight}
                  />
                  {point.experiments > 0 ? (
                    <circle
                      cx={x}
                      cy={experimentY}
                      fill="rgba(234, 123, 77, 0.92)"
                      r="3.6"
                      stroke="white"
                      strokeWidth="1"
                    />
                  ) : null}
                </g>
              );
            })}

            {tickYears.map((year) => {
              const x = getX(year);
              return (
                <g key={year}>
                  <line
                    stroke="rgba(79, 96, 115, 0.28)"
                    x1={x}
                    x2={x}
                    y1={baselineY}
                    y2={baselineY + 6}
                  />
                  <text
                    fill="rgba(76, 90, 100, 0.95)"
                    fontSize="11"
                    textAnchor="middle"
                    x={x}
                    y={baselineY + 20}
                  >
                    {year}
                  </text>
                </g>
              );
            })}

            <text
              fill="rgba(107, 118, 128, 0.9)"
              fontSize="11"
              textAnchor="start"
              x={CHART_PADDING.left}
              y="16"
            >
              formulation milestones
            </text>
            <text
              fill="rgba(107, 118, 128, 0.9)"
              fontSize="11"
              textAnchor="end"
              x={CHART_WIDTH - CHART_PADDING.right}
              y={CHART_PADDING.top - 16}
            >
              annual evidence activity
            </text>
          </svg>
        </div>

        <div className="space-y-4">
          <div className="rounded-sm border border-border/70 bg-muted/20 p-3">
            <p className="table-header">Top finding categories</p>
            <div className="mt-3 space-y-3">
              {storyStats.topFindingCategories.map((category) => (
                <div key={category.label}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-hero">{category.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.count} · {category.sharePct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(category.sharePct, 6)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-sm border border-border/70 bg-muted/20 p-3">
        <p className="table-header">Highlighted milestones</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {highlightedMilestones.map((milestone) => (
            <div key={milestone.id} className="rounded-sm border border-border/70 bg-white px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{milestone.year}</Badge>
                <Badge>{milestone.type}</Badge>
              </div>
              <h3 className="mt-2 font-headline text-base font-extrabold tracking-tight text-hero">
                {milestone.name}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {truncateText(milestone.note, 132)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{formatMilestoneSupport(milestone.linkedFindings)}</span>
                {milestone.referenceTitle ? <span>{truncateText(milestone.referenceTitle, 68)}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

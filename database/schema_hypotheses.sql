-- CryoLens Hypotheses Schema
-- Stores AI-generated CPA design hypotheses with full evidence chains

-- Core hypothesis table
CREATE TABLE IF NOT EXISTS hypotheses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    target_tissue TEXT,
    target_organism TEXT,
    status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'testing', 'validated', 'rejected')),
    total_cpa_concentration NUMERIC,
    concentration_unit TEXT DEFAULT 'M',
    carrier_solution TEXT,
    mechanism_summary TEXT,
    advantages TEXT,
    risks TEXT,
    protocol_summary TEXT,
    evidence_score NUMERIC DEFAULT 0,
    evidence_paper_count INTEGER DEFAULT 0,
    evidence_finding_count INTEGER DEFAULT 0,
    markdown TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Components of each hypothesis (links to compounds table)
CREATE TABLE IF NOT EXISTS hypothesis_components (
    id SERIAL PRIMARY KEY,
    hypothesis_id TEXT NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
    compound_id TEXT REFERENCES compounds(id),
    compound_name TEXT NOT NULL,
    concentration NUMERIC,
    concentration_unit TEXT,
    role TEXT CHECK (role IN (
        'penetrating_cpa', 'non_penetrating_cpa', 'ice_blocker',
        'ice_recrystallization_inhibitor', 'anti_apoptotic', 'antioxidant',
        'membrane_sealant', 'carrier', 'osmotic_agent', 'nanowarming_agent',
        'delivery_vehicle', 'other'
    )),
    rationale TEXT,
    UNIQUE(hypothesis_id, compound_name)
);

-- Evidence links: each hypothesis component backed by specific findings
CREATE TABLE IF NOT EXISTS hypothesis_evidence (
    id SERIAL PRIMARY KEY,
    hypothesis_id TEXT NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
    finding_id INTEGER REFERENCES findings(id),
    component_name TEXT,
    relevance TEXT NOT NULL,
    evidence_type TEXT CHECK (evidence_type IN (
        'direct_support', 'mechanism_basis', 'toxicity_data',
        'synergy_evidence', 'dose_guidance', 'negative_control', 'gap_motivation'
    )),
    confidence TEXT CHECK (confidence IN ('high', 'medium', 'low'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hyp_status ON hypotheses(status);
CREATE INDEX IF NOT EXISTS idx_hyp_components_hyp ON hypothesis_components(hypothesis_id);
CREATE INDEX IF NOT EXISTS idx_hyp_evidence_hyp ON hypothesis_evidence(hypothesis_id);
CREATE INDEX IF NOT EXISTS idx_hyp_evidence_finding ON hypothesis_evidence(finding_id);

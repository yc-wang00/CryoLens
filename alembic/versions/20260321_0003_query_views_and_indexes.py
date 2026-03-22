"""Add query-friendly views and JSON indexes for knowledge retrieval."""

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260321_0003"
down_revision = "20260321_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create indexes and flattened views for SQL-driven knowledge retrieval."""
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_findings_component_names_gin "
        "ON findings USING gin (component_names_json)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_findings_tags_gin "
        "ON findings USING gin (tags_json)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_cpa_structures_tissue_tags_gin "
        "ON cpa_structures USING gin (tissue_tags_json)"
    )

    op.execute(
        """
        CREATE OR REPLACE VIEW v_cpa_structure_components AS
        SELECT
            c.id AS cpa_structure_id,
            c.name AS structure_name,
            c.structure_type::text AS structure_type,
            component ->> 'name' AS component_name,
            COALESCE(
                component ->> 'role',
                c.component_roles_json ->> (component ->> 'name')
            ) AS component_role,
            NULLIF(component ->> 'concentration_M', '')::double precision
                AS concentration_m,
            NULLIF(component ->> 'concentration_mol_per_kg', '')::double precision
                AS concentration_mol_per_kg,
            NULLIF(component ->> 'pct_wv', '')::double precision AS pct_wv,
            c.tissue_tags_json,
            c.notes,
            c.search_text
        FROM cpa_structures AS c
        CROSS JOIN LATERAL jsonb_array_elements(c.components_json) AS component
        """
    )

    op.execute(
        """
        CREATE OR REPLACE VIEW v_findings_headline AS
        SELECT
            f.id AS finding_id,
            f.source_title,
            f.citation,
            f.year,
            f.tissue,
            f.modality,
            f.metric_type,
            f.metric_value,
            f.metric_unit,
            CASE
                WHEN jsonb_typeof(f.conditions_json -> 'temperature_c')
                    IN ('number', 'string')
                THEN NULLIF(f.conditions_json ->> 'temperature_c', '')::double precision
                ELSE NULL
            END AS temperature_c,
            CASE
                WHEN jsonb_typeof(f.conditions_json -> 'concentration_mol_per_kg')
                    IN ('number', 'string')
                THEN NULLIF(
                    f.conditions_json ->> 'concentration_mol_per_kg',
                    ''
                )::double precision
                ELSE NULL
            END AS concentration_mol_per_kg,
            CASE
                WHEN jsonb_typeof(f.conditions_json -> 'concentration_m')
                    IN ('number', 'string')
                THEN NULLIF(
                    f.conditions_json ->> 'concentration_m',
                    ''
                )::double precision
                ELSE NULL
            END AS concentration_m,
            f.conditions_json ->> 'exposure_minutes' AS exposure_minutes_text,
            f.conditions_json ->> 'comparison_temperatures_c'
                AS comparison_temperatures_text,
            f.component_names_json,
            f.candidate_names_json,
            f.conditions_json,
            f.statistics_json,
            f.tags_json,
            f.finding_summary,
            f.search_text,
            f.source_location,
            f.confidence
        FROM findings AS f
        """
    )

    op.execute(
        """
        CREATE OR REPLACE VIEW v_findings_components AS
        SELECT
            vh.*,
            component_name.value AS component_name
        FROM v_findings_headline AS vh
        CROSS JOIN LATERAL jsonb_array_elements_text(vh.component_names_json)
            AS component_name(value)
        """
    )


def downgrade() -> None:
    """Remove query-friendly views and indexes."""
    op.execute("DROP VIEW IF EXISTS v_findings_components")
    op.execute("DROP VIEW IF EXISTS v_findings_headline")
    op.execute("DROP VIEW IF EXISTS v_cpa_structure_components")

    op.execute("DROP INDEX IF EXISTS ix_cpa_structures_tissue_tags_gin")
    op.execute("DROP INDEX IF EXISTS ix_findings_tags_gin")
    op.execute("DROP INDEX IF EXISTS ix_findings_component_names_gin")

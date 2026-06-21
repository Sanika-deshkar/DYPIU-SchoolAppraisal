//contains all the schema for academic audit 2025-26 form
import { useEffect, useMemo, useState } from "react";
import universityLogo from "../../../assets/images/image.png";
import AuditReportPanel from "./AuditReportPanel";
import AuditSection from "./AuditSection";
import { columnsWithSerial, serialColumnFor } from "./tableHelpers";

const draftKeyFor = (schemaId) => `dypiu-school-appraisal:${schemaId}:draft`;

const emptyRowFor = (columns) =>
  columnsWithSerial(columns).reduce((row, column) => {
    row[column] = "";
    return row;
  }, {});

const numberedRowFor = (columns, index) => {
  const row = emptyRowFor(columns);
  const serialColumn = serialColumnFor(Object.keys(row));
  if (serialColumn) row[serialColumn] = String(index + 1);
  return row;
};

const withSerialNumbers = (columns, rows) => {
  const normalizedColumns = columnsWithSerial(columns);
  const serialColumn = serialColumnFor(normalizedColumns);

  return rows.map((row, index) => ({
    ...numberedRowFor(columns, index),
    ...row,
    ...(serialColumn && !row[serialColumn] ? { [serialColumn]: String(index + 1) } : {}),
  }));
};

function buildInitialValues(schema) {
  return schema.sections.reduce((values, section) => {
    const fields = [
      ...(section.fields || []),
      ...(section.blocks || []).flatMap((block) => (block.type === "fields" ? block.fields : [])),
    ];

    fields.forEach((field) => {
      if (field.kind === "heading") return;
      values[field.id] = "";
    });
    return values;
  }, {});
}

function buildInitialTables(schema) {
  return schema.sections.reduce((tables, section) => {
    const tableDefinitions = [
      ...(section.tables || []),
      ...(section.blocks || []).flatMap((block) => (block.type === "tables" ? block.tables : [])),
    ];

    tableDefinitions.forEach((table) => {
      const rows = table.initialRows?.length ? table.initialRows : [numberedRowFor(table.columns, 0)];
      tables[table.id] = withSerialNumbers(table.columns, rows);
    });
    return tables;
  }, {});
}

export default function AuditForm({ schema, activeSectionId, reportMode, onReportModeChange, onSectionChange }) {
  const initialValues = useMemo(() => buildInitialValues(schema), [schema]);
  const initialTables = useMemo(() => buildInitialTables(schema), [schema]);
  const [values, setValues] = useState(() => {
    const saved = window.localStorage.getItem(draftKeyFor(schema.id));
    if (!saved) return initialValues;
    try {
      return { ...initialValues, ...JSON.parse(saved).values };
    } catch {
      return initialValues;
    }
  });
  const [tables, setTables] = useState(() => {
    const saved = window.localStorage.getItem(draftKeyFor(schema.id));
    if (!saved) return initialTables;
    try {
      return { ...initialTables, ...JSON.parse(saved).tables };
    } catch {
      return initialTables;
    }
  });
  const [status, setStatus] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [printReportAfterRender, setPrintReportAfterRender] = useState(false);
  const activeSectionIndex = Math.max(0, schema.sections.findIndex((section) => section.id === activeSectionId));
  const progress = activeSectionId === "summary" ? 100 : Math.round(((activeSectionIndex + 1) / schema.sections.length) * 100);

  useEffect(() => {
    if (!reportMode || !printReportAfterRender) return undefined;

    const timer = window.setTimeout(() => {
      window.print();
      setPrintReportAfterRender(false);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [printReportAfterRender, reportMode]);

  const handleFieldChange = (fieldId, value) => {
    setValues((current) => ({ ...current, [fieldId]: value }));
    setStatus("");
  };

  const handleTableChange = (tableId, rowIndex, column, value) => {
    setTables((current) => ({
      ...current,
      [tableId]: current[tableId].map((row, index) => (index === rowIndex ? { ...row, [column]: value } : row)),
    }));
    setStatus("");
  };

  const handleAddRow = (table) => {
    setTables((current) => ({
      ...current,
      [table.id]: [...(current[table.id] || []), numberedRowFor(table.columns, current[table.id]?.length || 0)],
    }));
  };

  const handleDeleteLastRow = (table) => {
    setTables((current) => {
      const nextRows = (current[table.id] || []).slice(0, -1);
      return {
        ...current,
        [table.id]: nextRows.length ? withSerialNumbers(table.columns, nextRows) : [numberedRowFor(table.columns, 0)],
      };
    });
  };

  const handleSaveDraft = () => {
    window.localStorage.setItem(draftKeyFor(schema.id), JSON.stringify({ values, tables }));
    setStatus("Draft saved in this browser.");
  };

  const handleSaveAndNext = () => {
    window.localStorage.setItem(draftKeyFor(schema.id), JSON.stringify({ values, tables }));
    setStatus("Draft saved in this browser.");

    const sectionIds = [...schema.sections.map((section) => section.id), "summary"];
    const currentIndex = sectionIds.indexOf(activeSectionId);
    const nextSectionId = sectionIds[Math.min(currentIndex + 1, sectionIds.length - 1)];

    if (nextSectionId && nextSectionId !== activeSectionId) {
      onSectionChange?.(nextSectionId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleClear = () => {
    window.localStorage.removeItem(draftKeyFor(schema.id));
    setValues(initialValues);
    setTables(initialTables);
    setStatus("Form cleared.");
  };

  const handleGenerateReport = () => {
    onReportModeChange(true);
    setPrintReportAfterRender(true);
  };

  const handleSubmit = () => {
    window.localStorage.setItem(draftKeyFor(schema.id), JSON.stringify({ values, tables, submittedAt: new Date().toISOString() }));
    setSubmitStatus("Academic Audit submitted locally. Backend submission will be connected later.");
  };

  if (reportMode) {
    return (
      <div style={styles.form}>
        <div className="academic-report-actions" style={styles.actions}>
          <button type="button" className="btn btn-secondary" onClick={() => onReportModeChange(false)}>
            Close
          </button>
        </div>
        <AuditReportPanel schema={schema} values={values} tables={tables} />
      </div>
    );
  }

  return (
    <form className="audit-form" style={styles.form} onSubmit={(event) => event.preventDefault()}>
      <header className="audit-form__header" style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoWrap}><img src={universityLogo} alt="DYPIU Logo" style={styles.logo} /></div>
          <div style={styles.headerCopy}>
            <p style={styles.kicker}>{schema.header.university}</p>
            <h1 style={styles.title}>{schema.title}</h1>
            <p style={styles.meta}>{schema.header.address}</p>
            <div style={styles.headerMetaRow}>
              <span style={styles.year}>Academic Year {schema.academicYear}</span>
              <span style={styles.draftPill}>Draft in progress</span>
            </div>
          </div>
        </div>
        <div style={styles.actions}>
          <button type="button" className="btn btn-secondary" onClick={handleClear}>
            Clear
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSaveDraft}>
            Save Draft
          </button>
        </div>
        <div className="audit-form__progress" style={styles.progressTrack}>
          <span style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>
      </header>

      {status && <div style={styles.status}>{status}</div>}

      <div style={styles.sections}>
        {activeSectionId === "summary" ? (
          <SummaryPanel
            schema={schema}
            values={values}
            tables={tables}
            submitStatus={submitStatus}
            onGenerateReport={handleGenerateReport}
            onSubmit={handleSubmit}
          />
        ) : (
          schema.sections
            .filter((section) => !activeSectionId || section.id === activeSectionId)
            .map((section) => (
              <AuditSection
                key={section.id}
                section={section}
                values={values}
                tables={tables}
                onFieldChange={handleFieldChange}
                onTableChange={handleTableChange}
                onAddRow={handleAddRow}
                onDeleteLastRow={handleDeleteLastRow}
              />
            ))
        )}
      </div>

      {activeSectionId !== "summary" && (
        <div style={styles.sectionFooter}>
          <button type="button" className="btn btn-primary" onClick={handleSaveAndNext}>
            Save & Next
          </button>
        </div>
      )}
    </form>
  );
}

function SummaryPanel({ schema, values, tables, submitStatus, onGenerateReport, onSubmit }) {
  const tableCount = Object.keys(tables).length;
  const rowCount = Object.values(tables).reduce((count, rows) => count + rows.length, 0);
  const filledFields = Object.values(values).filter((value) => String(value || "").trim()).length;

  return (
    <section style={styles.summaryPanel}>
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <strong style={styles.summaryValue}>{schema.sections.length}</strong>
          <span>Sections</span>
        </div>
        <div style={styles.summaryCard}>
          <strong style={styles.summaryValue}>{tableCount}</strong>
          <span>Tables</span>
        </div>
        <div style={styles.summaryCard}>
          <strong style={styles.summaryValue}>{rowCount}</strong>
          <span>Rows</span>
        </div>
        <div style={styles.summaryCard}>
          <strong style={styles.summaryValue}>{filledFields}</strong>
          <span>Fields filled</span>
        </div>
      </div>

      <div style={styles.summaryActions}>
        <button type="button" className="btn btn-secondary" onClick={onGenerateReport}>
          Generate Report
        </button>
        <button type="button" className="btn btn-primary" onClick={onSubmit}>
          Submit
        </button>
      </div>

      {submitStatus && <div style={styles.status}>{submitStatus}</div>}
    </section>
  );
}

const styles = {
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  header: {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    padding: "24px 26px 28px",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 10px 35px rgba(15, 23, 42, 0.055)",
    overflow: "hidden",
  },
  headerContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: 18,
    minWidth: 0,
  },
  headerCopy: { minWidth: 0 },
  logoWrap: {
    width: 76,
    height: 76,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    border: "1px solid #e7edf5",
    borderRadius: 14,
    background: "#f8fafc",
  },
  logo: {
    width: 62,
    height: 62,
    objectFit: "contain",
    flexShrink: 0,
  },
  kicker: {
    margin: "0 0 6px",
    color: "#2563eb",
    fontSize: 11,
    fontWeight: 750,
    textTransform: "uppercase",
    letterSpacing: ".08em",
  },
  title: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: "-.025em",
    lineHeight: 1.25,
  },
  meta: {
    margin: "3px 0",
    color: "#64748b",
    fontSize: 12.5,
    lineHeight: 1.45,
  },
  headerMetaRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 10 },
  year: { color: "#334155", fontSize: 11, fontWeight: 650 },
  draftPill: { padding: "4px 8px", borderRadius: 999, color: "#0369a1", background: "#e0f2fe", fontSize: 9.5, fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase" },
  progressTrack: { position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: "#eff6ff" },
  progressBar: { display: "block", height: "100%", borderRadius: "0 4px 4px 0", background: "linear-gradient(90deg, #2563eb, #38bdf8)", transition: "width .3s ease" },
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  primaryButton: {
    border: "1px solid #2563eb",
    borderRadius: 5,
    color: "#fff",
    background: "#2563eb",
    padding: "10px 13px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: 5,
    color: "#334155",
    background: "#fff",
    padding: "10px 13px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  status: {
    padding: "10px 12px",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
    color: "#166534",
    background: "#f0fdf4",
    fontSize: 14,
    fontWeight: 700,
  },
  sections: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  summaryPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: 24,
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    background: "#fff",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  summaryCard: {
    border: "1px solid #e5eaf2",
    borderRadius: 13,
    background: "linear-gradient(145deg, #f8fafc, #ffffff)",
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 3,
    color: "#64748b",
    fontSize: 14,
    fontWeight: 900,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#0f172a",
    fontSize: 18,
    lineHeight: 1,
  },
  summaryActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },
  sectionFooter: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "14px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    background: "#fff",
  },
};

//main dashboard for administrative audit 2025-26 form, contains sidebar, header, summary metrics, and module panel with fields and tables
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuditTable from "../components/AuditTable";
import { columnsWithSerial, serialColumnFor } from "../components/tableHelpers";
import AdministrativeReportPanel from "./AdministrativeReportPanel";
import { administrativeAuditMeta, administrativeAuditModules, administrativeSummaryModule } from "./administrativeAuditConfig";

const STORAGE_KEY = "dypiu-school-appraisal:administrative-audit-2025-26";

const emptyRowFor = (columns, index) => {
  const row = columnsWithSerial(columns).reduce((value, column) => {
    value[column] = "";
    return value;
  }, {});
  const serialColumn = serialColumnFor(Object.keys(row));
  if (serialColumn) row[serialColumn] = String(index + 1);
  return row;
};

const normalizeRows = (columns, rows) => {
  const serialColumn = serialColumnFor(columnsWithSerial(columns));
  return rows.map((row, index) => ({
    ...emptyRowFor(columns, index),
    ...row,
    ...(serialColumn ? { [serialColumn]: row[serialColumn] || String(index + 1) } : {}),
  }));
};

const moduleBlocksFor = (module) =>
  module.blocks || [
    ...(module.fields?.length ? [{ type: "fields", fields: module.fields }] : []),
    ...(module.tables?.length ? [{ type: "tables", tables: module.tables }] : []),
  ];

const moduleFieldsFor = (module) =>
  moduleBlocksFor(module)
    .flatMap((block) => (block.type === "fields" ? block.fields : []))
    .filter((field) => field.kind !== "heading");

const moduleTablesFor = (module) =>
  moduleBlocksFor(module).flatMap((block) => (block.type === "tables" ? block.tables : []));

const buildInitialData = () => {
  const fields = {};
  const tables = {};

  administrativeAuditModules.forEach((module) => {
    moduleFieldsFor(module).forEach((field) => {
      fields[field.id] = "";
    });
    moduleTablesFor(module).forEach((table) => {
      tables[table.id] = normalizeRows(table.columns, table.initialRows?.length ? table.initialRows : [emptyRowFor(table.columns, 0)]);
    });
  });

  fields.universityName = administrativeAuditMeta.university;
  fields.address = administrativeAuditMeta.address;

  return { fields, tables, lastSavedAt: "" };
};

const getUserProfile = () => ({
  name: sessionStorage.getItem("name") || "Administrative User",
  designation: sessionStorage.getItem("designation") || "Registrar",
  school: sessionStorage.getItem("school") || "Administrative Office",
  email: sessionStorage.getItem("email") || sessionStorage.getItem("username") || "",
});

const initialsFor = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function AdministrativeAuditDashboard() {
  const navigate = useNavigate();
  const [activeModuleId, setActiveModuleId] = useState(administrativeAuditModules[0].id);
  const [reportMode, setReportMode] = useState(false);
  const [printReportAfterRender, setPrintReportAfterRender] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [data, setData] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return buildInitialData();
    try {
      const parsed = JSON.parse(saved);
      const initial = buildInitialData();
      return {
        fields: { ...initial.fields, ...(parsed.fields || {}) },
        tables: { ...initial.tables, ...(parsed.tables || {}) },
        lastSavedAt: parsed.lastSavedAt || "",
      };
    } catch {
      return buildInitialData();
    }
  });

  const activeModule = useMemo(
    () => administrativeAuditModules.find((module) => module.id === activeModuleId) || administrativeSummaryModule,
    [activeModuleId],
  );
  const profile = getUserProfile();
  const isSummary = activeModuleId === administrativeSummaryModule.id;

  useEffect(() => {
    const payload = {
      ...data,
      lastSavedAt: data.lastSavedAt || new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [data]);

  useEffect(() => {
    if (!reportMode || !printReportAfterRender) return undefined;

    const timer = window.setTimeout(() => {
      window.print();
      setPrintReportAfterRender(false);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [printReportAfterRender, reportMode]);

  const setFieldValue = (fieldId, value) => {
    setData((current) => ({
      ...current,
      fields: { ...current.fields, [fieldId]: value },
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const setCellValue = (tableId, rowIndex, column, value) => {
    setData((current) => ({
      ...current,
      tables: {
        ...current.tables,
        [tableId]: current.tables[tableId].map((row, index) => (index === rowIndex ? { ...row, [column]: value } : row)),
      },
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const addRow = (table) => {
    setData((current) => ({
      ...current,
      tables: {
        ...current.tables,
        [table.id]: [...current.tables[table.id], emptyRowFor(table.columns, current.tables[table.id].length)],
      },
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const deleteLastRow = (table) => {
    setData((current) => {
      const nextRows = current.tables[table.id].slice(0, -1);
      return {
        ...current,
        tables: {
          ...current.tables,
          [table.id]: normalizeRows(table.columns, nextRows.length ? nextRows : [emptyRowFor(table.columns, 0)]),
        },
        lastSavedAt: new Date().toISOString(),
      };
    });
  };

  const resetDraft = () => {
    const nextData = buildInitialData();
    setData(nextData);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
  };

  const saveAndGoNext = () => {
    const nextData = { ...data, lastSavedAt: new Date().toISOString() };
    setData(nextData);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));

    const moduleIds = [...administrativeAuditModules.map((module) => module.id), administrativeSummaryModule.id];
    const currentIndex = moduleIds.indexOf(activeModuleId);
    const nextModuleId = moduleIds[Math.min(currentIndex + 1, moduleIds.length - 1)];

    if (nextModuleId && nextModuleId !== activeModuleId) {
      setActiveModuleId(nextModuleId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleSubmit = () => {
    setData((current) => ({ ...current, submittedAt: new Date().toISOString(), lastSavedAt: new Date().toISOString() }));
    setSubmitStatus("Administrative Audit submitted locally. Backend submission will be connected later.");
  };

  if (reportMode) {
    return (
      <>
        <PrintStyles />
        <div className="admin-audit-shell" style={styles.shell}>
          <Sidebar
            activeModuleId={activeModuleId}
            setActiveModuleId={setActiveModuleId}
            profile={profile}
            onLogout={() => setShowLogoutModal(true)}
          />
          <main className="admin-audit-main" style={styles.main}>
            <AdministrativeReportPanel
              meta={administrativeAuditMeta}
              modules={administrativeAuditModules}
              data={data}
              onClose={() => setReportMode(false)}
            />
          </main>
          {showLogoutModal && <LogoutModal onCancel={() => setShowLogoutModal(false)} onConfirm={handleLogout} />}
        </div>
      </>
    );
  }

  return (
    <>
      <PrintStyles />
      <div className="admin-audit-shell" style={styles.shell}>
        <Sidebar
          activeModuleId={activeModuleId}
          setActiveModuleId={(moduleId) => {
            setReportMode(false);
            setActiveModuleId(moduleId);
          }}
          profile={profile}
          onLogout={() => setShowLogoutModal(true)}
        />

        <main className="admin-audit-main" style={styles.main}>
          <header className="admin-audit-header" style={styles.header}>
            <div>
              <p style={styles.kicker}>{administrativeAuditMeta.university}</p>
              <h1 style={styles.title}>{administrativeAuditMeta.title}</h1>
              <p style={styles.meta}>{administrativeAuditMeta.address}</p>
              <p style={styles.meta}>{administrativeAuditMeta.act}</p>
              <p style={styles.year}>Academic Year {administrativeAuditMeta.academicYear}</p>
            </div>
            <div className="admin-audit-actions" style={styles.headerActions}>
              <button type="button" style={styles.secondaryButton} onClick={resetDraft}>
                Reset
              </button>
            </div>
          </header>

          <section style={styles.modulePanel}>
            <div style={styles.moduleHead}>
              <div>
                <h2 style={styles.moduleTitle}>
                  {activeModule.number ? `${activeModule.number}. ${activeModule.title}` : activeModule.title}
                </h2>
                {activeModule.note && <p style={styles.moduleNote}>{activeModule.note}</p>}
              </div>
              <span style={styles.badge}>Local draft</span>
            </div>

            {isSummary ? (
              <SummaryPanel
                modules={administrativeAuditModules}
                data={data}
                submitStatus={submitStatus}
                onGenerateReport={() => {
                  setReportMode(true);
                  setPrintReportAfterRender(true);
                }}
                onSubmit={handleSubmit}
              />
            ) : (
              moduleBlocksFor(activeModule).map((block, index) => {
              if (block.type === "fields") {
                return <FieldGrid key={`fields-${index}`} fields={block.fields} data={data} onChange={setFieldValue} />;
              }

              if (block.type === "text") {
                return (
                  <p key={`text-${index}`} style={styles.sectionText}>
                    {block.text}
                  </p>
                );
              }

              return (
                <div key={`tables-${index}`} style={styles.tables}>
                  {block.tables.map((table) => (
                    <AuditTable
                      key={table.id}
                      table={table}
                  rows={data.tables[table.id] || []}
                  onCellChange={setCellValue}
                  onAddRow={addRow}
                  onDeleteLastRow={deleteLastRow}
                />
                  ))}
                </div>
              );
              })
            )}

            {!isSummary && (
              <div style={styles.sectionFooter}>
                <button type="button" style={styles.primaryButton} onClick={saveAndGoNext}>
                  Save & Next
                </button>
              </div>
            )}
          </section>
        </main>

        {showLogoutModal && <LogoutModal onCancel={() => setShowLogoutModal(false)} onConfirm={handleLogout} />}
      </div>
    </>
  );
}

function PrintStyles() {
  return (
    <style>{`
      @media (max-width: 900px) {
        .admin-audit-shell { flex-direction: column; }
        .admin-audit-sidebar { width: 100% !important; height: auto !important; position: relative !important; }
        .admin-audit-main { padding: 18px !important; }
        .admin-audit-header { flex-direction: column; }
      }
      @media print {
        .admin-audit-sidebar,
        .admin-audit-actions,
        .admin-report-actions {
          display: none !important;
        }
        .admin-audit-shell {
          display: block !important;
          background: #fff !important;
        }
        .admin-audit-main {
          padding: 0 !important;
          overflow: visible !important;
        }
        body {
          background: #fff !important;
        }
      }
    `}</style>
  );
}

function Sidebar({ activeModuleId, setActiveModuleId, profile, onLogout }) {
  return (
    <aside className="admin-audit-sidebar" style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandMark}>AA</div>
        <div>
          <div style={styles.brandTitle}>Administrative Audit</div>
          <div style={styles.brandSub}>School Appraisal</div>
        </div>
      </div>

      <div style={styles.roleCard}>
        <div style={styles.roleTitle}>Administrative Module</div>
        <div style={styles.roleText}>Registrar / HR / DSW / Placement</div>
        <div style={styles.roleYear}>AY 2025-26</div>
      </div>

      <div style={styles.navCard}>
        <label style={styles.navLabel} htmlFor="administrative-audit-module">
          School Appraisal Form
        </label>
        <select id="administrative-audit-module" value={activeModuleId} onChange={(event) => setActiveModuleId(event.target.value)} style={styles.navSelect}>
          {administrativeAuditModules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.number}. {module.title}
            </option>
          ))}
          <option value={administrativeSummaryModule.id}>{administrativeSummaryModule.title}</option>
        </select>
      </div>

      <div style={styles.queryCard}>
        <div style={styles.queryLabel}>For any queries</div>
        <a href="mailto:appraisal@dypiu.ac.in" style={styles.queryLink}>
          appraisal@dypiu.ac.in
        </a>
      </div>

      <div style={styles.sidebarSpacer} />

      <div style={styles.profileBlock}>
        <div style={styles.profileRow}>
          <div style={styles.avatar}>{initialsFor(profile.name) || "AU"}</div>
          <div style={styles.profileText}>
            <div style={styles.profileName}>{profile.name}</div>
            <div style={styles.profileMeta}>{profile.designation}</div>
            <div style={styles.profileMeta}>{profile.school}</div>
            {profile.email && <div style={styles.profileMeta}>{profile.email}</div>}
          </div>
        </div>
        <button type="button" style={styles.logoutButton} onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

function FieldGrid({ fields, data, onChange }) {
  return (
    <div style={styles.fieldGrid}>
      {fields.map((field) => {
        if (field.kind === "heading") {
          return (
            <h3 key={field.id} style={styles.subsectionHeading}>
              {field.label}
            </h3>
          );
        }

        return (
          <label key={field.id} style={field.type === "textarea" ? styles.wideField : styles.field}>
            <span style={styles.fieldLabel}>{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                value={data.fields[field.id] ?? ""}
                onChange={(event) => onChange(field.id, event.target.value)}
                style={styles.textarea}
                rows={4}
              />
            ) : (
              <input
                value={data.fields[field.id] ?? ""}
                onChange={(event) => onChange(field.id, event.target.value)}
                style={styles.input}
                type={field.type || "text"}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

function SummaryPanel({ modules, data, submitStatus, onGenerateReport, onSubmit }) {
  const tableCount = modules.reduce((count, module) => count + moduleTablesFor(module).length, 0);
  const rowCount = Object.values(data.tables).reduce((count, rows) => count + rows.length, 0);
  const filledFields = Object.values(data.fields).filter((value) => String(value || "").trim()).length;

  return (
    <div style={styles.summaryPanel}>
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <strong style={styles.summaryValue}>{modules.length}</strong>
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
        <button type="button" style={styles.secondaryButton} onClick={onGenerateReport}>
          Generate Report
        </button>
        <button type="button" style={styles.primaryButton} onClick={onSubmit}>
          Submit
        </button>
      </div>

      {submitStatus && <div style={styles.submitStatus}>{submitStatus}</div>}
    </div>
  );
}

function LogoutModal({ onCancel, onConfirm }) {
  return (
    <div style={styles.modalBackdrop} onClick={onCancel}>
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div style={styles.modalTitle}>Confirm Logout</div>
        <div style={styles.modalText}>You are about to leave Administrative Audit. Any unsaved edits should already be autosaved locally.</div>
        <div style={styles.modalActions}>
          <button type="button" onClick={onCancel} style={styles.cancelButton}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} style={styles.confirmButton}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    background: "#f0f4ff",
    color: "#0f172a",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  sidebar: {
    width: 264,
    height: "100vh",
    position: "sticky",
    top: 0,
    flexShrink: 0,
    boxSizing: "border-box",
    overflow: "hidden",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    padding: "22px 16px",
    gap: 12,
    color: "#e2e8f0",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "2px 0 16px rgba(15,23,42,0.14)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "linear-gradient(135deg,#0ea5e9,#2563eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 900,
    fontSize: 13,
  },
  brandTitle: {
    color: "#f8fafc",
    fontWeight: 900,
    fontSize: 14,
  },
  brandSub: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 2,
  },
  roleCard: {
    background: "#1d4ed8",
    borderRadius: 12,
    padding: "12px",
    color: "#bfdbfe",
  },
  roleTitle: {
    color: "#fff",
    fontWeight: 900,
    fontSize: 13,
  },
  roleText: {
    color: "#dbeafe",
    fontSize: 10,
    marginTop: 3,
  },
  roleYear: {
    color: "#bfdbfe",
    fontSize: 9,
    marginTop: 7,
    fontWeight: 900,
  },
  navCard: {
    background: "#1e293b",
    borderRadius: 10,
    padding: "12px",
  },
  navLabel: {
    display: "block",
    color: "#94a3b8",
    fontWeight: 900,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  navSelect: {
    width: "100%",
    border: "1px solid #334155",
    borderRadius: 8,
    background: "#0f172a",
    color: "#e2e8f0",
    padding: "9px 10px",
    fontSize: 12,
    fontWeight: 800,
    outline: "none",
  },
  queryCard: {
    margin: "8px 0",
    padding: "10px 12px",
    background: "rgba(37,99,235,0.15)",
    border: "1px solid #2563eb",
    borderRadius: 8,
  },
  queryLabel: {
    color: "#94a3b8",
    fontWeight: 700,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  queryLink: {
    color: "#60a5fa",
    fontWeight: 600,
    fontSize: 11,
    wordBreak: "break-all",
    textDecoration: "none",
  },
  sidebarSpacer: {
    flex: 1,
  },
  profileBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingTop: 12,
    borderTop: "1px solid #1e293b",
  },
  profileRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 12,
    flexShrink: 0,
  },
  profileText: {
    minWidth: 0,
  },
  profileName: {
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: 900,
    overflowWrap: "anywhere",
  },
  profileMeta: {
    color: "#64748b",
    fontSize: 9,
    marginTop: 2,
    overflowWrap: "anywhere",
  },
  logoutButton: {
    width: "100%",
    border: "1px solid #374151",
    borderRadius: 8,
    background: "transparent",
    color: "#f87171",
    padding: "9px 11px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12,
    fontFamily: "inherit",
  },
  main: {
    flex: 1,
    padding: "28px 30px 40px",
    overflowX: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    padding: 22,
    border: "1px solid #dbe3ef",
    borderRadius: 12,
    background: "#fff",
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  kicker: {
    margin: "0 0 8px",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
  },
  title: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontSize: 30,
    lineHeight: 1.2,
  },
  meta: {
    margin: "3px 0",
    color: "#64748b",
    fontSize: 13,
  },
  year: {
    margin: "10px 0 0",
    color: "#334155",
    fontSize: 14,
    fontWeight: 900,
  },
  headerActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  primaryButton: {
    border: "none",
    borderRadius: 8,
    background: "#2563eb",
    color: "#fff",
    padding: "11px 14px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#fff",
    color: "#334155",
    padding: "11px 14px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  modulePanel: {
    border: "1px solid #dbe3ef",
    borderRadius: 12,
    background: "#fff",
    padding: 18,
    marginTop: 16,
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  moduleHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    padding: "12px 14px",
    borderLeft: "4px solid #2563eb",
    borderRadius: 6,
    background: "#eff6ff",
    marginBottom: 16,
  },
  moduleTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: 23,
  },
  moduleNote: {
    margin: "6px 0 0",
    color: "#475569",
    fontSize: 13,
    fontWeight: 800,
  },
  badge: {
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 900,
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
    marginBottom: 16,
  },
  sectionText: {
    margin: "0 0 16px",
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 800,
  },
  subsectionHeading: {
    gridColumn: "1 / -1",
    margin: "4px 0 0",
    color: "#0f172a",
    fontSize: 15,
    fontWeight: 900,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  wideField: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    gridColumn: "1 / -1",
  },
  fieldLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: 900,
  },
  input: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    padding: "10px 11px",
    color: "#0f172a",
    background: "#fff",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 92,
    resize: "vertical",
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    padding: "10px 11px",
    color: "#0f172a",
    background: "#fff",
    outline: "none",
  },
  tables: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  summaryPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  summaryCard: {
    border: "1px solid #dbe3ef",
    borderRadius: 10,
    background: "#f8fafc",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 3,
    color: "#64748b",
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#0f172a",
    fontSize: 26,
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
    marginTop: 16,
    padding: "14px 16px",
    border: "1px solid #dbe3ef",
    borderRadius: 8,
    background: "#f8fafc",
  },
  submitStatus: {
    border: "1px solid #bbf7d0",
    borderRadius: 8,
    background: "#f0fdf4",
    color: "#166534",
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 800,
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    zIndex: 1000,
    display: "grid",
    placeItems: "center",
  },
  modal: {
    width: "min(380px, 92vw)",
    background: "#fff",
    borderRadius: 12,
    padding: "26px 28px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },
  modalTitle: {
    color: "#0f172a",
    fontWeight: 900,
    fontSize: 17,
    marginBottom: 8,
  },
  modalText: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 18,
  },
  modalActions: {
    display: "flex",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    border: "none",
    borderRadius: 8,
    background: "#f1f5f9",
    color: "#475569",
    padding: 10,
    fontWeight: 900,
    cursor: "pointer",
  },
  confirmButton: {
    flex: 1,
    border: "none",
    borderRadius: 8,
    background: "#dc2626",
    color: "#fff",
    padding: 10,
    fontWeight: 900,
    cursor: "pointer",
  },
};

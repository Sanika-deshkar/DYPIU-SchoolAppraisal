import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuditForm from "../../features/schoolAppraisal/components/AuditForm";
import { academicAudit2025Schema } from "../../features/schoolAppraisal/formSchemas";

const getInitials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function DirectorDashboard() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(academicAudit2025Schema.sections[0].id);
  const [reportMode, setReportMode] = useState(false);
  const profile = {
    name: sessionStorage.getItem("name") || "Director of Schools",
    designation: sessionStorage.getItem("designation") || "Director",
    school: sessionStorage.getItem("school") || "School",
    email: sessionStorage.getItem("email") || sessionStorage.getItem("username") || "",
  };

  const handleSectionChange = (event) => {
    setReportMode(false);
    setActiveSectionId(event.target.value);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <PrintStyles />
      <div className="academic-audit-shell" style={styles.shell}>
      <aside className="academic-audit-sidebar" style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>SA</div>
          <div>
            <div style={styles.brandTitle}>School Appraisal</div>
            <div style={styles.brandSub}>D Y Patil International University</div>
          </div>
        </div>

        <div style={styles.roleCard}>
          <div style={styles.roleTitle}>Academic Audit</div>
          <div style={styles.roleText}>Director of Schools</div>
          <div style={styles.roleYear}>AY 2025-26</div>
        </div>

        <div style={styles.divider} />

        <div style={styles.navCard}>
          <label style={styles.navLabel} htmlFor="school-appraisal-section">
            School Appraisal Form
          </label>
          <select id="school-appraisal-section" style={styles.navSelect} value={activeSectionId} onChange={handleSectionChange}>
            {academicAudit2025Schema.sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
            <option value="summary">Summary</option>
          </select>
        </div>

        <div style={styles.queryCard}>
          <div style={styles.queryLabel}>For any queries</div>
          <a href="mailto:appraisal@dypiu.ac.in" style={styles.queryLink}>
            appraisal@dypiu.ac.in
          </a>
        </div>

        <div style={styles.spacer} />

        <div style={styles.profileBlock}>
          <div style={styles.profileRow}>
            <div style={styles.avatar}>{getInitials(profile.name) || "DS"}</div>
            <div style={styles.profileText}>
              <div style={styles.profileName}>{profile.name}</div>
              <div style={styles.profileMeta}>{profile.designation}</div>
              <div style={styles.profileMeta}>{profile.school}</div>
              {profile.email && <div style={styles.profileMeta}>{profile.email}</div>}
            </div>
          </div>
          <button type="button" style={styles.logoutButton} onClick={() => setShowLogoutModal(true)}>
            Logout
          </button>
        </div>
      </aside>

      <main className="academic-audit-main" style={styles.page}>
        <AuditForm
          schema={academicAudit2025Schema}
          activeSectionId={activeSectionId}
          reportMode={reportMode}
          onReportModeChange={setReportMode}
          onSectionChange={setActiveSectionId}
        />
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
        .academic-audit-shell { flex-direction: column; }
        .academic-audit-sidebar { width: 100% !important; height: auto !important; position: relative !important; }
        .academic-audit-main { padding: 18px !important; }
      }
      @media print {
        .academic-audit-sidebar,
        .academic-report-actions {
          display: none !important;
        }
        .academic-audit-shell {
          display: block !important;
          background: #fff !important;
        }
        .academic-audit-main {
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

function LogoutModal({ onCancel, onConfirm }) {
  return (
    <div style={styles.modalBackdrop} onClick={onCancel}>
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div style={styles.modalTitle}>Confirm Logout</div>
        <div style={styles.modalText}>You are about to leave School Appraisal. Any unsaved edits will be lost.</div>
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
    background: "#f1f5f9",
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
    marginBottom: 4,
  },
  brandMark: {
    width: 40,
    height: 40,
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
    fontWeight: 800,
    fontSize: 13,
  },
  brandSub: {
    color: "#94a3b8",
    fontSize: 9,
    marginTop: 2,
    lineHeight: 1.3,
  },
  roleCard: {
    background: "#1d4ed8",
    borderRadius: 12,
    padding: "11px 12px",
    fontSize: 11,
    color: "#bfdbfe",
  },
  roleTitle: {
    fontWeight: 800,
    marginBottom: 2,
    color: "#fff",
  },
  roleText: {
    color: "#dbeafe",
    fontSize: 10,
  },
  roleYear: {
    color: "#bfdbfe",
    fontSize: 9,
    marginTop: 6,
    fontWeight: 800,
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
  },
  navCard: {
    background: "#1e293b",
    borderRadius: 10,
    padding: "12px",
  },
  navLabel: {
    display: "block",
    color: "#94a3b8",
    fontWeight: 800,
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
    fontWeight: 700,
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
  spacer: {
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
    fontWeight: 800,
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
    fontWeight: 800,
    fontSize: 12,
    fontFamily: "inherit",
  },
  page: {
    minHeight: "100vh",
    flex: 1,
    background: "#f0f4ff",
    padding: "28px 30px 40px",
    overflowX: "auto",
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
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  confirmButton: {
    flex: 1,
    border: "none",
    borderRadius: 8,
    background: "#dc2626",
    color: "#fff",
    padding: 10,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

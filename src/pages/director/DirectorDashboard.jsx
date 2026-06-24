import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuditForm from "../../features/schoolAppraisal/components/AuditForm";
import AppSidebar from "../../features/schoolAppraisal/components/AppSidebar";
import { academicAudit2025Schema } from "../../features/schoolAppraisal/formSchemas";

export default function DirectorDashboard() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(academicAudit2025Schema.sections[0].id);
  const [reportMode, setReportMode] = useState(false);
  const directorSchool = sessionStorage.getItem("school");
  const displaySchool = !directorSchool || directorSchool === "Director of Schools"
    ? "School of Computer Science & Applications"
    : directorSchool;
  const profile = {
    name: sessionStorage.getItem("name") || "Director",
    designation: sessionStorage.getItem("designation") || "Director",
    school: displaySchool,
    email: sessionStorage.getItem("email") || sessionStorage.getItem("username") || "",
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div className="academic-audit-shell">
      <AppSidebar
        title="School Appraisal"
        subtitle="D. Y. Patil International University"
        roleTitle="Academic Audit"
        roleText={profile.school}
        items={academicAudit2025Schema.sections}
        activeId={activeSectionId}
        onChange={(sectionId) => { setReportMode(false); setActiveSectionId(sectionId); }}
        profile={profile}
        onLogout={() => setShowLogoutModal(true)}
      />

      <main className="academic-audit-main">
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

function LogoutModal({ onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title">Confirm Logout</div>
        <div className="modal-text">You are about to leave School Appraisal. Any unsaved edits will be lost.</div>
        <div className="modal-actions">
          <button type="button" onClick={onCancel} className="modal-cancel">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="modal-confirm">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

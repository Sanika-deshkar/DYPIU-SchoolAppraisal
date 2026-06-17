export default function DirectorDashboard() {
  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <h1 style={styles.title}>Director Dashboard</h1>
        <p style={styles.text}>School appraisal dashboard will be connected here.</p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f8fafc",
    padding: 24,
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  panel: {
    width: "min(100%, 560px)",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
    padding: 28,
  },
  title: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontSize: 28,
  },
  text: {
    margin: 0,
    color: "#64748b",
    fontSize: 15,
  },
};

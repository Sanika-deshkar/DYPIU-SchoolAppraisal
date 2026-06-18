//academic & administrative table add rows and delete last row functionality , sr no, table heading(blue)
import { columnsWithSerial, serialColumnFor } from "./tableHelpers";

const isAttachmentColumn = (column) => /\b(link|proof|attachment|document|mom)\b/i.test(column);

export default function AuditTable({
  table,
  rows,
  values = {},
  onFieldChange,
  onChange,
  onCellChange,
  onAddRow,
  onDeleteLastRow,
}) {
  const columns = columnsWithSerial(table.columns);

  const handleCellChange = (rowIndex, column, value) => {
    if (onChange) {
      onChange(rowIndex, column, value);
      return;
    }

    onCellChange?.(table.id, rowIndex, column, value);
  };

  return (
    <section style={styles.wrap}>
      {table.showTitle !== false && (
        <div style={styles.header}>
          <h3 style={styles.title}>{table.title}</h3>
        </div>
      )}

      {!!table.notes?.length && (
        <div style={styles.notes}>
          {table.notes.map((note) => (
            <div key={note} style={styles.note}>
              {note}
            </div>
          ))}
        </div>
      )}

      {!!table.fields?.length && (
        <div style={styles.embeddedFields}>
          {table.fields.map((field) => (
            <label key={field.id} style={styles.embeddedField}>
              <span style={styles.embeddedLabel}>{field.label}</span>
              <input
                value={values[field.id] ?? ""}
                onChange={(event) => onFieldChange(field.id, event.target.value)}
                style={styles.embeddedInput}
                type={field.type || "text"}
              />
            </label>
          ))}
        </div>
      )}

      <div style={styles.scroller}>
        <table style={{ ...styles.table, minWidth: Math.max(760, columns.length * 180) }}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} style={{ ...styles.th, ...(serialColumnFor([column]) ? styles.serialCell : {}) }}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${table.id}-${rowIndex}`}>
                {columns.map((column) => (
                  <td key={column} style={{ ...styles.td, ...(serialColumnFor([column]) ? styles.serialCell : {}) }}>
                    {isAttachmentColumn(column) ? (
                      <div style={styles.attachmentCell}>
                        <label style={styles.attachmentButton}>
                          Add Attachment
                          <input
                            type="file"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              handleCellChange(rowIndex, column, {
                                name: file.name,
                                url: URL.createObjectURL(file),
                              });
                            }}
                            style={styles.fileInput}
                            aria-label={`${table.title} ${column}`}
                          />
                        </label>
                        {row[column]?.url && (
                          <a href={row[column].url} target="_blank" rel="noreferrer" style={styles.attachmentLink}>
                            View Attachment
                          </a>
                        )}
                        {row[column]?.name && <span style={styles.fileName}>{row[column].name}</span>}
                      </div>
                    ) : (
                      <input
                        value={row[column] ?? ""}
                        onChange={(event) => handleCellChange(rowIndex, column, event.target.value)}
                        style={{
                          ...styles.cellInput,
                          ...(serialColumnFor([column]) ? styles.serialInput : {}),
                          background: serialColumnFor([column]) ? "#f8fafc" : "#fff",
                        }}
                        readOnly={Boolean(serialColumnFor([column]))}
                        aria-label={`${table.title} ${column}`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td style={styles.emptyCell} colSpan={columns.length}>
                  No rows added.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.footer}>
        <button type="button" style={styles.secondaryButton} onClick={onAddRow}>
          Add Row
        </button>
        <button type="button" style={styles.removeButton} onClick={onDeleteLastRow} disabled={rows.length === 1}>
          Delete Last Row
        </button>
      </div>
    </section>
  );
}

const styles = {
  wrap: {
    border: "1px solid #dbe3ef",
    borderRadius: 6,
    background: "#fff",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    margin: "12px 14px",
    padding: "12px 14px",
    borderBottom: "1px solid #e5edf7",
    borderLeft: "4px solid #2563eb",
    borderRadius: 6,
    background: "#eff6ff",
  },
  title: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.35,
    color: "#0f172a",
    fontWeight: 900,
  },
  notes: {
    padding: "0 14px 12px",
    color: "#334155",
    fontSize: 14,
    lineHeight: 1.6,
  },
  note: {
    paddingLeft: 8,
  },
  embeddedFields: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
    padding: "12px 14px",
    borderBottom: "1px solid #e5edf7",
    background: "#fff",
  },
  embeddedField: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  embeddedLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: 800,
  },
  embeddedInput: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: 5,
    padding: "10px 11px",
    color: "#0f172a",
    background: "#fff",
    outline: "none",
  },
  scroller: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "10px 12px",
    borderBottom: "1px solid #dbe3ef",
    borderRight: "1px solid #e5edf7",
    color: "#334155",
    background: "#f1f5f9",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "left",
    whiteSpace: "normal",
  },
  serialCell: {
    width: 72,
    minWidth: 72,
    maxWidth: 72,
  },
  td: {
    padding: 8,
    borderBottom: "1px solid #edf2f7",
    borderRight: "1px solid #edf2f7",
    verticalAlign: "top",
  },
  cellInput: {
    width: "100%",
    minWidth: 120,
    border: "1px solid #cbd5e1",
    borderRadius: 4,
    padding: "8px 9px",
    color: "#0f172a",
    background: "#fff",
    outline: "none",
  },
  serialInput: {
    minWidth: 44,
    width: 54,
    textAlign: "center",
    fontWeight: 700,
    fontSize: 14,
  },
  secondaryButton: {
    flex: "0 0 auto",
    border: "1px solid #2563eb",
    borderRadius: 8,
    color: "#2563eb",
    background: "#fff",
    padding: "8px 12px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  removeButton: {
    border: "1px solid #dc2626",
    borderRadius: 8,
    color: "#dc2626",
    background: "#fff",
    padding: "8px 12px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: "12px 14px",
    borderTop: "1px solid #e5edf7",
    background: "#f8fafc",
  },
  attachmentCell: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 180,
  },
  attachmentButton: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    border: "1px solid #2563eb",
    borderRadius: 8,
    color: "#2563eb",
    background: "#fff",
    padding: "8px 12px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  fileInput: {
    position: "absolute",
    inset: 0,
    opacity: 0,
    cursor: "pointer",
  },
  attachmentLink: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: 800,
    textDecoration: "none",
  },
  fileName: {
    color: "#64748b",
    fontSize: 14,
    wordBreak: "break-word",
  },
  emptyCell: {
    padding: 18,
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
  },
};

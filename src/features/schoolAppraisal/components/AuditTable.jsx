//academic & administrative table add rows and delete last row functionality , sr no, table heading(blue)
import { useState } from "react";
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
  onUploadAttachment,
}) {
  const columns = columnsWithSerial(table.columns);
  const [uploadingCell, setUploadingCell] = useState("");
  const [uploadError, setUploadError] = useState("");

  const handleCellChange = (rowIndex, column, value) => {
    if (onChange) {
      onChange(rowIndex, column, value);
      return;
    }

    onCellChange?.(table.id, rowIndex, column, value);
  };

  const handleAttachmentChange = async (rowIndex, column, file) => {
    if (!file) return;

    setUploadError("");
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Attachment must be 10MB or smaller.");
      return;
    }

    const cellKey = `${rowIndex}-${column}`;
    setUploadingCell(cellKey);

    try {
      const uploaded = onUploadAttachment
        ? await onUploadAttachment(file)
        : { name: file.name, fileName: file.name, url: URL.createObjectURL(file) };
      handleCellChange(rowIndex, column, uploaded);
    } catch (error) {
      setUploadError(error?.response?.data?.message || error?.message || "Attachment upload failed.");
    } finally {
      setUploadingCell("");
    }
  };

  return (
    <section className="audit-table-card">
      {table.showTitle !== false && (
        <div className="audit-table-card__header">
          <h3 className="audit-table-card__title">{table.title}</h3>
        </div>
      )}

      {!!table.notes?.length && (
        <div className="audit-table-card__notes">
          {table.notes.map((note) => (
            <div key={note} className="audit-table-card__note">
              {note}
            </div>
          ))}
        </div>
      )}

      {uploadError && <div style={styles.uploadError}>{uploadError}</div>}

      {!!table.fields?.length && (
        <div className="audit-table-card__embedded-fields">
          {table.fields.map((field) => (
            <label key={field.id} className="audit-table-card__embedded-field">
              <span className="audit-table-card__embedded-label">{field.label}</span>
              <input
                value={values[field.id] ?? ""}
                onChange={(event) => onFieldChange(field.id, event.target.value)}
                className="audit-control audit-table-card__embedded-input"
                type={field.type || "text"}
              />
            </label>
          ))}
        </div>
      )}

      <div className="audit-table-card__scroller">
        <table className="audit-table-card__table" style={{ minWidth: Math.max(760, columns.length * 180) }}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} className={`audit-table-card__th${serialColumnFor([column]) ? " audit-table-card__serial" : ""}`}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${table.id}-${rowIndex}`}>
                {columns.map((column) => (
                  <td key={column} className={`audit-table-card__td${serialColumnFor([column]) ? " audit-table-card__serial" : ""}`}>
                    {isAttachmentColumn(column) ? (
                      <div style={styles.attachmentCell}>
                        <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {uploadingCell === `${rowIndex}-${column}` ? "Uploading..." : "Add Attachment"}
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              handleAttachmentChange(rowIndex, column, file);
                              event.target.value = "";
                            }}
                            className="audit-table-card__file-input"
                            aria-label={`${table.title} ${column}`}
                            disabled={uploadingCell === `${rowIndex}-${column}`}
                          />
                        </label>
                        {row[column]?.url && (
                          <a href={row[column].url} target="_blank" rel="noreferrer" className="audit-table-card__attachment-link">
                            View Attachment
                          </a>
                        )}
                        {row[column]?.name && <span className="audit-table-card__file-name">{row[column].name}</span>}
                      </div>
                    ) : (
                      <input
                        className={`audit-table-input audit-table-card__cell-input${serialColumnFor([column]) ? " audit-table-card__serial-input" : ""}`}
                        value={row[column] ?? ""}
                        onChange={(event) => handleCellChange(rowIndex, column, event.target.value)}
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
                <td className="audit-table-card__empty" colSpan={columns.length}>
                  No rows added.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="audit-table-card__footer">
        <button type="button" className="btn btn-secondary" onClick={onAddRow}>
          Add Row
        </button>
        <button type="button" className="btn btn-danger" onClick={onDeleteLastRow} disabled={rows.length === 1}>
          Delete Last Row
        </button>
      </div>
    </section>
  );
}

const styles = {
  wrap: {
    border: "1px solid #dbe3ef",
    borderRadius: 13,
    background: "#fff",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    margin: 0,
    padding: "15px 17px",
    borderBottom: "1px solid #e8edf4",
    background: "#f8fafc",
  },
  title: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.35,
    color: "#0f172a",
    fontWeight: 700,
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
    borderRadius: 9,
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
    padding: "11px 12px",
    borderBottom: "1px solid #dbe3ef",
    borderRight: "1px solid #e5edf7",
    color: "#334155",
    background: "#f8fafc",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".025em",
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
    borderRadius: 8,
    padding: "9px 10px",
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
    background: "#fbfcfe",
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
  uploadError: {
    margin: "10px 14px 0",
    border: "1px solid #fecaca",
    borderRadius: 8,
    background: "#fef2f2",
    color: "#991b1b",
    padding: "9px 10px",
    fontSize: 13,
    fontWeight: 700,
  },
  emptyCell: {
    padding: 18,
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
  },
};

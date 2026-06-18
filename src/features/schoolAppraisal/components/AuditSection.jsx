//renders a section of the audit form, like part A, part B, etc. It can contain fields and tables
import AuditTable from "./AuditTable";

function FieldGrid({ fields, values, onFieldChange }) {
  return (
    <div style={styles.fieldGrid}>
      {fields.map((field) => {
        if (field.kind === "heading") {
          return (
            <h3 key={field.id} style={styles.subheading}>
              {field.label}
            </h3>
          );
        }

        return (
          <label key={field.id} style={field.type === "textarea" ? styles.wideField : styles.field}>
            <span style={styles.label}>{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                value={values[field.id] ?? ""}
                onChange={(event) => onFieldChange(field.id, event.target.value)}
                style={styles.textarea}
                rows={4}
              />
            ) : field.type === "select" ? (
              <select
                value={values[field.id] ?? ""}
                onChange={(event) => onFieldChange(field.id, event.target.value)}
                style={styles.input}
              >
                <option value="">Select</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={values[field.id] ?? ""}
                onChange={(event) => onFieldChange(field.id, event.target.value)}
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

function TableList({ tableDefinitions, tableValues, values, onFieldChange, onTableChange, onAddRow, onDeleteLastRow }) {
  return (
    <div style={styles.tables}>
      {tableDefinitions.map((table) => (
        <AuditTable
          key={table.id}
          table={table}
          rows={tableValues[table.id] || []}
          values={values}
          onFieldChange={onFieldChange}
          onChange={(rowIndex, column, value) => onTableChange(table.id, rowIndex, column, value)}
          onAddRow={() => onAddRow(table)}
          onDeleteLastRow={() => onDeleteLastRow(table)}
        />
      ))}
    </div>
  );
}

export default function AuditSection({ section, values, tables, onFieldChange, onTableChange, onAddRow, onDeleteLastRow }) {
  const blocks = section.blocks || [
    ...(section.fields?.length ? [{ type: "fields", fields: section.fields }] : []),
    ...(section.tables?.length ? [{ type: "tables", tables: section.tables }] : []),
  ];

  return (
    <section id={section.id} style={styles.section}>
      <div style={styles.headingRow}>
        <h2 style={styles.heading}>{section.title}</h2>
      </div>

      {blocks.map((block, index) => {
        if (block.type === "fields") {
          return <FieldGrid key={`fields-${index}`} fields={block.fields} values={values} onFieldChange={onFieldChange} />;
        }

        return (
          <TableList
            key={`tables-${index}`}
            tableValues={tables}
            tableDefinitions={block.tables}
            values={values}
            onFieldChange={onFieldChange}
            onTableChange={onTableChange}
            onAddRow={onAddRow}
            onDeleteLastRow={onDeleteLastRow}
          />
        );
      })}
    </section>
  );
}

const styles = {
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: 20,
    border: "1px solid #dbe3ef",
    borderRadius: 8,
    background: "#fff",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  headingRow: {
    padding: "12px 14px",
    borderLeft: "4px solid #2563eb",
    borderRadius: 6,
    background: "#eff6ff",
  },
  heading: {
    margin: 0,
    color: "#0f172a",
    fontSize: 18,
    lineHeight: 1.3,
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
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
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: 700,
  },
  subheading: {
    gridColumn: "1 / -1",
    margin: "8px 0 0",
    padding: "10px 12px",
    borderLeft: "4px solid #2563eb",
    borderRadius: 6,
    color: "#0f172a",
    background: "#eff6ff",
    fontSize: 18,
    lineHeight: 1.35,
  },
  input: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: 5,
    padding: "10px 11px",
    color: "#0f172a",
    background: "#fff",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 88,
    resize: "vertical",
    border: "1px solid #cbd5e1",
    borderRadius: 5,
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
};

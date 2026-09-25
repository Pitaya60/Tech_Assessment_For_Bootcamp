import { useEffect, useState } from "react";
import { api } from "../api";

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = { location: "", start_date: todayISO(), end_date: todayISO(), notes: "" };

export default function RecordsManager() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function refresh() {
    try {
      const data = await api.listRecords();
      setRecords(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (editingId) {
        await api.updateRecord(editingId, form);
      } else {
        await api.createRecord(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(record) {
    setEditingId(record.id);
    setForm({
      location: record.location_query,
      start_date: record.start_date,
      end_date: record.end_date,
      notes: record.notes || "",
    });
    window.scrollTo({ top: document.getElementById("records-form")?.offsetTop - 20, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this record?")) return;
    setError(null);
    try {
      await api.deleteRecord(id);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="records-manager card" id="records-form">
      <h2>Saved Weather Records (Database CRUD)</h2>
      <p className="muted">
        Enter a location and a date range to fetch and persist weather data. All saved records are visible to
        everyone using this app (no per-user segmentation), per the assessment spec.
      </p>

      <form onSubmit={handleSubmit} className="records-form">
        <div className="form-row">
          <label>
            Location
            <input
              required
              type="text"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="e.g. Chicago, 90210, Eiffel Tower"
            />
          </label>
        </div>
        <div className="form-row two-col">
          <label>
            Start date
            <input
              required
              type="date"
              value={form.start_date}
              onChange={(e) => updateField("start_date", e.target.value)}
            />
          </label>
          <label>
            End date
            <input
              required
              type="date"
              value={form.end_date}
              onChange={(e) => updateField("end_date", e.target.value)}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Notes (optional)
            <input
              type="text"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Anything you want to remember about this trip/search"
            />
          </label>
        </div>
        <div className="form-row form-buttons">
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : editingId ? "Update Record" : "Create Record"}
          </button>
          {editingId && (
            <button type="button" className="secondary" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="form-error">⚠️ {error}</p>}

      <div className="export-buttons">
        <span>Export all records:</span>
        {["json", "csv", "xml", "pdf", "markdown"].map((fmt) => (
          <a key={fmt} className="export-link" href={api.exportUrl(fmt)} target="_blank" rel="noreferrer">
            {fmt.toUpperCase()}
          </a>
        ))}
      </div>

      <div className="records-table-wrap">
        <table className="records-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Range</th>
              <th>Notes</th>
              <th>Days</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No records yet — create one above.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.resolved_name}</td>
                <td>
                  {r.start_date} → {r.end_date}
                </td>
                <td>{r.notes || <span className="muted">—</span>}</td>
                <td>{r.daily_data.length}</td>
                <td>{new Date(r.updated_at + "Z").toLocaleString()}</td>
                <td className="row-actions">
                  <button className="link-btn" onClick={() => startEdit(r)}>
                    Edit
                  </button>
                  <button className="link-btn danger" onClick={() => handleDelete(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

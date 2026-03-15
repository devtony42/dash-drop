import { useState, useEffect, useCallback } from "react";
import { fetchRecords, createRecord, updateRecord, deleteRecord, exportRecords } from "../api.js";
import RecordForm from "./RecordForm.jsx";
import DeleteModal from "./DeleteModal.jsx";

export default function EntityView({ entity, readOnly }) {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);

  const [exporting, setExporting] = useState(false);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState(null);

  const visibleFields = entity.fields.filter((f) => f.type !== "list");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        sortBy,
        sortOrder,
      };
      // Add filters
      for (const [key, val] of Object.entries(filters)) {
        if (val !== "" && val !== undefined) params[`filter_${key}`] = val;
      }

      const result = await fetchRecords(entity.name, params);
      setRecords(result.data || []);
      setPagination((prev) => ({ ...prev, ...result.pagination }));
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [entity.name, pagination.page, pagination.limit, search, sortBy, sortOrder, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleCreate = async (data) => {
    await createRecord(entity.name, data);
    setFormOpen(false);
    loadData();
  };

  const handleUpdate = async (data) => {
    await updateRecord(entity.name, editRecord.id, data);
    setEditRecord(null);
    loadData();
  };

  const handleDelete = async () => {
    await deleteRecord(entity.name, deleteTarget.id);
    setDeleteTarget(null);
    loadData();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { search, sortBy, sortOrder };
      for (const [key, val] of Object.entries(filters)) {
        if (val !== "" && val !== undefined) params[`filter_${key}`] = val;
      }
      await exportRecords(entity.name, params);
    } catch {
      setError("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const formatValue = (val, field) => {
    if (val === null || val === undefined) return <span className="text-gray-400">—</span>;
    if (field.type === "boolean") {
      return (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${val ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
          {val ? "Yes" : "No"}
        </span>
      );
    }
    if (field.type === "date") return new Date(val).toLocaleDateString();
    if (field.type === "number") {
      return typeof val === "number" ? val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : val;
    }
    if (field.type === "enum") {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-500">
          {val}
        </span>
      );
    }
    if (field.type === "text" && typeof val === "string" && val.length > 50) {
      return val.slice(0, 50) + "...";
    }
    return String(val);
  };

  return (
    <div className="p-4 lg:p-8">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${entity.name}...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Enum filters */}
        {visibleFields
          .filter((f) => f.type === "enum")
          .map((f) => (
            <select
              key={f.name}
              value={filters[f.name] || ""}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, [f.name]: e.target.value }));
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All {f.name}</option>
              {f.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ))}

        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? "Exporting..." : "Export CSV"}
        </button>

        {!readOnly && (
          <button
            onClick={() => { setEditRecord(null); setFormOpen(true); }}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add {entity.name}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th
                  onClick={() => handleSort("id")}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 select-none"
                >
                  ID {sortBy === "id" && (sortOrder === "asc" ? "\u2191" : "\u2193")}
                </th>
                {visibleFields.map((f) => (
                  <th
                    key={f.name}
                    onClick={() => handleSort(f.name)}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 select-none"
                  >
                    {f.name} {sortBy === f.name && (sortOrder === "asc" ? "\u2191" : "\u2193")}
                  </th>
                ))}
                {!readOnly && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={visibleFields.length + (readOnly ? 1 : 2)} className="px-4 py-12 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={visibleFields.length + (readOnly ? 1 : 2)} className="px-4 py-12 text-center text-gray-400">
                    No records found
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{record.id}</td>
                    {visibleFields.map((f) => (
                      <td key={f.name} className="px-4 py-3">
                        {formatValue(record[f.name], f)}
                      </td>
                    ))}
                    {!readOnly && (
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => { setEditRecord(record); setFormOpen(true); }}
                          className="inline-flex px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-brand-500 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(record)}
                          className="inline-flex px-2 py-1 text-xs rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
            <p className="text-xs text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Prev
              </button>
              <span className="px-3 py-1 text-xs text-gray-500">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {!readOnly && formOpen && (
        <RecordForm
          entity={entity}
          record={editRecord}
          onSubmit={editRecord ? handleUpdate : handleCreate}
          onClose={() => { setFormOpen(false); setEditRecord(null); }}
        />
      )}

      {/* Delete Modal */}
      {!readOnly && deleteTarget && (
        <DeleteModal
          entityName={entity.name}
          record={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

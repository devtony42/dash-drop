import { useState } from "react";

export default function RecordForm({ entity, record, onSubmit, onClose }) {
  const isEdit = !!record;
  const visibleFields = entity.fields.filter((f) => f.type !== "list");

  const [formData, setFormData] = useState(() => {
    const initial = {};
    for (const field of visibleFields) {
      if (isEdit && record[field.name] !== undefined) {
        let val = record[field.name];
        // Format date for input
        if (field.type === "date" && val) {
          val = new Date(val).toISOString().split("T")[0];
        }
        initial[field.name] = val;
      } else {
        initial[field.name] = field.default ?? (field.type === "boolean" ? false : "");
      }
    }
    return initial;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.name];
    const baseClass =
      "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent";

    switch (field.type) {
      case "text":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            rows={3}
            className={baseClass + " resize-y"}
            required={field.required}
          />
        );

      case "number":
        return (
          <input
            type="number"
            step="any"
            value={value ?? ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseClass}
            required={field.required}
          />
        );

      case "boolean":
        return (
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {value ? "Yes" : "No"}
            </span>
          </label>
        );

      case "enum":
        return (
          <select
            value={value || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseClass}
            required={field.required}
          >
            <option value="">Select...</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case "date":
        return (
          <input
            type="date"
            value={value || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseClass}
            required={field.required}
          />
        );

      default: // string
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseClass}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit" : "Create"} {entity.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {visibleFields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

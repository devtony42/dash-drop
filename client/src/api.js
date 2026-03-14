const BASE = "/api";

export async function fetchSchema() {
  const res = await fetch(`${BASE}/schema`);
  return res.json();
}

export async function fetchRecords(entityName, params = {}) {
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      query.set(key, val);
    }
  }
  const res = await fetch(`${BASE}/${entityName.toLowerCase()}?${query}`);
  return res.json();
}

export async function fetchRecord(entityName, id) {
  const res = await fetch(`${BASE}/${entityName.toLowerCase()}/${id}`);
  return res.json();
}

export async function createRecord(entityName, data) {
  const res = await fetch(`${BASE}/${entityName.toLowerCase()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const data = await res.json();
    if (res.status === 400 && data.errors) {
      throw Object.assign(new Error("Validation failed"), { validationErrors: data.errors });
    }
    throw new Error(data.error || "Create failed");
  }
  return res.json();
}

export async function updateRecord(entityName, id, data) {
  const res = await fetch(`${BASE}/${entityName.toLowerCase()}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const data = await res.json();
    if (res.status === 400 && data.errors) {
      throw Object.assign(new Error("Validation failed"), { validationErrors: data.errors });
    }
    throw new Error(data.error || "Update failed");
  }
  return res.json();
}

export async function deleteRecord(entityName, id) {
  const res = await fetch(`${BASE}/${entityName.toLowerCase()}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

export async function exportRecords(entityName, params = {}) {
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      query.set(key, val);
    }
  }
  const res = await fetch(`${BASE}/${entityName.toLowerCase()}/export?${query}`);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${entityName}-export.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

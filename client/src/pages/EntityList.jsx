import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import EntityForm from '@/components/EntityForm';
import {
  Plus, Search, Download, Pencil, Trash2, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, X, Columns3,
} from 'lucide-react';

export default function EntityList({ entity }) {
  const { canEdit: roleCanEdit, canDelete: roleCanDelete } = useAuth();
  const canEdit = roleCanEdit && !entity.readOnly;
  const canDelete = roleCanDelete && !entity.readOnly;
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Column visibility — persisted per entity in localStorage
  const colsKey = `dash-drop-cols-${entity.name}`;
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = localStorage.getItem(colsKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return entity.fields.map(f => f.name);
  });
  const [showColsPanel, setShowColsPanel] = useState(false);

  // Reset column visibility when entity changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`dash-drop-cols-${entity.name}`);
      if (saved) {
        setVisibleCols(JSON.parse(saved));
      } else {
        setVisibleCols(entity.fields.map(f => f.name));
      }
    } catch {
      setVisibleCols(entity.fields.map(f => f.name));
    }
    setShowColsPanel(false);
  }, [entity.name]);

  const toggleColumn = (fieldName) => {
    setVisibleCols(prev => {
      const next = prev.includes(fieldName)
        ? prev.filter(n => n !== fieldName)
        : [...prev, fieldName];
      localStorage.setItem(colsKey, JSON.stringify(next));
      return next;
    });
  };

  const displayFields = entity.fields.filter(f => visibleCols.includes(f.name));

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      for (const [key, val] of Object.entries(filters)) {
        if (val !== '' && val !== undefined) params[key] = val;
      }
      const res = await api.listEntity(entity.name, params);
      setData(res.data);
      setPagination(prev => ({ ...prev, ...res.pagination }));
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [entity.name, pagination.page, pagination.limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset state when entity changes
  useEffect(() => {
    setSearch('');
    setFilters({});
    setSortBy('createdAt');
    setSortOrder('desc');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [entity.name]);

  const handleSearch = (value) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilter = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleCreate = async (formData) => {
    setFormLoading(true);
    try {
      await api.createEntity(entity.name, formData);
      setShowCreate(false);
      fetchData();
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    setFormLoading(true);
    try {
      await api.updateEntity(entity.name, editItem.id, formData);
      setEditItem(null);
      fetchData();
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteEntity(entity.name, deleteItem.id);
      setDeleteItem(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { sortBy, sortOrder };
      if (search) params.search = search;
      for (const [key, val] of Object.entries(filters)) {
        if (val !== '' && val !== undefined) params[key] = val;
      }
      const blob = await api.exportCsv(entity.name, params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity.name.toLowerCase()}s.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const formatValue = (field, value) => {
    if (value === null || value === undefined) return '-';
    if (field.type === 'boolean') {
      return value ? (
        <Badge variant="default" className="bg-green-600">Yes</Badge>
      ) : (
        <Badge variant="secondary">No</Badge>
      );
    }
    if (field.type === 'enum') {
      return <Badge variant="outline">{value}</Badge>;
    }
    if (field.type === 'number') {
      return typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value;
    }
    if (field.type === 'text') {
      return value.length > 50 ? value.substring(0, 50) + '...' : value;
    }
    return String(value);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const enumFields = entity.fields.filter(f => f.type === 'enum');
  const hasActiveFilters = search || Object.values(filters).some(v => v !== '' && v !== undefined);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{entity.name}s</h1>
          <p className="text-muted-foreground">
            {pagination.total} total record{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowColsPanel(p => !p)}>
              <Columns3 className="mr-2 h-4 w-4" />
              Columns
            </Button>
            {showColsPanel && (
              <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-md border bg-popover p-2 shadow-md">
                {entity.fields.map(f => (
                  <label key={f.name} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols.includes(f.name)}
                      onChange={() => toggleColumn(f.name)}
                      className="h-4 w-4 rounded border-input"
                    />
                    {f.name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  </label>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add {entity.name}
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${entity.name.toLowerCase()}s...`}
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {enumFields.map(field => (
            <Select
              key={field.name}
              value={filters[field.name] || ''}
              onChange={e => handleFilter(field.name, e.target.value)}
              className="w-full sm:w-40"
            >
              <option value="">All {field.name.replace(/([A-Z])/g, ' $1').trim()}s</option>
              {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          ))}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setFilters({}); }}
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button onClick={() => handleSort('id')} className="flex items-center gap-1 hover:text-foreground">
                    ID <SortIcon field="id" />
                  </button>
                </th>
                {displayFields.map(field => (
                  <th key={field.name} className="px-4 py-3 text-left font-medium text-muted-foreground">
                    <button
                      onClick={() => handleSort(field.name)}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {field.name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                      <SortIcon field={field.name} />
                    </button>
                  </th>
                ))}
                {(canEdit || canDelete) && (
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={displayFields.length + 2} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={displayFields.length + 2} className="px-4 py-8 text-center text-muted-foreground">
                    No {entity.name.toLowerCase()}s found.
                  </td>
                </tr>
              ) : (
                data.map(item => (
                  <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 text-muted-foreground">{item.id}</td>
                    {displayFields.map(field => (
                      <td key={field.name} className="px-4 py-3">
                        {formatValue(field, item[field.name])}
                      </td>
                    ))}
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <Button variant="ghost" size="icon" onClick={() => setEditItem(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon" onClick={() => setDeleteItem(item)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={pagination.limit}
              onChange={e => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
              className="w-20"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Select>
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create {entity.name}</DialogTitle>
            <DialogDescription>Add a new {entity.name.toLowerCase()} record.</DialogDescription>
          </DialogHeader>
          <EntityForm
            entity={entity}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {entity.name}</DialogTitle>
            <DialogDescription>Update the {entity.name.toLowerCase()} record.</DialogDescription>
          </DialogHeader>
          {editItem && (
            <EntityForm
              entity={entity}
              initialData={editItem}
              onSubmit={handleUpdate}
              onCancel={() => setEditItem(null)}
              loading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {entity.name}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {entity.name.toLowerCase()}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function EntityForm({ entity, initialData, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const data = {};
    for (const field of entity.fields) {
      if (initialData && initialData[field.name] !== undefined) {
        data[field.name] = initialData[field.name];
      } else if (field.default !== undefined) {
        data[field.name] = field.default;
      } else {
        data[field.name] = field.type === 'boolean' ? false : '';
      }
    }
    setFormData(data);
    setErrors({});
  }, [entity, initialData]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  const validate = () => {
    const newErrors = {};
    for (const field of entity.fields) {
      if (field.required && field.type !== 'boolean') {
        const val = formData[field.name];
        if (val === undefined || val === null || val === '') {
          newErrors[field.name] = `${field.name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} is required`;
        }
      }
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      await onSubmit(formData);
    } catch (err) {
      // Map server-side errors to fields if possible
      const msg = err.message || 'Save failed';
      const fieldMatch = entity.fields.find(f => msg.toLowerCase().includes(f.name.toLowerCase()));
      if (fieldMatch) {
        setErrors({ [fieldMatch.name]: msg });
      } else {
        setErrors({ _form: msg });
      }
    }
  };

  const fieldError = (name) => errors[name];
  const errorClass = (name) => errors[name] ? 'border-destructive ring-destructive' : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors._form && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors._form}
        </div>
      )}

      {entity.fields.map(field => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {field.type === 'text' && (
            <Textarea
              id={field.name}
              value={formData[field.name] || ''}
              onChange={e => handleChange(field.name, e.target.value)}
              rows={3}
              className={errorClass(field.name)}
            />
          )}

          {field.type === 'enum' && (
            <Select
              id={field.name}
              value={formData[field.name] || ''}
              onChange={e => handleChange(field.name, e.target.value)}
              className={errorClass(field.name)}
            >
              <option value="">Select...</option>
              {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          )}

          {field.type === 'boolean' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={field.name}
                checked={!!formData[field.name]}
                onChange={e => handleChange(field.name, e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor={field.name} className="font-normal">
                {formData[field.name] ? 'Yes' : 'No'}
              </Label>
            </div>
          )}

          {field.type === 'number' && (
            <Input
              id={field.name}
              type="number"
              step="any"
              value={formData[field.name] ?? ''}
              onChange={e => handleChange(field.name, e.target.value === '' ? '' : parseFloat(e.target.value))}
              className={errorClass(field.name)}
            />
          )}

          {field.type === 'integer' && (
            <Input
              id={field.name}
              type="number"
              step="1"
              value={formData[field.name] ?? ''}
              onChange={e => handleChange(field.name, e.target.value === '' ? '' : parseInt(e.target.value))}
              className={errorClass(field.name)}
            />
          )}

          {field.type === 'string' && (
            <Input
              id={field.name}
              type="text"
              value={formData[field.name] || ''}
              onChange={e => handleChange(field.name, e.target.value)}
              className={errorClass(field.name)}
            />
          )}

          {field.type === 'date' && (
            <Input
              id={field.name}
              type="date"
              value={formData[field.name] || ''}
              onChange={e => handleChange(field.name, e.target.value)}
              className={errorClass(field.name)}
            />
          )}

          {fieldError(field.name) && (
            <p className="text-sm text-destructive">{fieldError(field.name)}</p>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
}

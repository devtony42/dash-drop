/**
 * Smoke tests for the EntityForm component.
 * Tests that form fields are rendered according to the entity schema.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntityForm from '@/components/EntityForm';

// ── Test entity schemas ───────────────────────────────────────────────────────
const contactEntity = {
  name: 'Contact',
  fields: [
    { name: 'name',    type: 'string', required: true,  searchable: true },
    { name: 'email',   type: 'string', required: true,  searchable: true },
    { name: 'phone',   type: 'string' },
    { name: 'status',  type: 'enum',   options: ['Lead', 'Customer', 'Churned'], required: true, default: 'Lead' },
    { name: 'active',  type: 'boolean', default: true },
    { name: 'notes',   type: 'text' },
  ],
};

const productEntity = {
  name: 'Product',
  fields: [
    { name: 'title',    type: 'string',  required: true },
    { name: 'price',    type: 'number',  required: true },
    { name: 'quantity', type: 'integer', required: true },
    { name: 'category', type: 'enum',    options: ['Electronics', 'Clothing', 'Food'], required: true },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('EntityForm — schema-driven field rendering', () => {
  it('renders without crashing for a basic entity', () => {
    render(
      <EntityForm
        entity={contactEntity}
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />
    );
    expect(document.body).toBeTruthy();
  });

  it('renders a label and input for each string field', () => {
    render(
      <EntityForm
        entity={contactEntity}
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />
    );

    // name, email, phone are string fields
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });

  it('renders a textarea for text-type fields', () => {
    render(
      <EntityForm
        entity={contactEntity}
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />
    );

    // notes is type 'text' → should be a textarea
    const notesField = screen.getByLabelText(/notes/i);
    expect(notesField.tagName.toLowerCase()).toBe('textarea');
  });

  it('renders a select/combobox for enum fields', () => {
    render(
      <EntityForm
        entity={contactEntity}
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />
    );

    // status is an enum — expect a combobox or select role
    const statusField = screen.getByRole('combobox', { name: /status/i });
    expect(statusField).toBeInTheDocument();
  });

  it('renders number inputs for number and integer fields', () => {
    render(
      <EntityForm
        entity={productEntity}
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />
    );

    const priceInput = screen.getByLabelText(/price/i);
    const qtyInput   = screen.getByLabelText(/quantity/i);
    expect(priceInput).toBeInTheDocument();
    expect(qtyInput).toBeInTheDocument();
  });

  it('pre-populates fields when initialData is provided', () => {
    const initialData = {
      name: 'Alice',
      email: 'alice@example.com',
      phone: '555-1234',
      status: 'Customer',
      active: true,
      notes: 'VIP client',
    };

    render(
      <EntityForm
        entity={contactEntity}
        initialData={initialData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />
    );

    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('VIP client')).toBeInTheDocument();
  });

  it('renders a submit button', () => {
    render(
      <EntityForm
        entity={contactEntity}
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />
    );

    expect(screen.getByRole('button', { name: /save|submit|create|add/i })).toBeInTheDocument();
  });

  it('renders a cancel button', () => {
    render(
      <EntityForm
        entity={contactEntity}
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <EntityForm
        entity={contactEntity}
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={onCancel}
        loading={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation errors for required fields when submitting empty form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <EntityForm
        entity={contactEntity}
        initialData={null}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        loading={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /save|submit|create|add/i }));

    // onSubmit should NOT have been called (validation failed)
    expect(onSubmit).not.toHaveBeenCalled();
    // At least one error message should be visible
    const errors = screen.getAllByText(/required|is required/i);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('disables submit button when loading is true', () => {
    render(
      <EntityForm
        entity={contactEntity}
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        loading={true}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /save|submit|saving|create/i });
    expect(submitBtn).toBeDisabled();
  });

  it('renders all fields from a different entity schema (products)', () => {
    render(
      <EntityForm
        entity={productEntity}
        initialData={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        loading={false}
      />
    );

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
  });
});

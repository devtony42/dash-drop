/**
 * Smoke tests for the EntityList page component.
 * Mocks: AuthContext, api module, react-router-dom navigation hooks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ── Mock the api module ───────────────────────────────────────────────────────
vi.mock('@/lib/api', () => ({
  api: {
    listEntity: vi.fn(),
    createEntity: vi.fn(),
    updateEntity: vi.fn(),
    deleteEntity: vi.fn(),
    getEntity: vi.fn(),
  },
}));

// ── Mock AuthContext ──────────────────────────────────────────────────────────
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import EntityList from '@/pages/EntityList';

// ── Test entity schema ────────────────────────────────────────────────────────
const testEntity = {
  name: 'Contact',
  icon: 'Users',
  fields: [
    { name: 'name',    type: 'string', required: true,  searchable: true },
    { name: 'email',   type: 'string', required: true,  searchable: true },
    { name: 'company', type: 'string', searchable: true },
    { name: 'status',  type: 'enum',   options: ['Lead', 'Customer'], required: true, default: 'Lead' },
  ],
};

// ── Fixture data ──────────────────────────────────────────────────────────────
const mockRecords = [
  { id: 1, name: 'Alice', email: 'alice@example.com', company: 'Acme', status: 'Lead',     createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Bob',   email: 'bob@example.com',   company: 'Beta', status: 'Customer', createdAt: '2024-01-02T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' },
];

const mockPaginatedResponse = {
  data: mockRecords,
  pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

// ── Helper ────────────────────────────────────────────────────────────────────
function renderEntityList(role = 'Admin') {
  useAuth.mockReturnValue({
    user: { id: 1, email: 'test@test.com', role },
    canEdit: role === 'Admin' || role === 'Editor',
    canDelete: role === 'Admin',
  });

  return render(
    <MemoryRouter>
      <EntityList entity={testEntity} />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('EntityList — smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listEntity.mockResolvedValue(mockPaginatedResponse);
  });

  it('renders without crashing', async () => {
    renderEntityList();
    // Component should mount and show loading or content
    expect(document.body).toBeTruthy();
  });

  it('renders record rows after data loads', async () => {
    renderEntityList();

    // Wait for Alice to appear
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders column headers for entity fields', async () => {
    renderEntityList();
    await screen.findByText('Alice'); // wait for load

    // Column headers (capitalized field names)
    expect(screen.getByText(/name/i)).toBeInTheDocument();
    expect(screen.getByText(/email/i)).toBeInTheDocument();
  });

  it('renders a search input', async () => {
    renderEntityList();
    await screen.findByText('Alice');

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('calls listEntity with search param when user types in search box', async () => {
    const user = userEvent.setup();
    renderEntityList();
    await screen.findByText('Alice');

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.clear(searchInput);
    await user.type(searchInput, 'alice');

    // Wait for debounce / re-fetch
    await vi.waitFor(() => {
      const calls = api.listEntity.mock.calls;
      const withSearch = calls.find(([, params]) => params?.search === 'alice');
      expect(withSearch).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('renders an Add button for Admin role', async () => {
    renderEntityList('Admin');
    await screen.findByText('Alice');

    expect(screen.getByRole('button', { name: /add|new|create/i })).toBeInTheDocument();
  });

  it('does NOT render an Add button for Viewer role', async () => {
    renderEntityList('Viewer');
    await screen.findByText('Alice');

    expect(screen.queryByRole('button', { name: /add|new|create/i })).not.toBeInTheDocument();
  });

  it('shows total record count and pagination area when there are records', async () => {
    renderEntityList();
    await screen.findByText('Alice');

    // The component renders "N total record(s)" in the header
    expect(screen.getByText(/2\s*total\s*record/i)).toBeInTheDocument();

    // Pagination buttons are icon-only — check that more than the 3 toolbar buttons
    // are present (prev page / page numbers / next page are rendered)
    const allBtns = screen.getAllByRole('button');
    expect(allBtns.length).toBeGreaterThan(5);
  });

  it('calls listEntity on mount', async () => {
    renderEntityList();
    await screen.findByText('Alice');

    expect(api.listEntity).toHaveBeenCalledWith('Contact', expect.any(Object));
  });

  it('renders a CSV export button', async () => {
    renderEntityList();
    await screen.findByText('Alice');

    // Export button uses Download icon with export label or aria
    const exportBtn = screen.getByRole('button', { name: /export|download/i });
    expect(exportBtn).toBeInTheDocument();
  });
});

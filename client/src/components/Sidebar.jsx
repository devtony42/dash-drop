export default function Sidebar({ entities, active, onSelect, open }) {
  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        flex flex-col transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      {/* Brand */}
      <div className="h-14 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
        <span className="text-lg font-bold tracking-tight">
          dash<span className="text-brand-500">-drop</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Entities
        </p>
        {entities.map((entity) => (
          <button
            key={entity.name}
            onClick={() => onSelect(entity.name)}
            className={`
              w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                active === entity.name
                  ? "bg-brand-500/10 text-brand-500"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }
            `}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {entity.name}
            </span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400">
        Schema-driven CRUD
      </div>
    </aside>
  );
}

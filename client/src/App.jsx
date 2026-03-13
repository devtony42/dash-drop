import { useState, useEffect } from "react";
import { fetchSchema } from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import EntityView from "./components/EntityView.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";

export default function App() {
  const [schema, setSchema] = useState(null);
  const [activeEntity, setActiveEntity] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchema()
      .then((data) => {
        setSchema(data);
        if (data.entities?.length > 0) {
          setActiveEntity(data.entities[0].name);
        }
      })
      .catch(() => setError("Failed to load schema. Is the API running?"));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-8 max-w-md text-center">
          <p className="text-red-600 dark:text-red-400 font-semibold text-lg mb-2">Connection Error</p>
          <p className="text-red-500 dark:text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  const entity = schema.entities.find((e) => e.name === activeEntity);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        entities={schema.entities}
        active={activeEntity}
        onSelect={(name) => {
          setActiveEntity(name);
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
      />

      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 lg:px-8 h-14 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {activeEntity}
          </h1>
          <ThemeToggle />
        </header>

        {entity && <EntityView key={activeEntity} entity={entity} />}
      </main>
    </div>
  );
}

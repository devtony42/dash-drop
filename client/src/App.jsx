import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SchemaProvider, useSchema } from '@/context/SchemaContext';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import EntityList from '@/pages/EntityList';
import UsersPage from '@/pages/UsersPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const { schema, loading } = useSchema();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const entities = schema?.entities || [];

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {entities.map(entity => (
          <Route
            key={entity.name}
            path={`/${entity.name.toLowerCase()}s`}
            element={<EntityList entity={entity} />}
          />
        ))}
        <Route path="/users" element={<UsersPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SchemaProvider>
            <AppRoutes />
          </SchemaProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

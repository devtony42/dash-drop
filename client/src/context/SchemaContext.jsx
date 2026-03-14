import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

const SchemaContext = createContext(null);

export function SchemaProvider({ children }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setSchema(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.getSchema()
      .then(setSchema)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <SchemaContext.Provider value={{ schema, loading }}>
      {children}
    </SchemaContext.Provider>
  );
}

export const useSchema = () => useContext(SchemaContext);

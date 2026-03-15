import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSchema } from '@/context/SchemaContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package, ShoppingCart, FileText, Users, TrendingUp, LayoutDashboard } from 'lucide-react';

const iconMap = { Package, ShoppingCart, FileText, Users };

function getIcon(name) {
  return iconMap[name] || Package;
}

export default function Dashboard() {
  const { schema } = useSchema();
  const { user } = useAuth();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (!schema) return;
    const fetchCounts = async () => {
      const results = {};
      for (const entity of schema.entities) {
        try {
          const res = await api.listEntity(entity.name, { limit: 1 });
          results[entity.name] = res.pagination.total;
        } catch {
          results[entity.name] = 0;
        }
      }
      setCounts(results);
    };
    fetchCounts();
  }, [schema]);

  const entities = schema?.entities || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}. Here's your overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entities.map(entity => {
          const Icon = getIcon(entity.icon);
          const count = counts[entity.name];
          const path = `/${entity.name.toLowerCase()}s`;
          return (
            <Link key={entity.name} to={path}>
              <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {entity.name}s
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {count !== undefined ? count : '...'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total records
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {/* Your Role card — always last in the grid, fills naturally */}
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Role
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user?.role}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {user?.role === 'admin' ? 'Full access' : user?.role === 'editor' ? 'Can create and edit' : 'Read only'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>This dashboard is dynamically generated from <code className="rounded bg-muted px-1 py-0.5">schema.config.json</code>.</p>
          <p>Add new entities to the config, restart the server, and new CRUD views will appear automatically.</p>
          <p>Current entities: {entities.map(e => e.name).join(', ')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

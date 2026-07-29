import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, useLocation, Redirect } from 'wouter';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { AppShell } from '@/components/layout/app-shell';

// Pages
import NotFound from '@/pages/not-found';
import Landing from '@/pages/landing';
import Login from '@/pages/login';
import Register from '@/pages/register';
import Dashboard from '@/pages/dashboard';
import Wizard from '@/pages/wizard';
import Result from '@/pages/result';
import History from '@/pages/history';
import Profile from '@/pages/profile';
import AdminDashboard from '@/pages/admin';

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Redirect to="/connexion" />;
  if (adminOnly && user.role !== 'admin') return <Redirect to="/tableau-de-bord" />;

  return (
    <AppShell>
      <Component />
    </AppShell>
  );
}

function AuthRedirect() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (user && (location === '/' || location === '/connexion' || location === '/inscription')) {
      setLocation('/tableau-de-bord');
    }
  }, [user, location, setLocation]);

  return null;
}

function Router() {
  return (
    <>
      <AuthRedirect />
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Landing} />
        <Route path="/connexion" component={Login} />
        <Route path="/inscription" component={Register} />

        {/* Protected Routes */}
        <Route path="/tableau-de-bord">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/generer">
          <ProtectedRoute component={Wizard} />
        </Route>
        <Route path="/resultat/:id">
          <ProtectedRoute component={Result} />
        </Route>
        <Route path="/historique">
          <ProtectedRoute component={History} />
        </Route>
        <Route path="/favoris">
          <ProtectedRoute component={() => <History isFavoritesOnly />} />
        </Route>
        <Route path="/profil">
          <ProtectedRoute component={Profile} />
        </Route>

        {/* Admin Route */}
        <Route path="/admin">
          <ProtectedRoute component={AdminDashboard} adminOnly />
        </Route>

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

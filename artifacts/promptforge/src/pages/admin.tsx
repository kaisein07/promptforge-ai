import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Link, useLocation } from "wouter";
import { 
  useGetAdminStats, 
  useGetAdminUsers, 
  useUpdateAdminUser, 
  useGetAdminConfig, 
  useUpdateAdminConfig, 
  useGetPayments,
  useApprovePayment,
  useRejectPayment,
} from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  LayoutDashboard, Users, Settings, CreditCard, ShieldAlert,
  Users as UsersIcon, Crown, Image as ImageIcon,
  DollarSign, Check, X, Save, Loader2, Clock, Phone
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Accès Refusé</h1>
        <p className="text-muted-foreground mb-8">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
        <Link href="/tableau-de-bord">
          <Button className="bg-primary text-white">Retour au tableau de bord</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-destructive" /> Administration
        </h1>
        <p className="text-muted-foreground">Gérez la plateforme, les utilisateurs et la configuration.</p>
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="bg-black/50 border border-white/10 p-1 rounded-xl mb-8">
          <TabsTrigger value="stats" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"><LayoutDashboard className="w-4 h-4 mr-2" /> Statistiques</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"><Users className="w-4 h-4 mr-2" /> Utilisateurs</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"><CreditCard className="w-4 h-4 mr-2" /> Paiements</TabsTrigger>
          <TabsTrigger value="config" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"><Settings className="w-4 h-4 mr-2" /> Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <StatsTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsTab />
        </TabsContent>
        <TabsContent value="config">
          <ConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsTab() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading || !stats) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground font-medium text-sm">Total Utilisateurs</h3>
            <UsersIcon className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground font-medium text-sm">Membres Premium</h3>
            <Crown className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.premiumUsers}</p>
          <p className="text-xs text-muted-foreground mt-2">{stats.conversionRate.toFixed(1)}% de conversion</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground font-medium text-sm">Prompts Générés</h3>
            <ImageIcon className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalPrompts}</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground font-medium text-sm">Revenus</h3>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.revenue} FCFA</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <h3 className="text-lg font-bold text-white mb-6">Répartition par catégorie</h3>
        <div className="space-y-4">
          {stats.categoryCounts.map(cat => (
            <div key={cat.category} className="flex items-center gap-4">
              <span className="w-48 text-sm text-muted-foreground truncate">{cat.category}</span>
              <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${(cat.count / Math.max(1, stats.totalPrompts)) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right text-sm font-medium text-white">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading } = useGetAdminUsers();
  const updateMutation = useUpdateAdminUser();
  const queryClient = useQueryClient();

  const handleUpdate = (id: number, data: any) => {
    updateMutation.mutate({ id, data }, {
      onSuccess: () => {
        toast.success("Utilisateur mis à jour");
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      }
    });
  };

  if (isLoading || !users) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="p-4 font-medium">Nom</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Rôle</th>
              <th className="p-4 font-medium">Statut</th>
              <th className="p-4 font-medium text-right">Prompts</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 text-white font-medium">{u.name}</td>
                <td className="p-4 text-muted-foreground text-sm">{u.email}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${u.role === 'admin' ? 'bg-destructive/20 text-destructive border border-destructive/30' : 'bg-white/10 text-muted-foreground'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  {u.isPremium ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-md">
                      <Crown className="w-3 h-3" /> Premium
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-white/5 px-2 py-1 rounded-md">
                      Gratuit
                    </span>
                  )}
                </td>
                <td className="p-4 text-right text-white font-mono text-sm">{u.promptsUsed}</td>
                <td className="p-4 text-right space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-white/10 h-8 text-xs"
                    onClick={() => handleUpdate(u.id, { isPremium: !u.isPremium })}
                  >
                    Toggle Premium
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-white/10 h-8 text-xs"
                    onClick={() => handleUpdate(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                  >
                    Toggle Admin
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsTab() {
  const { data: payments, isLoading } = useGetPayments();
  const approveMutation = useApprovePayment();
  const rejectMutation = useRejectPayment();
  const queryClient = useQueryClient();

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success("Paiement approuvé — utilisateur passé en Premium !");
        queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      },
      onError: () => toast.error("Erreur lors de l'approbation."),
    });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success("Paiement rejeté.");
        queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      },
      onError: () => toast.error("Erreur lors du rejet."),
    });
  };

  if (isLoading || !payments) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const pending = payments.filter(p => p.status === "pending");
  const others = payments.filter(p => p.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Pending payments */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" /> En attente de validation ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map(p => (
              <div key={p.id} className="glass-panel rounded-2xl border border-yellow-500/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{p.userName || `Utilisateur #${p.userId}`}</span>
                      <span className="text-xs text-muted-foreground">{p.userEmail}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phoneNumber || "—"}</span>
                      <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {p.paymentMethod || "—"}</span>
                      <span className="font-bold text-white">{p.amount} {p.currency}</span>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">Réf: {p.transactionRef}</div>
                    {p.notes && <div className="text-xs text-muted-foreground italic">Note: {p.notes}</div>}
                    <div className="text-xs text-muted-foreground">{format(new Date(p.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(p.id)}
                      disabled={approveMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white h-9 px-4"
                    >
                      {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Approuver</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(p.id)}
                      disabled={rejectMutation.isPending}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-9 px-4"
                    >
                      <X className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h3 className="text-white font-semibold mb-3">Historique</h3>
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 font-medium">Utilisateur</th>
                  <th className="p-4 font-medium">Opérateur</th>
                  <th className="p-4 font-medium">Référence</th>
                  <th className="p-4 font-medium">Montant</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {others.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">Aucun historique</td></tr>
                )}
                {others.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="text-white text-sm font-medium">{p.userName || `#${p.userId}`}</div>
                      <div className="text-muted-foreground text-xs">{p.userEmail}</div>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">{p.paymentMethod || "—"}</td>
                    <td className="p-4 text-white font-mono text-xs">{p.transactionRef}</td>
                    <td className="p-4 text-white font-bold">{p.amount} {p.currency}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        p.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        p.status === 'pending'  ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {p.status === 'approved' ? 'Approuvé' : p.status === 'pending' ? 'En attente' : 'Rejeté'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-muted-foreground text-sm">
                      {format(new Date(p.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigTab() {
  const { data: config, isLoading } = useGetAdminConfig();
  const updateMutation = useUpdateAdminConfig();
  const queryClient = useQueryClient();
  
  const [localConfig, setLocalConfig] = useState<Record<string, string>>({});

  if (config && Object.keys(localConfig).length === 0) {
    const map: Record<string, string> = {};
    config.forEach(c => map[c.key] = c.value);
    setLocalConfig(map);
  }

  const handleSave = () => {
    const entries = Object.entries(localConfig).map(([key, value]) => ({ key, value }));
    updateMutation.mutate({ data: { entries } }, {
      onSuccess: () => {
        toast.success("Configuration enregistrée");
        queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      }
    });
  };

  if (isLoading || !config) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-8 max-w-2xl">
      <h3 className="text-lg font-bold text-white mb-6">Paramètres de l'application</h3>
      
      <div className="space-y-6">
        {config.map(c => (
          <div key={c.key} className="grid grid-cols-3 items-center gap-4">
            <div className="col-span-1">
              <label className="text-sm font-medium text-white">{c.key}</label>
              <p className="text-xs text-muted-foreground mt-1">Clé système</p>
            </div>
            <div className="col-span-2">
              <Input 
                value={localConfig[c.key] || ""} 
                onChange={(e) => setLocalConfig(prev => ({ ...prev, [c.key]: e.target.value }))}
                className="bg-black/30 border-white/10 text-white focus-visible:ring-primary font-mono text-sm"
              />
            </div>
          </div>
        ))}

        <div className="pt-6 border-t border-white/10 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-white electric-glow"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  );
}

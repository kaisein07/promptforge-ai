import { useState } from "react";
import { useGetPrompts, useDeletePrompt, useDuplicatePrompt, useToggleFavorite } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Trash2, Copy, Heart, Eye, 
  History as HistoryIcon, Loader2, Sparkles 
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPromptsQueryKey } from "@workspace/api-client-react";

export default function History({ isFavoritesOnly = false }: { isFavoritesOnly?: boolean }) {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const queryParams = { 
    ...(search ? { search } : {}),
    ...(isFavoritesOnly ? { favorites: "true" } : {})
  };

  const { data: prompts, isLoading } = useGetPrompts(queryParams, {
    query: {
      queryKey: getGetPromptsQueryKey(queryParams)
    }
  });

  const deleteMutation = useDeletePrompt();
  const duplicateMutation = useDuplicatePrompt();
  const toggleFavoriteMutation = useToggleFavorite();

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce prompt ?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast.success("Prompt supprimé");
          queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
        }
      });
    }
  };

  const handleDuplicate = (id: number) => {
    duplicateMutation.mutate({ id }, {
      onSuccess: (data) => {
        toast.success("Prompt dupliqué");
        queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      }
    });
  };

  const handleToggleFavorite = (id: number) => {
    toggleFavoriteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            {isFavoritesOnly ? (
              <><Heart className="w-8 h-8 text-pink-500 fill-current" /> Vos Favoris</>
            ) : (
              <><HistoryIcon className="w-8 h-8 text-primary" /> Historique</>
            )}
          </h1>
          <p className="text-muted-foreground">Retrouvez tous vos prompts générés précédemment.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un mot-clé..." 
            className="pl-10 bg-black/30 border-white/10 text-white rounded-xl h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : !prompts || prompts.length === 0 ? (
        <div className="glass-panel border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Aucun prompt trouvé</h3>
          <p className="text-muted-foreground mb-6">
            {search ? "Essayez de modifier votre recherche." : "Vous n'avez pas encore généré de prompt."}
          </p>
          {!search && !isFavoritesOnly && (
            <Link href="/generer">
              <Button className="bg-primary hover:bg-primary/90 text-white">Générer mon premier prompt</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-white/5 text-xs font-medium text-white border border-white/10">
                    {prompt.projectType}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-primary/10 text-xs font-medium text-primary border border-primary/20">
                    {prompt.style}
                  </span>
                </div>
                <button 
                  onClick={() => handleToggleFavorite(prompt.id)}
                  className={`p-2 rounded-full hover:bg-white/10 transition-colors ${prompt.isFavorite ? 'text-pink-500' : 'text-muted-foreground'}`}
                >
                  <Heart className={`w-5 h-5 ${prompt.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-1 font-mono">
                {prompt.generatedText}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(prompt.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                </span>
                
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => handleDuplicate(prompt.id)} title="Dupliquer">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(prompt.id)} title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Link href={`/resultat/${prompt.id}`}>
                    <Button size="sm" className="h-8 ml-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">
                      <Eye className="w-4 h-4 mr-1.5" /> Voir
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
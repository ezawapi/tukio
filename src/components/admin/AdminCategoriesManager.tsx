import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ICON_OPTIONS = ["music", "mic-2", "palette", "trophy", "church", "graduation-cap", "party-popper", "globe", "landmark", "lock", "users", "wrench", "sparkles"];
const COLOR_OPTIONS = ["bg-primary", "bg-secondary", "bg-accent", "bg-emerald", "bg-amber", "bg-blue", "bg-green", "bg-purple", "bg-pink", "bg-orange", "bg-indigo", "bg-red", "bg-teal", "bg-cyan"];

const AdminCategoriesManager = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", icon: "globe", color: "bg-primary" });
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Nom requis", variant: "destructive" }); return; }
    if (editId) {
      const { error } = await supabase.from("categories").update({ name: form.name, icon: form.icon, color: form.color }).eq("id", editId);
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Catégorie modifiée" });
    } else {
      const { error } = await supabase.from("categories").insert({ name: form.name, icon: form.icon, color: form.color });
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Catégorie ajoutée" });
    }
    setDialogOpen(false);
    setEditId(null);
    setForm({ name: "", icon: "globe", color: "bg-primary" });
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Catégorie supprimée" });
    fetchCategories();
  };

  const openEdit = (cat: any) => {
    setEditId(cat.id);
    setForm({ name: cat.name, icon: cat.icon, color: cat.color });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ name: "", icon: "globe", color: "bg-primary" });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base sm:text-lg">Catégories ({categories.length})</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom de la catégorie" />
              </div>
              <div className="space-y-2">
                <Label>Icône</Label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                      className={`rounded-lg border-2 p-2 text-xs ${form.icon === icon ? "border-primary bg-primary/10" : "border-border"}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <button key={color} onClick={() => setForm(f => ({ ...f, color }))}
                      className={`h-8 w-8 rounded-full border-2 ${form.color === color ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: `hsl(var(--primary))` }}
                      title={color} />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSave}>{editId ? "Enregistrer" : "Ajouter"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">{cat.icon}</Badge>
                <span className="font-body text-sm font-medium text-foreground">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(cat)} className="h-8 w-8 p-0">
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer « {cat.name} » ?</AlertDialogTitle>
                      <AlertDialogDescription>Les événements liés à cette catégorie ne seront pas supprimés mais n'auront plus de catégorie.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCategoriesManager;

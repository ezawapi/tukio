import { useState, useEffect, useMemo } from "react";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { icons as lucideIcons } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Convert PascalCase icon name to kebab-case key used in DB
const toKebab = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

// Build full icon list from lucide-react
const ALL_ICONS = Object.keys(lucideIcons)
  .filter((name) => /^[A-Z]/.test(name) && !name.endsWith("Icon"))
  .map((name) => ({ name, kebab: toKebab(name) }));

const COLOR_OPTIONS = [
  { key: "bg-primary", label: "Bleu", hsl: "hsl(222,60%,45%)" },
  { key: "bg-secondary", label: "Terracotta", hsl: "hsl(16,65%,48%)" },
  { key: "bg-accent", label: "Or", hsl: "hsl(38,80%,50%)" },
  { key: "bg-emerald", label: "Émeraude", hsl: "hsl(160,60%,38%)" },
  { key: "bg-amber", label: "Ambre", hsl: "hsl(38,90%,50%)" },
  { key: "bg-green", label: "Vert", hsl: "hsl(142,55%,38%)" },
  { key: "bg-purple", label: "Violet", hsl: "hsl(270,55%,50%)" },
  { key: "bg-pink", label: "Rose", hsl: "hsl(330,65%,50%)" },
  { key: "bg-orange", label: "Orange", hsl: "hsl(25,90%,50%)" },
  { key: "bg-indigo", label: "Indigo", hsl: "hsl(240,50%,50%)" },
  { key: "bg-red", label: "Rouge", hsl: "hsl(0,70%,50%)" },
  { key: "bg-teal", label: "Sarcelle", hsl: "hsl(170,50%,38%)" },
  { key: "bg-cyan", label: "Cyan", hsl: "hsl(190,65%,38%)" },
  { key: "bg-rose", label: "Rosé", hsl: "hsl(350,60%,50%)" },
  { key: "bg-slate", label: "Ardoise", hsl: "hsl(215,20%,42%)" },
  { key: "bg-blue", label: "Bleu ciel", hsl: "hsl(210,70%,50%)" },
];

const AdminCategoriesManager = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", icon: "globe", color: "bg-primary" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [customIcon, setCustomIcon] = useState("");

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
  };

  useEffect(() => { fetchCategories(); }, []);

  const filteredIcons = useMemo(() => {
    const q = iconSearch.toLowerCase().trim();
    if (!q) return ALL_ICONS.slice(0, 80);
    return ALL_ICONS.filter((i) => i.kebab.includes(q) || i.name.toLowerCase().includes(q)).slice(0, 80);
  }, [iconSearch]);

  const renderIcon = (kebab: string, size = 20) => {
    const pascal = kebab.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    const IconComp = (lucideIcons as any)[pascal];
    if (!IconComp) return <span className="text-[10px]">{kebab}</span>;
    return <IconComp size={size} />;
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Nom requis", variant: "destructive" }); return; }
    const iconValue = customIcon.trim() || form.icon;
    if (editId) {
      const { error } = await supabase.from("categories").update({ name: form.name, icon: iconValue, color: form.color }).eq("id", editId);
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Catégorie modifiée" });
    } else {
      const { error } = await supabase.from("categories").insert({ name: form.name, icon: iconValue, color: form.color });
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Catégorie ajoutée" });
    }
    setDialogOpen(false);
    setEditId(null);
    setCustomIcon("");
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
    setCustomIcon("");
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ name: "", icon: "globe", color: "bg-primary" });
    setCustomIcon("");
    setDialogOpen(true);
  };

  const selectedColor = COLOR_OPTIONS.find((c) => c.key === form.color);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-base sm:text-lg">Catégories ({categories.length})</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nom de la catégorie" />
              </div>

              {/* Icon picker */}
              <div className="space-y-2">
                <Label>Icône sélectionnée</Label>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground" style={{ backgroundColor: selectedColor?.hsl || "hsl(222,60%,45%)" }}>
                    {renderIcon(customIcon.trim() || form.icon, 20)}
                  </div>
                  <span className="text-sm font-medium text-foreground">{customIcon.trim() || form.icon}</span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Rechercher une icône (ex: calendar, heart, star...)"
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-48 rounded-lg border border-border p-2">
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                    {filteredIcons.map(({ kebab }) => (
                      <button
                        key={kebab}
                        type="button"
                        onClick={() => { setForm((f) => ({ ...f, icon: kebab })); setCustomIcon(""); }}
                        title={kebab}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${form.icon === kebab && !customIcon ? "border-primary bg-primary/10 scale-110" : "border-transparent hover:bg-muted"}`}
                      >
                        {renderIcon(kebab, 18)}
                      </button>
                    ))}
                  </div>
                </ScrollArea>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Ou entrer un nom d'icône manuellement</Label>
                  <Input
                    value={customIcon}
                    onChange={(e) => setCustomIcon(e.target.value)}
                    placeholder="ex: book-open, shield-check, heart-pulse..."
                    className="text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Voir toutes les icônes sur <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="text-primary underline">lucide.dev/icons</a>
                  </p>
                </div>
              </div>

              {/* Color picker */}
              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c.key }))}
                      title={c.label}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${form.color === c.key ? "border-foreground scale-110 ring-2 ring-primary/30" : "border-transparent hover:scale-105"}`}
                      style={{ backgroundColor: c.hsl }}
                    />
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
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground"
                  style={{ backgroundColor: COLOR_OPTIONS.find((c) => c.key === cat.color)?.hsl || "hsl(222,60%,45%)" }}
                >
                  {renderIcon(cat.icon, 16)}
                </div>
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

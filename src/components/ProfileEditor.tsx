import { useState, useEffect, useRef } from "react";
import { Camera, User, Save, Loader2, Pencil, X, Phone, MapPin, Building2, Globe, Facebook, Instagram, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileEditorProps {
  userId: string;
  email: string;
}

const ProfileEditor = ({ userId, email }: ProfileEditorProps) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    display_name: "", avatar_url: "", video_url: "", bio: "",
    phone_primary: "", phone_secondary: "", physical_address: "",
    organization_name: "", organization_role: "",
    facebook_url: "", instagram_url: "", twitter_url: "",
    tiktok_url: "", linkedin_url: "", website_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { fetchProfile(); }, [userId]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, video_url, bio, phone_primary, phone_secondary, physical_address, organization_name, organization_role, facebook_url, instagram_url, twitter_url, tiktok_url, linkedin_url, website_url")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setForm({
        display_name: data.display_name || "",
        avatar_url: data.avatar_url || "",
        video_url: (data as any).video_url || "",
        phone_primary: (data as any).phone_primary || "",
        phone_secondary: (data as any).phone_secondary || "",
        physical_address: (data as any).physical_address || "",
        organization_name: (data as any).organization_name || "",
        organization_role: (data as any).organization_role || "",
        facebook_url: (data as any).facebook_url || "",
        instagram_url: (data as any).instagram_url || "",
        twitter_url: (data as any).twitter_url || "",
        tiktok_url: (data as any).tiktok_url || "",
        linkedin_url: (data as any).linkedin_url || "",
        website_url: (data as any).website_url || "",
      });
    }
    setLoaded(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Format invalide", variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: "Max 2 Mo", variant: "destructive" }); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
    set("avatar_url", urlData.publicUrl + "?t=" + Date.now());
    setUploading(false);
    toast({ title: "Photo mise à jour !" });
  };

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    const payload: any = {
      display_name: form.display_name.trim() || null,
      avatar_url: form.avatar_url || null,
      video_url: form.video_url || null,
      phone_primary: form.phone_primary || null,
      phone_secondary: form.phone_secondary || null,
      physical_address: form.physical_address || null,
      organization_name: form.organization_name || null,
      organization_role: form.organization_role || null,
      facebook_url: form.facebook_url || null,
      instagram_url: form.instagram_url || null,
      twitter_url: form.twitter_url || null,
      tiktok_url: form.tiktok_url || null,
      linkedin_url: form.linkedin_url || null,
      website_url: form.website_url || null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase.from("profiles").update(payload).eq("id", userId));
    } else {
      ({ error } = await supabase.from("profiles").insert({ id: userId, ...payload }));
    }
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Profil enregistré !" }); setEditing(false); }
    setSaving(false);
  };

  const initials = form.display_name
    ? form.display_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  if (!loaded) return null;

  if (!editing) {
    return (
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-border">
          <AvatarImage src={form.avatar_url} alt={form.display_name || email} />
          <AvatarFallback className="text-lg font-display">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg font-semibold text-foreground truncate">{form.display_name || "Utilisateur"}</p>
          <p className="font-body text-sm text-muted-foreground break-all">{email}</p>
          {form.organization_name && (
            <p className="font-body text-xs text-muted-foreground mt-0.5">{form.organization_role ? `${form.organization_role} — ` : ""}{form.organization_name}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5 shrink-0">
          <Pencil className="h-3.5 w-3.5" /> Modifier
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Modifier le profil</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage src={form.avatar_url} alt={form.display_name || email} />
            <AvatarFallback className="text-lg font-display">{initials}</AvatarFallback>
          </Avatar>
          <button onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
            disabled={uploading}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        <div className="flex-1 w-full space-y-4">
          {/* Basic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nom d'affichage</Label>
              <Input value={form.display_name} onChange={e => set("display_name", e.target.value)} placeholder="Votre nom" />
            </div>
            <div>
              <Label className="text-xs">Vidéo de présentation</Label>
              <Input value={form.video_url} onChange={e => set("video_url", e.target.value)} placeholder="https://youtube.com/..." />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Téléphone principal</Label>
              <Input value={form.phone_primary} onChange={e => set("phone_primary", e.target.value)} placeholder="+243..." />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Téléphone secondaire</Label>
              <Input value={form.phone_secondary} onChange={e => set("phone_secondary", e.target.value)} placeholder="+243..." />
            </div>
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> Adresse physique</Label>
            <Input value={form.physical_address} onChange={e => set("physical_address", e.target.value)} placeholder="123 Avenue..." />
          </div>

          {/* Organization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1"><Building2 className="h-3 w-3" /> Organisation</Label>
              <Input value={form.organization_name} onChange={e => set("organization_name", e.target.value)} placeholder="Nom de l'organisation" />
            </div>
            <div>
              <Label className="text-xs">Fonction / Rôle</Label>
              <Input value={form.organization_role} onChange={e => set("organization_role", e.target.value)} placeholder="Directeur, Manager..." />
            </div>
          </div>

          {/* Social */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Réseaux sociaux</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input value={form.facebook_url} onChange={e => set("facebook_url", e.target.value)} placeholder="Facebook URL" />
              <Input value={form.instagram_url} onChange={e => set("instagram_url", e.target.value)} placeholder="Instagram URL" />
              <Input value={form.twitter_url} onChange={e => set("twitter_url", e.target.value)} placeholder="Twitter / X URL" />
              <Input value={form.tiktok_url} onChange={e => set("tiktok_url", e.target.value)} placeholder="TikTok URL" />
              <Input value={form.linkedin_url} onChange={e => set("linkedin_url", e.target.value)} placeholder="LinkedIn URL" />
              <Input value={form.website_url} onChange={e => set("website_url", e.target.value)} placeholder="Site web" />
            </div>
          </div>

          <p className="font-body text-sm text-muted-foreground break-all">{email}</p>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;

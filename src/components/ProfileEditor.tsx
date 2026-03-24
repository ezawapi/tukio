import { useState, useEffect, useRef } from "react";
import { Camera, User, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileEditorProps {
  userId: string;
  email: string;
}

const ProfileEditor = ({ userId, email }: ProfileEditorProps) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles" as any)
      .select("display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setDisplayName((data as any).display_name || "");
      setAvatarUrl((data as any).avatar_url || "");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Format invalide", description: "Veuillez choisir une image.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Max 2 Mo.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erreur d'upload", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();
    setAvatarUrl(url);
    setUploading(false);
    toast({ title: "Photo mise à jour !" });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles" as any)
      .upsert({
        id: userId,
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      } as any);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profil enregistré !" });
    }
    setSaving(false);
  };

  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      <div className="relative">
        <Avatar className="h-20 w-20 border-2 border-border">
          <AvatarImage src={avatarUrl} alt={displayName || email} />
          <AvatarFallback className="text-lg font-display">{initials}</AvatarFallback>
        </Avatar>
        <button
          onClick={() => fileRef.current?.click()}
          className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
      </div>

      <div className="flex-1 w-full space-y-3">
        <div>
          <label className="font-body text-sm font-medium text-foreground mb-1 block">Nom d'affichage</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Votre nom"
            className="max-w-sm"
          />
        </div>
        <p className="font-body text-sm text-muted-foreground break-all">{email}</p>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default ProfileEditor;

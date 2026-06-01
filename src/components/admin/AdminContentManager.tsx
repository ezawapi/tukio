import { useEffect, useState } from "react";
import { Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { invalidateSiteContent } from "@/hooks/use-site-content";

const CONTENT_FIELDS = [
  { key: "home_badge_text", label: "Accueil · Badge au-dessus du titre", type: "input" },
  { key: "home_hero_title", label: "Accueil · Titre principal", type: "textarea" },
  { key: "home_hero_description", label: "Accueil · Description", type: "textarea" },
  { key: "home_search_placeholder", label: "Accueil · Placeholder recherche", type: "input" },
  { key: "home_city_placeholder", label: "Accueil · Placeholder ville", type: "input" },
  { key: "home_search_button", label: "Accueil · Bouton recherche", type: "input" },
  { key: "footer_description", label: "Description du footer", type: "textarea" },
  { key: "footer_contact_email", label: "Email de contact (footer)", type: "input" },
  { key: "footer_contact_phone", label: "Téléphone de contact (footer)", type: "input" },
  { key: "footer_facebook", label: "Facebook (URL)", type: "input" },
  { key: "footer_twitter", label: "X / Twitter (URL)", type: "input" },
  { key: "footer_instagram", label: "Instagram (URL)", type: "input" },
  { key: "footer_youtube", label: "YouTube (URL)", type: "input" },
  { key: "footer_tiktok", label: "TikTok (URL)", type: "input" },
  { key: "footer_linkedin", label: "LinkedIn (URL)", type: "input" },
  { key: "about_intro", label: "Introduction (À propos)", type: "textarea" },
  { key: "about_vision", label: "Vision (À propos)", type: "textarea" },
] as const;

const AdminContentManager = () => {
  const [content, setContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const { data } = await supabase.from("site_content").select("key, value");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((row: any) => { map[row.key] = row.value; });
      setContent(map);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    for (const field of CONTENT_FIELDS) {
      const value = content[field.key] || "";
      // Use upsert to handle both insert and update
      const { error } = await supabase
        .from("site_content")
        .upsert({ key: field.key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) {
        console.error(`Error saving ${field.key}:`, error.message);
      }
    }
    invalidateSiteContent();
    toast.success("Contenu mis à jour");
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Contenu du site
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {CONTENT_FIELDS.map((field) => (
          <div key={field.key}>
            <Label className="font-body text-sm font-medium">{field.label}</Label>
            {field.type === "textarea" ? (
              <Textarea
                value={content[field.key] || ""}
                onChange={(e) => setContent({ ...content, [field.key]: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <Input
                value={content[field.key] || ""}
                onChange={(e) => setContent({ ...content, [field.key]: e.target.value })}
                className="mt-1"
              />
            )}
          </div>
        ))}
        <Button onClick={handleSave} disabled={saving} className="gradient-hero border-0 text-primary-foreground gap-2">
          <Save className="h-4 w-4" /> {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminContentManager;

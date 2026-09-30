import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { z } from "zod";
import { User, Megaphone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SKIP = ["/auth", "/reset-password", "/terms", "/invite"];
const url = z.string().trim().max(500).refine((v) => !v || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v), "Lien invalide (https://…)");

const schema = z.object({
  account_type: z.enum(["user", "organizer"]),
  display_name: z.string().trim().min(2, "Nom requis (2 caractères min.)").max(100),
  contact_email: z.string().trim().email("Email invalide").max(255),
  phone_primary: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Numéro de téléphone invalide"),
  organization_name: z.string().trim().max(150).optional(),
  facebook_url: url, instagram_url: url, linkedin_url: url, tiktok_url: url, website_url: url, blog_url: url,
}).superRefine((d, ctx) => {
  if (d.account_type !== "organizer") return;
  if (!d.organization_name || d.organization_name.length < 2)
    ctx.addIssue({ code: "custom", path: ["organization_name"], message: "Nom de l'organisation requis" });
  if (![d.facebook_url, d.instagram_url, d.linkedin_url, d.tiktok_url, d.website_url, d.blog_url].some(Boolean))
    ctx.addIssue({ code: "custom", path: ["website_url"], message: "Ajoutez au moins un lien professionnel (page, site, blog…)" });
});

type Form = z.infer<typeof schema>;
const empty: Form = { account_type: "user", display_name: "", contact_email: "", phone_primary: "", organization_name: "",
  facebook_url: "", instagram_url: "", linkedin_url: "", tiktok_url: "", website_url: "", blog_url: "" };

const LINKS: [keyof Form, string][] = [
  ["facebook_url", "Page Facebook"], ["instagram_url", "Instagram"], ["linkedin_url", "LinkedIn"],
  ["tiktok_url", "TikTok"], ["website_url", "Site internet"], ["blog_url", "Blog"],
];

const OnboardingGate = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setOpen(false); return; }
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      const p: any = data || {};
      if (p.onboarding_completed) return;
      setForm({
        ...empty,
        account_type: p.account_type === "organizer" ? "organizer" : (user.user_metadata?.account_type === "organizer" ? "organizer" : "user"),
        display_name: p.display_name || user.user_metadata?.full_name || "",
        contact_email: p.contact_email || user.email || "",
        phone_primary: p.phone_primary || "",
        organization_name: p.organization_name || "",
        facebook_url: p.facebook_url || "", instagram_url: p.instagram_url || "", linkedin_url: p.linkedin_url || "",
        tiktok_url: p.tiktok_url || "", website_url: p.website_url || "", blog_url: p.blog_url || "",
      });
      setOpen(true);
    });
  }, [user]);

  if (!user || SKIP.some((s) => pathname.startsWith(s))) return null;

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const r = schema.safeParse(form);
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach((i) => { e[String(i.path[0])] ??= i.message; });
      setErrors(e); return;
    }
    setErrors({});
    setSaving(true);
    const d = r.data;
    const n = (v?: string) => (v ? v : null);
    const { error } = await supabase.from("profiles").update({
      account_type: d.account_type, display_name: d.display_name, contact_email: d.contact_email,
      phone_primary: d.phone_primary, organization_name: n(d.organization_name),
      facebook_url: n(d.facebook_url), instagram_url: n(d.instagram_url), linkedin_url: n(d.linkedin_url),
      tiktok_url: n(d.tiktok_url), website_url: n(d.website_url), blog_url: n(d.blog_url),
      onboarding_completed: true,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Profil complété", description: "Bienvenue sur Tukio !" });
    setOpen(false);
  };

  const Err = ({ k }: { k: string }) => errors[k] ? <p className="text-[11px] text-destructive mt-1">{errors[k]}</p> : null;
  const org = form.account_type === "organizer";

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display">Complétez votre profil</DialogTitle>
          <DialogDescription>Ces informations sont obligatoires pour utiliser Tukio.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {([["user", "Simple utilisateur", User], ["organizer", "Organisateur", Megaphone]] as const).map(([v, l, Icon]) => (
              <button key={v} type="button" onClick={() => set("account_type", v)}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${form.account_type === v ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}>
                <Icon className="h-4 w-4" /> {l}
              </button>
            ))}
          </div>
          <div><Label className="text-xs">Nom complet *</Label><Input value={form.display_name} onChange={(e) => set("display_name", e.target.value)} /><Err k="display_name" /></div>
          <div className="grid sm:grid-cols-2 gap-2">
            <div><Label className="text-xs">Email *</Label><Input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} /><Err k="contact_email" /></div>
            <div><Label className="text-xs">Téléphone *</Label><Input value={form.phone_primary} placeholder="+243 …" onChange={(e) => set("phone_primary", e.target.value)} /><Err k="phone_primary" /></div>
          </div>
          {org && (
            <>
              <div><Label className="text-xs">Nom de l'organisation *</Label><Input value={form.organization_name} onChange={(e) => set("organization_name", e.target.value)} /><Err k="organization_name" /></div>
              <p className="text-xs text-muted-foreground">Liens professionnels * (au moins un)</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {LINKS.map(([k, l]) => (
                  <div key={k}><Label className="text-[11px]">{l}</Label><Input value={form[k] as string} placeholder="https://…" onChange={(e) => set(k, e.target.value)} /><Err k={k} /></div>
                ))}
              </div>
            </>
          )}
          <Button className="w-full" onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Valider"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingGate;

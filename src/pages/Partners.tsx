import { useState } from "react";
import { z } from "zod";
import { Handshake, Send } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import PartnersBlock from "@/components/PartnersBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const url = z.string().trim().max(500).refine((v) => !v || /^https?:\/\//i.test(v), "Lien invalide (https://…)");
const schema = z.object({
  organization_name: z.string().trim().min(2, "Nom de l'organisation requis").max(150),
  contact_name: z.string().trim().min(2, "Nom du contact requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().max(30),
  website_url: url,
  logo_url: url,
  message: z.string().trim().max(2000),
});

const empty = { organization_name: "", contact_name: "", email: "", phone: "", website_url: "", logo_url: "", message: "" };

const Partners = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...empty, email: user?.email || "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast({ title: parsed.error.errors[0].message, variant: "destructive" }); return; }
    const d = parsed.data;
    setSending(true);
    const { error } = await supabase.from("partnership_requests").insert({
      organization_name: d.organization_name, contact_name: d.contact_name, email: d.email,
      phone: d.phone || null, website_url: d.website_url || null, logo_url: d.logo_url || null,
      message: d.message || null, user_id: user?.id ?? null,
    });
    setSending(false);
    if (error) { toast({ title: "Envoi impossible", description: "Réessayez plus tard.", variant: "destructive" }); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Partenaires | Tukio</title><meta name="description" content="Devenez partenaire de Tukio et gagnez en visibilité auprès du public événementiel." /><link rel="canonical" href="https://tukio.cd/partners" /></Helmet>
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 pb-24 pt-24">
        <div className="mb-4 flex items-center gap-3">
          <Handshake className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Partenaires</h1>
            <p className="font-body text-sm text-muted-foreground">Organisateurs, marques et institutions : rejoignez notre réseau.</p>
          </div>
        </div>

        <PartnersBlock />

        <Card className="mt-6"><CardContent className="p-5">
          <h2 className="mb-1 font-display text-xl font-semibold text-foreground">Demande de partenariat</h2>
          <p className="mb-4 font-body text-sm text-muted-foreground">Une fois validée par notre équipe, votre logo apparaîtra dans la carte des partenaires.</p>
          {sent ? (
            <p className="py-8 text-center font-body text-foreground">Merci ! Votre demande a été envoyée. Nous revenons vers vous rapidement.</p>
          ) : (
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Organisation *</Label><Input value={form.organization_name} onChange={(e) => set("organization_name", e.target.value)} required maxLength={150} /></div>
              <div className="space-y-2"><Label>Nom du contact *</Label><Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} required maxLength={100} /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required maxLength={255} /></div>
              <div className="space-y-2"><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={30} /></div>
              <div className="space-y-2"><Label>Site web</Label><Input value={form.website_url} onChange={(e) => set("website_url", e.target.value.trim())} placeholder="https://…" /></div>
              <div className="space-y-2"><Label>Lien du logo</Label><Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value.trim())} placeholder="https://…/logo.png" /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Message</Label><Textarea rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} maxLength={2000} /></div>
              <Button type="submit" disabled={sending} className="sm:col-span-2 gradient-hero border-0 text-primary-foreground"><Send className="mr-2 h-4 w-4" />{sending ? "Envoi..." : "Envoyer la demande"}</Button>
            </form>
          )}
        </CardContent></Card>
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Partners;

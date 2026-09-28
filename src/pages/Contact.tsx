import { useState } from "react";
import { z } from "zod";
import { Mail, Send } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(5, "Message trop court").max(3000),
});

const Contact = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: user?.email || "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name, email: parsed.data.email,
      subject: parsed.data.subject || null, message: parsed.data.message,
      user_id: user?.id ?? null,
    });
    setSending(false);
    if (error) { toast({ title: "Envoi impossible", description: "Réessayez plus tard.", variant: "destructive" }); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Contact | Tukio</title><meta name="description" content="Contactez l'équipe Tukio pour toute question sur vos événements." /><link rel="canonical" href="https://tukio.cd/contact" /></Helmet>
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 pb-24 pt-24">
        <div className="mb-6 flex items-center gap-3">
          <Mail className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Nous contacter</h1>
            <p className="font-body text-sm text-muted-foreground">Une question, une suggestion ? Écrivez-nous.</p>
          </div>
        </div>
        <Card><CardContent className="p-5">
          {sent ? (
            <p className="py-8 text-center font-body text-foreground">Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Nom</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} /></div>
              </div>
              <div className="space-y-2"><Label>Sujet</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={150} /></div>
              <div className="space-y-2"><Label>Message</Label><Textarea rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={3000} /></div>
              <Button type="submit" disabled={sending} className="w-full gradient-hero border-0 text-primary-foreground"><Send className="mr-2 h-4 w-4" />{sending ? "Envoi..." : "Envoyer"}</Button>
            </form>
          )}
        </CardContent></Card>
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Contact;

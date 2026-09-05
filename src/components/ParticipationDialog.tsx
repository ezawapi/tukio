import { useState, ReactNode } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, Ticket } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  full_name: z.string().trim().min(2, "Nom trop court").max(100, "Nom trop long"),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().max(30, "Téléphone trop long").optional().or(z.literal("")),
  guests: z.coerce.number().int().min(1, "Minimum 1 place").max(20, "Maximum 20 places"),
  message: z.string().trim().max(500, "Message trop long").optional().or(z.literal("")),
});

interface Props {
  eventId: string;
  eventTitle: string;
  children: ReactNode;
}

const ParticipationDialog = ({ eventId, eventTitle, children }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    full_name: (user?.user_metadata as any)?.display_name || "",
    email: user?.email || "",
    phone: "",
    guests: "1",
    message: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[String(i.path[0])] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await (supabase as any).from("event_participations").insert({
      event_id: eventId,
      user_id: user?.id ?? null,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      guests: parsed.data.guests,
      message: parsed.data.message || null,
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: "Inscription impossible",
        description: "Cet événement n'accepte pas encore les inscriptions. Réessayez plus tard.",
        variant: "destructive",
      });
      return;
    }
    setDone(true);
    toast({ title: "🎉 Participation enregistrée", description: `Vous êtes inscrit à « ${eventTitle} ».` });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) { setDone(false); setErrors({}); }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">Participation confirmée</h2>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Merci ! Votre inscription à « {eventTitle} » a bien été enregistrée. L'organisateur vous contactera par email.
            </p>
            <Button className="mt-5 w-full" onClick={() => setOpen(false)}>Fermer</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display">
                <Ticket className="h-5 w-5 text-primary" /> Participer à l'événement
              </DialogTitle>
              <DialogDescription>{eventTitle}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Nom complet *</Label>
                <Input id="p-name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} maxLength={100} placeholder="Votre nom" />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-email">Email *</Label>
                <Input id="p-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={255} placeholder="vous@email.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-phone">Téléphone</Label>
                  <Input id="p-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={30} placeholder="+243..." />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-guests">Nombre de places</Label>
                  <Input id="p-guests" type="number" min={1} max={20} value={form.guests} onChange={(e) => set("guests", e.target.value)} />
                  {errors.guests && <p className="text-xs text-destructive">{errors.guests}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-message">Message à l'organisateur</Label>
                <Textarea id="p-message" value={form.message} onChange={(e) => set("message", e.target.value)} maxLength={500} rows={3} placeholder="Facultatif" />
                {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
              </div>
              <Button type="submit" className="w-full gradient-hero border-0 text-primary-foreground" size="lg" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</> : "Confirmer ma participation"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ParticipationDialog;

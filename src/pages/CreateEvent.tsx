import { useState, useEffect } from "react";
import MobileTabBar from "@/components/MobileTabBar";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Phone, Mail, Globe, Facebook, Instagram, Twitter, MessageCircle, DollarSign, Image, Ticket, Lock, Link2, Video, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageUpload from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const CURRENCIES = [
  { value: "FCFA", label: "FCFA" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "GBP", label: "£ GBP" },
  { value: "CDF", label: "CDF" },
  { value: "XAF", label: "XAF" },
  { value: "NGN", label: "₦ NGN" },
  { value: "KES", label: "KES" },
  { value: "ZAR", label: "ZAR" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Privé & Exclusif" },
];

const TICKETING_OPTIONS = [
  { value: "none", label: "Pas de réservation externe" },
  { value: "external", label: "Réservation externe (Eventbrite, etc.)" },
];

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    date: "",
    end_date: "",
    venue_name: "",
    location: "",
    city: "",
    price: "Gratuit",
    currency: "FCFA",
    capacity: "",
    image_url: "",
    image_url2: "",
    organizer_name: "",
    organizer_logo_url: "",
    latitude: "",
    longitude: "",
    phone1: "",
    phone2: "",
    whatsapp: "",
    contact_email: "",
    website_url: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    tiktok_url: "",
    visibility: "public",
    ticketing_mode: "none",
    external_ticket_url: "",
    reservation_cta_label: "Réserver",
    is_live: false,
    live_url: "",
  });

  useEffect(() => {
    if (!user) navigate("/auth");
    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    if (data) setCategories(data);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (form.ticketing_mode === "external" && !form.external_ticket_url.trim()) {
      toast({ title: "Lien requis", description: "Ajoutez un lien vers votre plateforme de réservation.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description,
      category_id: form.category_id || null,
      date: new Date(form.date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      venue_name: form.venue_name || null,
      location: form.location,
      city: form.city,
      price: form.price,
      currency: form.currency,
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      image_url: form.image_url || null,
      image_url2: form.image_url2 || null,
      organizer_name: form.organizer_name,
      organizer_logo_url: form.organizer_logo_url || null,
      organizer_id: user.id,
      author_id: user.id,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      phone1: form.phone1 || null,
      phone2: form.phone2 || null,
      whatsapp: form.whatsapp || null,
      contact_email: form.contact_email || null,
      website_url: form.website_url || null,
      facebook_url: form.facebook_url || null,
      instagram_url: form.instagram_url || null,
      twitter_url: form.twitter_url || null,
      tiktok_url: form.tiktok_url || null,
      visibility: form.visibility,
      ticketing_mode: form.ticketing_mode,
      external_ticket_url: form.ticketing_mode === "external" ? form.external_ticket_url.trim() : null,
      reservation_cta_label: form.ticketing_mode === "external" ? (form.reservation_cta_label.trim() || "Réserver") : "Réserver",
      is_live: form.is_live,
      live_url: form.is_live ? (form.live_url || null) : null,
    } as any);

    setLoading(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Événement soumis !", description: "Il sera visible après validation par l'administrateur." });
      navigate("/events");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pb-16 pt-20">
        <div className="container mx-auto max-w-2xl px-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl sm:text-2xl">Publier un événement</CardTitle>
              <p className="font-body text-sm text-muted-foreground">
                Votre événement sera soumis à validation avant publication.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-body">Titre *</Label>
                  <Input value={form.title} onChange={(e) => handleChange("title", e.target.value)} required placeholder="Nom de l'événement" />
                </div>

                <div className="space-y-2">
                  <Label className="font-body">Description</Label>
                  <Textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Décrivez votre événement..." rows={4} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-body">Catégorie</Label>
                    <Select value={form.category_id} onValueChange={(v) => handleChange("category_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Nom de l'organisateur</Label>
                    <Input value={form.organizer_name} onChange={(e) => handleChange("organizer_name", e.target.value)} placeholder="Votre nom ou organisation" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-body">Visibilité</Label>
                    <Select value={form.visibility} onValueChange={(value) => handleChange("visibility", value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VISIBILITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.visibility === "private" && (
                      <p className="font-body text-xs text-muted-foreground">
                        Après validation, gérez les invitations QR depuis la page de l'événement.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Réservation</Label>
                    <Select value={form.ticketing_mode} onValueChange={(value) => handleChange("ticketing_mode", value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TICKETING_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Live option */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-destructive" />
                      <Label className="font-body font-semibold">Diffusion en direct (Live)</Label>
                    </div>
                    <Switch checked={form.is_live} onCheckedChange={(checked) => handleChange("is_live", checked)} />
                  </div>
                  {form.is_live && (
                    <div className="space-y-2">
                      <Label className="font-body text-xs">Lien du Live (YouTube, Zoom, etc.)</Label>
                      <Input value={form.live_url} onChange={(e) => handleChange("live_url", e.target.value)} placeholder="https://youtube.com/live/..." />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-body">Date de début *</Label>
                    <Input type="datetime-local" value={form.date} onChange={(e) => handleChange("date", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Date de fin</Label>
                    <Input type="datetime-local" value={form.end_date} onChange={(e) => handleChange("end_date", e.target.value)} />
                  </div>
                </div>

                {/* Venue and Address */}
                <div className="border-t border-border pt-5">
                  <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                    <MapPin className="h-4 w-4 text-primary" /> Lieu
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-body">Nom du lieu</Label>
                      <Input value={form.venue_name} onChange={(e) => handleChange("venue_name", e.target.value)} placeholder="Ex: Stade des Martyrs, Hôtel Memling..." />
                      <p className="text-xs text-muted-foreground">S'affichera en gras au-dessus de l'adresse</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="font-body">Adresse *</Label>
                        <Input value={form.location} onChange={(e) => handleChange("location", e.target.value)} required placeholder="Avenue de la Libération, n°12" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-body">Ville *</Label>
                        <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} required placeholder="Kinshasa, Abidjan..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="font-body">Latitude</Label>
                        <Input type="number" step="any" value={form.latitude} onChange={(e) => handleChange("latitude", e.target.value)} placeholder="-4.3250" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-body">Longitude</Label>
                        <Input type="number" step="any" value={form.longitude} onChange={(e) => handleChange("longitude", e.target.value)} placeholder="15.3222" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-5">
                  <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                    <DollarSign className="h-4 w-4 text-primary" /> Tarification
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2 sm:col-span-1">
                      <Label className="font-body">Prix</Label>
                      <Input value={form.price} onChange={(e) => handleChange("price", e.target.value)} placeholder="Gratuit, 5000..." />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body">Devise</Label>
                      <Select
                        value={(!form.price || form.price.toLowerCase() === "gratuit") ? "" : form.currency}
                        onValueChange={(v) => handleChange("currency", v)}
                        disabled={!form.price || form.price.toLowerCase() === "gratuit"}
                      >
                        <SelectTrigger className={(!form.price || form.price.toLowerCase() === "gratuit") ? "opacity-50" : ""}>
                          <SelectValue placeholder={(!form.price || form.price.toLowerCase() === "gratuit") ? "—" : undefined} />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body">Capacité</Label>
                      <Input type="number" value={form.capacity} onChange={(e) => handleChange("capacity", e.target.value)} placeholder="Nombre de places" />
                    </div>
                  </div>
                </div>

                {form.ticketing_mode === "external" && (
                  <div className="border-t border-border pt-5">
                    <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                      <Ticket className="h-4 w-4 text-primary" /> Réservation externe
                    </h3>
                    <div className="space-y-4">
                      <div className="rounded-xl border border-border bg-muted/40 p-4">
                        <p className="font-body text-sm text-muted-foreground">
                          Crée d'abord ta billetterie sur Eventbrite, Shotgun, Bizouk ou une autre plateforme, puis colle ici le lien public de réservation.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label className="font-body flex items-center gap-1">
                            <Link2 className="h-3.5 w-3.5 text-primary" /> Lien de réservation
                          </Label>
                          <Input
                            type="url"
                            value={form.external_ticket_url}
                            onChange={(e) => handleChange("external_ticket_url", e.target.value)}
                            placeholder="https://www.eventbrite.com/e/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-body">Texte du bouton</Label>
                          <Input value={form.reservation_cta_label} onChange={(e) => handleChange("reservation_cta_label", e.target.value)} placeholder="Réserver" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-5">
                  <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                    <Image className="h-4 w-4 text-primary" /> Photos de l'événement
                  </h3>
                  {user && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <ImageUpload
                        value={form.image_url}
                        onChange={(url) => handleChange("image_url", url)}
                        userId={user.id}
                        label="Photo principale * (fichier ou URL)"
                      />
                      <ImageUpload
                        value={form.image_url2}
                        onChange={(url) => handleChange("image_url2", url)}
                        userId={user.id}
                        label="Photo secondaire (optionnel)"
                      />
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-5">
                  <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                    <Phone className="h-4 w-4 text-primary" /> Informations de contact
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="font-body">Téléphone 1</Label>
                        <Input value={form.phone1} onChange={(e) => handleChange("phone1", e.target.value)} placeholder="+243 XXX XXX XXX" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-body">Téléphone 2</Label>
                        <Input value={form.phone2} onChange={(e) => handleChange("phone2", e.target.value)} placeholder="+243 XXX XXX XXX" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="font-body flex items-center gap-1">
                          <MessageCircle className="h-3 w-3 text-primary" /> WhatsApp
                        </Label>
                        <Input value={form.whatsapp} onChange={(e) => handleChange("whatsapp", e.target.value)} placeholder="+243 XXX XXX XXX" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-body">Email de contact</Label>
                        <Input type="email" value={form.contact_email} onChange={(e) => handleChange("contact_email", e.target.value)} placeholder="contact@exemple.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body">Site web</Label>
                      <Input value={form.website_url} onChange={(e) => handleChange("website_url", e.target.value)} placeholder="https://www.exemple.com" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-5">
                  <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                    <Globe className="h-4 w-4 text-primary" /> Réseaux sociaux
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="font-body flex items-center gap-1"><Facebook className="h-3 w-3" /> Facebook</Label>
                        <Input value={form.facebook_url} onChange={(e) => handleChange("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-body flex items-center gap-1"><Instagram className="h-3 w-3" /> Instagram</Label>
                        <Input value={form.instagram_url} onChange={(e) => handleChange("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="font-body flex items-center gap-1"><Twitter className="h-3 w-3" /> Twitter / X</Label>
                        <Input value={form.twitter_url} onChange={(e) => handleChange("twitter_url", e.target.value)} placeholder="https://x.com/..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-body">TikTok</Label>
                        <Input value={form.tiktok_url} onChange={(e) => handleChange("tiktok_url", e.target.value)} placeholder="https://tiktok.com/@..." />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="flex items-start gap-2 font-body text-xs text-muted-foreground">
                    <Lock className="mt-0.5 h-3.5 w-3.5 text-primary" />
                    Pour un événement privé, créez l'événement puis gérez les invitations QR depuis la page de l'événement après validation. L'admin peut aussi modifier toute publication.
                  </p>
                </div>

                <Button type="submit" className="w-full border-0 gradient-hero text-primary-foreground" size="lg" disabled={loading}>
                  {loading ? "Soumission..." : "Soumettre l'événement"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default CreateEvent;

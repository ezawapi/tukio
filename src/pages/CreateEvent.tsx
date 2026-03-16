import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Globe, Facebook, Instagram, Twitter, MessageCircle, DollarSign, Image } from "lucide-react";
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
    location: "",
    city: "",
    price: "Gratuit",
    currency: "FCFA",
    capacity: "",
    image_url: "",
    image_url2: "",
    organizer_name: "",
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
  });

  useEffect(() => {
    if (!user) navigate("/auth");
    fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    if (data) setCategories(data);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description,
      category_id: form.category_id || null,
      date: new Date(form.date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      location: form.location,
      city: form.city,
      price: form.price,
      currency: form.currency,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      image_url: form.image_url || null,
      image_url2: form.image_url2 || null,
      organizer_name: form.organizer_name,
      organizer_id: user.id,
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
    });

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
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Publier un événement</CardTitle>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-body">Date de début *</Label>
                    <Input type="datetime-local" value={form.date} onChange={(e) => handleChange("date", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Date de fin</Label>
                    <Input type="datetime-local" value={form.end_date} onChange={(e) => handleChange("end_date", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-body">Lieu *</Label>
                    <Input value={form.location} onChange={(e) => handleChange("location", e.target.value)} required placeholder="Adresse ou nom du lieu" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Ville *</Label>
                    <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} required placeholder="Kinshasa, Abidjan..." />
                  </div>
                </div>

                {/* Prix avec devise */}
                <div className="border-t border-border pt-5">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" /> Tarification
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2 sm:col-span-1">
                      <Label className="font-body">Prix</Label>
                      <Input value={form.price} onChange={(e) => handleChange("price", e.target.value)} placeholder="Gratuit, 5000..." />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-body">Devise</Label>
                      <Select value={form.currency} onValueChange={(v) => handleChange("currency", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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

                {/* Photos */}
                <div className="border-t border-border pt-5">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Image className="h-4 w-4 text-primary" /> Photos de l'événement
                  </h3>
                  {user && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        label="Photo secondaire (optionnel, fichier ou URL)"
                      />
                    </div>
                  )}
                </div>

                {/* Contact Section */}
                <div className="border-t border-border pt-5">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" /> Informations de contact
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-body">Téléphone 1</Label>
                        <Input value={form.phone1} onChange={(e) => handleChange("phone1", e.target.value)} placeholder="+243 XXX XXX XXX" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-body">Téléphone 2</Label>
                        <Input value={form.phone2} onChange={(e) => handleChange("phone2", e.target.value)} placeholder="+243 XXX XXX XXX" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* Social Media Section */}
                <div className="border-t border-border pt-5">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Réseaux sociaux
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-body flex items-center gap-1"><Facebook className="h-3 w-3" /> Facebook</Label>
                        <Input value={form.facebook_url} onChange={(e) => handleChange("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-body flex items-center gap-1"><Instagram className="h-3 w-3" /> Instagram</Label>
                        <Input value={form.instagram_url} onChange={(e) => handleChange("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-body">Latitude</Label>
                    <Input type="number" step="any" value={form.latitude} onChange={(e) => handleChange("latitude", e.target.value)} placeholder="-4.3250" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Longitude</Label>
                    <Input type="number" step="any" value={form.longitude} onChange={(e) => handleChange("longitude", e.target.value)} placeholder="15.3222" />
                  </div>
                </div>

                <Button type="submit" className="w-full gradient-hero text-primary-foreground border-0" size="lg" disabled={loading}>
                  {loading ? "Soumission..." : "Soumettre l'événement"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateEvent;

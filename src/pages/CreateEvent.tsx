import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
    capacity: "",
    image_url: "",
    organizer_name: "",
    latitude: "",
    longitude: "",
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
      capacity: form.capacity ? parseInt(form.capacity) : null,
      image_url: form.image_url || null,
      organizer_name: form.organizer_name,
      organizer_id: user.id,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Événement créé avec succès !" });
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

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-body">Date de début *</Label>
                    <Input type="datetime-local" value={form.date} onChange={(e) => handleChange("date", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Date de fin</Label>
                    <Input type="datetime-local" value={form.end_date} onChange={(e) => handleChange("end_date", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-body">Lieu *</Label>
                    <Input value={form.location} onChange={(e) => handleChange("location", e.target.value)} required placeholder="Adresse ou nom du lieu" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Ville *</Label>
                    <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} required placeholder="Kinshasa, Abidjan..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-body">Prix</Label>
                    <Input value={form.price} onChange={(e) => handleChange("price", e.target.value)} placeholder="Gratuit, 5000 FCFA..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Capacité</Label>
                    <Input type="number" value={form.capacity} onChange={(e) => handleChange("capacity", e.target.value)} placeholder="Nombre de places" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-body">URL de l'image</Label>
                  <Input value={form.image_url} onChange={(e) => handleChange("image_url", e.target.value)} placeholder="https://..." />
                </div>

                <Button type="submit" className="w-full gradient-hero text-primary-foreground border-0" size="lg" disabled={loading}>
                  {loading ? "Publication..." : "Publier l'événement"}
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

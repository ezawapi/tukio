import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Phone, Mail, Globe, Facebook, Instagram, Twitter, MessageCircle, DollarSign, Image, Ticket, Link2, Video, MapPin, Lock } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

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

interface EventFormFieldsProps {
  form: Record<string, any>;
  categories: { id: string; name: string }[];
  userId?: string;
  onChange: (field: string, value: string | boolean) => void;
  showAdminFields?: boolean;
}

const EventFormFields = ({ form, categories, userId, onChange, showAdminFields }: EventFormFieldsProps) => {
  const isFree = !form.price || form.price === "Gratuit" || form.price === "0" || form.price.toLowerCase?.() === "gratuit";

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="font-body">Titre *</Label>
        <Input value={form.title || ""} onChange={(e) => onChange("title", e.target.value)} required placeholder="Nom de l'événement" />
      </div>

      <div className="space-y-2">
        <Label className="font-body">Description</Label>
        <Textarea value={form.description || ""} onChange={(e) => onChange("description", e.target.value)} placeholder="Décrivez votre événement..." rows={4} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="font-body">Catégorie</Label>
          <Select value={form.category_id || "none"} onValueChange={(v) => onChange("category_id", v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="font-body">Nom de l'organisateur</Label>
          <Input value={form.organizer_name || ""} onChange={(e) => onChange("organizer_name", e.target.value)} placeholder="Votre nom ou organisation" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="font-body">Visibilité</Label>
          <Select value={form.visibility || "public"} onValueChange={(value) => onChange("visibility", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {VISIBILITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="font-body">Réservation</Label>
          <Select value={form.ticketing_mode || "none"} onValueChange={(value) => onChange("ticketing_mode", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TICKETING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showAdminFields && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-body">Statut</Label>
            <Select value={form.status || "pending"} onValueChange={(value) => onChange("status", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvée</SelectItem>
                <SelectItem value="rejected">Rejetée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-body">Publication</Label>
            <Select value={form.is_published ? "true" : "false"} onValueChange={(value) => onChange("is_published", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Publiée</SelectItem>
                <SelectItem value="false">Non publiée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Live option */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-destructive" />
            <Label className="font-body font-semibold">Diffusion en direct (Live)</Label>
          </div>
          <Switch checked={!!form.is_live} onCheckedChange={(checked) => onChange("is_live", checked)} />
        </div>
        {form.is_live && (
          <div className="space-y-2">
            <Label className="font-body text-xs">Lien du Live (YouTube, Zoom, etc.)</Label>
            <Input value={form.live_url || ""} onChange={(e) => onChange("live_url", e.target.value)} placeholder="https://youtube.com/live/..." />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="font-body">Date de début *</Label>
          <Input type="datetime-local" value={form.date || ""} onChange={(e) => onChange("date", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label className="font-body">Date de fin</Label>
          <Input type="datetime-local" value={form.end_date || ""} onChange={(e) => onChange("end_date", e.target.value)} />
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
            <Input value={form.venue_name || ""} onChange={(e) => onChange("venue_name", e.target.value)} placeholder="Ex: Stade des Martyrs, Hôtel Memling..." />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-body">Adresse *</Label>
              <Input value={form.location || ""} onChange={(e) => onChange("location", e.target.value)} required placeholder="Avenue de la Libération, n°12" />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Ville *</Label>
              <Input value={form.city || ""} onChange={(e) => onChange("city", e.target.value)} required placeholder="Kinshasa, Abidjan..." />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-body">Latitude</Label>
              <Input type="number" step="any" value={form.latitude || ""} onChange={(e) => onChange("latitude", e.target.value)} placeholder="-4.3250" />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Longitude</Label>
              <Input type="number" step="any" value={form.longitude || ""} onChange={(e) => onChange("longitude", e.target.value)} placeholder="15.3222" />
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
            <Input value={form.price || ""} onChange={(e) => onChange("price", e.target.value)} placeholder="Gratuit, 5000..." />
          </div>
          <div className="space-y-2">
            <Label className="font-body">Devise</Label>
            <Select value={isFree ? "" : (form.currency || "FCFA")} onValueChange={(v) => onChange("currency", v)} disabled={isFree}>
              <SelectTrigger className={isFree ? "opacity-50" : ""}>
                <SelectValue placeholder={isFree ? "—" : undefined} />
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
            <Input type="number" value={form.capacity || ""} onChange={(e) => onChange("capacity", e.target.value)} placeholder="Nombre de places" />
          </div>
        </div>
      </div>

      {(form.ticketing_mode === "external") && (
        <div className="border-t border-border pt-5">
          <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <Ticket className="h-4 w-4 text-primary" /> Réservation externe
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-body flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5 text-primary" /> Lien de réservation
                </Label>
                <Input type="url" value={form.external_ticket_url || ""} onChange={(e) => onChange("external_ticket_url", e.target.value)} placeholder="https://www.eventbrite.com/e/..." />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Texte du bouton</Label>
                <Input value={form.reservation_cta_label || "Réserver"} onChange={(e) => onChange("reservation_cta_label", e.target.value)} placeholder="Réserver" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border pt-5">
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <Image className="h-4 w-4 text-primary" /> Photos de l'événement
        </h3>
        {userId ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ImageUpload value={form.image_url || ""} onChange={(url) => onChange("image_url", url)} userId={userId} label="Photo principale * (fichier ou URL)" />
            <ImageUpload value={form.image_url2 || ""} onChange={(url) => onChange("image_url2", url)} userId={userId} label="Photo secondaire (optionnel)" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-body">Image principale (URL)</Label>
              <Input value={form.image_url || ""} onChange={(e) => onChange("image_url", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Image secondaire (URL)</Label>
              <Input value={form.image_url2 || ""} onChange={(e) => onChange("image_url2", e.target.value)} />
            </div>
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
              <Input value={form.phone1 || ""} onChange={(e) => onChange("phone1", e.target.value)} placeholder="+243 XXX XXX XXX" />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Téléphone 2</Label>
              <Input value={form.phone2 || ""} onChange={(e) => onChange("phone2", e.target.value)} placeholder="+243 XXX XXX XXX" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-body flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-primary" /> WhatsApp
              </Label>
              <Input value={form.whatsapp || ""} onChange={(e) => onChange("whatsapp", e.target.value)} placeholder="+243 XXX XXX XXX" />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Email de contact</Label>
              <Input type="email" value={form.contact_email || ""} onChange={(e) => onChange("contact_email", e.target.value)} placeholder="contact@exemple.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-body">Site web</Label>
            <Input value={form.website_url || ""} onChange={(e) => onChange("website_url", e.target.value)} placeholder="https://www.exemple.com" />
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
              <Input value={form.facebook_url || ""} onChange={(e) => onChange("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-2">
              <Label className="font-body flex items-center gap-1"><Instagram className="h-3 w-3" /> Instagram</Label>
              <Input value={form.instagram_url || ""} onChange={(e) => onChange("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-body flex items-center gap-1"><Twitter className="h-3 w-3" /> Twitter / X</Label>
              <Input value={form.twitter_url || ""} onChange={(e) => onChange("twitter_url", e.target.value)} placeholder="https://x.com/..." />
            </div>
            <div className="space-y-2">
              <Label className="font-body">TikTok</Label>
              <Input value={form.tiktok_url || ""} onChange={(e) => onChange("tiktok_url", e.target.value)} placeholder="https://tiktok.com/@..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventFormFields;

import { useState, useRef } from "react";
import { Image as ImageIcon, Link2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  userId: string;
  label?: string;
}

const ImageUpload = ({ value, onChange, userId, label = "Photo" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [urlValue, setUrlValue] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Fichier invalide", description: "Veuillez sélectionner une image.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Maximum 5 Mo.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("event-images").upload(filePath, file);

    if (error) {
      toast({ title: "Erreur d'upload", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(filePath);

    setUrlValue(urlData.publicUrl);
    onChange(urlData.publicUrl);
    setUploading(false);
    toast({ title: "Image uploadée !" });
  };

  const handleUrlApply = () => {
    const trimmedValue = urlValue.trim();
    if (!trimmedValue) {
      toast({ title: "Lien manquant", description: "Ajoutez un lien image valide.", variant: "destructive" });
      return;
    }

    try {
      const parsedUrl = new URL(trimmedValue);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("invalid");
      onChange(trimmedValue);
      toast({ title: "Lien image ajouté" });
    } catch {
      toast({ title: "Lien invalide", description: "Utilisez une URL http(s) valide.", variant: "destructive" });
    }
  };

  const handleRemove = () => {
    setUrlValue("");
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <p className="font-body text-sm font-medium text-foreground">{label}</p>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      {value ? (
        <div className="relative rounded-lg overflow-hidden h-32 w-full border border-border">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload"><Upload className="h-4 w-4" /> Fichier</TabsTrigger>
            <TabsTrigger value="url"><Link2 className="h-4 w-4" /> URL</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
            >
              {uploading ? (
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span className="font-body text-xs">Télécharger depuis l'appareil</span>
                  <span className="font-body text-xs text-muted-foreground">Max 5 Mo</span>
                </>
              )}
            </button>
          </TabsContent>
          <TabsContent value="url" className="mt-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4 text-primary" />
                Collez un lien d'image public
              </div>
              <Input
                value={urlValue}
                onChange={(event) => setUrlValue(event.target.value)}
                placeholder="https://exemple.com/photo.jpg"
              />
              <Button type="button" variant="outline" className="w-full" onClick={handleUrlApply}>
                Utiliser ce lien
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ImageUpload;

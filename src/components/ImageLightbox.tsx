import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LightboxImage {
  src: string;
  alt: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
}

const ImageLightbox = ({ images, open, onOpenChange, initialIndex = 0 }: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (!open) return;
    const nextIndex = Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0));
    setCurrentIndex(nextIndex);
  }, [initialIndex, images.length, open]);

  if (images.length === 0) return null;

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border-border bg-background p-3 sm:p-4">
        <DialogHeader className="sr-only">
          <DialogTitle>Aperçu de l'image</DialogTitle>
          <DialogDescription>Affichage grand format de l'image sélectionnée.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <img
              src={currentImage.src}
              alt={currentImage.alt}
              className="max-h-[80vh] w-full object-contain"
              loading="lazy"
            />
          </div>

          {hasMultipleImages && (
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédente
              </Button>

              <p className="font-body text-sm text-muted-foreground">
                {currentIndex + 1} / {images.length}
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              >
                Suivante
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;

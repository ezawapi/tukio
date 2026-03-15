import { Facebook, Twitter, Copy, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
  title: string;
  url?: string;
  children: React.ReactNode;
}

const ShareDialog = ({ title, url, children }: ShareDialogProps) => {
  const { toast } = useToast();
  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Lien copié !" });
  };

  const shareOptions = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "text-green-600",
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "text-blue-600",
    },
    {
      label: "Twitter / X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "text-sky-500",
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      color: "text-muted-foreground",
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Partager l'événement</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {shareOptions.map((opt) => (
            <a
              key={opt.label}
              href={opt.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <opt.icon className={`h-5 w-5 ${opt.color}`} />
              <span className="font-body text-sm text-foreground">{opt.label}</span>
            </a>
          ))}
        </div>
        <Button variant="outline" onClick={copyLink} className="w-full">
          <Copy className="h-4 w-4 mr-2" />
          Copier le lien
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;

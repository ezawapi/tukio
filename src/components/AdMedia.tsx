import { cn } from "@/lib/utils";
import { getAdMediaKind, getYouTubeEmbedUrl } from "@/lib/ad-media";

interface AdMediaProps {
  src: string;
  title: string;
  className?: string;
}

const AdMedia = ({ src, title, className }: AdMediaProps) => {
  const mediaKind = getAdMediaKind(src);

  if (mediaKind === "youtube") {
    const embedUrl = getYouTubeEmbedUrl(src);
    if (!embedUrl) return null;

    return (
      <div className={cn("relative w-full overflow-hidden rounded-xl bg-muted", className)}>
        <div className="aspect-video w-full">
          <iframe
            src={embedUrl}
            title={title}
            className="h-full w-full border-0"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (mediaKind === "video") {
    return (
      <div className={cn("overflow-hidden rounded-xl bg-muted", className)}>
        <video
          src={src}
          className="h-full w-full object-cover"
          controls
          muted
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl bg-muted", className)}>
      <img
        src={src}
        alt={title}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
};

export default AdMedia;
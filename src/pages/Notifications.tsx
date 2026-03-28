import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bell, Trash2, Star, StarOff, Check, CheckCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface UserNotification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  is_favorite: boolean;
  related_event_id: string | null;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  new_event: "Nouvel événement",
  event_modified: "Modification",
  info: "Information",
  reminder: "Rappel",
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "favorites">("all");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setNotifications((data as UserNotification[]) || []);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("user_notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("user_notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast({ title: "Toutes les notifications marquées comme lues" });
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    await supabase.from("user_notifications").update({ is_favorite: !current }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_favorite: !current } : n));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("user_notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast({ title: "Notification supprimée" });
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "favorites") return n.is_favorite;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto max-w-2xl px-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="font-body text-sm text-muted-foreground">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs gap-1">
                <CheckCheck className="h-3.5 w-3.5" /> Tout lire
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(["all", "unread", "favorites"] as const).map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}
                className="text-xs">
                {f === "all" ? "Toutes" : f === "unread" ? "Non lues" : "Favoris"}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-body text-muted-foreground">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((n) => (
                <div key={n.id} className={`rounded-xl border p-3 flex gap-3 items-start transition-colors ${n.is_read ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="secondary" className="text-[9px]">{typeLabels[n.type] || n.type}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                    <p className="font-body text-sm font-medium text-foreground">{n.title}</p>
                    {n.body && <p className="font-body text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                    {n.related_event_id && (
                      <Link to={`/events/${n.related_event_id}`} className="text-xs text-primary mt-1 inline-block">
                        Voir l'événement →
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!n.is_read && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsRead(n.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleFavorite(n.id, n.is_favorite)}>
                      {n.is_favorite ? <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteNotification(n.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default Notifications;

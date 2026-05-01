import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";
import AdminRolesManager from "@/components/admin/AdminRolesManager";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";

const AdminRolesPage = () => {
  const { user } = useAuth();
  const { can, loading, role } = usePermissions();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (loading) return;
    if (!can("roles.manage")) {
      toast({ title: "Accès refusé", description: "Vous n'avez pas la permission de gérer les rôles.", variant: "destructive" });
      navigate("/admin");
    }
  }, [user, can, loading, role, navigate, toast]);

  if (!user || loading || !can("roles.manage")) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="h-32 animate-pulse rounded-xl bg-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pb-16 pt-20">
        <div className="container mx-auto px-4">
          <Link to="/admin" className="mb-4 inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Retour au tableau de bord
          </Link>
          <div className="mb-6 flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            <div>
              <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">Gestion des rôles</h1>
              <p className="font-body text-xs text-muted-foreground">Assignation utilisateur ↔ rôle et configuration des permissions</p>
            </div>
          </div>
          <AdminRolesManager />
        </div>
      </div>
      <Footer />
      <MobileTabBar />
    </div>
  );
};

export default AdminRolesPage;

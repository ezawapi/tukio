import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-event.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (city.trim()) params.set("city", city.trim());
    if (date) params.set("date", date);
    navigate(`/events${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Événement culturel" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
      </div>

      <div className="container mx-auto w-full px-4 md:w-[80%] md:px-0 max-w-6xl relative z-10 pt-16">
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-sm font-body font-medium mb-6 backdrop-blur-sm border border-primary-foreground/20">
              🎉 La plateforme événementielle #1
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground leading-tight mb-4">
              Découvrez les événements qui comptent
            </h1>
            <p className="font-body text-lg text-primary-foreground/80 mb-8 max-w-lg">
              Explorez, suivez et participez aux événements publics et privés. Concerts, conférences, festivals et bien plus encore.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="bg-background/95 backdrop-blur-md rounded-2xl p-3 shadow-warm"
          >
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl bg-muted">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Rechercher un événement..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                  className="bg-transparent outline-none text-sm font-body text-foreground placeholder:text-muted-foreground flex-1"
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Ville"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                  className="bg-transparent outline-none text-sm font-body text-foreground placeholder:text-muted-foreground w-full md:w-28"
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="bg-transparent outline-none text-sm font-body text-foreground placeholder:text-muted-foreground w-full md:w-36"
                />
              </div>
              <Button onClick={handleSearch} className="gradient-hero text-primary-foreground border-0 px-8">
                Rechercher
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-wrap gap-8 mt-8"
          >
            {[
              { value: "64+", label: "Événements" },
              { value: "3+", label: "Utilisateurs" },
              { value: "26+", label: "Villes" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display font-bold text-2xl text-primary-foreground">{stat.value}</p>
                <p className="font-body text-sm text-primary-foreground/60">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

export const SITE_URL = "https://tukio.cd";
export const publicPageSeo: Record<string, { title: string; description: string }> = {
  "/": { title: "Tukio — Événements en RDC, au Congo et dans le monde", description: "Découvrez les concerts, festivals, conférences et activités en RDC, au Congo-Brazzaville et dans le monde. Consultez les dates, lieux et participations sur Tukio." },
  "/events": { title: "Événements et activités à venir | Tukio", description: "Trouvez un événement par ville, catégorie ou date : concerts, festivals, sport et conférences. Consultez les lieux et les informations de participation." },
  "/categories": { title: "Catégories d’événements et d’activités | Tukio", description: "Explorez les événements Tukio par catégorie : musique, culture, sport et conférences. Retrouvez les activités qui correspondent à vos centres d’intérêt." },
  "/agenda": { title: "Agenda des événements et activités | Tukio", description: "Consultez le calendrier des événements en RDC, au Congo et ailleurs. Retrouvez les dates des concerts, festivals, conférences et activités à venir." },
  "/explorer": { title: "Carte des événements et lieux d’activités | Tukio", description: "Repérez les événements sur la carte, découvrez leurs lieux et trouvez les activités près de vous en RDC, au Congo-Brazzaville et dans le monde." },
  "/partners": { title: "Partenaires de Tukio | Tukio", description: "Découvrez les partenaires de Tukio et prenez contact avec notre équipe pour proposer un partenariat autour des événements et des activités." },
  "/about": { title: "À propos de Tukio — Agenda événementiel", description: "Tukio rassemble les événements de la RDC, de sa diaspora et du monde. Découvrez la plateforme pour trouver, organiser et partager des activités." },
  "/contact": { title: "Nous contacter | Tukio", description: "Contactez l’équipe Tukio pour une question, une demande ou un message concernant la plateforme et les événements publiés." },
  "/terms": { title: "Conditions d’utilisation | Tukio", description: "Consultez les conditions d’utilisation de Tukio et les règles applicables aux comptes, aux événements et aux publications sur la plateforme." },
};

export const getPageSeo = (pathname: string) => {
  const path = pathname === "/map" ? "/explorer" : pathname.replace(/\/$/, "") || "/";
  const page = publicPageSeo[path];
  return { ...(page || { title: "Espace personnel | Tukio", description: "Votre espace personnel sur Tukio." }), canonical: `${SITE_URL}${path}`, indexable: !!page };
};

export const isIndexableEvent = (event: { visibility?: string; status?: string; is_published?: boolean }) =>
  event.visibility === "public" && event.status === "approved" && event.is_published === true;

export const safeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
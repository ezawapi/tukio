import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-20 pb-16">
      <div className="container mx-auto max-w-3xl px-4 space-y-8">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Règlement & Conditions d'utilisation</h1>
        <p className="font-body text-sm text-muted-foreground">Dernière mise à jour : 20 mars 2026</p>

        {[
          {
            title: "1. Acceptation des conditions",
            content: "En accédant à Tukio, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.",
          },
          {
            title: "2. Description du service",
            content: "Tukio est une plateforme de référencement, de promotion et de gestion d'événements publics et privés. Elle permet aux utilisateurs de découvrir, publier, partager et suivre des activités événementielles.",
          },
          {
            title: "3. Inscription et comptes",
            content: "Pour publier un événement ou accéder à certaines fonctionnalités, vous devez créer un compte. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités réalisées sous votre compte.",
          },
          {
            title: "4. Publication d'événements",
            content: "Tout événement soumis est soumis à une validation par l'administrateur avant publication. Tukio se réserve le droit de refuser, modifier ou supprimer tout contenu jugé inapproprié, trompeur, illégal ou contraire à l'esprit de la plateforme.",
          },
          {
            title: "5. Événements privés",
            content: "Les événements marqués « privés » ne sont visibles que par les personnes invitées via un code QR unique. L'organisateur est seul responsable de la gestion de ses invitations.",
          },
          {
            title: "6. Comportement des utilisateurs",
            content: "Les utilisateurs s'engagent à ne pas publier de contenu offensant, discriminatoire, violent ou illégal. Tout abus peut entraîner la suspension ou la suppression du compte sans préavis.",
          },
          {
            title: "7. Propriété intellectuelle",
            content: "Les contenus publiés (textes, images, logos) restent la propriété de leurs auteurs respectifs. En publiant sur Tukio, vous accordez à la plateforme une licence non exclusive pour afficher ces contenus.",
          },
          {
            title: "8. Responsabilité",
            content: "Tukio agit en tant qu'intermédiaire et ne saurait être tenu responsable des événements publiés par les organisateurs, de leur déroulement, annulation ou de tout préjudice en découlant.",
          },
          {
            title: "9. Publicité et partenariats",
            content: "Tukio peut afficher des publicités et contenus sponsorisés. Les annonceurs sont responsables de la véracité de leurs contenus promotionnels.",
          },
          {
            title: "10. Protection des données",
            content: "Vos données personnelles sont traitées conformément à notre politique de confidentialité. Nous ne vendons pas vos données à des tiers.",
          },
          {
            title: "11. Modification des conditions",
            content: "Tukio se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés des changements majeurs par notification sur la plateforme.",
          },
          {
            title: "12. Contact",
            content: "Pour toute question relative à ces conditions, vous pouvez nous contacter via la plateforme ou par email à l'adresse indiquée dans la section « À propos ».",
          },
        ].map((section) => (
          <div key={section.title} className="space-y-2">
            <h2 className="font-display text-xl font-semibold text-foreground">{section.title}</h2>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
    <Footer />
  </div>
);

export default Terms;

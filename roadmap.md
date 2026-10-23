# Ajouts d’événements
- [x] Vérifier les dates futures et les sources en RDC, au Congo-Brazzaville et ailleurs.
- [x] Héberger les visuels authentiques et ajouter les fiches avec auteur administrateur.
- [x] Vérifier les fiches publiées et les images dans l’application.

# Modification & brouillons
- [x] Page de modification qui se réinitialise seule (corriger)
- [x] Brouillon automatique par utilisateur, supprimé après 48 h
- [x] Sous-catégories liées aux catégories (admin, formulaires, fiche, filtre)

# Lieu EzaWapi
- [x] Ajouter le lien du lieu aux formulaires, aux enregistrements et aux brouillons.
- [x] Réserver les liens à ezawapi.cd et afficher le bouton sur les fiches.
- [x] Vérifier la validation et le parcours de modification.

# Indexation Google
- [x] Améliorer les titres, descriptions et adresses officielles des pages publiques.
- [x] Compléter le sitemap avec les événements publics publiés (87 événements, 9 pages).
- [x] Vérifier les informations structurées et exclure les pages privées.
- [ ] Soumettre le sitemap à Google Search Console : le compte accessible possède EzaWapi, mais aucune propriété Tukio vérifiée ; autorisation/vérification Tukio nécessaire après publication.

# Installation native
- [x] Préparer Capacitor pour Android et iOS, et Electron pour Windows, macOS et Linux.
- [x] Adapter Installer au système, avec uniquement des liens de versions réellement disponibles.
- [x] Vérifier la détection et l'ouverture du dialogue sur Android et Windows ; 9 tests passent, aucun téléchargement fictif.
- [ ] Distribuer les versions signées : comptes boutiques, certificats et compilation sur les outils natifs requis.

# Confirmation d’inscription
- [x] Vérifier les réglages hébergés : email activé, inscriptions autorisées, mailer_autoconfirm=false ; envoi par défaut, aucun domaine d’envoi configuré.
- [x] Permettre la confirmation par lien ou code signup si fourni, et le renvoi depuis l’écran d’inscription et de connexion non confirmée.
- [x] 19 tests passent ; parcours simulé : code court rejeté, code invalide refusé, utilisateur toujours sur /auth ; aucune erreur de page.
- [ ] Envoyer explicitement le code dans un email personnalisé et vérifier la réception puis une confirmation réelle : configuration du domaine d’envoi et adresse de test autorisée nécessaires.

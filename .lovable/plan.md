# Plan d'implémentation

Cette requête couvre 8 chantiers distincts. Je propose de les exécuter dans cet ordre (3 étapes), avec validation visuelle entre chaque étape.

## Étape 1 — Données & corrections rapides

### 1.1 Événement disparu "Accor Arena, 21 nov 2026"
- Recherche en base via `supabase--read_query` sur `events` (filtre titre/lieu/date).
- Diagnostic probable : champ `is_published=false`, `status='pending'` ou `'rejected'`, ou trigger qui a remis `pending` après édition (memory: "Modifier un événement le remet en pending").
- Action : migration pour repasser cet événement précis en `status='approved'`, `is_published=true`. Pas de modification de schéma.

### 1.2 organizer_logo_url
- Vérifier (lecture seule) `EventFormFields.tsx`, `CreateEvent.tsx`, `EditEvent.tsx`, `AdminEventEditDialog.tsx` :
  - Aperçu présent + fallback (avatar profil si vide).
  - Validation client `https?://` + côté DB déjà via `validate_safe_url`.
- Corriger uniquement les écarts (probablement aperçu manquant côté admin dialog).

## Étape 2 — Splash & icônes (charte orange)

Source : `user-uploads://icone-tukio2-2.png` (O bleu + micro + foule).

- Régénération via `imagegen--edit_image` en variantes orange dominante (charte terracotta/gold de l'app) :
  - `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.ico` source, `maskable-512.png`.
  - `src/assets/splash-tukio.png` (logo centré, fond orange profond).
- Mise à jour `index.html` (favicon, theme-color, apple-touch-icon) et `manifest.webmanifest` si présent.
- Mise à jour `SplashScreen.tsx` pour utiliser la nouvelle image + fond orange dégradé cohérent avec `--primary` (terracotta) actuel.

## Étape 3 — Navigation & notifications (gros morceau)

### 3.1 Harmonisation menus
Règle unique appliquée aux 3 surfaces :

| Surface          | Non connecté                                     | Connecté                                                            |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| **Navbar (top)** | Logo + Connexion                                 | Logo + **icône Profil** (avec badge messages non lus)               |
| **Hamburger**    | (1) — / (2) Accueil, Activités, Carte, Agenda, Favoris / (3) Connexion | (1) Nom + rôle / (2) idem / (3) Déconnexion |
| **MobileTabBar** | Accueil, Activités, Carte, Agenda, **Profil**    | Accueil, Activités, Carte, Agenda, **Favoris**                      |

- Suppression des doublons (pas de "Profil" dans hamburger si déjà sur navbar, etc.).
- Rôle affiché dans hamburger via `useUserRole` + `account_type` du profil ("Organisateur", "Administrateur", "Utilisateur").

### 3.2 Page profil filtrée par account_type
- `Profile.tsx` : si `account_type='user'` → masquer l'onglet "Mes activités", bouton "Nouvelle activité", lien "Mes invitations organisateur".
- Si `account_type='organizer'` → tout afficher.
- Encadrement visuel cohérent (bordure `primary/30` sur les blocs réservés organisateur).

### 3.3 Notifications dans le profil
- Ajout d'un onglet **"Notifications"** dans le `Tabs` de `Profile.tsx` (réutilise la logique de `Notifications.tsx`).
- Clic sur une notification → `Dialog` (popup) avec le contenu détaillé + bouton "Ouvrir" si `related_event_id` ou lien.
- Badge `useUnreadNotifications` déjà existant → l'afficher sur l'**icône Profil du Navbar** (point rouge + compteur si >0), retirer le doublon ailleurs.
- La page `/notifications` reste accessible pour rétrocompatibilité mais le hub principal devient le profil.

### 3.4 Cliquer une activité depuis "Mes activités"
Déjà le cas : `<Link to="/events/${id}">`. Sur la page détail, ajouter un bouton **"Modifier"** visible si `user.id === event.organizer_id` (au-dessus de la fiche, à côté de "Partager").

## Détails techniques

- Aucune nouvelle table. Migration unique pour ressusciter l'événement Accor Arena.
- Pas de changement aux RLS existantes.
- Tous les nouveaux composants utilisent les tokens HSL de `index.css` (pas de couleur en dur).
- Le badge "messages non lus" agrège `user_notifications.is_read=false` (hook existant `use-unread-notifications`).
- Le splash respecte le `prefers-reduced-motion`.

## Ce que je NE fais pas dans ce plan
- Pas de refonte du système d'invitations (déjà livré).
- Pas de changement de la structure DB autre que la correction de l'événement.
- Pas de nouvelles traductions i18n (réutilisation des clés existantes ; ajout uniquement si manquant).

Confirme et je démarre par l'**Étape 1** (diagnostic + correction Accor Arena), puis j'enchaîne sur 2 et 3.

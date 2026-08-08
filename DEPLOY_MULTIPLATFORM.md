# Déploiement multi-plateformes (Lovable, Netlify, Vercel, Hosting.cd)

L'app est un SPA React/Vite. Le backend (BD, Auth, Edge Functions, Storage) reste **toujours** sur Supabase (Lovable Cloud). Seul le front change d'hébergeur.

## ⚠️ Les deux causes de 99% des bugs de déploiement

### A. Variables d'environnement manquantes → login KO, contenu vide

Le client backend lit ces 3 variables **au build** :

| Nom | Où trouver |
|---|---|
| `VITE_SUPABASE_URL` | `.env` local |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` local (clé publique / anon, sûre à exposer) |
| `VITE_SUPABASE_PROJECT_ID` | `.env` local |

Sans elles → aucune donnée et aucune inscription. Si l'hébergeur ne fournit que
`VITE_SUPABASE_ANON_KEY`, copiez sa valeur dans `VITE_SUPABASE_PUBLISHABLE_KEY`.

### B. Redirect URLs Auth non whitelistées → OAuth et magic links KO

Dans **Cloud → Users → Auth Settings** → ajouter chaque domaine de déploiement dans **Site URL** + **Redirect URLs** (patterns `https://mon-domaine/**`).

---

## Lovable
Rien à faire, déploiement natif via **Publish**.

## Netlify

1. Push le repo, "New site from Git", Netlify lit `netlify.toml` automatiquement.
2. **Site settings → Environment variables** → ajouter les 3 `VITE_SUPABASE_*` ci-dessus.
3. **Deploys → Trigger deploy → Clear cache and deploy site** (redéployer après ajout des vars, sinon le vieux build sans vars reste servi).
4. Ajouter `https://<site>.netlify.app/**` dans Cloud → Users → Auth Settings (Site URL + Redirect URLs).

Fichiers de config déjà présents : `netlify.toml`, `public/_redirects`.

## Vercel

1. Import du repo, framework détecté = Vite.
2. **Project Settings → Environment Variables** → ajouter les 3 `VITE_SUPABASE_*` (cocher Production + Preview + Development).
3. **Redeploy** (désactive "Use existing Build Cache").
4. Ajouter `https://<site>.vercel.app/**` dans Cloud → Users → Auth Settings.

Fichier de config déjà présent : `vercel.json` (SPA fallback + headers de sécurité + cache assets).

## Hosting.cd / hébergement Apache
1. Construire avec `npm run build` (Node 20), puis envoyer le contenu de `dist/` dans le dossier web.
2. Définir les 3 variables `VITE_SUPABASE_*` **avant** la construction ; un hébergement statique ne peut pas les injecter après coup.
3. Le fichier `public/.htaccess` est copié dans `dist/` et assure le fallback SPA sur Apache.
4. Ajouter `https://votre-domaine.cd/**` dans Cloud → Users → Auth Settings.
5. Activer HTTPS : l'auth Google, la géolocalisation et le service worker l'exigent.

## Backend
- Aucun changement, la BD et les Edge Functions vivent ici quel que soit l'hébergeur front.
- **Toujours** enregistrer chaque nouvelle URL front dans Auth Settings avant de tester le login.

---

## Checklist de dépannage

| Symptôme | Cause probable |
|---|---|
| Page blanche / requêtes vers `undefined` | Env vars `VITE_SUPABASE_*` non définies → redéploie après les avoir ajoutées |
| Inscription "réussit" mais aucun email / login impossible | Domaine pas dans **Redirect URLs** Supabase |
| Google OAuth boucle ou "invalid redirect" | Ajouter le domaine dans **Redirect URLs** + `Site URL` |
| 404 en rafraîchissant `/agenda`, `/events/:id` | SPA fallback manquant → `netlify.toml` / `vercel.json` présents ? |
| Contenu partiel sur Vercel | Env vars absentes en environnement "Production" (elles doivent être cochées pour Prod ET Preview) |
| Service Worker sert un vieux contenu | Hard refresh (Ctrl+Shift+R), le SW se met à jour à la prochaine visite |

## Pour toute nouvelle plateforme d'hébergement statique
1. Build command = `npm run build`, output = `dist`, Node 20.
2. Définir les 3 `VITE_SUPABASE_*` en env vars **avant** le premier build.
3. Configurer un SPA fallback (`/* → /index.html 200`).
4. Ajouter le nouveau domaine dans Supabase Auth (Site URL + Redirect URLs).

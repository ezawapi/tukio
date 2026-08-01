# Déploiement multi-plateformes (Lovable, Netlify, Vercel, Supabase)

L'app est un SPA React/Vite. Le backend (BD, Auth, Edge Functions, Storage) reste **toujours** sur Supabase (Lovable Cloud). Seul le front change d'hébergeur.

## ⚠️ Les deux causes de 99% des bugs de déploiement

### A. Variables d'environnement manquantes → login KO, contenu vide

Le client Supabase lit les 2 premières variables **au build**. La troisième sert de métadonnée de projet et reste recommandée pour les outils de déploiement :

| Nom | Où trouver |
|---|---|
| `VITE_SUPABASE_URL` | `.env` local |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` local (clé publique / anon, sûre à exposer) |
| `VITE_SUPABASE_PROJECT_ID` | `.env` local |

Sans elles → bundle vide, aucune requête, pas d'inscription possible.

### B. Redirect URLs Auth non whitelistées → OAuth et magic links KO

Dans **Cloud → Users → Auth Settings** → ajouter chaque domaine de déploiement dans **Site URL** + **Redirect URLs** (patterns `https://mon-domaine/**`).

---

## Lovable
Rien à faire, déploiement natif via **Publish**.

## Netlify

1. Push le repo, "New site from Git", Netlify lit `netlify.toml` automatiquement.
2. **Site settings → Environment variables** → ajouter les 3 `VITE_SUPABASE_*` ci-dessus.
3. **Deploys → Trigger deploy → Clear cache and deploy site** (redéployer après ajout des vars, sinon le vieux build sans vars reste servi).
4. Ajouter `https://<site>.netlify.app/**` dans Supabase Auth (Site URL + Redirect URLs).

Fichiers de config déjà présents : `netlify.toml`, `public/_redirects`.

## Vercel

1. Import du repo, framework détecté = Vite.
2. **Project Settings → Environment Variables** → ajouter les 3 `VITE_SUPABASE_*` (cocher Production + Preview + Development).
3. **Redeploy** (désactive "Use existing Build Cache").
4. Ajouter `https://<site>.vercel.app/**` dans Supabase Auth.

Fichier de config déjà présent : `vercel.json` (SPA fallback + headers de sécurité + cache assets).

## Supabase (backend)
- Aucun changement, la BD et les Edge Functions vivent ici quel que soit l'hébergeur front.
- **Toujours** enregistrer chaque nouvelle URL front dans Auth Settings avant de tester le login.

## Hosting.cd / cPanel (Apache)

1. Installer les dépendances avec `npm ci`, puis lancer `npm run build` sur une machine disposant de Node.js.
2. Compresser **le contenu** de `dist` (y compris le fichier caché `.htaccess`).
3. Envoyer et extraire ce contenu directement dans `public_html`.
4. Vérifier que cPanel conserve `.htaccess`; il fournit le fallback SPA, les en-têtes de sécurité, la compression et le cache des ressources.
5. Ajouter `https://votre-domaine/**` dans les URL autorisées de Supabase Auth.

Le serveur Hosting.cd ne nécessite ni Node.js, ni npm, ni compilation. Le frontend reste statique et communique directement avec Supabase.

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

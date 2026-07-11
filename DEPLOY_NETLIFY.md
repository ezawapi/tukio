# Déploiement Test sur Netlify

## 1. Pré-requis
- Un compte Netlify (gratuit)
- Le repo Git connecté (GitHub/GitLab/Bitbucket) OU le CLI Netlify

## 2. Configuration détectée automatiquement
Le fichier `netlify.toml` définit déjà :
- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Node version** : 20
- **SPA fallback** (React Router) : redirect `/* → /index.html 200`
- **Headers de sécurité** de base
- **Cache long** sur `/assets/*`

Un fichier `public/_redirects` est également présent en secours.

## 3. Variables d'environnement à ajouter dans Netlify
Site settings → Environment variables :

| Nom | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | valeur de `.env` local |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | valeur de `.env` local |
| `VITE_SUPABASE_PROJECT_ID` | valeur de `.env` local |

Voir `.env.example`. Ces clés sont publiques (protégées par RLS côté BD).

## 4. Déploiement

### Option A — via l'UI Netlify (Git)
1. New site from Git → sélectionne le repo
2. Netlify lit `netlify.toml` automatiquement — ne rien changer
3. Ajoute les variables d'env (étape 3)
4. Deploy

### Option B — via CLI
```bash
npm i -g netlify-cli
netlify login
npm run build
netlify deploy --dir=dist          # preview
netlify deploy --dir=dist --prod   # production
```

## 5. Post-déploiement
- Ajoute l'URL Netlify (`https://<site>.netlify.app`) dans Supabase Auth → **Site URL** et **Redirect URLs** (sinon Google OAuth et magic links échoueront).
- Vérifie qu'un refresh sur `/agenda`, `/events/:id` fonctionne (SPA fallback).
- Les Edge Functions et la BD restent sur Supabase — Netlify sert uniquement le front.

## 6. Notes
- Le Service Worker PWA est désactivé automatiquement dans les hosts contenant `lovableproject.com` ; sur Netlify il sera actif.
- Aucun secret serveur n'est requis pour le front (pas de `SUPABASE_SERVICE_ROLE_KEY` côté client).

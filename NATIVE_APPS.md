# Tukio — applications natives

## État actuel

Les outils Capacitor (Android/iOS) et Electron (Windows/macOS/Linux) sont installés. Le bouton Installer ouvre la liste des systèmes, identifie l'appareil et indique « À venir » tant qu'aucune version réelle n'est publiée. Il ne déclenche pas une installation PWA à la place d'une version native.

Aucun fichier installable signé ni lien de boutique n'est actuellement disponible. Le site ne peut pas installer silencieusement un programme : l'utilisateur doit autoriser le téléchargement puis l'installation selon son système.

## Tester sur téléphone

1. Exporter le projet vers votre GitHub, le récupérer sur votre ordinateur, puis faire `git pull` avant chaque mise à jour.
2. Installer Node.js et exécuter `npm install`.
3. Exécuter `npx cap add android` et/ou `npx cap add ios` une seule fois.
4. Exécuter `npx cap update android` et/ou `npx cap update ios`.
5. Exécuter `npm run build`, puis `npx cap sync` après chaque récupération des modifications.
6. Ouvrir Android Studio avec `npx cap open android`, ou Xcode avec `npx cap open ios` (Mac obligatoire).
7. Exécuter `npx cap run android` ou `npx cap run ios` sur un émulateur ou un appareil.

Pour tester les modifications de l'aperçu en direct, définir `TUKIO_NATIVE_PREVIEW=true` lors de `npx cap sync`. Cette option utilise exclusivement l'adresse d'aperçu demandée. Ne jamais l'activer pour une version distribuée : les versions normales embarquent le dossier `dist`.

## Avant la distribution mobile

- Créer les projets natifs sur votre ordinateur et vérifier les autorisations, navigation, géolocalisation, médias et persistance des sessions.
- Adapter et tester Google OAuth via le navigateur système et un retour sécurisé vers l'app : le flux web actuel ne garantit pas une connexion native fonctionnelle. Tester également les liens de confirmation et de récupération de mot de passe.
- Android : générer un APK signé pour distribution directe, ou un AAB signé pour Google Play. Conserver la clé de signature hors du dépôt.
- iOS : compte Apple Developer, certificats/profils et compilation Xcode requis ; TestFlight/App Store pour la distribution normale, pas de téléchargement universel d'un fichier iOS depuis le site.
- Les magasins peuvent imposer des fonctionnalités natives et refuser un simple emballage de site ; l'approbation n'est pas garantie.

## Ordinateurs

Après `npm install` et `npm run build`, tester `npm run desktop:start`. Le dossier `dist` est chargé via `file://` ; les liens internes utilisent le routage avec fragment uniquement dans ce contexte. La fenêtre est isolée, sans accès Node.js depuis la page, et les liens HTTPS externes s'ouvrent dans le navigateur système.

Le script `npm run desktop:package -- --platform=win32 --arch=x64` (Windows), `--platform=darwin --arch=arm64` (Mac Apple Silicon), `--platform=darwin --arch=x64` (Mac Intel) ou `--platform=linux --arch=x64` génère un dossier portable sous `/tmp/tukio-desktop-release`. Utiliser `@electron/packager`, pas electron-builder. Ce dossier n'est ni un installateur signé ni un téléchargement public.

Avant distribution : tester les assets, toutes les pages, Google OAuth, confirmation/reset email et le stockage de connexion sous `file://` ; ces parcours nécessitent encore une stratégie de callback adaptée. Signer Windows et signer/notariser macOS. Créer les installateurs sur les outils de la plateforme cible. Ne jamais distribuer `.env`, secrets, sources du backend ou métadonnées du projet.

## Activer les vrais téléchargements

Après validation, déposer les fichiers publics dans `public/downloads/` ou héberger leurs versions signées. Renseigner ensuite les liens réels dans `src/lib/native-releases.ts`, ainsi que le nom du fichier pour les téléchargements du site. Pour Android/iOS, privilégier les liens des boutiques. Ne pas mettre de liens fictifs ou d'archives de code à la place d'une application. Mettre à jour le texte de disponibilité du dialogue quand une première version existe.

## Références

- [Publication mobile selon Lovable](https://docs.lovable.dev/features/publish#can-i-publish-my-project-as-a-native-ios-or-android-app-to-the-app-store-or-play-store)
- [Documentation Capacitor](https://capacitorjs.com/docs/getting-started)
- [Article Lovable mentionnant Capacitor](https://lovable.dev/blog/customer-stories/supercharge-lovable-chrome-extension) — témoignage, pas un guide de compilation.
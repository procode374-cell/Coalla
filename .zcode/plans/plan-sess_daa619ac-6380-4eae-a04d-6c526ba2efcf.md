## Plan : Plateforme partagée avec Supabase + améliorations

### Phase 1 : Nettoyage & données (app.js)
- **Supprimer les anciennes données fictives** (`defaultPartners` 4 éléments, `defaultTutors` 3 éléments)
- **Remplacer par 3 annonces d'exemple** (marquées `isExample: true`, non supprimables) qui seront insérées dans Supabase
- **Réécrire `initData()`** : ne charge plus depuis localStorage mais depuis l'API Supabase
- **Supprimer le bot de réponse simulé** (`triggerSimulatedReply`) — remplacé par les vrais messages

### Phase 2 : Intégration Supabase
- **Ajouter la librairie Supabase JS** via CDN dans `index.html` (un seul `<script>`)
- **Créer un fichier `supabase-config.js`** contenant l'URL du projet et la clé anonyme (tu rempliras avec tes identifiants Supabase). Fichier de config séparé pour pouvoir le versionner sans exposer les clés.
- **Tables Supabase à créer** (je te fournirai le SQL exact à copier-coller dans le dashboard Supabase) :
  - `partners` (id uuid, owner_id, name, subject, level, mode, location, contact, description, image_url, created_at, is_example)
  - `tutors` (id uuid, owner_id, name, subject, level, price, mode, contact, description, image_url, created_at, is_example)
  - `messages` (id uuid, conversation_id, sender_id, text, created_at)
  - `conversations` (id uuid, ad_id, ad_type, participant_a, participant_b, created_at)
- **Auth Supabase** (gestion native, sécurisée, hashage des mots de passe automatique) remplace le système localStorage actuel
- **Storage Supabase** pour les images d'annonces (au lieu de base64)

### Phase 3 : Réécriture de la couche données (app.js)
- **`initData()` → `loadData()`** : `fetch` asynchrone depuis Supabase pour partners + tutors
- **`initForms()`** : à la soumission, `INSERT` dans Supabase au lieu de `localStorage.setItem`. Upload image vers Supabase Storage.
- **`renderPartners()` / `renderTutors()`** : identiques, mais lisent depuis les données chargées de Supabase
- **`deleteAnnouncement()`** : vérifie `owner_id === currentUser.id` avant suppression (sécurité). Les exemples (`is_example: true`) ne sont pas supprimables.
- **Auth** : `handleLogin`/`handleSignup`/`logout` réécrits avec Supabase Auth (`supabase.auth.signInWithPassword`, `signUp`, `signOut`)
- **Chat** : `appendAndSaveChatMessage` → `INSERT` dans la table `messages`. `openChatPanel` charge l'historique réel. Suppression du bot simulé.

### Phase 4 : Fond pleine largeur (CSS + HTML)
- **Retirer `max-width: 1200px` et `margin: 0 auto` de `.main-content`**
- **Appliquer `max-width: 1200px; margin: 0 auto; padding: 0 2rem;` sur chaque conteneur interne** (`.hero-container`, `.features-showcase-section`, `.section-header`, `.filter-bar`, `.announcements-grid`, `.about-hero`, `.steps-container`, `.faq-container`, `.settings-grid`)
- **Les fonds** (grille sur home/about, crème sur partners/tutors) restent sur les `<section>` et deviennent ainsi pleine largeur
- **Retirer le `border-radius: 14px`** des sections (plus de "carte" arrondie)
- **Ajouter un fond au header** opaque si nécessaire pour que la grille ne passe pas au travers de façon moche

### Phase 5 : Améliorations de robustesse
- **Validation** : empêcher de poster une annonce sans être connecté (message "Connectez-vous pour poster")
- **Sécurité** : liaison `owner_id` sur chaque annonce, check à la suppression
- **Gestion d'erreurs** : try/catch autour des appels API, messages d'erreur clairs
- **Échappement XSS** systématique (fonction `escapeHtml` déjà présente, à utiliser partout)
- **Indicateur de chargement** (spinner) pendant les requêtes réseau
- **Synchronisation** : rafraîchissement automatique de la liste quand on revient sur une page

### Phase 6 : Ce que tu devras faire côté Supabase
Je te fournirai un guide pas-à-pas :
1. Créer un compte gratuit sur supabase.com
2. Créer un nouveau projet
3. Copier-coller le script SQL que je te donne (création des tables)
4. Activer Email/Password Auth
5. Créer un bucket Storage "annonces"
6. Copier l'URL + clé anonyme dans `supabase-config.js`

### Fichiers modifiés
- `app.js` : réécriture majeure de la couche données (localStorage → Supabase)
- `index.html` : ajout du script Supabase CDN, structure interne des sections (wrappers max-width)
- `index.css` : `.main-content` pleine largeur, max-width reporté sur les blocs internes
- **Nouveau** `supabase-config.js` : configuration de connexion
- **Nouveau** `SUPABASE_SETUP.md` : guide d'installation pas-à-pas + SQL

### Important
Le site ne fonctionnera PAS tant que tu n'auras pas créé le projet Supabase et rempli `supabase-config.js`. Je te préparerai tout le code + un guide clair, mais l'étape finale (création du compte Supabase) te revient — ça prend environ 10 minutes.
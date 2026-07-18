# Guide d'installation Supabase — Coalla

Ce guide t'explique, étape par étape, comment configurer Supabase pour que Coalla fonctionne avec de vrais utilisateurs partageant leurs annonces.

⏱️ **Temps total estimé : ~10 minutes**

---

## Étape 1 — Créer un compte Supabase (2 min)

1. Va sur **https://supabase.com**
2. Clique sur **"Start your project"** (en haut à droite)
3. Connecte-toi avec GitHub (le plus simple) ou crée un compte avec ton email
4. Accepte les conditions

---

## Étape 2 — Créer un nouveau projet (2 min)

1. Clique sur **"New Project"**
2. **Name** : `coalla` (ou ce que tu veux)
3. **Database Password** : choisis un mot de passe fort et **note-le quelque part** (tu en auras besoin si tu te connectes directement à la BDD)
4. **Region** : choisis la plus proche de toi (ex: `West Europe (Frankfurt)` pour la France)
5. **Pricing Plan** : laisse **Free** (gratuit, largement suffisant)
6. Clique sur **"Create new project"**

⏳ Attends 2-3 minutes que le projet se provisioning (la barre de progression tourne).

---

## Étape 3 — Créer les tables (3 min)

1. Dans le menu de gauche, clique sur **"SQL Editor"** (l'icône `>_`)
2. Clique sur **"New query"**
3. **Copie-colle tout le SQL ci-dessous** dans l'éditeur :

```sql
-- ============================================================
-- COALLA — Création des tables
-- ============================================================

-- Table : partners (annonces de recherche de camarades)
create table if not exists partners (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid references auth.users(id) on delete set null,
    name text not null,
    subject text not null,
    level text not null,
    mode text not null,
    location text default '',
    contact text not null,
    description text not null,
    image_url text default '',
    is_example boolean default false,
    created_at timestamptz default now()
);

-- Table : tutors (annonces de professeurs particuliers)
create table if not exists tutors (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid references auth.users(id) on delete set null,
    name text not null,
    subject text not null,
    level text not null,
    price numeric default 0,
    mode text not null,
    contact text not null,
    description text not null,
    image_url text default '',
    is_example boolean default false,
    created_at timestamptz default now()
);

-- Table : conversations (un canal de discussion par couple d'utilisateurs)
create table if not exists conversations (
    id uuid default gen_random_uuid() primary key,
    ad_id text not null,
    ad_type text not null,
    participant_a uuid references auth.users(id) on delete cascade,
    participant_b uuid references auth.users(id) on delete cascade,
    created_at timestamptz default now(),
    unique(ad_id, participant_a, participant_b)
);

-- Table : messages (les messages d'une conversation)
create table if not exists messages (
    id uuid default gen_random_uuid() primary key,
    conversation_id uuid references conversations(id) on delete cascade,
    sender_id uuid references auth.users(id) on delete cascade,
    text text not null,
    created_at timestamptz default now()
);

-- ============================================================
-- Politiques de sécurité (RLS - Row Level Security)
-- Tout le monde peut LIRE les annonces, seul le propriétaire peut MODIFIER/SUPPRIMER
-- ============================================================

-- Activer RLS sur toutes les tables
alter table partners enable row level security;
alter table tutors enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- PARTNERS : lecture publique, écriture si connecté, modif/suppression si propriétaire
create policy "Partners : lecture publique" on partners for select using (true);
create policy "Partners : insertion si connecte" on partners for insert with check (auth.uid() is not null or is_example = true);
create policy "Partners : modif si proprietaire" on partners for update using (owner_id = auth.uid());
create policy "Partners : suppr si proprietaire" on partners for delete using (owner_id = auth.uid());

-- TUTORS : même logique
create policy "Tutors : lecture publique" on tutors for select using (true);
create policy "Tutors : insertion si connecte" on tutors for insert with check (auth.uid() is not null or is_example = true);
create policy "Tutors : modif si proprietaire" on tutors for update using (owner_id = auth.uid());
create policy "Tutors : suppr si proprietaire" on tutors for delete using (owner_id = auth.uid());

-- CONVERSATIONS : lecture si on est participant, insertion si connecté
create policy "Convos : lecture si participant" on conversations for select using (auth.uid() = participant_a or auth.uid() = participant_b);
create policy "Convos : insertion si connecte" on conversations for insert with check (auth.uid() = participant_a or auth.uid() = participant_b);

-- MESSAGES : lecture si participant de la conversation, insertion si connecté
create policy "Messages : lecture si participant" on messages for select using (
    exists (
        select 1 from conversations c
        where c.id = messages.conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
);
create policy "Messages : insertion si connecte" on messages for insert with check (
    exists (
        select 1 from conversations c
        where c.id = messages.conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
    and sender_id = auth.uid()
);

-- ============================================================
-- Données d'exemple (annonces visibles par tous au démarrage)
-- ============================================================

insert into partners (name, subject, level, mode, location, contact, description, is_example) values
    ('Camille', 'Mathématiques', 'Terminale', 'Présentiel', 'Paris (Bibliothèque Sainte-Geneviève)', 'camille.exemple@coalla.fr', 'Je prépare le bac de maths et je cherche un binôme pour s''entraîner aux exercices type bac. Disponible le mercredi après-midi et le week-end.', true),
    ('Hugo', 'Physique-Chimie', 'Licence', 'Visioconférence', '', 'hugo.exemple@coalla.fr', 'Étudiant en L1, je cherche un groupe de 2-3 personnes pour réviser la mécanique et la thermodynamique. Visio le soir après 18h.', true),
    ('Léa', 'Anglais', 'Lycée', 'Présentiel', 'Lyon (Bibliothèque de la Part-Dieu)', 'lea.exemple@coalla.fr', 'Je vise un niveau C1 et je cherche quelqu''un avec qui pratiquer l''oral. Rencontres hebdomadaires sur Lyon.', true);

insert into tutors (name, subject, level, price, mode, contact, description, is_example) values
    ('Professeur Marchand', 'Mathématiques', 'Lycée', 25, 'Présentiel et Visioconférence', 'marchand.cours@coalla.fr', 'Professeur certifié avec 8 ans d''expérience. Spécialiste de la préparation au bac (spécialité et tronc commun). Cours adaptés au niveau de l''élève.', true),
    ('Tuteur Bernard', 'Physique-Chimie', 'Licence', 30, 'Visioconférence', 'bernard.sciences@coalla.fr', 'Doctorant en physique, je propose un accompagnement en chimie organique et mécanique quantique. Première séance à moitié prix.', true);

-- ============================================================
-- Fin du script
-- ============================================================
```

4. Clique sur **"Run"** (bouton vert en bas)
5. Tu dois voir le message **"Success. No rows returned"** ✅

---

## Étape 4 — Vérifier l'authentification (1 min)

L'authentification Email/Mot de passe est **activée par défaut** dans Supabase.

1. Vérifie dans le menu de gauche : **Authentication → Providers**
2. **Email** doit être sur **"Enabled"** ✅
3. (Optionnel) Si tu veux que tes amis puissent s'inscrire sans confirmation par email :
   - Va dans **Authentication → Settings**
   - Sous **"Email confirmations"**, tu peux désactiver "Confirm email" si tu veux (plus simple pour tester entre amis)

---

## Étape 5 — Créer le bucket de stockage d'images (1 min)

1. Dans le menu de gauche, clique sur **"Storage"**
2. Clique sur **"New bucket"**
3. **Name** : tape exactement `annonces` (en minuscules)
4. Coche **"Public bucket"** (pour que les images soient visibles publiquement)
5. Clique sur **"Create bucket"**

---

## Étape 6 — Récupérer tes clés API (1 min)

1. Dans le menu de gauche, clique sur **"Project Settings"** (l'icône ⚙️ en bas)
2. Clique sur **"API"**
3. Tu vois deux valeurs importantes :
   - **Project URL** : `https://xxxxxxxx.supabase.co`
   - **anon public key** : une longue chaine qui commence par `eyJ...`
4. **Copie ces deux valeurs**

---

## Étape 7 — Configurer ton projet Coalla (1 min)

1. Ouvre le fichier **`supabase-config.js`** (dans ton dossier Coalla)
2. Remplace les valeurs par les tiennes :

```js
const SUPABASE_URL = "https://xxxxxxxxx.supabase.co";  // ← ton URL
const SUPABASE_KEY = "eyJhbGci...";                     // ← ta clé anon
```

3. **Sauvegarde le fichier**

---

## Étape 8 — Tester 🚀

1. Lance ton site en local (ou sur GitHub Pages)
2. Crée un compte (un vrai email + mot de passe)
3. Vérifie ton email si la confirmation est activée, clique sur le lien
4. Connecte-toi
5. Poste une annonce → elle doit apparaître dans la liste
6. Ouvre un onglet de navigation privée, crée un 2e compte → **tu dois voir l'annonce du 1er compte** ✅

---

## Problèmes courants

### "Invalid API key" au chargement
→ Vérifie que tu as bien copié la clé **anon public** (pas service_role) dans `supabase-config.js`

### Les annonces ne s'affichent pas
→ Vérifie que tu as bien exécuté le script SQL de l'étape 3 (section "SQL Editor")

### "Permission denied" à la création d'annonce
→ Vérifie que tu es bien connecté (les politiques RLS exigent une authentification pour écrire)

### Les images ne s'upload pas
→ Vérifie que le bucket `annonces` existe et est **public** (étape 5)

---

## C'est tout ! 🎉

Ton site Coalla fonctionne maintenant avec de vrais utilisateurs partageant leurs annonces. Chaque utilisateur a son propre compte sécurisé, peut poster des annonces visibles par tous, et discuter avec les autres.

**Limite du plan gratuit Supabase :** 500 Mo de base de données, 1 Go de stockage, 50 000 utilisateurs actifs/mois. Largement suffisant pour commencer.

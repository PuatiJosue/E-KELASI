# E-KELASI Parent & Admin Platform

_Started 2026-05-24 19:15 UTC_

---

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "E-KELASI"
Project is currently empty (no files)
Current date is now May 24, 2026
</system-info>

<pasted_text name="Pasted text (93 lines)">
Créer une application SaaS éducative mobile + web complète appelée E-KELASI, destinée aux parents, professeurs et écoles.
 
IMPORTANT :
Générer un résultat orienté produit réel (production-ready), avec design professionnel et structure prête pour développement.
 
IDENTITÉ DU PRODUIT :
Nom : E-KELASI
Concept : plateforme de suivi scolaire intelligent et communication école–parents–professeurs
Objectif : améliorer la réussite scolaire des élèves grâce au suivi continu et à la communication
 
SORTIE ATTENDUE :
Organiser la réponse en sections claires :
 
1. Wireframes (tous les écrans)
2. UI/UX design détaillé
3. Architecture technique complète
4. Base de données (schema détaillé)
5. User flows (parents, professeurs, écoles, super admin)
6. Dashboard super admin (business + abonnements)
7. Plan MVP → version scalable
 
CONTEXTE PRODUIT :
 
- Application de suivi scolaire en temps réel
- Notes, commentaires des professeurs, devoirs et exercices
- Communication directe parents ↔ professeurs
- Notifications en temps réel
- Suivi de progression de l’élève
 
MODÈLE ÉCONOMIQUE :
Application payante (abonnement mensuel pour parents)
Paiement via Stripe (abonnement, gestion automatique)
 
TECH STACK :
 
- React Native (mobile iOS + Android)
- Next.js (dashboard web admin et écoles)
- Supabase ou Firebase (backend rapide)
- PostgreSQL (base de données)
- AWS S3 (stockage fichiers)
- Stripe Billing (abonnements)
 
FONCTIONNALITÉS :
 
PARENTS :
 
- tableau de bord avec progression de l’enfant
- notes et résultats scolaires
- commentaires des professeurs
- devoirs et exercices
- notifications en temps réel
- messagerie avec professeurs
 
PROFESSEURS :
 
- gestion des classes
- ajout de notes
- commentaires pédagogiques
- création de devoirs/exercices
- communication avec parents
 
ÉCOLES :
 
- gestion élèves et professeurs
- statistiques globales
- rapports PDF
- branding personnalisé
 
SUPER ADMIN (PLATEFORME E-KELASI) :
 
- gestion des écoles partenaires
- gestion des abonnements et paiements
- MRR (revenus mensuels)
- churn rate
- support et tickets
- logs et sécurité
 
UI/UX :
 
- design moderne, propre, éducatif et professionnel
- style type Stripe / Notion / ClassDojo
- interface intuitive et simple
- dashboard en cartes (cards UI)
- sidebar élégante
- responsive web + mobile
- mode sombre
 
EXIGENCE PRINCIPALE :
Créer une application complète, scalable et prête à être publiée sur Google Play et App Store.
 
OBJECTIF FINAL :
E-KELASI doit être une plateforme éducative premium permettant aux parents de suivre et améliorer la réussite scolaire de leurs enfants en temps réel.
 
</pasted_text>

<!-- The user explicitly selected the following skills for this project, as attachments to their message. These are not optional context — they define how you work. Use them. -->
<attached-skill name="Hi-fi design">
Create a high-fidelity, polished design. Follow the instructions about design in your system prompt, particularly the 'How to do design work' section. Use the design_canvas starter component, or make a full-bleed prototype and offer options via Tweaks.
</attached-skill>

<attached-skill name="Interactive prototype">
Create a fully interactive prototype with realistic state management and transitions. Use React useState/useEffect for dynamic behavior. Include hover states, click interactions, form validation, animated transitions, and multi-step navigation flows. It should feel like a real working app, not a static mockup.
</attached-skill>

<attached-skill name="Design System (design system)">
[Design System] This project uses the **Design System** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

    Explore it to find what you need:
    - Always copy out the fonts and colors you need
    - For prototypes and designs, always copy out any relevant components
    - If the design system contains existing mocks of products, and you were asked to design or prototype something similar, copy and fork those mocks to start your design. This helps you make high-quality designs.

    Explore it quickly to find relevant UI kits (e.g. mocks of existing products you can copy and fork)

Full system at `/projects/019e2cf7-02e7-76da-a045-3ba19c9e6a06/`. Before producing any visuals, explore it: call `list_files("/projects/019e2cf7-02e7-76da-a045-3ba19c9e6a06/")` to see the structure, then `read_file` the README/base.md or whatever index file it has. Don't guess at the design system's contents.

CSS tokens: the guide may describe tokens in prose, but the exact `--*` names are defined in the design system's stylesheet(s). Before writing any `var(--*)`, look up the real name in the design system's `.css` files (`list_files` + `read_file` under `/projects/019e2cf7-02e7-76da-a045-3ba19c9e6a06/`). Never guess a token name — an unresolved `var()` silently falls back to the browser default.

For assets and UI kits beyond the guide: `read_file("/projects/019e2cf7-02e7-76da-a045-3ba19c9e6a06/<path>")` and `copy_files` to bring them into the current project.
</attached-skill>

## Assistant

_[tool: list_files]_

_[tool: list_files]_

_[tool: questions_v2]_

Avant de commencer, j'ai besoin de cadrer le projet. La demande est très large (wireframes, UI/UX, architecture, BDD, user flows, dashboard, plan MVP) — il faut prioriser pour produire quelque chose de qualité.

## User

Questions answered:
- primary_deliverable: Prototype interactif hi-fi du produit (écrans cliquables, mobile + web)
- audience_focus: Parents (mobile), Super Admin E-KELASI (web)
- platform_focus: Les deux à parts égales
- design_canvas_vs_proto: Les deux : prototype + canvas de comparaison
- visual_style: Hybride éducatif premium (à ma discrétion)
- color_direction: 3
- dark_mode: Les deux (toggle dans la maquette)
- language: Bilingue FR/EN
- interactions_depth: Navigation entre écrans (clic sur boutons)
- include_business: Schéma de base de données (visuel), Architecture technique (diagramme), User flows (parents/profs/etc.), Roadmap MVP → V2, Modèle économique / pricing
- tweaks_wanted: Couleur primaire, Light/Dark mode, Style des cards (plat / ombré / bordé), Famille typographique
- extra_context: Target market: French-speaking schools first (Canada + Francophone Africa), with future international expansion.
 
E-KELASI should feel premium, trustworthy, and educational.
 
Main paying users are parents subscribing monthly to track their children's academic progress.
 
The app must inspire confidence and justify a paid subscription.
 
Use realistic school data examples.
 
Include subtle educational branding.
 
Design should feel modern like Stripe and Notion, but warmer and more human.
 
Prioritize mobile usability for parents.
 
Super admin dashboard should feel professional SaaS-grade.

## Assistant

_[tool: update_todos]_

_[tool: copy_starter_component]_

_[tool: copy_starter_component]_

_[tool: copy_starter_component]_

_[tool: copy_starter_component]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: write_file]_

Now I'll write the design tokens and shared code. Given the scope, I'll split into a few files to keep things manageable.

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

## Assistant

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: show_html]_

_[tool: done]_

_[tool: fork_verifier_agent]_

J'ai construit **E-KELASI** comme un canvas de design interactif rassemblant 4 sections :

- **Application parent · iOS** — 8 écrans cliquables (bienvenue, dashboard, notes, devoirs, messagerie, conversation, profil/abonnement, notifications) avec navigation par onglets et tab bar.
- **Console super admin · Web** — 5 écrans (vue d'ensemble avec MRR/churn, écoles partenaires, abonnements Stripe, support en kanban, sécurité & logs).
- **Architecture & données** — diagramme système + schéma PostgreSQL avec relations.
- **Produit & business** — user flows pour 4 personas, roadmap MVP → v2 sur 12 mois, et tarifs 3 paliers.

**Tweaks live** (panneau en bas à droite) : couleur primaire, mode sombre, style de cartes (plat/ombré/bordé), famille typographique, et bascule FR/EN.

**Conventions** : palette ambre éducative chaleureuse, typo Bricolage Grotesque + Plus Jakarta Sans, données réalistes (Dakar, Montréal, Abidjan…), bilingue FR/EN partout.

**Limitations connues** :
- Les apps prof et école/direction ne sont qu'évoquées dans les flows — pas mockées.
- Les interactions sont la navigation entre écrans ; pas de vraie saisie de formulaire.
- L'IA n'est citée que dans la roadmap, pas démontrée.

**Pistes pour la suite** si vous voulez approfondir : (1) écrans prof + école, (2) onboarding parent end-to-end avec paiement Stripe, (3) version Android avec Material 3, (4) écrans bulletin PDF.

## User

ce la meme chose deja non?? android et ios???

## Assistant

Bonne remarque. À 95 % oui, c'est le même produit — mêmes écrans, mêmes flows, mêmes données. Les différences sont superficielles :

- **Status bar / safe area** (encoche iOS vs barre Android)
- **Composants natifs** (boutons Cupertino vs Material 3, sélecteur de date, switch)
- **Bouton retour système** (geste iOS vs bouton Android)
- **Notifications** (centre iOS vs shade Android)
- **Typographie système** (SF Pro vs Roboto — mais on garde Bricolage côté custom)

En React Native, **un seul codebase** couvre les deux. Donc oui, pas besoin de redessiner 8 écrans.

Voulez-vous que je fasse l'une de ces choses à la place ?

1. **Ajouter UNE artboard Android** côte à côte avec l'iOS pour montrer la parité (status bar Material, nav bar gestuelle, switch Material) — 1 écran suffit pour démontrer
2. **Construire la console prof** (saisie de notes, gestion classe) — c'est ça qui manque vraiment
3. **Construire le dashboard école/direction** (stats globales, bulletins PDF, branding)
4. **Approfondir l'onboarding parent** (signup → ajout enfant → paiement Stripe) — flow complet bout-en-bout
5. Autre chose


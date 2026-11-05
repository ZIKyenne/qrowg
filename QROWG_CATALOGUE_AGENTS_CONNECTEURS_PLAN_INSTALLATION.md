# QRowg — Catalogue d'agents, connecteurs et plan d'installation

**Version : 4 novembre 2026 — cible : QRowg AI Growth Engine.**

## 0. Objectif et état de départ

Objectif : à partir d'entreprises B2B éligibles et de données professionnelles collectées licitement, sélectionner les prospects adaptés à QRowg, analyser leur activité, fabriquer une **prévisualisation de page QRowg personnalisée** et fidèle aux fonctionnalités réellement disponibles, contrôler la qualité et les droits d'usage, rédiger un message commercial personnalisé, puis orchestrer l'envoi avec un prestataire qui autorise expressément la prospection B2B. Après la visite, permettre l'import de la page dans le compte du prospect, l'édition et la publication en quelques étapes, puis mesurer activation et abonnements réellement encaissés.

Constats utiles : qrowg.com présente un constructeur sans compte, des pages/QR éditables, une bibliothèque métiers, un plan gratuit et deux plans payants. Le dépôt GitHub `ZIKyenne/qrowg` contient notamment Next.js, React, TypeScript, pnpm/Turborepo, Supabase, Stripe, Resend, Anthropic SDK, Playwright, Vitest et un ancien paquet `mcp-server` à expertiser. L'état précis et le déploiement actif ne sont PAS établis par une simple dépendance. Des documents historiques QRowg HQ décrivent les agents CHEF, Jade, Léna, Rex, Théo et Nina ainsi qu'une interface gaming : ne pas créer de doublons sans vérification.

**Les trois couches à ne pas confondre :** (1) sous-agents Claude Code = équipe de développement à la demande, dans `.claude/agents/` ; (2) skills = procédures réutilisables dans `.claude/skills/` ; (3) agents métier en production = tâches durables et traçables qui travaillent pour QRowg via backend et files de jobs, pas des sessions Claude Code supposées tourner en permanence. Les MCP donnent aux agents de développement accès à des outils, ils ne réalisent pas à eux seuls des tâches 24/7.

## 1. Catalogue raisonné des outils

Colonnes : **niveau** = P0 indispensable, P1 juste après un pilote, P2 facultatif/sous condition. **Type** = MCP, plugin, SDK/API, outil de développement ou service.

| Outil | Niveau / type | Utilité précise | Comment l'ajouter / remarque |
| --- | --- | --- | --- |
| **Claude Code natif — subagents** | P0 / natif | architecte, template-engine, sécurité, QA, croissance | `.claude/agents/*.md`; pas de plugin nécessaire ; https://code.claude.com/docs/en/sub-agents |
| **Claude Code Skills** | P0 / natif | procédures QRowg reproductibles | `.claude/skills/<nom>/SKILL.md` ; https://code.claude.com/docs/en/skills |
| **Supabase MCP officiel** | P0 / MCP | schémas, logs, RLS, audits SQL | https://supabase.com/docs/guides/ai-tools/mcp ; lire la PROD **en lecture seule** et sur un `project_ref` précis ; écriture uniquement en DEV/staging |
| **Vercel MCP officiel** | P0 / MCP | déploiements, erreurs, projets et logs | `claude mcp add --transport http vercel https://mcp.vercel.com` ; https://vercel.com/docs/agent-resources/vercel-mcp |
| **Playwright MCP officiel** | P0 / MCP | parcours mobile, captures, tests de prévisualisation | `claude mcp add playwright npx @playwright/mcp@latest` ; https://playwright.dev/docs/getting-started-mcp |
| **GitHub CLI / GitHub MCP** | P0 / CLI ou MCP | branches, PR, commits, CI, revue | préférer CLI `gh` si déjà utilisé ; MCP https://github.com/github/github-mcp-server ; aucun secret dans le dépôt |
| **Chrome DevTools MCP** | P1 / plugin | inspecter JS, réseau, performance et rendu | `/plugin marketplace add ChromeDevTools/chrome-devtools-mcp` puis `/plugin install chrome-devtools-mcp@chrome-devtools-plugins` ; https://github.com/ChromeDevTools/chrome-devtools-mcp |
| **Stripe plugin officiel** | P1 / plugin | auditer abonnements, webhooks, entitlement et checkout | `claude plugin install stripe@claude-plugins-official` ; accès et capacité de modification à limiter ; https://github.com/mcp/com.stripe/mcp |
| **Resend plugin officiel** | P1 / plugin | emails demandés par l'utilisateur, modèles transactionnels, réponses et délivrabilité | `claude plugin install resend@claude-plugins-official` ; https://resend.com/changelog/resend-claude-code-plugin ; **ne jamais utiliser pour la prospection froide** |
| **PostHog MCP** | P1 / MCP | funnels, cohortes, A/B, clic aperçu→compte→premier scan→payant | `claude mcp add --transport http posthog https://mcp.posthog.com/mcp` ; https://posthog.com/docs/model-context-protocol |
| **Sentry MCP** | P1 / MCP | erreurs de production, traces de performance | `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` ; https://mcp.sentry.dev/ ; seulement si Sentry est retenu/présent |
| **axe-core / Lighthouse CI** | P1 / dev | accessibilité, performance et qualité mobile | bibliothèques de tests/CI à intégrer aux tests existants ; ne remplace pas une recette manuelle |
| **Oh My ClaudeCode** | P2 / plugin | orchestration avancée de développement multi-agent | seulement après test du natif ; https://github.com/Yeachan-Heo/oh-my-claudecode ; éviter doublons d'orchestrateurs |
| **OpenAI Codex** | P2 / second réviseur | deuxième regard sur sécurité ou PR complexes | complément de revue, non nécessaire au moteur métier |
| **Canva / Figma MCP** | P2 / design | assets autorisés et bibliothèques de marque | réutiliser le connecteur Canva QRowg HQ s'il est opérationnel ; ne pas remplacer le renderer de QRowg |
| **SEO : Search Console, Lighthouse** | P1 / API/outils | indexation pages publiques, performance, Search Console | pas d'indexation des prévisualisations commerciales privées |
| **API Recherche d'entreprises** | P0 / API FR | recherche B2B par société, SIREN/SIRET, activité/zone | https://recherche-entreprises.api.gouv.fr/docs/ ; ne fournit pas un droit d'emailing automatique ni nécessairement des emails |
| **Site officiel de l'entreprise** | P0 / collecte limitée | description, liens, infos et marque vérifiables | consulter des pages publiques accessibles et autorisées ; tracer URL/date ; aucun contournement de paywall, CAPTCHA, compte, robots ou interdiction |
| **Google Places API (New)** | P1 / API payante | découvrir des établissements par secteur et zone | https://developers.google.com/maps/documentation/places/web-service/overview ; contrôles de coût, field masks, attribution, restrictions de stockage/réutilisation |
| **OpenStreetMap / Overpass** | P1 / source géographique | découvrir des établissements suivant la couverture et la licence | respecter ODbL, politiques d'usage et limites ; pas de garantie de présence d'emails fiables |
| **Lemlist** | P1 / API prospection B2B | séquences d'emails commerciaux, réponses, suppression globale | https://developer.lemlist.com/ et https://help.lemlist.com/en/articles/4452694-find-and-use-the-lemlist-api ; vérifier contrat, capacité et conformité avant activation |
| **Hunter / Dropcontact / vérif emails** | P2 / API | retrouver/vérifier une adresse professionnelle licitement, réduire les rebonds | choisir un seul fournisseur après audit juridique/coût/source ; ne pas deviner des adresses personnelles |
| **Anthropic SDK déjà présent** | P0 / SDK runtime | classifier secteur, choisir template, remplir JSON structuré, rédiger brouillon | appels ponctuels côté serveur ; jamais une IA qui invente horaires, menus, tarifs, photos ou affiliation |
| **Job queue : Inngest OU Trigger.dev** | P1 / service | exécuter/reprendre les lots durables, avec retries, checkpoints et audit | comparer à l'ordonnanceur QRowg existant ; une seule solution si les crons actuels sont insuffisants |
| **Supabase Postgres / Storage** | P0 / existant | CRM léger, profils de marque, templates, prévisualisations, événements | nouveaux schémas séparés, RLS, TTL, index, sauvegardes ; ne pas créer un CRM externe par défaut |
| **Stripe existant** | P0 / existant | attribuer conversions à abonnement effectivement payé | les données Stripe restent source de vérité ; ne pas inférer revenu à partir de clics |
| **Buffer, Supermetrics** | P2 / présents dans HQ selon documents | campagnes publiques, analytics externes | vérifier réellement la connexion et les droits ; pas nécessaires au pilote emailing |
| **Firecrawl / service parsing** | P2 / API | extraction de sites plus robuste si l'approche sobre échoue | autorisations du site et conditions fournisseur, coût au document, injection et données perso à contrôler |
| **n8n** | P2 / orchestrateur | automatisations métier visuelles | alternative au backend jobs, pas une obligation ; éviter une deuxième source de vérité |
| **OpenBot / autres agents desktop** | P2 / app externe | expérimentation multi-agents | pas indispensable si Claude Code + QRowg HQ suffisent ; ne pas donner accès prod par défaut |

**Ne PAS installer par défaut** les packages Trader Skill, Day Trader, MoonX, Cubrik ou Grok Trading Desk : ils concernent le trading, pas la création de templates ni la conversion de commerçants ; ne pas intégrer d'outils de prospection LinkedIn non conformes ni de contournements de protections.

## 2. Équipe d'agents métier recommandée

Chaque ligne désigne une capacité fonctionnelle, pas nécessairement un processus LLM vivant en permanence. Le CHEF existant reste orchestrateur si son exécution est prouvée.

| Agent | Mission et livrable | Autorisations |
| --- | --- | --- |
| CHEF / Growth Orchestrator | créer les missions, gérer statuts, budgets, retries et priorités ; rapport prouvable | pas d'envoi ni de publication sans politique activée |
| Théo / Radar secteurs | identifier régions et métiers cibles, opportunités vérifiables | collecte autorisée uniquement |
| Prospect Finder | rechercher entreprises éligibles et source de contact | pas de scraping interdit, pas d'invention de contact |
| Prospect Qualifier | score besoin/faisabilité/business fit, justification et provenance | aucune décision fondée sur données sensibles |
| Brand Analyst | dossier avec couleurs, typographie approximative, ton, site, liens publics | pas de copie d'images/logo sans droit vérifié |
| Template Architect | mapper métier→blocs QRowg réels, versionner le blueprint | pas de nouvelles primitives silencieuses |
| Template Composer | remplir un modèle existant dans un schéma validé | jamais d'accès aux pages d'autres clients |
| Design Reviewer | contrôle mobile, lisibilité, cohérence, CTA, qualité de contenu | peut rejeter ; ne peut valider de faux faits |
| Rex / Security + Compliance | vérifier origine, licence, non-affiliation, RGPD, permissions, XSS | bloque les envois non conformes |
| Email Copywriter | produire sujet, texte concis, lien d'aperçu et suivi optionnel | brouillon seulement jusqu'à validation/politique |
| Outreach Dispatcher | envoi via fournisseur B2B accepté + webhooks + désabonnements | jamais Resend pour cold email |
| Reply Classifier | identifier intéressé, stop, question, doute ; proposer réponse | opt-out bloque immédiatement ; réponse sensible à valider |
| Onboarding Coach | tutoriel de prise en main métier en 3–5 étapes | pas de faux boutons ni de promesses absentes |
| Léna / Analytics & Experiment | suivre source→envoi→aperçu→claim→publication→premier scan→abonnement | mesure agrégée privilégiée ; définition de chaque KPI |
| Nina / Growth Strategist | priorités, tests contrôlés, coût/activation, apprentissage | pas d'auto-optimisation opaque |
| Jade / Content Studio | enrichit la bibliothèque publique de templates sectoriels | validation de qualité, duplication évitée |

**Sous-agents de DÉVELOPPEMENT Claude Code** : `repo-architect`, `supabase-security-reviewer`, `template-engine-builder`, `ux-accessibility`, `prospecting-compliance`, `growth-backend`, `outreach-integration`, `e2e-qa`, `analytics-reviewer`. Les créer en `.claude/agents/` avec objectifs, outils autorisés, sorties et critères mesurables. Ne pas multiplier les sous-agents s'ils n'apportent pas de séparation réelle des responsabilités.

**Skills à écrire** dans `.claude/skills/<nom>/SKILL.md` : `qrowg-template-schema`, `qrowg-sector-playbook`, `qrowg-brand-fidelity`, `qrowg-preview-qa`, `qrowg-prospect-research`, `qrowg-b2b-compliance`, `qrowg-email-personalization`, `qrowg-onboarding`, `qrowg-growth-metrics`, `qrowg-security-release`. Vérifier au préalable ceux déjà décrits dans les documents HQ (`qrowg-marketing`, `qrowg-design-qc`, `qrfolio-security`, `qrfolio-theme-studio`, etc.) et les étendre plutôt que dupliquer.

## 3. Installation pas à pas (Windows / VS Code / Claude Code)

### Étape 0 — Inventaire, sauvegarde, branche

Dans le terminal à la racine réelle de QRowg :

```powershell
# Vérifier le contexte
pwd
git status
git branch --show-current
node --version
pnpm --version
claude --version
claude mcp list

# Ne rien supprimer ; si l'arbre n'est pas propre, sauvegarder d'abord.
# Une fois la situation comprise :
git switch -c feat/qrowg-ai-growth-engine
pnpm install
pnpm type-check
pnpm test
```

Ne pas écraser un travail non commité. Demander à Claude Code de repérer les intégrations actives et les tests existants. Conserver dans un rapport les échecs déjà présents avant les changements.

### Étape 1 — Connexions principales (éviter les doublons)

Dans **PowerShell** (pas comme phrases de chat Claude Code), seulement si le serveur manque dans `claude mcp list` :

```powershell
# Accès projet Supabase de lecture — remplacer la valeur fictive
claude mcp add --transport http supabase-qrowg-ro "https://mcp.supabase.com/mcp?project_ref=VOTRE_PROJECT_REF&read_only=true"

# Déploiements et logs
claude mcp add --transport http vercel https://mcp.vercel.com

# Tests navigateur et capture d'aperçus
claude mcp add playwright npx @playwright/mcp@latest

# Après déploiement de la collecte d'événements pertinente
claude mcp add --transport http posthog https://mcp.posthog.com/mcp

# Facultatif si Sentry choisi
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

claude mcp list
```

Démarrer `claude`, taper `/mcp` pour authentifier individuellement les serveurs et contrôler leurs permissions. Utiliser les environnements DEV/staging pour les écritures. Le Supabase MCP de PROD est **lecture seule** ; ne jamais donner un token service-role en accès libre à un sous-agent.

### Étape 2 — Plugins de spécialité (dans Claude Code)

Ces commandes slash s'entrent **l'une après l'autre dans Claude Code**, pas dans PowerShell :

```text
/plugin marketplace add ChromeDevTools/chrome-devtools-mcp
/plugin install chrome-devtools-mcp@chrome-devtools-plugins
```

Pour le paiement, uniquement si utile :

```text
/plugin install stripe@claude-plugins-official
```

Pour les messages **transactionnels et consentis** :

```text
/plugin install resend@claude-plugins-official
```

**Alternative :** remplacer le plugin Resend par son MCP `claude mcp add --transport http resend https://mcp.resend.com/mcp`, pas les deux sans raison. Resend ne convient pas aux campagnes de cold outreach. Oh My ClaudeCode est facultatif, seulement après preuve que l'orchestration native ne suffit pas :

```text
/plugin marketplace add https://github.com/Yeachan-Heo/oh-my-claudecode
/plugin install oh-my-claudecode
```

### Étape 3 — Créer les instructions et rôles du projet

Conserver ou créer :

```text
CLAUDE.md
.claude/
  agents/
    repo-architect.md
    template-engine-builder.md
    prospecting-compliance.md
    growth-backend.md
    ux-accessibility.md
    e2e-qa.md
  skills/
    qrowg-template-schema/SKILL.md
    qrowg-prospect-research/SKILL.md
    qrowg-preview-qa/SKILL.md
    qrowg-b2b-compliance/SKILL.md
    qrowg-email-personalization/SKILL.md
    qrowg-onboarding/SKILL.md
```

Chaque fichier agent doit avoir `name`, `description`, `tools` adaptés en frontmatter YAML, puis sa mission, interdictions, livrables, tests. Déclarer les rôles et skills métier dans un registre lisible par QRowg HQ, sans prétendre qu'un agent de développement est un worker permanent.

### Étape 4 — Première tranche fonctionnelle sans dépenses externes

Créer un pilote de 10 entreprises **fictives** ou explicitement volontaires avec données autorisées. Implémenter CRM minimal dans Supabase, classification métier, architecture de `brand_profile`, adaptateur du moteur existant de templates, génération versionnée de preview, capture Playwright, contrôle QA, lien privé expirant, appropriation par un compte authentifié, publication/QR optionnels. L'ensemble doit marcher avec les fournisseurs de prospection désactivés (`mock_transport`). Aucun envoi externe. Mesurer la durée et le coût de création d'une page par prospect.

### Étape 5 — Prospection B2B ciblée

1. Vérifier juridiquement et contractuellement sources de données, pays ciblé, durée de conservation, droits d'opposition et fournisseur d'envoi.
2. Choisir **un seul outil accepté pour la prospection froide**, par exemple Lemlist si son contrat et son usage précis le permettent. Créer son compte, vérifier domaine d'envoi dédié, SPF, DKIM, DMARC, boîtes de réponses ; ne pas compromettre le domaine transactionnel QRowg.
3. Générer une clé API depuis les paramètres Lemlist, la mettre seulement en environnement serveur/Vercel, puis adapter un client HTTP TypeScript en suivant les endpoints officiels. **Pas de clé dans le navigateur, un prompt ou Git.** Documentation : https://help.lemlist.com/en/articles/4452694-find-and-use-the-lemlist-api.
4. Créer une campagne d'essai à destinataires internes/consentants, synchroniser statuts + réponses + désabonnements, tester les webhooks, l'arrêt automatique des relances et les retries idempotents.
5. Élargir progressivement aux professionnels éligibles français selon une politique documentée et vérifiée, après validation manuelle du pilote. Une automatisation autorisée peut ensuite envoyer des séquences **dans le périmètre prédéfini et révocable**, sans validation par destinataire si le contrôle juridique et qualité a été mis en place.

### Étape 6 — Rattacher au QRowg HQ

Une mission QRowg HQ porte `campaign_id`, `prospect_id`, `agent_run_id`, sources/horodatages, template_version, aperçu, preuve de QA, état d'envoi, état de reprise, coût. Ajouter une salle **Acquisition** et un atelier **Prévisualisations**, en conservant les agents et la charte existants. Les statuts et compteurs doivent provenir de données réelles, pas de personnages animés à partir d'une heure théorique.

## 4. Expérience prospect et création de templates

**Moteur de personnalisation en deux étages :**

- **Templates sectoriels réutilisables** : restaurant, bar, coiffeur, hôtel, artisan, immobilier, auto-école, commerce, thérapeute, photographe, coach, événement ; chacun possède structure de blocs, actions principales, options mobile et variantes visuelles conformes au schéma du builder.
- **Calque entreprise (`brand_profile`)** : palette, tonalité, logo SI son usage a été autorisé, nom, site source, adresse et horaires vérifiés, liens de réservation et réseaux dont la provenance est connue. Les données incertaines deviennent des champs à valider, pas des inventions.

Le moteur propose un template de base adapté au métier, puis applique les éléments vérifiés. Le rendu sert le **même renderer QRowg** que les pages normales. Preview non indexable, expirable, privée et clairement marquée « proposition non officielle créée par QRowg ». Images et logos commerciaux seulement si licence/droit d'utilisation évalué ; sinon visuels neutres ou placeholders. Ne jamais prétendre qu'une entreprise réelle a créé/validé la page.

**Parcours réclamation :** aperçu → « Ce modèle me plaît » → inscription/connexion (éventuellement sans compte avant publication, conformément au parcours actuel) → claim sécurisé et idempotent → copie du modèle dans l'espace propre à l'utilisateur → vérification des informations → publication/QR. Ne pas lier la revendication à une simple visite anonyme ou à un lien public ; vérifier la possession de l'adresse/du compte et la relation avec l'entreprise avant tout attribut d'officialité.

**Tunnel mesuré :** `prospect_qualified`, `brand_profile_ready`, `preview_created`, `preview_qa_passed`, `outreach_approved`, `outreach_sent`, `preview_viewed`, `preview_claim_started`, `signup_completed`, `page_published`, `first_qualified_scan`, `subscription_active`. Garder la définition de chaque événement, le lien avec sa source, son niveau de certitude. Respecter les choix de confidentialité et éviter les pixels de suivi nominatif non nécessaires.

## 5. Schéma minimal de données

Ne pas dupliquer `users`, `pages`, `templates`, `analytics`, `billing` : migrer en complément du schéma existant.

```text
prospect_companies(id, legal_name, siren?, sector, source_url, source_observed_at, territory, status)
prospect_contacts(id, company_id, work_email?, provenance, lawful_basis, notice_status, contact_status)
prospect_sources(id, company_id, url, kind, fetched_at, license_note, content_hash, allowed_use)
prospect_brand_profiles(id, company_id, profile_json, provenance_json, verified_at, version)
growth_campaigns(id, scope, status, target_sector, budget, approved_policy_version)
growth_templates(id, sector, base_template_id, schema_version, variants_json, active)
growth_previews(id, company_id, blueprint_version, brand_version, render_payload, private_token_hash, expires_at, qa_status, claimed_by?)
growth_messages(id, company_id, contact_id, campaign_id, subject, body, preview_id, status, approved_at, provider_ref?)
growth_events(id, campaign_id, prospect_id, event_type, event_time, provider_event_id?, metadata_minimal)
growth_suppressions(id, normalized_identifier_hash, reason, created_at, source)
growth_jobs(id, type, idempotency_key, status, attempts, last_error, next_run_at, policy_version)
growth_costs(id, provider, operation, units, estimated_eur, actual_eur?, occurred_at)
```

Le stockage minimal des coordonnées et leur conservation doivent être décidés avec la documentation RGPD. Interdire les accès publics non autorisés ; tester RLS, énumération de previews, expiration, SSRF du crawler, XSS du texte importé, injections de prompt présentes sur les sites prospects, falsification d'identité et reprises de jobs.

## 6. Règles d'envoi et de conformité indispensables

- CNIL B2B (France) : pertinence professionnelle, information sur source/finalité, opposition gratuite, durée de conservation, exercice des droits. Une adresse publique n'est pas un blanc-seing de réutilisation. Sources : https://www.cnil.fr/fr/communication-electronique-quelles-regles et https://www.cnil.fr/fr/la-reutilisation-des-donnees-publiquement-accessibles-en-ligne-des-fins-de-demarchage-commercial .
- Resend AUP interdit les emails non sollicités, y compris cold outreach : https://resend.com/legal/acceptable-use . Garder Resend pour les emails dont le type/consentement respecte sa politique.
- Vérifier les politiques propres aux prestataires, même si une pratique est potentiellement légale en France. Garder journal des origines, refus, rebonds, et liste repoussoir globale. Source : https://www.cnil.fr/fr/comment-utiliser-une-liste-repoussoir-pour-respecter-lopposition-la-prospection-commerciale .
- Les prévisualisations sont des **propositions non officielles**, protégées, `noindex`, non revendiquées. Ne pas publier de copies publiques de sites et pages de tiers. Pas de photos/avis/menu/horaires inventés ou redistribués sans autorisation.
- Mettre à jour la politique de confidentialité QRowg pour la nouvelle finalité, les durées et sous-traitants avant l'activation.
- Vérifier les restrictions Google Places concernant stockage, attribution, réutilisation, cache et prix : https://developers.google.com/maps/documentation/places/web-service/policies .
- Ne pas mesurer la réussite avec des « ouvertures email » seules ; préférer aperçus consultés, réponses positives, inscriptions, pages publiées, premières visites et abonnements Stripe constatés.

## 7. Tests et critères de validation

**Passage de bout en bout minimal :** une entreprise fictive préchargée et 3 secteurs → sélection d'un template de la bibliothèque existante → 3 variantes réelles du renderer → contrôle responsive 360/390/768/1440 → contenu sans fausse affirmation → URL privée et noindex → email en brouillon → « envoi » vers boîte interne via mock ou fournisseur autorisé → clic → claim authentifié → vraie page personnalisable → publication → QR scannable → events/attribution → désabonnement et réexécution idempotente. Tout incident est observable et réparable ; rollback sur chaque migration.

**Livrer pour chaque lot** : fichiers touchés, tests exécutés, captures mobile/desktop, migration appliquée, état Vercel, coût moyen par preview et par prospect qualifié, risques résiduels et prochaine action. Les chiffres projetés ne sont pas présentés comme revenus réalisés.

## 8. Liens officiels de référence

- Claude Code agents : https://code.claude.com/docs/en/sub-agents
- Claude Code skills : https://code.claude.com/docs/en/skills
- Claude Code MCP : https://code.claude.com/docs/en/mcp
- Supabase MCP : https://supabase.com/docs/guides/ai-tools/mcp
- Vercel MCP : https://vercel.com/docs/agent-resources/vercel-mcp
- Playwright MCP : https://playwright.dev/docs/getting-started-mcp
- Chrome DevTools MCP : https://github.com/ChromeDevTools/chrome-devtools-mcp
- Stripe : https://github.com/mcp/com.stripe/mcp
- Resend plugin : https://resend.com/changelog/resend-claude-code-plugin
- Resend anti-spam : https://resend.com/legal/acceptable-use
- PostHog : https://posthog.com/docs/model-context-protocol
- Sentry : https://mcp.sentry.dev/
- GitHub MCP : https://github.com/github/github-mcp-server
- Recherche Entreprises : https://recherche-entreprises.api.gouv.fr/docs/
- Google Places : https://developers.google.com/maps/documentation/places/web-service/overview
- Lemlist API : https://help.lemlist.com/en/articles/4452694-find-and-use-the-lemlist-api
- CNIL : https://www.cnil.fr/fr/communication-electronique-quelles-regles

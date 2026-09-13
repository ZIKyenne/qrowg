// app/q/[code]/route.ts v2
// Résolution QR avec gestion des statuts

import { createAdminClient } from "@/lib/supabase/server"
import { estUnRobot } from "@/lib/robots"
import { NextRequest, NextResponse, after } from "next/server"
import { createHash } from "node:crypto"
import { resolveOverrideDest, detectDevice, escapeHtml, type OverrideDest } from "./qrResolve"
import { moyensDeJoindre, phraseDuMur, titreDuMur, type MoyenDeJoindre, type RaisonDuMur } from "./joindreLeCommerce"
import { harnessAutorise } from "@/app/e2e-harness/gate"
import { rateLimit, ipOf } from "@/lib/rateLimit"
import { parseDevice } from "@/lib/scanStats"
import { verifyLinkPassword } from "@/lib/linkPassword"

// Redirection NON mise en cache : un QR est DYNAMIQUE (le proprietaire peut changer sa
// destination apres impression) -> chaque scan doit re-resoudre cote serveur. Sans no-store,
// un CDN/navigateur pourrait figer une ancienne destination.
function redirectNoStore(url: string | URL, status = 302): NextResponse {
  return new NextResponse(null, {
    status,
    headers: { Location: url.toString(), "Cache-Control": "no-store, must-revalidate" },
  })
}

// Déduit OS + navigateur depuis le User-Agent (best-effort, pour les stats de scan).
// Ordre important : Edge (Edg/) et Opera (OPR/) AVANT Chrome car leur UA contient "Chrome" ;
// Safari en dernier et seulement si pas Chrome (le UA Chrome contient aussi "Safari").
function parseUserAgent(ua: string): { os: string | null; browser: string | null } {
  const s = ua || ""
  let os: string | null = null
  if (/Windows NT/i.test(s)) os = "Windows"
  else if (/iPhone|iPad|iPod/i.test(s)) os = "iOS"
  else if (/Mac OS X|Macintosh/i.test(s)) os = "macOS"
  else if (/Android/i.test(s)) os = "Android"
  else if (/Linux/i.test(s)) os = "Linux"
  let browser: string | null = null
  if (/Edg\//i.test(s)) browser = "Edge"
  else if (/OPR\/|Opera/i.test(s)) browser = "Opera"
  else if (/Chrome\//i.test(s) && !/Chromium/i.test(s)) browser = "Chrome"
  else if (/Firefox\//i.test(s)) browser = "Firefox"
  else if (/Safari\//i.test(s) && !/Chrome/i.test(s)) browser = "Safari"
  return { os, browser }
}

// ── Le mur au bout du QR imprimé ───────────────────────────────────────────
//
// Quatre écrans d'échec (introuvable, expiré, en pause, pas encore publiée)
// n'offraient au client qu'un seul lien : « Créer votre propre QR Code → » vers
// qrowg.com. Une personne devant la vitrine, le flyer à la main, recevait une
// publicité pour l'outil de son commerçant (relevé du 13 septembre, voir
// ./joindreLeCommerce.ts). Le mur rend maintenant ce que le flyer promettait :
// le nom du commerce, et un moyen de le joindre quand le produit en connaît un.
// Le lien QRowg reste, en bas, en petit — il n'est plus la seule sortie.

const TEINTE_DU_MUR: Record<RaisonDuMur, string> = {
  introuvable: "201,168,76",
  expire: "255,107,107",
  en_pause: "249,115,22",
  brouillon: "201,168,76",
  erreur: "255,107,107",
}
const EMOJI_DU_MUR: Record<RaisonDuMur, string> = {
  introuvable: "🔍", expire: "⌛", en_pause: "⏸", brouillon: "🚧", erreur: "⚠️",
}
const ETIQUETTE_DU_MUR: Record<RaisonDuMur, string> = {
  introuvable: "Code inconnu", expire: "Expiré", en_pause: "En pause",
  brouillon: "Bientôt en ligne", erreur: "Indisponible",
}

/**
 * L'écran d'échec, en une seule fonction pour les quatre cas — avant, trois
 * gabarits presque identiques divergeaient à chaque retouche.
 *
 * Tailles de texte ≥ 11 px et cibles ≥ 48 px de haut : les règles de la maison
 * valent AUSSI pour l'écran que voit le client (garde ./murDuQr.test.ts).
 */
function murHtml(o: {
  raison: RaisonDuMur
  nom?: string | null
  moyens?: MoyenDeJoindre[]
  message?: string | null
  appUrl: string
}): string {
  const teinte = TEINTE_DU_MUR[o.raison]
  const titre = titreDuMur(o.raison, o.nom)
  const moyens = o.moyens ?? []
  const phrase = (o.message && o.message.trim()) ? o.message.trim() : phraseDuMur(o.raison, o.nom, moyens.length > 0)
  const boutons = moyens.map(m => `  <a class="joindre" href="${escapeHtml(m.href)}">${m.emoji} ${escapeHtml(m.libelle)}</a>`).join("\n")
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(titre)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:#080808;color:#F5F0E8;font-family:'DM Sans',Arial,sans-serif;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#0F0E0B;border:1px solid rgba(${teinte},0.3);border-radius:20px;padding:40px 32px;max-width:400px;width:100%;text-align:center}
.icon{font-size:48px;margin-bottom:16px}
.badge{display:inline-flex;align-items:center;gap:6px;background:rgba(${teinte},0.1);border:1px solid rgba(${teinte},0.25);border-radius:20px;padding:4px 14px;font-size:12px;color:rgb(${teinte});font-weight:600;margin-bottom:20px}
h1{font-size:22px;font-weight:700;margin-bottom:10px;color:#F5F0E8}
p{font-size:15px;line-height:1.7;color:#BDB6A8;margin-bottom:24px}
.joindre{display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;margin-bottom:10px;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.35);border-radius:12px;color:#E6C766;text-decoration:none;font-size:16px;font-weight:700}
.pied{margin-top:22px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08)}
.link{display:inline-flex;align-items:center;min-height:32px;color:#9A927F;text-decoration:none;font-size:12px}
</style>
</head>
<body>
<div class="card">
  <div class="icon">${EMOJI_DU_MUR[o.raison]}</div>
  <div class="badge">${ETIQUETTE_DU_MUR[o.raison]}</div>
  <h1>${escapeHtml(titre)}</h1>
  <p>${escapeHtml(phrase)}</p>
${boutons}
  <div class="pied"><a class="link" href="${o.appUrl}">QR Code créé avec QRowg</a></div>
</div>
</body></html>`
}

function murResponse(o: Parameters<typeof murHtml>[0], status: number): NextResponse {
  return new NextResponse(murHtml(o), {
    status, headers: { "Content-Type": "text/html;charset=utf-8", "Cache-Control": "no-store, must-revalidate" },
  })
}


// Page de saisie du mot de passe (sécurité du lien, Pro+). Formulaire POST vers la
// même URL : le mot de passe ne passe plus dans l'adresse (historique du
// navigateur, journaux du serveur). `etat` : "" | "wrong" | "trop" (trop d'essais).
function passwordPromptHtml(appUrl: string, etat: "" | "wrong" | "trop"): string {
  const wrong = etat === "wrong"
  const trop = etat === "trop"
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lien protégé</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:#080808;color:#F5F0E8;font-family:'DM Sans',Arial,sans-serif;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#0F0E0B;border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:40px 32px;max-width:400px;width:100%;text-align:center}
.icon{font-size:48px;margin-bottom:16px}
.badge{display:inline-flex;align-items:center;gap:6px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.25);border-radius:20px;padding:4px 14px;font-size:12px;color:#C9A84C;font-weight:600;margin-bottom:20px}
h1{font-size:22px;font-weight:700;margin-bottom:10px}
p{font-size:14px;line-height:1.6;color:#8A8478;margin-bottom:22px}
input{width:100%;height:50px;background:#0A0A0A;border:1px solid rgba(255,255,255,0.14);border-radius:12px;color:#F5F0E8;font-size:16px;padding:0 15px;outline:none;margin-bottom:12px}
input:focus{border-color:#C9A84C}
button{width:100%;height:50px;border:none;border-radius:12px;background:#C9A84C;color:#080808;font-size:15px;font-weight:700;cursor:pointer}
.err{color:#FF6B6B;font-size:13px;margin-bottom:14px}
</style>
</head>
<body>
<div class="card">
  <div class="icon">🔒</div>
  <div class="badge">Lien protégé</div>
  <h1>Mot de passe requis</h1>
  <p>Ce lien est protégé. Saisissez le mot de passe pour continuer.</p>
  ${wrong ? '<p class="err">Mot de passe incorrect. Réessayez.</p>' : ""}
  ${trop ? '<p class="err">Trop d’essais. Patientez quelques minutes avant de réessayer.</p>' : ""}
  <form method="post" autocomplete="off">
    <input type="password" name="pw" placeholder="Mot de passe" autofocus aria-label="Mot de passe" />
    <button type="submit">Déverrouiller</button>
  </form>
</div>
</body></html>`
}

/**
 * Page de RELAIS après un déverrouillage par mot de passe.
 *
 * Pourquoi elle existe. Le site envoie l'en-tête
 *   Content-Security-Policy: … form-action 'self' …
 * qui interdit à un FORMULAIRE d'envoyer l'internaute ailleurs que sur le site.
 * WebKit (donc Safari, donc tout iPhone) et Chrome appliquent cette règle à
 * TOUTE la chaîne de redirections qui suit l'envoi du formulaire — pas seulement
 * à la première étape.
 *
 * Or le formulaire du mot de passe répondait par une redirection 302 vers la
 * destination du QR, qui est par nature un autre site. Le navigateur annulait
 * donc la navigation, en silence : pas d'erreur, pas de page, rien. Le bon mot
 * de passe donnait exactement le même résultat visible qu'un mauvais.
 * Neuf redirections 302 dans les journaux, aucune suivie.
 *
 * Une navigation lancée par la PAGE (et non par l'envoi du formulaire) n'est pas
 * concernée par `form-action`. On rend donc une page du site, qui part d'elle-même
 * vers la destination — avec un bouton visible si le renvoi automatique ne se fait
 * pas (c'est le cas des liens `tel:` et `mailto:` sur certains téléphones).
 */
function relaisHtml(dest: string, appUrl: string): string {
  const url = escapeHtml(dest)
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0;url=${url}">
<title>Redirection…</title>
<style>*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:#080808;color:#F5F0E8;font-family:'DM Sans',Arial,sans-serif;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#0F0E0B;border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:36px 30px;max-width:400px;width:100%;text-align:center}
.icon{font-size:44px;margin-bottom:14px}
h1{font-size:20px;font-weight:700;margin-bottom:10px}
p{font-size:14px;line-height:1.6;color:#8A8478;margin-bottom:20px;word-break:break-all}
a.btn{display:block;height:50px;line-height:50px;border-radius:12px;background:#C9A84C;color:#080808;font-size:15px;font-weight:700;text-decoration:none}
</style></head>
<body><div class="card">
  <div class="icon">🔓</div>
  <h1>Lien déverrouillé</h1>
  <p>Redirection en cours…</p>
  <a class="btn" href="${url}">Continuer →</a>
</div></body></html>`
}

// Page de contenu pour un QR instantané DYNAMIQUE non-redirigeable (texte / Wi-Fi / contact).
// Le QR encode /q/<code> → cette page affiche le contenu (ne fonctionne donc plus hors ligne, mais
// devient expirable). Contenu échappé (anti-XSS).
function instantContentHtml(kind: string, content: string, appUrl: string): string {
  let title = "QR Code", inner = ""
  if (kind === "text") {
    title = "Note"
    inner = `<p class="txt">${escapeHtml(content)}</p>`
  } else if (kind === "wifi") {
    title = "Réseau Wi-Fi"
    const g = (k: string) => { const m = content.match(new RegExp(k + ":((?:\\\\.|[^;])*)")); return m ? m[1].replace(/\\(.)/g, "$1") : "" }
    const ssid = g("S"), pass = g("P"), type = g("T") || "WPA"
    inner = `<div class="rows">
      <div class="row"><span class="k">Réseau</span><b>${escapeHtml(ssid)}</b></div>
      <div class="row"><span class="k">Mot de passe</span><b>${escapeHtml(pass)}</b></div>
      <div class="row"><span class="k">Sécurité</span><b>${escapeHtml(type)}</b></div>
    </div><p class="hint">Connectez-vous à ce réseau avec ces identifiants.</p>`
  } else if (kind === "contact") {
    title = "Contact"
    const href = `data:text/vcard;charset=utf-8,${encodeURIComponent(content)}`
    inner = `<a class="btn" href="${href}" download="contact.vcf">📇 Ajouter le contact</a><pre class="pre">${escapeHtml(content)}</pre>`
  }
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{min-height:100vh;background:#080808;color:#F5F0E8;font-family:'DM Sans',Arial,sans-serif;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#0F0E0B;border:1px solid rgba(201,168,76,0.25);border-radius:20px;padding:32px 26px;max-width:420px;width:100%;text-align:center}
h1{font-size:20px;font-weight:700;margin-bottom:18px}.txt{font-size:16px;line-height:1.6;white-space:pre-wrap;word-break:break-word;color:#E8E2D6}
.rows{display:flex;flex-direction:column;gap:10px;text-align:left}.row{display:flex;justify-content:space-between;gap:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 14px}.k{color:#8A8478;font-size:13px}b{font-size:15px;word-break:break-all}
.hint{color:#8A8478;font-size:12px;margin-top:14px}.btn{display:inline-block;background:#C9A84C;color:#080808;font-weight:700;border-radius:12px;padding:13px 20px;text-decoration:none;font-size:15px;margin-bottom:16px}
.pre{text-align:left;background:#0A0A0A;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;font-size:11px;color:#8A8478;overflow:auto;white-space:pre-wrap;word-break:break-all}
.link{display:block;color:#8A8478;text-decoration:none;font-size:12px;margin-top:18px}</style></head>
<body><div class="card"><h1>${title}</h1>${inner}<a class="link" href="${appUrl}">Créé avec QRowg →</a></div></body></html>`
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  return resoudre(req, ctx, null)
}

// Le mot de passe d'un lien protégé arrive par POST (jamais dans l'URL).
export async function POST(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  let pw = ""
  try {
    const form = await req.formData()
    pw = String(form.get("pw") ?? "")
  } catch { pw = "" }
  return resoudre(req, ctx, pw)
}

// Tentatives de mot de passe par code et par adresse : 5 par quart d'heure.
const ESSAIS_PW_MAX = 5
const ESSAIS_PW_FENETRE_MS = 15 * 60_000

async function resoudre(req: NextRequest, { params }: { params: Promise<{ code: string }> }, pwFourni: string | null) {
  const { code } = await params
  if (!code) return redirectNoStore(new URL("/", req.url))

  const supabase = createAdminClient()
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "https://qrowg.com"

  try {
    // ── L'écran d'échec, regardable ───────────────────────────────────────
    // Ce mur est le seul écran du produit qu'aucun écran d'administration ne
    // montre : pour le voir, il faut casser un QR. `?mur=<raison>` le rend avec
    // un commerce d'exemple, uniquement quand le harnais est autorisé (jamais en
    // production) — un écran qu'on ne peut pas regarder est un écran qui dérive.
    const murDemande = req.nextUrl.searchParams.get("mur")
    if (murDemande && harnessAutorise()) {
      return murResponse({
        raison: (["introuvable", "expire", "en_pause", "brouillon", "erreur"] as RaisonDuMur[])
          .includes(murDemande as RaisonDuMur) ? (murDemande as RaisonDuMur) : "introuvable",
        nom: "Le Comptoir",
        moyens: moyensDeJoindre([
          { type: "call_button", content: { phone: "01 23 45 67 89" } },
          { type: "whatsapp_button", content: { phone: "+33612345678" } },
          { type: "directions_button", content: { address: "12 rue des Lilas, Paris" } },
        ]),
        appUrl,
      }, 200)
    }

    // select("*") volontaire : robuste si des colonnes optionnelles (status,
    // dest_override, pause_message, expires_at — migrations 012/013) ne sont pas
    // appliquées en prod. Un select explicite d'une colonne absente ferait échouer
    // la requête -> data null -> redirection à tort vers l'accueil pour TOUS les QR.
    const { data: qr, error: qrErr } = await supabase
      .from("qr_codes")
      .select("*, pages(slug, status, title)")
      .eq("short_code", code)
      .maybeSingle()

    if (qrErr) console.error("[qr-redirect] erreur lookup", code, qrErr.message)

    // ── Lien instantané DYNAMIQUE (table `instant_qrs`) : résolu ici via l'admin client (hors RLS).
    // Même logique de statut/expiration que les qr_codes (essai 30 j par lien → status "expired").
    if (!qr) {
      const htmlNoStore = (html: string, status: number) => new NextResponse(html, {
        status, headers: { "Content-Type": "text/html;charset=utf-8", "Cache-Control": "no-store, must-revalidate" },
      })
      const { data: inst } = await supabase
        .from("instant_qrs").select("id, user_id, kind, dynamic, dest_url, status, expires_at, total_scans, password_hash")
        .eq("short_code", code).maybeSingle()
      if (inst && inst.dynamic) {
        const st = inst.status ?? "active"
        if (inst.expires_at && new Date(inst.expires_at) < new Date() && st === "active") {
          supabase.from("instant_qrs").update({ status: "expired" }).eq("id", inst.id).then(() => {}, () => {})
          return htmlNoStore(murHtml({ raison: "expire", appUrl }), 410)
        }
        if (st === "paused") return htmlNoStore(murHtml({ raison: "en_pause", appUrl }), 503)
        if (st === "expired") return htmlNoStore(murHtml({ raison: "expire", appUrl }), 410)

        // Mot de passe (sécurité du lien, Pro+) : exiger le bon pw avant de résoudre/compter le scan.
        // `viaFormulaire` retient qu'on arrive de l'envoi du formulaire : la réponse ne
        // peut alors PAS être une redirection vers un autre site (cf. relaisHtml).
        let viaFormulaire = false
        if (inst.password_hash) {
          const pw = pwFourni ?? ""
          if (pw.length === 0) return htmlNoStore(passwordPromptHtml(appUrl, ""), 401)
          // Anti-force-brute AVANT toute vérification (la comparaison scrypt coûte cher).
          if (pw.length > 128 || !(await rateLimit(`pw:${code}:${ipOf(req)}`, ESSAIS_PW_MAX, ESSAIS_PW_FENETRE_MS))) {
            return htmlNoStore(passwordPromptHtml(appUrl, "trop"), 429)
          }
          if (!verifyLinkPassword(pw, inst.password_hash)) {
            return htmlNoStore(passwordPromptHtml(appUrl, "wrong"), 401)
          }
          viaFormulaire = true
        }

        // Scan best-effort (anti-abus + incrément non bloquant) — pour TOUS les types.
        const instDevice = parseDevice(req.headers.get("user-agent"))
        const instCountry = req.headers.get("x-vercel-ip-country") || null
        const instReferrer = (req.headers.get("referer") || "").slice(0, 300) || null
        const instRobot = estUnRobot(req.headers.get("user-agent"))
        after(() => rateLimit(`scan:${code}:${ipOf(req)}`, 20, 60_000).then((allow) => {
          if (!allow || instRobot) return    // un aperçu de lien n'est pas un scan
          const nowIso = new Date().toISOString()
          supabase.from("instant_qrs").update({ total_scans: (inst.total_scans ?? 0) + 1, last_scan_at: nowIso }).eq("id", inst.id).then(() => {}, () => {})
          // Événement détaillé (stats Pro+) — best-effort, ne bloque jamais la redirection.
          supabase.from("instant_scan_events").insert({
            instant_qr_id: inst.id,
            user_id: inst.user_id,
            scanned_at: nowIso,
            device: instDevice,
            country: instCountry,
            referrer: instReferrer,
          }).then(() => {}, () => {})
        }))

        // Résolution selon le type. Redirigeables : lien (http), appel (tel:), email (mailto:).
        // Non redirigeables (texte/WiFi/contact) : page de contenu (le QR encode /q/<code>).
        const content = String(inst.dest_url || "")
        const kind = String(inst.kind || "link")
        // Après le formulaire du mot de passe : page-relais au lieu d'une redirection,
        // que le navigateur refuserait de suivre (form-action 'self').
        const sortir = (url: string) => viaFormulaire ? htmlNoStore(relaisHtml(url, appUrl), 200) : redirectNoStore(url)
        if (kind === "link" && /^https?:\/\//i.test(content)) return sortir(content)
        if ((kind === "phone" || kind === "call") && /^tel:/i.test(content)) return sortir(content)
        if (kind === "email" && /^mailto:/i.test(content)) return sortir(content)
        if (kind === "text" || kind === "wifi" || kind === "contact") return htmlNoStore(instantContentHtml(kind, content, appUrl), 200)
        if (/^https?:\/\//i.test(content)) return sortir(content) // repli
      }
      return murResponse({ raison: "introuvable", appUrl }, 404)
    }

    const qrStatus = qr.status ?? "active"

    // Quand le scan va échouer, on sait à quel commerce ce code appartient : son
    // titre, et les moyens de le joindre que sa page porte déjà. Lu uniquement
    // sur les branches d'échec — un scan qui réussit ne paie pas cette requête.
    const commerceDuQr = async (): Promise<{ nom: string | null; moyens: MoyenDeJoindre[] }> => {
      const nom = ((qr as any).pages?.title as string | null) ?? null
      if (!qr.page_id) return { nom, moyens: [] }
      try {
        const { data: blocs } = await supabase
          .from("blocks").select("type, content")
          .eq("page_id", qr.page_id).eq("is_visible", true).limit(60)
        return { nom, moyens: moyensDeJoindre(blocs as any) }
      } catch { return { nom, moyens: [] } }
    }

    // ── Vérifier expiration automatique ───────────────────────────────────
    if (qr.expires_at && new Date(qr.expires_at) < new Date() && qrStatus === "active") {
      // Auto-expirer
      supabase.from("qr_codes").update({ status: "expired" }).eq("id", qr.id).then(() => {}, () => {})
      return murResponse({ raison: "expire", ...(await commerceDuQr()), appUrl }, 410)
    }

    // ── Bloquer selon statut ───────────────────────────────────────────────
    switch (qrStatus) {
      case "paused":
        return murResponse({ raison: "en_pause", message: qr.pause_message ?? null, ...(await commerceDuQr()), appUrl }, 503)
      case "archived":
      case "expired":
        return murResponse({ raison: "expire", ...(await commerceDuQr()), appUrl }, 410)
      case "draft":
        // Draft accessible uniquement si paramètre preview (pour le dashboard)
        if (!req.nextUrl.searchParams.has("preview")) {
          return murResponse({ raison: "brouillon", ...(await commerceDuQr()), appUrl }, 404)
        }
        break
    }

    // ── Enregistrer le scan (fire-and-forget) ─────────────────────────────
    const ua     = req.headers.get("user-agent") ?? ""
    const device = detectDevice(ua)

    // ── Enrichissement du scan (géo Vercel + UA + empreinte anonyme RGPD) ──
    // country/city viennent des en-têtes edge de Vercel ; os/browser du User-Agent.
    // ip_hash = SHA-256(ip + ua + sel) : l'IP n'est JAMAIS stockée en clair, mais on
    // peut compter les visiteurs uniques (count distinct ip_hash) côté analytics.
    const rawIp    = ipOf(req)
    const country  = req.headers.get("x-vercel-ip-country") || null
    const cityHdr  = req.headers.get("x-vercel-ip-city")
    const city     = cityHdr ? (() => { try { return decodeURIComponent(cityHdr) } catch { return cityHdr } })() : null
    const referrer = (req.headers.get("referer") || "").slice(0, 300) || null
    const { os, browser } = parseUserAgent(ua)
    const ipHash   = rawIp
      ? createHash("sha256").update(`${rawIp}|${ua}|${process.env.SCAN_IP_SALT ?? "qrowg-scan-v1"}`).digest("hex")
      : null
    // UTM lus MAINTENANT (requête encore vive) — pas dans after() où req est détaché.
    const utmSp = new URL(req.url).searchParams
    const utmSource = (utmSp.get("utm_source")||"").slice(0,80)||null
    const utmCampaign = (utmSp.get("utm_campaign")||"").slice(0,120)||null
    const utmMedium = (utmSp.get("utm_medium")||"").slice(0,80)||null

    // Le comptage (qr_codes.total_scans + last_scan_at, pages.total_views,
    // profiles.total_scans) est fait par le trigger `increment_scan_counters`
    // sur l'INSERT de scan ci-dessous. L'ancien UPDATE manuel etait casse
    // (rpc imbrique comme valeur de colonne -> rejete par Postgres, avale
    // silencieusement) et redondant : retire.
    // Anti-abus best-effort : au-delà de 20 scans/min pour un même code+IP, on
    // n'enregistre plus (évite le gonflage des stats/quotas par bouclage d'un
    // short_code). NON bloquant : la redirection n'attend pas ce check.
    // Un aperçu de lien n'est pas un client. Le produit lisait déjà l'agent —
    // `parseDevice` en tirait « bot » — et enregistrait le scan quand même
    // (relevé du 13 septembre, voir lib/robots.ts). La redirection, elle, se
    // fait toujours : on ne compte pas, on n'empêche rien.
    const robot = estUnRobot(req.headers.get("user-agent"))
    after(() => rateLimit(`scan:${code}:${ipOf(req)}`, 20, 60_000).then((allow) => {
      if (allow && !robot) return supabase.from("scans").insert({
        qr_code_id: qr.id, page_id: qr.page_id, device,
        country, city, os, browser, referrer, ip_hash: ipHash,
        utm_source: utmSource, utm_campaign: utmCampaign, utm_medium: utmMedium,
      }).then(() => {}, () => {})
    }))

    // ── Résolution destination (override ou page) ─────────────────────────
    const override = qr.dest_override as OverrideDest
    if (override) {
      if (override.type === "page") {
        // Type "page" : resolution du slug via la DB (hors helper pur).
        const { data: pg } = await supabase.from("pages").select("slug").eq("id", override.value).maybeSingle()
        if (pg?.slug) return redirectNoStore(`${appUrl}/${pg.slug}?s=${encodeURIComponent(code)}`)
      } else {
        const dest = resolveOverrideDest(override)
        if (dest) return redirectNoStore(dest)
      }
    }

    if (qr.page_id) {
            if ((qr as any).pages?.status && (qr as any).pages.status !== "published" && !req.nextUrl.searchParams.has("preview")) return murResponse({ raison: "brouillon", ...(await commerceDuQr()), appUrl }, 404)
      // Slug déjà joint au lookup initial (pages(slug)) -> pas de 2ᵉ aller-retour DB
      // sur le chemin le plus fréquent. Repli sur une requête si l'embed manque.
      const joinedSlug = (qr as any).pages?.slug as string | undefined
      if (joinedSlug) return redirectNoStore(`${appUrl}/${joinedSlug}?s=${encodeURIComponent(code)}`)
      const { data: pg } = await supabase.from("pages").select("slug").eq("id", qr.page_id).maybeSingle()
      if (pg?.slug) return redirectNoStore(`${appUrl}/${pg.slug}?s=${encodeURIComponent(code)}`)
    }

    return murResponse({ raison: "erreur", appUrl }, 500)
  } catch (e) {
    console.error("[qr-redirect]", e)
    return murResponse({ raison: "erreur", appUrl }, 500)
  }
}

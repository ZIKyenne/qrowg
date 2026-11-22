import { texteDeLEmail } from "@/lib/emailLayout"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { resolveStripeEvent, premiereFoisPourCetAbonnement, evenementEncoreValable, type LigneConnue } from "@/lib/webhookLogic"
import { buildSubscriptionEmail } from "@/lib/subscriptionEmail"
import { emailPaiementRefuse, emailResiliationProgrammee, emailChangementDeFormule, type EmailAbonnement } from "@/lib/emailsAbonnement"
import { EMAIL_FROM } from "@/lib/emailFrom"
import { serverError } from "@/lib/apiError"
import { dynLimit, pageLimit } from "@/lib/plans"
import { planPagesReconcile, phrasePagesApres, colonneMotifAbsente } from "@/lib/pauseDesPages"
import { planDynamicReconcile } from "@/lib/dynamicReconcile"
import { gardesDAbord, colonneGardeAbsente } from "@/lib/gardeAuRetour"
import { PAUSE_QUOTA, phraseApresLaBascule } from "@/lib/pauseDeQuota"
import { emailShell, emailH1, emailButton } from "@/lib/emailLayout"

// Réconcilie les QR modifiables d'un utilisateur avec le sous-quota de son plan :
// promeut les anciens essais en permanents, met en pause les excédents après un
// changement de plan vers le bas, réactive ceux que le quota re-couvre. Best-effort.
// Appelée sur CHAQUE changement de plan : le quota des QR modifiables vient
// désormais du plan principal, il doit bouger avec lui.
async function reconcileDynamicLinks(userId: string, plan: string): Promise<number> {
  // D3 : ce que l'abonné a choisi de garder passe en premier. Sans la colonne
  // (migration pas encore appliquée), l'ordre reste celui d'avant.
  const lire = (cols: string) => supabase
    .from("instant_qrs")
    .select(cols)
    .eq("user_id", userId).eq("dynamic", true)
    .order("created_at", { ascending: true })
  const COLS_LIENS = "id, status, expires_at, paused_reason, label"
  let { data: links, error: errLiens } = await lire(COLS_LIENS + ", keep_on_downgrade")
  if (errLiens && colonneGardeAbsente(errLiens)) ({ data: links } = await lire(COLS_LIENS))
  if (!links?.length) return 0
  const ops = planDynamicReconcile(gardesDAbord(links as any), dynLimit(plan), Date.now())
  for (const op of ops) {
    await supabase.from("instant_qrs").update(op.patch).eq("id", op.id)
  }
  // Combien de QR IMPRIMÉS viennent de s'éteindre. Le produit le savait déjà —
  // il l'écrivait en base sous `paused_reason: "quota"` — et ne le disait à
  // personne (lot v82, lib/pauseDeQuota.ts).
  return ops.filter(o => (o.patch as any)?.paused_reason === PAUSE_QUOTA).length
}

// Même réconciliation pour les QR DE PAGE (audit A1, décision du 14 novembre) :
// au-delà du quota du plan, les plus récents passent en pause motif « quota » ;
// une remontée de plan les rallume. Renvoie le nombre de QR éteints.
// Une écriture refusée est remontée par `ecrire` → 500 → Stripe rejoue.
async function reconcilePageQrs(
  userId: string, plan: string,
  ecrire: (quoi: string, e: PromiseLike<{ error: { message: string } | null }>) => Promise<boolean>,
): Promise<number> {
  const lire = (cols: string) => supabase
    .from("qr_codes").select(cols)
    .eq("user_id", userId).order("created_at", { ascending: true })
  let { data: qrs, error } = await lire("id, status, paused_reason, keep_on_downgrade")
  // D3 : sans la colonne du choix, on relit comme avant (l'ordre d'origine) ;
  // l'erreur de cette seconde lecture suit le traitement habituel ci-dessous.
  if (error && colonneGardeAbsente(error)) ({ data: qrs, error } = await lire("id, status, paused_reason"))
  // Migration pas encore appliquée : on ne réconcilie pas, et on ne fait pas
  // échouer le webhook pour autant (Stripe rejouerait sans fin).
  if (error && colonneMotifAbsente(error)) { console.warn("[stripe webhook] qr_codes.paused_reason absente : pages non réconciliées"); return 0 }
  if (error) { await ecrire("qr_codes.lecture", Promise.resolve({ error })); return 0 }
  const ops = planPagesReconcile(gardesDAbord((qrs ?? []) as any), pageLimit(plan))
  for (const op of ops) {
    await ecrire("qr_codes.quota", supabase.from("qr_codes").update({ ...op.patch, updated_at: new Date().toISOString() }).eq("id", op.id))
  }
  return ops.filter(o => o.patch.status === "paused").length
}

async function prevenirPagesCoupees(userId: string, nb: number, plan: string) {
  const phrase = phrasePagesApres(nb, pageLimit(plan))
  if (!phrase) return
  try {
    if (!process.env.RESEND_API_KEY) return
    const { data: prof } = await supabase.from("profiles").select("email").eq("id", userId).single()
    if (!prof?.email) return
    const resend = new Resend(process.env.RESEND_API_KEY)
    const html = emailShell({
      preheader: phrase,
      content: `${emailH1(nb > 1 ? "Des pages ont été mises en pause" : "Une page a été mise en pause")}
        <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#F5F0E8;line-height:1.6;">${phrase}</p>
        <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#8A8478;line-height:1.6;">Rien n'est supprimé. Reprendre un plan qui les couvre les remet en ligne automatiquement.</p>
        ${emailButton("Choisir mes pages actives →", "https://qrowg.com/dashboard/qr-codes")}`,
    })
    await resend.emails.send({
      from: EMAIL_FROM, to: prof.email,
      subject: nb > 1 ? `${nb} de vos pages sont en pause` : "Une de vos pages est en pause",
      html, text: texteDeLEmail(html),
    })
  } catch (e) {
    console.warn("[stripe webhook] email pages en pause non envoye:", (e as any)?.message)
  }
}

/**
 * Prévenir le commerçant que des supports déjà imprimés ne mènent plus nulle
 * part. Best-effort, comme les autres e-mails du webhook : ne bloque jamais.
 */
async function prevenirQrCoupes(userId: string, nb: number, plan: string) {
  const phrase = phraseApresLaBascule(nb, dynLimit(plan))
  if (!phrase) return
  try {
    if (!process.env.RESEND_API_KEY) return
    const { data: prof } = await supabase.from("profiles").select("email").eq("id", userId).single()
    if (!prof?.email) return
    const resend = new Resend(process.env.RESEND_API_KEY)
    const html = emailShell({
        preheader: phrase,
        content: `${emailH1("Des QR imprimés se sont arrêtés")}
          <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#F5F0E8;line-height:1.6;">${phrase}</p>
          <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#8A8478;line-height:1.6;">Les codes déjà collés ou distribués restent valables : reprendre un plan qui les couvre les rallume, sans rien réimprimer.</p>
          ${emailButton("Voir mes QR →", "https://qrowg.com/dashboard/qr-link")}`,
    })
    await resend.emails.send({
      from: EMAIL_FROM,
      to: prof.email,
      subject: nb > 1 ? `${nb} de vos QR imprimés ne fonctionnent plus` : "Un de vos QR imprimés ne fonctionne plus",
      html,
      text: texteDeLEmail(html),
    })
  } catch (e) {
    console.warn("[stripe webhook] email QR coupes non envoye:", (e as any)?.message)
  }
}

// Les e-mails de la vie de l'abonnement (lib/emailsAbonnement) — best-effort,
// comme les autres : un e-mail raté ne fait jamais échouer le webhook.
async function envoyerAuClient(userId: string, construire: (nom: string | null) => EmailAbonnement | null, quoi: string) {
  try {
    if (!process.env.RESEND_API_KEY) return
    const { data: prof } = await supabase.from("profiles").select("email, full_name").eq("id", userId).single()
    if (!prof?.email) return
    const e = construire(prof.full_name ?? null)
    if (!e) return
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: EMAIL_FROM, to: prof.email, subject: e.subject, html: e.html, text: texteDeLEmail(e.html) })
  } catch (err) {
    console.warn(`[stripe webhook] email ${quoi} non envoye:`, (err as any)?.message)
  }
}

// Email de bienvenue abonnement (essai/achat) — fire-and-forget, n'echoue jamais.
async function sendSubscriptionEmail(userId: string, plan: string, billing?: string | null) {
  try {
    if (!process.env.RESEND_API_KEY) return
    const { data: prof } = await supabase.from("profiles").select("email, full_name").eq("id", userId).single()
    if (!prof?.email) return
    // L'essai de 7 jours n'est ouvert QUE sur le plan Starter (voir stripe/checkout,
    // qui ne pose trial_period_days que pour lui). Annoncer « votre essai gratuit
    // de 7 jours » à tous revenait à écrire à un client Pro qui vient de payer
    // qu'il ne paie pas encore.
    const { subject, html, planConnu } = buildSubscriptionEmail({ name: prof.full_name, plan, billing, trialDays: 0 })
    // Un plan que le code ne connaît pas : l'email reste sobre (voir subscriptionEmail),
    // mais il faut le savoir — c'est le signe d'un tarif renommé chez Stripe.
    if (!planConnu) console.error("[stripe] plan inconnu dans l'email d'abonnement :", plan)
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: EMAIL_FROM, to: prof.email, subject, html, text: texteDeLEmail(html) })
  } catch (e) {
    console.warn("[stripe webhook] email abonnement non envoye:", (e as any)?.message)
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    console.error("Webhook signature error:", e.message)
    // Le message de Stripe décrivait pourquoi la signature ne collait pas ;
    // le renvoyer aide surtout qui essaie d'en fabriquer une (lot v134).
    console.error("[webhooks/stripe]", e?.message)
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 })
  }

  // supabase-js NE LEVE PAS d'exception : une écriture refusée renvoie un objet
  // { error } que personne ne lisait. Le webhook répondait donc « received: true »
  // à Stripe sans avoir rien écrit, et l'événement était perdu pour de bon.
  // Ici chaque écriture est vérifiée ; s'il en rate une, on répond 500 et Stripe
  // rejoue l'événement (il réessaie pendant 3 jours).
  const echecs: string[] = []
  const ecrire = async (quoi: string, ecriture: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await ecriture
    if (error) {
      echecs.push(quoi)
      console.error(`[stripe webhook] ECHEC ECRITURE ${quoi} (${event.type}) :`, error.message)
    }
    return !error
  }

  try {
    // Décision pure (testée : lib/webhookLogic.test.ts), puis application des effets.
    const outcome = resolveStripeEvent(event)

    // La ligne d'abonnement telle qu'elle est AVANT cet événement : c'est la
    // mémoire qui rend les rejeux et le désordre sans effet (voir webhookLogic).
    const ligneAvant = async (userId: string): Promise<LigneConnue> => {
      const { data } = await supabase.from("subscriptions")
        .select("stripe_subscription_id, status").eq("user_id", userId).maybeSingle()
      return data as LigneConnue
    }

    switch (outcome.type) {
      case "checkout_completed": {
        const avant = await ligneAvant(outcome.userId)
        await ecrire("profiles.plan", supabase.from("profiles").update({
          plan: outcome.plan,
          stripe_customer_id: outcome.customerId,
        }).eq("id", outcome.userId))
        // `status` est volontairement ABSENT de cette charge utile. Un upsert ne
        // met a jour que les colonnes qu'on lui donne : a la creation la colonne
        // prend son defaut (`active`, et le client vient bien de payer), et si la
        // ligne existe deja son statut n'est PAS ecrase. Le vrai statut vient des
        // evenements `customer.subscription.*`, qui peuvent arriver AVANT celui-ci
        // — Stripe ne garantit pas l'ordre. Ecrire un statut ici, c'est risquer
        // d'ecraser la verite par une supposition.
        await ecrire("subscriptions.upsert", supabase.from("subscriptions").upsert({
          user_id: outcome.userId,
          stripe_subscription_id: outcome.subscriptionId,
          stripe_price_id: outcome.priceId,
          plan: outcome.plan,
          // Nouvel abonnement à la place d'un ancien (mort) : la ligne garderait
          // sinon le « canceled » du précédent, et `evenementEncoreValable`
          // refuserait tous les événements du nouveau. Si un événement de CET
          // abonnement était déjà passé, la ligne le porterait et on n'écrirait rien ici.
          ...(premiereFoisPourCetAbonnement(avant, outcome.subscriptionId) && avant?.stripe_subscription_id ? { status: "active", cancel_at_period_end: false } : {}),
        }, { onConflict: "user_id" }))
        // Le plan porte aussi le quota de QR modifiables : le faire suivre.
        await reconcileDynamicLinks(outcome.userId, outcome.plan)
        // ...et celui des QR de page : une montée rallume ce que le plan avait mis en pause.
        await reconcilePageQrs(outcome.userId, outcome.plan, ecrire)
        // Email de bienvenue — une fois par abonnement, pas une fois par rejeu.
        if (premiereFoisPourCetAbonnement(avant, outcome.subscriptionId)) {
          await sendSubscriptionEmail(outcome.userId, outcome.plan, outcome.billing)
        }
        break
      }

      case "subscription_updated": {
        const ligne = await ligneAvant(outcome.userId)
        if (!evenementEncoreValable(ligne, outcome.subId, outcome.status)) {
          console.warn("[stripe webhook] evenement perime ignore:", event.id, outcome.subId, outcome.status)
          break
        }
        if (!outcome.plan) console.warn("[stripe webhook] price non mappe, plan inchange")
        // Ce qui était vrai AVANT cet événement : un e-mail ne part qu'au CHANGEMENT
        // (un rejeu trouve l'état déjà écrit et n'envoie rien).
        const { data: avantProfil } = await supabase.from("profiles").select("plan").eq("id", outcome.userId).maybeSingle()
        const { data: avantAbo } = await supabase.from("subscriptions").select("cancel_at_period_end").eq("user_id", outcome.userId).maybeSingle()
        const planAvant = (avantProfil as { plan?: string } | null)?.plan ?? null
        const resiliationAvant = !!(avantAbo as { cancel_at_period_end?: boolean } | null)?.cancel_at_period_end
        const memeAbonnement = ligne?.stripe_subscription_id === outcome.subId
        if (outcome.plan) await ecrire("profiles.plan", supabase.from("profiles").update({ plan: outcome.plan }).eq("id", outcome.userId))
        // UPSERT et non UPDATE : si l'événement `checkout.session.completed` a été
        // manqué (rejeu, panne, ordre d'arrivée), un UPDATE ne touchait aucune ligne
        // et l'abonnement n'existait nulle part. L'upsert répare la ligne manquante.
        await ecrire("subscriptions.upsert", supabase.from("subscriptions").upsert({
          user_id: outcome.userId,
          stripe_subscription_id: outcome.subId,
          ...(outcome.priceId ? { stripe_price_id: outcome.priceId } : {}),
          ...(outcome.plan ? { plan: outcome.plan } : {}),
          status: outcome.status,
          // Dates ecrites SEULEMENT si Stripe les a fournies. Les convertir a
          // l'aveugle levait « Invalid time value » et faisait repondre 500 :
          // l'annulation n'etait jamais enregistree.
          ...(outcome.periodStart ? { current_period_start: new Date(outcome.periodStart * 1000).toISOString() } : {}),
          ...(outcome.periodEnd ? { current_period_end: new Date(outcome.periodEnd * 1000).toISOString() } : {}),
          cancel_at_period_end: outcome.cancelAtEnd,
        }, { onConflict: "user_id" }))
        if (outcome.plan) {
          const coupes = await reconcileDynamicLinks(outcome.userId, outcome.plan)
          await prevenirQrCoupes(outcome.userId, coupes, outcome.plan)
          await prevenirPagesCoupees(outcome.userId, await reconcilePageQrs(outcome.userId, outcome.plan, ecrire), outcome.plan)
        }
        // Changement de formule (portail Stripe) : dit, avec ce qui change vraiment.
        // Un abonnement neuf a déjà son e-mail de bienvenue (checkout_completed).
        if (memeAbonnement && outcome.plan && planAvant && planAvant !== "free" && planAvant !== outcome.plan && (outcome.status === "active" || outcome.status === "trialing")) {
          const avant = planAvant, apres = outcome.plan
          await envoyerAuClient(outcome.userId, nom => emailChangementDeFormule({ nom, avant, apres }), "changement de formule")
        }
        // Résiliation programmée : la date, et comment revenir dessus — avant la coupure, pas après.
        if (memeAbonnement && outcome.cancelAtEnd && !resiliationAvant) {
          const plan = outcome.plan ?? planAvant ?? "free"
          const finIso = outcome.periodEnd ? new Date(outcome.periodEnd * 1000).toISOString() : null
          await envoyerAuClient(outcome.userId, nom => emailResiliationProgrammee({ nom, plan, finIso }), "résiliation programmée")
        }
        break
      }

      case "subscription_deleted":
        // L'annulation d'un ANCIEN abonnement ne rétrograde pas le compte qui en
        // a pris un nouveau depuis.
        if (!evenementEncoreValable(await ligneAvant(outcome.userId), outcome.subId, "deleted")) {
          console.warn("[stripe webhook] annulation d'un ancien abonnement ignoree:", event.id, outcome.subId)
          break
        }
        await ecrire("profiles.plan", supabase.from("profiles").update({ plan: "free" }).eq("id", outcome.userId))
        await ecrire("subscriptions.annulation", supabase.from("subscriptions").update({
          plan: "free",
          status: "canceled",
          canceled_at: new Date().toISOString(),
        }).eq("stripe_subscription_id", outcome.subId))
        // Retour au gratuit : les QR modifiables au-delà du quota passent en
        // pause — et le commerçant l'apprend, parce que ces QR sont imprimés.
        await prevenirQrCoupes(outcome.userId, await reconcileDynamicLinks(outcome.userId, "free"), "free")
        await prevenirPagesCoupees(outcome.userId, await reconcilePageQrs(outcome.userId, "free", ecrire), "free")
        break

      case "payment_failed": {
        // Stripe retente plusieurs fois : on ne prévient qu'au PREMIER refus.
        const { data: abo } = await supabase.from("subscriptions").select("user_id, plan, status").eq("stripe_subscription_id", outcome.subId).maybeSingle()
        await ecrire("subscriptions.past_due", supabase.from("subscriptions").update({ status: "past_due" }).eq("stripe_subscription_id", outcome.subId))
        const a = abo as { user_id?: string; plan?: string; status?: string } | null
        if (a?.user_id && a.status !== "past_due" && a.status !== "unpaid") {
          const plan = a.plan ?? "pro"
          await envoyerAuClient(a.user_id, nom => emailPaiementRefuse({ nom, plan }), "paiement refusé")
        }
        break
      }

    }
  } catch (e: any) {
    return serverError("stripe/webhook", e)
  }

  if (echecs.length) {
    return NextResponse.json({ error: `ecritures refusees: ${echecs.join(", ")}` }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}

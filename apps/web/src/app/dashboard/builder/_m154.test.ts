import { describe, it } from "vitest"
import { hasPublishableContent } from "./blockEmptyState"
import { BLOCK_DEFS } from "./blockDefs"
const MODELES: Record<string, string> = {
  album_block: "albumBlock:albumBlockViewModel", audio_player: "audioPlayer:audioPlayerViewModel",
  bio: "bio:bioViewModel", concerts: "concerts:concertsViewModel", discography: "discography:discographyViewModel",
  donation: "donation:donationViewModel", download_file: "downloadFile:downloadFileViewModel",
  email_button: "emailButton:emailButtonViewModel", engagements: "engagements:engagementsViewModel",
  event_info: "eventInfo:eventInfoViewModel", event_program: "eventProgram:eventProgramViewModel",
  event_ticketing: "eventTicketing:eventTicketingViewModel", gift_card: "giftCard:giftCardViewModel",
  google_maps_embed: "googleMapsEmbed:googleMapsEmbedViewModel", google_review: "googleReview:googleReviewViewModel",
  lineup: "lineup:lineupViewModel", menu_section: "menuSection:menuSectionViewModel", merch: "merch:merchViewModel",
  on_site_services: "onSiteServices:onSiteServicesViewModel", order_online: "orderOnline:orderOnlineViewModel",
  pdf_viewer: "pdfViewer:pdfViewerViewModel", podcast_links: "podcastLinks:podcastLinksViewModel",
  process_steps: "processSteps:processStepsViewModel", promo_banner: "promoBanner:promoBannerViewModel",
  skills: "skills:skillsViewModel", spotify_embed: "spotifyEmbed:spotifyEmbedViewModel",
  stats_block: "statsBlock:statsBlockViewModel", testimonials: "testimonials:testimonialsViewModel",
  trust_badge: "trustBadge:trustBadgeViewModel", values: "values:valuesViewModel",
  video: "videoBlock:videoBlockViewModel", whatsapp_button: "whatsappButton:whatsappButtonViewModel",
  // sans détecteur aujourd'hui, mais l'adapter éditeur sait déjà dire « invisible »
  heading: "heading:headingViewModel", menu_tabs: "menuTabs:menuTabsViewModel", timeline: "timeline:timelineViewModel",
}
const val = (f: any) => f.type === "url" ? "https://exemple.fr" : f.type === "image" ? "https://exemple.fr/i.png"
  : f.type === "color" ? "#123456" : f.type === "select" ? (f.options?.[1] ?? f.options?.[0] ?? "x")
  : f.type === "date" ? "2026-10-01" : f.type === "datetime" ? "2026-10-01T10:00" : "Essai"
describe("m154", () => { it("copie vs appel", async () => {
  const ecarts: string[] = []; let sondes = 0
  for (const [type, spec] of Object.entries(MODELES)) {
    const [mod, fn] = spec.split(":")
    const m: any = await import(/* @vite-ignore */ `./shared-renderer/models/${mod}`)
    const vm = m[fn]
    if (!vm) { ecarts.push(`${type} : ${fn} introuvable`); continue }
    const champs = ((BLOCK_DEFS as any)[type]?.fields ?? []) as any[]
    for (const c of [{}, ...champs.map(f => ({ [f.key]: val(f) })), Object.fromEntries(champs.map(f => [f.key, val(f)]))]) {
      sondes++
      const copie = hasPublishableContent(type, c)
      const appel = !!vm(c).visible
      if (copie !== appel) ecarts.push(`${type} [${Object.keys(c).join(",").slice(0, 30) || "vide"}] copie=${copie} modèle=${appel}`)
    }
  }
  console.log(`sondes ${sondes} · écarts ${ecarts.length}`)
  const parBloc: Record<string, number> = {}
  for (const e of ecarts) { const b = e.split(" ")[0]; parBloc[b] = (parBloc[b] ?? 0) + 1 }
  console.log(Object.entries(parBloc).map(([b, n]) => `${b}:${n}`).join(" "))
  console.log(ecarts.slice(0, 25).join("\n"))
}) })

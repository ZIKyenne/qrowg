import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { chaine, reseauVedette } from "./models/chaines"
import { EditorInstagramFeed, PublicInstagramFeed } from "./blocks/instagram_feed"
import { EditorTiktokFeed, PublicTiktokFeed } from "./blocks/tiktok_feed"
import { EditorYoutubeChannel, PublicYoutubeChannel } from "./blocks/youtube_channel"
import { EditorTwitchLive, PublicTwitchLive } from "./blocks/twitch_live"
import { EditorDiscordServer, PublicDiscordServer } from "./blocks/discord_server"
import { EditorTelegramChannel, PublicTelegramChannel } from "./blocks/telegram_channel"
import { EditorSocialFeature, PublicSocialFeature } from "./blocks/social_feature"
import { SHARED_RENDERER_BLOCKS } from "./architecture"
import type { EditorRenderCtx, PublicRenderCtx } from "./renderTypes"

// Vague 19 — la famille « chaînes et réseaux » : sept blocs de même forme (un
// nom, quelques lignes, un bouton), donc sept fois la même dérive possible.
//
//   · tiktok_feed dessinait SIX FAUSSES VIGNETTES VIDÉO dans l'aperçu. Il n'y
//     a aucune intégration TikTok : la page ne publie qu'une carte et un
//     bouton. Le commerçant croyait composer un mur de vidéos qui n'existerait
//     jamais — c'est pire que les six cases de la galerie, parce que ça
//     ressemble à du contenu réellement intégré ;
//   · discord_server et telegram_channel dessinaient TOUJOURS leur bouton,
//     libellé par défaut compris, même sans adresse ;
//   · youtube_channel et tiktok_feed faisaient l'inverse : la page publiait un
//     bouton que l'aperçu cachait tant que le libellé n'était pas saisi ;
//   · cinq d'entre eux se publiaient avec un simple nom. Depuis que le rendu ne
//     publie plus de bouton sans destination, cela donnait une carte inerte.

const sombre: any = { bg: "#080808", fontDisplay: "Fraunces", fontBody: "DM Sans", accent: "#39FF8F", primary: "#C9A84C", text: "#F5F0E8", muted: "#A8A190" }
const clair: any = { ...sombre, bg: "#FFFFFF", text: "#1A1A1A", muted: "#6B7280" }
const eCtx = (theme: any = sombre): EditorRenderCtx =>
  ({ theme, primary: theme.primary, text: theme.text, muted: theme.muted, accent: theme.accent, surfaceStyle: {}, canEdit: false, edit: () => () => {} })
const pCtx = (theme: any = sombre): PublicRenderCtx =>
  ({ theme, G: theme.primary, TEXT: theme.text, MUTED: theme.muted, FONT_D: "Fraunces, serif", FONT_B: "DM Sans, sans-serif", pageId: "p1", blockId: "b1", trackClick: () => {} })
const H = (el: any) => renderToStaticMarkup(el)

const FAMILLE = [
  ["instagram_feed", EditorInstagramFeed, PublicInstagramFeed, { username: "@atelier", cta_url: "https://instagram.com/atelier" }],
  ["tiktok_feed", EditorTiktokFeed, PublicTiktokFeed, { username: "@atelier", cta_url: "https://tiktok.com/@atelier" }],
  ["youtube_channel", EditorYoutubeChannel, PublicYoutubeChannel, { channel_name: "Atelier Nord", subscribers: "1 200 abonnés", cta_url: "https://youtube.com/@atelier" }],
  ["twitch_live", EditorTwitchLive, PublicTwitchLive, { username: "atelier", game: "Menuiserie", status: "live", viewers: "42", cta_url: "https://twitch.tv/atelier" }],
  ["discord_server", EditorDiscordServer, PublicDiscordServer, { server_name: "Atelier Nord", members: "300", description: "Entraide bois", cta_url: "https://discord.gg/x" }],
  ["telegram_channel", EditorTelegramChannel, PublicTelegramChannel, { channel_name: "Atelier Nord", members: "120", cta_url: "https://t.me/atelier" }],
  ["social_feature", EditorSocialFeature, PublicSocialFeature, { network: "instagram", url: "atelier.nord", title: "Suivez l'atelier", count: "2 400 abonnés" }],
] as const

describe("vague 19 - sans destination, aucun de ces blocs ne publie", () => {
  for (const [type, Ed, Pub] of FAMILLE) {
    it(type + " : public null ; l'editeur invite", () => {
      expect(Pub({ content: {}, ctx: pCtx() } as any)).toBeNull()
      const h = H(<Ed content={{}} ctx={eCtx()} />)
      expect(h).toContain('role="note"')
      expect(h).toContain("Invisible en ligne")
    })
  }

  it("un nom seul ne suffit plus : le lien EST le bloc", () => {
    // Cinq d'entre eux se publiaient avec un simple nom et, depuis que le rendu
    // ne publie plus de bouton mort, laissaient une carte inerte.
    expect(chaine({ server_name: "Atelier" }, { cleNom: "server_name", labelParDefaut: "Rejoindre" })).toBeNull()
    expect(PublicDiscordServer({ content: { server_name: "Atelier" }, ctx: pCtx() } as any)).toBeNull()
    expect(PublicSocialFeature({ content: { network: "instagram", title: "Suivez-moi" }, ctx: pCtx() } as any)).toBeNull()
  })

  it("une adresse qui ne mene nulle part compte comme absente", () => {
    for (const mauvais of ["#", "  ", "javascript:alert(1)"]) {
      expect(chaine({ cta_url: mauvais }, { cleNom: "username", labelParDefaut: "X" }), mauvais).toBeNull()
    }
  })
})

describe("vague 19 - tiktok_feed : les six fausses vignettes ont disparu", () => {
  const c = { username: "@atelier", cta_url: "https://tiktok.com/@atelier" }
  it("l'apercu ne dessine plus de mur de videos", () => {
    const h = H(<EditorTiktokFeed content={c} ctx={eCtx()} />)
    expect((h.match(/🎵/g) ?? []).length, "il en dessinait six, plus une").toBe(1)
    expect(h).not.toContain("9/16")
  })
  it("et il montre exactement ce que la page publie", () => {
    const textes = (x: string) => x.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean)
    expect(textes(H(<EditorTiktokFeed content={c} ctx={eCtx()} />))).toEqual(textes(H(<PublicTiktokFeed content={c} ctx={pCtx()} />)))
  })
})

describe("vague 19 - le libelle du bouton est le meme des deux cotes", () => {
  it("le libelle par defaut apparait aussi dans l'apercu", () => {
    // La page publiait « S'abonner » ; l'apercu ne montrait rien tant que le
    // commercant n'avait pas saisi le libelle a la main.
    const c = { channel_name: "Atelier", cta_url: "https://youtube.com/@a" }
    for (const h of [H(<EditorYoutubeChannel content={c} ctx={eCtx()} />), H(<PublicYoutubeChannel content={c} ctx={pCtx()} />)]) {
      expect(h).toContain("abonner")
    }
  })
  it("un libelle saisi remplace le defaut, des deux cotes", () => {
    const c = { channel_name: "Atelier", cta_label: "Voir mes vidéos", cta_url: "https://youtube.com/@a" }
    for (const h of [H(<EditorYoutubeChannel content={c} ctx={eCtx()} />), H(<PublicYoutubeChannel content={c} ctx={pCtx()} />)]) {
      expect(h).toContain("Voir mes vidéos")
      expect(h).not.toContain("abonner")
    }
  })
})

describe("vague 19 - twitch : le direct ne s'annonce que s'il a lieu", () => {
  it("le badge et les spectateurs n'apparaissent qu'en direct", () => {
    const horsDirect = chaine({ username: "a", viewers: "42", game: "Bois", cta_url: "https://twitch.tv/a" }, { cleNom: "username", labelParDefaut: "X", lignes: [{ champ: "game", icone: "🎯" }, { champ: "viewers", siEnDirect: true }] })!
    expect(horsDirect.enDirect).toBe(false)
    expect(horsDirect.lignes.map(l => l.texte)).toEqual(["Bois"])
    expect(H(<PublicTwitchLive content={{ username: "a", viewers: "42", cta_url: "https://twitch.tv/a" }} ctx={pCtx()} />)).not.toContain("LIVE")
    expect(H(<PublicTwitchLive content={{ username: "a", viewers: "42", status: "live", cta_url: "https://twitch.tv/a" }} ctx={pCtx()} />)).toContain("LIVE")
  })
})

describe("vague 19 - social_feature : le pseudo devient une vraie adresse", () => {
  it("un pseudo suffit, le modele construit le lien du reseau", () => {
    expect(reseauVedette({ network: "instagram", url: "atelier.nord" })!.cta.href).toContain("instagram.com/atelier.nord")
    expect(reseauVedette({ network: "instagram" })).toBeNull()
  })
  it("un reseau inconnu ne casse rien", () => {
    const r = reseauVedette({ network: "quelquechose", url: "https://x.fr" })!
    expect(r.icone).toBe("🔗")
    expect(r.libelleReseau).toBe("Réseau")
  })
  it("la banniere passe par le meme chemin dimensionne des deux cotes", () => {
    const c = { network: "instagram", url: "atelier.nord", image: "https://abcdefgh.supabase.co/storage/v1/object/public/b/1.jpg" }
    for (const h of [H(<EditorSocialFeature content={c} ctx={eCtx()} />), H(<PublicSocialFeature content={c} ctx={pCtx()} />)]) {
      expect(h).toContain("/_next/image")
    }
  })
})

describe("vague 19 - l'apercu montre ce qui sera publie", () => {
  const textes = (h: string) => h.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean)
  for (const [type, Ed, Pub, contenu] of FAMILLE) {
    it(type + " : memes textes des deux cotes", () => {
      expect(textes(H(<Ed content={contenu} ctx={eCtx()} />))).toEqual(textes(H(<Pub content={contenu} ctx={pCtx()} /> as any)))
    })
  }
})

describe("vague 19 - liens reels en ligne, coquilles inertes dans l'apercu", () => {
  for (const [type, Ed, Pub, contenu] of FAMILLE) {
    it(type + " : vrai lien public, rien de navigable dans le canvas", () => {
      expect(H(<Pub content={contenu} ctx={pCtx()} /> as any)).toContain('href="http')
      expect(H(<Ed content={contenu} ctx={eCtx()} />)).not.toContain("href=")
    })
  }
})

describe("vague 19 - les surfaces suivent le theme", () => {
  it("la carte Twitch hors direct reste visible sur un theme clair", () => {
    const c = { username: "a", cta_url: "https://twitch.tv/a" }
    expect(H(<PublicTwitchLive content={c} ctx={pCtx(clair)} />)).not.toMatch(/rgba\(255,255,255/)
    expect(H(<PublicTwitchLive content={c} ctx={pCtx()} />)).toMatch(/rgba\(255,255,255/)
  })
})

describe("vague 19 - activation", () => {
  it("les sept blocs sont dans le drapeau de migration", () => {
    for (const [t] of FAMILLE) expect(SHARED_RENDERER_BLOCKS.has(t)).toBe(true)
  })
})

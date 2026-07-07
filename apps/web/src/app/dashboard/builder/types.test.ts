import { describe, it, expect } from "vitest"
import {
  bannerImageStyle, bannerOverlayLayers, availabilityStatus, profileBadgeStyle,
  bannerTitleStyle, bannerFrame, bannerHeight, bannerBackgroundStyle,
  normalizePhoneDigits, waLink, telLink, directionsLink, ctaButtonStyle, stickyActionHref, embedVideoUrl,
  SOCIAL_NETWORKS, SOCIAL_NETWORKS_MAP, productBadgeStyle,
  parsePrice, priceDiscount, countdownParts, stockStatus, paymentLink, paymentBrand, starRow,
  parseHourRanges, fmtMinutes, openStatus,
  vcardEscape, splitName, buildVCard, mapEmbedUrl, shareLinks,
} from "./types"

describe("bannerImageStyle", () => {
  it("défaut : cover / center / pas de zoom", () => {
    const s = bannerImageStyle({})
    expect(s.objectFit).toBe("cover")
    expect(s.objectPosition).toBe("center")
    expect(s.transform).toBeUndefined()
  })
  it("position précise + zoom", () => {
    const s = bannerImageStyle({ img_pos_x: "20", img_pos_y: "80", img_zoom: "2" })
    expect(s.objectPosition).toBe("20% 80%")
    expect(s.transform).toBe("scale(2)")
  })
  it("focus bas -> center bottom", () => {
    expect(bannerImageStyle({ img_focus: "bottom" }).objectPosition).toBe("center bottom")
  })
  it("filtres composés", () => {
    const f = bannerImageStyle({ img_brightness: "120", img_grayscale: "100", img_saturate: "0" }).filter as string
    expect(f).toContain("brightness(120%)")
    expect(f).toContain("grayscale(100%)")
    expect(f).toContain("saturate(0%)")
  })
  it("valeurs neutres -> pas de filter", () => {
    expect(bannerImageStyle({ img_brightness: "100" }).filter).toBeUndefined()
  })
})

describe("bannerOverlayLayers", () => {
  it("aucun overlay par défaut", () => {
    expect(bannerOverlayLayers({}, "#C9A84C")).toHaveLength(0)
  })
  it("verre -> backdropFilter", () => {
    const l = bannerOverlayLayers({ fx_overlay: "glass" }, "#C9A84C")
    expect(l).toHaveLength(1)
    expect(typeof l[0].style.backdropFilter).toBe("string")
  })
  it("aurora -> classe animée", () => {
    expect(bannerOverlayLayers({ fx_overlay: "aurora" }, "#C9A84C")[0].className).toBe("qfb-aurora-layer")
  })
  it("voile bas -> dégradé", () => {
    expect(String(bannerOverlayLayers({ overlay_gradient: "bottom" }, "#C9A84C")[0].style.background)).toContain("linear-gradient")
  })
  it("teinte + mode de fusion + opacité", () => {
    const l = bannerOverlayLayers({ overlay_color: "#ff0000", overlay_opacity: "0.5", blend_mode: "screen" }, "#C9A84C")
    expect(l[0].style.mixBlendMode).toBe("screen")
    expect(l[0].style.opacity).toBe(0.5)
  })
  it("teinte opacité 0 -> ignorée", () => {
    expect(bannerOverlayLayers({ overlay_color: "#ff0000", overlay_opacity: "0" }, "#C9A84C")).toHaveLength(0)
  })
})

describe("availabilityStatus", () => {
  it("statut connu : label + couleur + fond alpha", () => {
    const a = availabilityStatus("tour")
    expect(a.label).toBe("En tournée")
    expect(a.color).toBe("#9146FF")
    expect(a.bg).toBe("#9146FF14")
  })
  it("couleur de pastille personnalisée valide", () => {
    expect(availabilityStatus("available", "#123456").color).toBe("#123456")
  })
  it("statut inconnu -> fallback Disponible", () => {
    expect(availabilityStatus("inconnu_xyz").label).toBe("Disponible")
  })
  it("couleur invalide -> couleur du statut", () => {
    expect(availabilityStatus("available", "pasunehex").color).toBe("#39FF8F")
  })
})

describe("profileBadgeStyle", () => {
  it("Vérifié -> bleu + ✓", () => {
    const b = profileBadgeStyle("Vérifié", "#C9A84C")
    expect(b.color).toBe("#38BDF8")
    expect(b.icon).toBe("✓")
  })
  it("Premium -> or + 👑", () => {
    expect(profileBadgeStyle("Premium", "#C9A84C").icon).toBe("👑")
  })
  it("inconnu -> accent, pas d'icône", () => {
    const b = profileBadgeStyle("MonTrucPerso", "#C9A84C")
    expect(b.color).toBe("#C9A84C")
    expect(b.icon).toBe("")
  })
  it("libellé commençant par emoji -> pas de double icône", () => {
    expect(profileBadgeStyle("🔥 Populaire", "#C9A84C").icon).toBe("")
  })
})

describe("bannerTitleStyle", () => {
  it("défaut public 24/700", () => {
    const t = bannerTitleStyle({}, "public", "#fff", "Serif")
    expect(t.fontSize).toBe(24)
    expect(t.fontWeight).toBe(700)
    expect(t.fontFamily).toBe("Serif")
  })
  it("taille/graisse/glow/majuscules", () => {
    const t = bannerTitleStyle({ title_size: "32", title_weight: "800", title_effect: "glow", title_transform: "uppercase" }, "public", "#39FF8F", "Serif")
    expect(t.fontSize).toBe(32)
    expect(t.fontWeight).toBe(800)
    expect(String(t.textShadow)).toContain("#39FF8F")
    expect(t.textTransform).toBe("uppercase")
  })
  it("police mono", () => {
    expect(String(bannerTitleStyle({ title_font: "mono" }, "editor", "#fff", "Serif").fontFamily)).toContain("monospace")
  })
})

describe("bannerFrame", () => {
  it("ombre glow -> boxShadow accent", () => {
    const f = bannerFrame({ block_shadow: "glow" }, "#C9A84C", 12)
    expect(String(f.boxShadow)).toContain("#C9A84C")
  })
  it("bordure dégradée -> calque + rayon", () => {
    const f = bannerFrame({ block_border: "gradient", border_color: "#ff0000" }, "#C9A84C", 16)
    expect(f.borderLayer).toBeTruthy()
    expect(String(f.borderLayer!.style.background)).toContain("#ff0000")
    expect(f.borderLayer!.style.borderRadius).toBe(16)
  })
  it("aucun effet -> pas d'ombre", () => {
    expect(bannerFrame({}, "#C9A84C", 0).boxShadow).toBeUndefined()
  })
})

describe("bannerHeight", () => {
  it("xl public = 340", () => expect(bannerHeight({ height: "xl" }, "public")).toBe(340))
  it("hauteur px prioritaire", () => expect(bannerHeight({ height_px: "200" }, "public")).toBe(200))
  it("md éditeur = 100", () => expect(bannerHeight({}, "editor")).toBe(100))
})

describe("normalizePhoneDigits", () => {
  it("nettoie les espaces/ponctuation", () => {
    expect(normalizePhoneDigits("06 12 34 56 78")).toBe("0612345678")
  })
  it("indicatif ajouté + 0 national retiré", () => {
    expect(normalizePhoneDigits("06 12 34 56 78", "33")).toBe("33612345678")
  })
  it("numéro déjà international (+) respecté", () => {
    expect(normalizePhoneDigits("+33 6 12 34 56 78", "33")).toBe("33612345678")
  })
  it("n'ajoute pas deux fois l'indicatif", () => {
    expect(normalizePhoneDigits("33612345678", "33")).toBe("33612345678")
  })
  it("vide -> vide", () => {
    expect(normalizePhoneDigits("", "33")).toBe("")
  })
})

describe("waLink / telLink", () => {
  it("waLink construit wa.me + message encodé", () => {
    const l = waLink("0612345678", "Bonjour !", "33")
    expect(l).toBe("https://wa.me/33612345678?text=Bonjour%20!")
  })
  it("waLink sans numéro -> vide", () => {
    expect(waLink("", "x")).toBe("")
  })
  it("telLink garde le + international", () => {
    expect(telLink("+33 6 12 34 56 78")).toBe("tel:+33612345678")
  })
  it("telLink national", () => {
    expect(telLink("06 12 34 56 78")).toBe("tel:0612345678")
  })
  it("telLink vide -> vide", () => {
    expect(telLink("")).toBe("")
  })
})

describe("embedVideoUrl", () => {
  it("YouTube watch -> embed", () => {
    expect(embedVideoUrl("https://youtube.com/watch?v=abc123&t=10")).toBe("https://www.youtube.com/embed/abc123")
  })
  it("youtu.be court -> embed", () => {
    expect(embedVideoUrl("https://youtu.be/xyz789")).toBe("https://www.youtube.com/embed/xyz789")
  })
  it("YouTube Shorts -> embed", () => {
    expect(embedVideoUrl("https://www.youtube.com/shorts/short01")).toBe("https://www.youtube.com/embed/short01")
  })
  it("Vimeo -> player", () => {
    expect(embedVideoUrl("https://vimeo.com/123456789")).toBe("https://player.vimeo.com/video/123456789")
  })
  it("lien inconnu -> tel quel", () => {
    expect(embedVideoUrl("https://exemple.com/video")).toBe("https://exemple.com/video")
  })
  it("vide -> vide", () => {
    expect(embedVideoUrl("")).toBe("")
  })
})

describe("directionsLink", () => {
  it("google/auto par défaut", () => {
    expect(directionsLink("12 rue de la Paix, Paris")).toBe("https://www.google.com/maps/dir/?api=1&destination=12%20rue%20de%20la%20Paix%2C%20Paris")
  })
  it("apple plans", () => {
    expect(directionsLink("Paris", "apple")).toBe("https://maps.apple.com/?daddr=Paris")
  })
  it("waze", () => {
    expect(directionsLink("Paris", "waze")).toBe("https://waze.com/ul?q=Paris&navigate=yes")
  })
  it("adresse vide -> vide", () => {
    expect(directionsLink("")).toBe("")
  })
})

describe("ctaButtonStyle", () => {
  const opt = { G: "#C9A84C", accent: "#39FF8F", text: "#F5F0E8" }
  it("gold : ombre dorée, pas de classe", () => {
    const r = ctaButtonStyle("gold", opt)
    expect(String(r.style.boxShadow)).toContain("#C9A84C")
    expect(r.className).toBeUndefined()
  })
  it("gradient : classe animée", () => {
    expect(ctaButtonStyle("gradient", opt).className).toBe("qcta-flow")
  })
  it("glass : backdropFilter", () => {
    expect(String(ctaButtonStyle("glass", opt).style.backdropFilter)).toContain("blur")
  })
  it("luxe : bordure or", () => {
    expect(String(ctaButtonStyle("luxe", opt).style.border)).toContain("#C9A84C")
  })
  it("style inconnu -> gold", () => {
    expect(ctaButtonStyle("inconnu", opt).style.color).toBe("#080808")
  })
})

describe("stickyActionHref", () => {
  it("call -> tel", () => {
    const a = stickyActionHref("call", "0612345678")
    expect(a.href).toBe("tel:0612345678")
    expect(a.icon).toBe("📞")
  })
  it("directions -> google maps", () => {
    expect(stickyActionHref("directions", "Paris").href).toContain("google.com/maps/dir")
  })
  it("email -> mailto", () => {
    expect(stickyActionHref("email", "a@b.com").href).toBe("mailto:a@b.com")
  })
  it("share -> flag share, pas de href", () => {
    const a = stickyActionHref("share")
    expect(a.share).toBe(true)
    expect(a.href).toBeUndefined()
  })
  it("none -> icône vide", () => {
    expect(stickyActionHref("none").icon).toBe("")
  })
})

describe("SOCIAL_NETWORKS_MAP (parité éditeur <-> public)", () => {
  it("contient une entrée pour chaque réseau de l'éditeur", () => {
    for (const n of SOCIAL_NETWORKS) {
      expect(SOCIAL_NETWORKS_MAP[n.key]).toBeTruthy()
      expect(SOCIAL_NETWORKS_MAP[n.key].label).toBe(n.label)
      expect(SOCIAL_NETWORKS_MAP[n.key].color).toBe(n.color)
    }
  })
  it("couvre 30+ réseaux (bibliothèque riche)", () => {
    expect(Object.keys(SOCIAL_NETWORKS_MAP).length).toBeGreaterThan(30)
  })
  it("inclut les réseaux clés", () => {
    for (const k of ["instagram", "tiktok", "youtube", "spotify", "deezer", "twitch", "threads", "linkedin", "discord", "behance"]) {
      expect(SOCIAL_NETWORKS_MAP[k]).toBeTruthy()
    }
  })
})

describe("productBadgeStyle", () => {
  it("Promo -> rouge + icône", () => {
    const b = productBadgeStyle("Promo -30%", "#C9A84C")
    expect(b.color).toBe("#EF4444")
    expect(b.icon).toBe("🏷️")
    expect(b.fg).toBe("#fff")
  })
  it("Nouveau -> vert", () => {
    expect(productBadgeStyle("Nouveau", "#C9A84C").color).toBe("#39FF8F")
  })
  it("Épuisé -> gris + texte clair", () => {
    const b = productBadgeStyle("Épuisé", "#C9A84C")
    expect(b.color).toBe("#8A8478")
    expect(b.fg).toBe("#fff")
  })
  it("inconnu -> accent, pas d'icône", () => {
    const b = productBadgeStyle("MonBadge", "#C9A84C")
    expect(b.color).toBe("#C9A84C")
    expect(b.icon).toBe("")
  })
  it("libellé avec emoji -> pas de double icône", () => {
    expect(productBadgeStyle("⭐ Signature", "#C9A84C").icon).toBe("")
  })
})

describe("bannerBackgroundStyle", () => {
  it("dégradé nommé", () => {
    expect(String(bannerBackgroundStyle({ banner_type: "gradient", grad_preset: "or_nuit" }, "#C9A84C").background)).toContain("linear-gradient")
  })
  it("couleur unie", () => {
    expect(bannerBackgroundStyle({ banner_type: "color", bg_color: "#111" }, "#C9A84C").background).toBe("#111")
  })
  it("image -> style vide (géré par <img>)", () => {
    expect(Object.keys(bannerBackgroundStyle({ banner_type: "image", src: "x" }, "#C9A84C"))).toHaveLength(0)
  })
})

describe("parsePrice", () => {
  it("vide / gratuit / sur devis -> null", () => {
    expect(parsePrice("")).toBeNull()
    expect(parsePrice(undefined)).toBeNull()
    expect(parsePrice("Gratuit")).toBeNull()
    expect(parsePrice("Sur devis")).toBeNull()
  })
  it("entiers avec devise variée", () => {
    expect(parsePrice("29€")).toBe(29)
    expect(parsePrice("$29")).toBe(29)
    expect(parsePrice("29 USD")).toBe(29)
    expect(parsePrice("£19")).toBe(19)
  })
  it("décimale virgule ou point", () => {
    expect(parsePrice("29,90 €")).toBeCloseTo(29.9)
    expect(parsePrice("29.90€")).toBeCloseTo(29.9)
    expect(parsePrice("9,5")).toBeCloseTo(9.5)
  })
  it("séparateur de milliers (3 chiffres) traité comme entier", () => {
    expect(parsePrice("1,299€")).toBe(1299)
    expect(parsePrice("1.299 €")).toBe(1299)
    expect(parsePrice("1 299,00 €")).toBeCloseTo(1299)
  })
  it("texte non numérique -> null", () => {
    expect(parsePrice("abc")).toBeNull()
  })
})

describe("priceDiscount", () => {
  it("ancien prix supérieur -> pourcentage arrondi", () => {
    const d = priceDiscount("29€", "59€")
    expect(d).not.toBeNull()
    expect(d!.percent).toBe(51)
    expect(d!.label).toBe("-51%")
  })
  it("économie formatée avec devise reprise de l'ancien prix", () => {
    const d = priceDiscount("40€", "50€")
    expect(d!.percent).toBe(20)
    expect(d!.saved).toBe("10€")
  })
  it("pas de réduction si ancien <= prix", () => {
    expect(priceDiscount("59€", "29€")).toBeNull()
    expect(priceDiscount("29€", "29€")).toBeNull()
  })
  it("null si prix non numérique ou ancien absent", () => {
    expect(priceDiscount("29€", undefined)).toBeNull()
    expect(priceDiscount("Sur devis", "59€")).toBeNull()
    expect(priceDiscount("29€", "Gratuit")).toBeNull()
  })
  it("décimales : 29,90 vs 59,90 ~ -50%", () => {
    const d = priceDiscount("29,90€", "59,90€")
    expect(d!.percent).toBe(50)
  })
})

describe("countdownParts", () => {
  const DAY = 86400000, HOUR = 3600000, MIN = 60000, SEC = 1000
  it("cible NaN (aucune date) -> non expiré, zéros", () => {
    const p = countdownParts(NaN, 1000)
    expect(p.expired).toBe(false)
    expect(p.days).toBe(0)
    expect(Number.isNaN(p.totalMs)).toBe(true)
  })
  it("cible dépassée -> expired", () => {
    const p = countdownParts(1000, 5000)
    expect(p.expired).toBe(true)
    expect(p.totalMs).toBe(0)
  })
  it("cible = maintenant -> expired (diff 0)", () => {
    expect(countdownParts(1000, 1000).expired).toBe(true)
  })
  it("décompose j/h/m/s correctement", () => {
    const now = 0
    const target = 2 * DAY + 3 * HOUR + 4 * MIN + 5 * SEC
    const p = countdownParts(target, now)
    expect(p.expired).toBe(false)
    expect(p.days).toBe(2)
    expect(p.hours).toBe(3)
    expect(p.mins).toBe(4)
    expect(p.secs).toBe(5)
  })
  it("moins d'une minute", () => {
    const p = countdownParts(45 * SEC, 0)
    expect(p.days).toBe(0)
    expect(p.hours).toBe(0)
    expect(p.mins).toBe(0)
    expect(p.secs).toBe(45)
  })
})

describe("stockStatus", () => {
  it("vide / non numérique -> null (rien affiché)", () => {
    expect(stockStatus("")).toBeNull()
    expect(stockStatus(undefined)).toBeNull()
    expect(stockStatus("beaucoup")).toBeNull()
  })
  it("0 ou négatif -> épuisé + soldOut", () => {
    const s = stockStatus("0")
    expect(s!.state).toBe("out")
    expect(s!.soldOut).toBe(true)
    expect(stockStatus("-3")!.state).toBe("out")
  })
  it("1..seuil -> rareté (urgence), pas soldOut", () => {
    const s = stockStatus("3")
    expect(s!.state).toBe("low")
    expect(s!.label).toBe("Plus que 3 en stock")
    expect(s!.soldOut).toBe(false)
    expect(stockStatus("5")!.state).toBe("low")
  })
  it("au-dessus du seuil -> en stock", () => {
    expect(stockStatus("42")!.state).toBe("in")
    expect(stockStatus("6")!.state).toBe("in")
  })
  it("seuil personnalisable", () => {
    expect(stockStatus("8", 10)!.state).toBe("low")
  })
  it("extrait l'entier d'un texte (ex '3 restants')", () => {
    expect(stockStatus("3 restants")!.label).toBe("Plus que 3 en stock")
  })
})

describe("paymentLink", () => {
  it("URL http collée = priorité absolue", () => {
    expect(paymentLink({ platform: "Stripe", url: "https://buy.stripe.com/abc" })).toBe("https://buy.stripe.com/abc")
    expect(paymentLink({ platform: "PayPal", url: "https://buy.stripe.com/abc", handle: "jean" })).toBe("https://buy.stripe.com/abc")
  })
  it("PayPal via pseudo -> paypal.me", () => {
    expect(paymentLink({ platform: "PayPal", handle: "jean" })).toBe("https://paypal.me/jean")
    expect(paymentLink({ platform: "PayPal", handle: "@jean" })).toBe("https://paypal.me/jean")
  })
  it("PayPal avec montant", () => {
    expect(paymentLink({ platform: "PayPal", handle: "jean", amount: "29€" })).toBe("https://paypal.me/jean/29")
  })
  it("Revolut via pseudo -> revolut.me (sans montant)", () => {
    expect(paymentLink({ platform: "Revolut", handle: "marie", amount: "10€" })).toBe("https://revolut.me/marie")
  })
  it("Stripe/Lydia/SumUp sans URL -> vide", () => {
    expect(paymentLink({ platform: "Stripe", handle: "jean" })).toBe("")
    expect(paymentLink({ platform: "Lydia" })).toBe("")
  })
  it("pseudo vide -> vide", () => {
    expect(paymentLink({ platform: "PayPal", handle: "" })).toBe("")
    expect(paymentLink({ platform: "PayPal" })).toBe("")
  })
})

describe("paymentBrand", () => {
  it("marque connue -> couleur + icône", () => {
    expect(paymentBrand("PayPal").color).toBe("#009CDE")
    expect(paymentBrand("PayPal").handleBased).toBe(true)
    expect(paymentBrand("Stripe").handleBased).toBe(false)
  })
  it("inconnu / vide -> Stripe par défaut", () => {
    expect(paymentBrand(undefined).label).toBe("Stripe")
    expect(paymentBrand("Bidule").label).toBe("Stripe")
  })
})

describe("starRow", () => {
  it("note pleine -> 5 étoiles remplies", () => {
    expect(starRow(5)).toEqual([1, 1, 1, 1, 1])
  })
  it("décimale : 4.9 -> 4 pleines + 1 quasi pleine", () => {
    const r = starRow(4.9)
    expect(r.slice(0, 4)).toEqual([1, 1, 1, 1])
    expect(r[4]).toBeCloseTo(0.9)
  })
  it("demi-étoile : 3,5 (virgule) -> [1,1,1,0.5,0]", () => {
    expect(starRow("3,5")).toEqual([1, 1, 1, 0.5, 0])
  })
  it("zéro / vide / non numérique -> tout vide", () => {
    expect(starRow(0)).toEqual([0, 0, 0, 0, 0])
    expect(starRow(undefined)).toEqual([0, 0, 0, 0, 0])
    expect(starRow("abc")).toEqual([0, 0, 0, 0, 0])
  })
  it("borné : au-delà du max -> tout plein", () => {
    expect(starRow(9)).toEqual([1, 1, 1, 1, 1])
  })
  it("max personnalisable", () => {
    expect(starRow(2, 3)).toEqual([1, 1, 0])
  })
})

describe("fmtMinutes", () => {
  it("heure pile -> '18h', sinon '9h30'", () => {
    expect(fmtMinutes(540)).toBe("9h")
    expect(fmtMinutes(1080)).toBe("18h")
    expect(fmtMinutes(570)).toBe("9h30")
    expect(fmtMinutes(0)).toBe("0h")
  })
})

describe("parseHourRanges", () => {
  it("plage simple", () => {
    expect(parseHourRanges("9h - 18h")).toEqual([{ start: 540, end: 1080 }])
  })
  it("double plage (coupure midi)", () => {
    expect(parseHourRanges("9h-12h, 14h-18h")).toEqual([{ start: 540, end: 720 }, { start: 840, end: 1080 }])
  })
  it("formats varies (: . et minutes)", () => {
    expect(parseHourRanges("9:30 - 17:00")).toEqual([{ start: 570, end: 1020 }])
    expect(parseHourRanges("10h30 – 16h")).toEqual([{ start: 630, end: 960 }])
  })
  it("ferme / vide -> []", () => {
    expect(parseHourRanges("Fermé")).toEqual([])
    expect(parseHourRanges("")).toEqual([])
    expect(parseHourRanges(undefined)).toEqual([])
  })
  it("plage invalide (fin <= debut) ignoree", () => {
    expect(parseHourRanges("18h - 9h")).toEqual([])
  })
})

describe("openStatus", () => {
  const uniform = { mon_fri: "9h - 18h", saturday: "9h - 18h", sunday: "9h - 18h" }
  it("ouvert pendant les heures -> ferme a X", () => {
    const r = openStatus(uniform, new Date(2026, 6, 8, 10, 30))
    expect(r?.open).toBe(true)
    expect(r?.label).toBe("Ouvert · ferme à 18h")
    expect(r?.color).toBe("#39FF8F")
  })
  it("avant ouverture -> ouvre a X", () => {
    const r = openStatus(uniform, new Date(2026, 6, 8, 8, 0))
    expect(r?.open).toBe(false)
    expect(r?.label).toBe("Fermé · ouvre à 9h")
  })
  it("apres fermeture -> Fermé", () => {
    const r = openStatus(uniform, new Date(2026, 6, 8, 20, 0))
    expect(r?.open).toBe(false)
    expect(r?.label).toBe("Fermé")
  })
  it("selectionne le bon champ selon le jour", () => {
    const c = { mon_fri: "9h - 18h", saturday: "10h - 16h", sunday: "" }
    // 2026-07-04 = samedi, 2026-07-06 = lundi, 2026-07-05 = dimanche
    expect(openStatus(c, new Date(2026, 6, 4, 11, 0))?.label).toBe("Ouvert · ferme à 16h")
    expect(openStatus(c, new Date(2026, 6, 6, 11, 0))?.label).toBe("Ouvert · ferme à 18h")
    expect(openStatus(c, new Date(2026, 6, 5, 11, 0))).toBeNull() // dimanche vide -> pas de badge
  })
  it("coupure midi : ferme entre les deux plages", () => {
    const c = { mon_fri: "9h-12h, 14h-18h", saturday: "", sunday: "" }
    expect(openStatus(c, new Date(2026, 6, 6, 13, 0))?.label).toBe("Fermé · ouvre à 14h")
    expect(openStatus(c, new Date(2026, 6, 6, 15, 0))?.open).toBe(true)
  })
})

describe("vcardEscape", () => {
  it("echappe , ; \\ et retours ligne", () => {
    expect(vcardEscape("Paris, France")).toBe("Paris\\, France")
    expect(vcardEscape("a;b")).toBe("a\\;b")
    expect(vcardEscape("a\\b")).toBe("a\\\\b")
    expect(vcardEscape("l1\nl2")).toBe("l1\\nl2")
  })
})

describe("splitName", () => {
  it("prenom + nom", () => {
    expect(splitName("Jean Dupont")).toEqual({ given: "Jean", family: "Dupont" })
  })
  it("prenom compose -> dernier mot = nom", () => {
    expect(splitName("Jean Marie Dupont")).toEqual({ given: "Jean Marie", family: "Dupont" })
  })
  it("un seul mot / vide", () => {
    expect(splitName("Madonna")).toEqual({ given: "Madonna", family: "" })
    expect(splitName("")).toEqual({ given: "", family: "" })
  })
})

describe("buildVCard", () => {
  it("carte complete valide (BEGIN/END, FN, N, champs)", () => {
    const v = buildVCard({ name: "Jean Dupont", phone: "+33612345678", email: "jean@ex.com", company: "Studio PIXEL", title: "DA", website: "https://x.com", address: "Paris, France" })
    expect(v.startsWith("BEGIN:VCARD\r\nVERSION:3.0")).toBe(true)
    expect(v.endsWith("END:VCARD")).toBe(true)
    expect(v).toContain("FN:Jean Dupont")
    expect(v).toContain("N:Dupont;Jean;;;")
    expect(v).toContain("ORG:Studio PIXEL")
    expect(v).toContain("TITLE:DA")
    expect(v).toContain("TEL;TYPE=CELL:+33612345678")
    expect(v).toContain("EMAIL;TYPE=INTERNET:jean@ex.com")
    expect(v).toContain("URL:https://x.com")
    expect(v).toContain("ADR;TYPE=WORK:;;Paris\\, France;;;;")
  })
  it("utilise CRLF entre les lignes", () => {
    expect(buildVCard({ name: "A B" }).includes("\r\n")).toBe(true)
  })
  it("sans nom -> FN reprend l'entreprise", () => {
    const v = buildVCard({ company: "ACME" })
    expect(v).toContain("FN:ACME")
    expect(v).not.toContain("\nN:")
  })
  it("champs vides omis", () => {
    const v = buildVCard({ name: "Jean" })
    expect(v).not.toContain("TEL")
    expect(v).not.toContain("ADR")
  })
})

describe("mapEmbedUrl", () => {
  it("construit une carte depuis l'adresse (sans cle API)", () => {
    const u = mapEmbedUrl("12 rue de la Paix, Paris")
    expect(u).toBe("https://maps.google.com/maps?q=12%20rue%20de%20la%20Paix%2C%20Paris&z=15&output=embed")
  })
  it("zoom personnalise valide (1-2 chiffres)", () => {
    expect(mapEmbedUrl("Paris", "", "18")).toContain("&z=18&")
    expect(mapEmbedUrl("Paris", "", "abc")).toContain("&z=15&") // invalide -> defaut
  })
  it("URL embed personnalisee prioritaire", () => {
    const custom = "https://www.google.com/maps/embed?pb=xyz"
    expect(mapEmbedUrl("Paris", custom)).toBe(custom)
  })
  it("rien d'exploitable -> vide", () => {
    expect(mapEmbedUrl("")).toBe("")
    expect(mapEmbedUrl(undefined, undefined)).toBe("")
  })
})

describe("shareLinks", () => {
  const L = shareLinks("https://qrfolio.app/jean", "Jean Dupont")
  const by = (k: string) => L.find(t => t.key === k)!
  it("6 reseaux, encodage URL", () => {
    expect(L.map(t => t.key)).toEqual(["whatsapp", "facebook", "x", "linkedin", "telegram", "email"])
    expect(by("whatsapp").href).toContain("https%3A%2F%2Fqrfolio.app%2Fjean")
  })
  it("WhatsApp/X/Telegram incluent le texte, Facebook seulement l'URL", () => {
    expect(by("whatsapp").href).toContain("Jean%20Dupont")
    expect(by("x").href).toContain("&text=Jean%20Dupont")
    expect(by("facebook").href).not.toContain("Jean")
  })
  it("email en mailto", () => {
    expect(by("email").href.startsWith("mailto:?subject=Jean%20Dupont")).toBe(true)
  })
  it("sans texte -> pas de segment texte parasite", () => {
    const w = shareLinks("https://x.io").find(t => t.key === "whatsapp")!
    expect(w.href).toBe("https://wa.me/?text=https%3A%2F%2Fx.io")
  })
})

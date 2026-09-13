import { describe, it, expect } from "vitest"
import { estUnRobot, ligneDeRobot } from "./robots"
import { parseDevice } from "./scanStats"

// Chaînes d'agent réelles, telles qu'elles arrivent sur la redirection.
const ROBOTS: [string, string][] = [
  ["WhatsApp", "WhatsApp/2.23.20.0 A"],
  ["Messenger / Facebook", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"],
  ["Slack", "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)"],
  ["Telegram", "TelegramBot (like TwitterBot)"],
  ["Discord", "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)"],
  ["Twitter", "Twitterbot/1.0"],
  ["LinkedIn", "LinkedInBot/1.0 (compatible; Mozilla/5.0; Jakarta Commons-HttpClient/3.1)"],
  ["Apple / iMessage", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15 Applebot/0.1"],
  ["Google", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
  ["Bing", "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"],
  ["Outlook Safe Links", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SafeLinks"],
  ["Proofpoint", "Mozilla/5.0 (compatible; proofpoint-urldefense)"],
  ["curl", "curl/8.4.0"],
  ["wget", "Wget/1.21.3"],
  ["python", "python-requests/2.31.0"],
  ["Chrome sans tête", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36"],
  ["surveillance", "Mozilla/5.0 (compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)"],
]

// Et de vrais téléphones : ceux qu'on ne doit surtout pas écarter.
const HUMAINS: [string, string][] = [
  ["iPhone Safari", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1"],
  ["Android Chrome", "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36"],
  ["Samsung Internet", "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/19.0 Chrome/102.0.0.0 Mobile Safari/537.36"],
  ["Firefox Android", "Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/119.0 Firefox/119.0"],
  ["iPad", "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"],
  ["Mac Safari", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"],
  ["Windows Chrome", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"],
  ["Edge", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0"],
]

describe("un programme qui suit un lien n'est pas un client", () => {
  for (const [nom, ua] of ROBOTS) {
    it(`${nom} est reconnu`, () => expect(estUnRobot(ua), ua).toBe(true))
  }
  it("un agent absent ou vide est un programme : un navigateur en envoie toujours un", () => {
    expect(estUnRobot(null)).toBe(true)
    expect(estUnRobot("")).toBe(true)
    expect(estUnRobot("   ")).toBe(true)
  })
})

describe("aucun vrai téléphone n'est écarté", () => {
  for (const [nom, ua] of HUMAINS) {
    it(`${nom} passe`, () => expect(estUnRobot(ua), ua).toBe(false))
  }
})

describe("ce que le produit savait déjà", () => {
  it("parseDevice appelait déjà « bot » ce qu'il enregistrait quand même", () => {
    // Le cœur du relevé : l'information existait, elle n'était pas utilisée.
    expect(parseDevice("facebookexternalhit/1.1")).toBe("bot")
    expect(parseDevice("Slackbot-LinkExpanding 1.0")).toBe("bot")
  })
  it("sa liste était plus courte que la réalité — d'où celle de ce module", () => {
    // WhatsApp, Telegram, Discord, curl : « desktop » ou « unknown » pour parseDevice.
    for (const ua of ["WhatsApp/2.23.20.0 A", "curl/8.4.0", "Wget/1.21.3", "python-requests/2.31.0"]) {
      expect(parseDevice(ua), ua).not.toBe("bot")
      expect(estUnRobot(ua), ua).toBe(true)
    }
  })
  it("les lignes déjà écrites se reconnaissent à leur colonne", () => {
    expect(ligneDeRobot("bot")).toBe(true)
    expect(ligneDeRobot("mobile")).toBe(false)
    expect(ligneDeRobot(null)).toBe(false)
  })
})

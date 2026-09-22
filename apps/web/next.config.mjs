import { frameSrc } from "./src/lib/hotesDeCadre.mjs"
// En-têtes de sécurité appliqués à toutes les réponses. La CSP complète est
// volontairement différée (l'app utilise massivement des styles inline -> il
// faudrait 'unsafe-inline', ce qui affaiblit la CSP ; à durcir en phase 2 avec
// des nonces). Ici : les protections sans risque de casse.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // CSP APPLIQUÉE — uniquement les directives SANS RISQUE de casse (pas de
  // default-src/script-src ici → scripts/styles/connexions restent libres).
  // Gains réels et sûrs : anti-clickjacking, anti-<base>, anti-<object>/<embed>,
  // formulaires bornés à l'app (aucun <form> externe trouvé), upgrade http→https.
  //
  // ── `frame-src`, appliquée au lot v161 ────────────────────────────────────
  //
  // Elle a longtemps attendu, et la raison était bonne : tant que le produit
  // pouvait émettre un hôte dans un ensemble NON BORNÉ, aucun en-tête ne pouvait
  // le décrire. C'était le cas des cartes — `mapEmbedUrl` acceptait `google.fr`,
  // `google.de`, et une CSP ne sait pas écrire `google.*`.
  //
  // Les quatre chemins qui mènent à un `<iframe>` reconstruisent désormais tous
  // une adresse canonique (lots v159 pour Spotify, v161 pour les cartes), ou
  // filtrent sur une liste. L'ensemble est fini, donc écrivable.
  //
  // La liste n'est pas recopiée ici : elle est fabriquée à partir de celle qui
  // FILTRE, dans `src/lib/hotesDeCadre.mjs`. Deux listes finiraient par diverger,
  // et le symptôme serait muet — un cadre vide sur la page d'un client, sans
  // message. C'est ce qui rend cette directive sûre à appliquer.
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
      `frame-src ${frameSrc()}`,
      "upgrade-insecure-requests",
    ].join("; "),
  },
  // CSP STRICTE en Report-Only : NE BLOQUE RIEN. Elle OBSERVE la cible « nonces »
  // à atteindre en phase 2 (retirer 'unsafe-inline', ajouter un report endpoint,
  // dérouler progressivement). Ce qui reste à faire est donc `script-src` : les
  // cadres, eux, sont bornés pour de vrai depuis le lot v161, par la directive
  // appliquée ci-dessus. Celle d'ici dit la même chose, pour ne pas observer une
  // règle plus lâche que celle qui s'applique.
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "media-src 'self' https: blob:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com",
      `frame-src ${frameSrc()}`,
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ].join("; "),
  },
]

const nextConfig = {
  // Verification TypeScript active au build : bloque les regressions de types ET les
  // imports casses (qui crashaient au runtime). Le code typecheck a 0 erreur (2026-07-07).
  typescript: { ignoreBuildErrors: false },
  // Le navigateur ne peut pas savoir si la clé Anthropic existe côté serveur. On
  // lui transmet UN BOOLÉEN au build : sans clé, l'éditeur ne monte même pas le
  // bloc « Générer ma page avec l'IA » (au lieu de laisser rédiger, attendre,
  // puis répondre « arrive très bientôt »). Voir src/lib/generationIa.ts.
  env: { NEXT_PUBLIC_GENERATION_IA: process.env.ANTHROPIC_API_KEY ? "1" : "0" },
  // (Clé `eslint` retirée : non supportée par Next 16 — ESLint n'est pas câblé au build.
  //  La sécurité de type est assurée par `typescript.ignoreBuildErrors: false` ci-dessus.)
  // Optimisation d'images : autorise l'optimisation Next des assets Supabase Storage
  // (prepare la migration <img> -> next/image sur les pages publiques).
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
    formats: ["image/avif", "image/webp"],
  },
  // Tree-shaking cible des gros barrels (bundle par-route allege).
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "react-simple-maps"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}
export default nextConfig

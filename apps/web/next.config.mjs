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
]

const nextConfig = {
  // Verification TypeScript active au build : bloque les regressions de types ET les
  // imports casses (qui crashaient au runtime). Le code typecheck a 0 erreur (2026-07-07).
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}
export default nextConfig

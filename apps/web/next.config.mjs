const nextConfig = {
  // Verification TypeScript active au build : bloque les regressions de types ET les
  // imports casses (qui crashaient au runtime). Le code typecheck a 0 erreur (2026-07-07).
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
}
export default nextConfig

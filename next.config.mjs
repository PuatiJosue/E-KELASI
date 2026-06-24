/** @type {import('next').NextConfig} */

const securityHeaders = [
  // HSTS : force HTTPS sur le domaine pendant 2 ans (preload-ready).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Anti-clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Empêche le navigateur d'inférer le type MIME (anti XSS via mauvais type)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limite la fuite du Referer vers les sites tiers
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Coupe l'accès aux APIs sensibles du navigateur
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Une CSP stricte demande d'ajuster d'abord (Google Fonts + styles inline) ;
  // démarrer en Report-Only avant de la rendre obligatoire.
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Autorise l'envoi de pièces jointes (annonces) via Server Actions (base64).
    serverActions: { bodySizeLimit: "12mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

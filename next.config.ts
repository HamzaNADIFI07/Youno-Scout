import type { NextConfig } from "next";

/**
 * Headers de sécurité HTTP appliqués globalement.
 *
 * Inspirés de :
 *  - OWASP Secure Headers Project (https://owasp.org/www-project-secure-headers/)
 *  - Mozilla Observatory recommandations
 *
 * Audit possible via https://securityheaders.com après déploiement.
 */
const securityHeaders = [
  // HSTS : force HTTPS pour 2 ans, sous-domaines inclus, éligible preload list
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Empêche l'embed de l'app dans une iframe (anti-clickjacking)
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Bloque le MIME sniffing du navigateur (réduit la surface XSS)
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Limite ce qui est envoyé dans le Referer cross-origin
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Désactive les APIs sensibles (caméra, micro, géoloc) que Scout n'utilise pas
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
  },
  // Désactive le DNS prefetch automatique (évite des fuites d'info)
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
  // CSP : autorise self + sources connues (logos Clearbit, fonts Google).
  // 'unsafe-inline' est requis par les styles inline générés par Next.js.
  // En production durcie, on passerait à des nonces.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

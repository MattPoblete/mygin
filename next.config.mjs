/** @type {import('next').NextConfig} */
// JS plano (no TS) a propósito: el adaptador de Firebase Hosting bundlea next.config
// con esbuild solo si es TypeScript; en .mjs evita ese paso y su fricción de instalación.
const nextConfig = {
  reactStrictMode: true,
  // Para contenerizar a Cloud Run, añadir `output: 'standalone'` (incompatible con `next start`).
};

export default nextConfig;

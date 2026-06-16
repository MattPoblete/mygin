import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Para contenerizar a Cloud Run (Fase de hosting), añadir:
  //   output: 'standalone',
  // Nota: 'standalone' es incompatible con `next start`; usar solo al desplegar a Cloud Run.
};

export default nextConfig;

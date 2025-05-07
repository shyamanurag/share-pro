/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["assets.co.dev", "images.unsplash.com"],
  },
  webpack: (config, context) => {
    config.optimization.minimize = process.env.NEXT_PUBLIC_CO_DEV_ENV !== "preview";
    return config;
  },
  // Balanced security headers that won't block essential resources
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; script-src * 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src * 'self' data: blob: 'unsafe-inline'; img-src * 'self' data: blob: 'unsafe-inline'; frame-src * 'self' data: blob: 'unsafe-inline'; style-src * 'self' data: blob: 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */

// Validate environment variables at startup
const requiredEnvs = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SITE_URL'
];

for (const env of requiredEnvs) {
  if (!process.env[env]) {
    throw new Error(
      `\n❌ Missing required environment variable: ${env}\n` +
      `Ensure you have copied .env.example to frontend/.env.local and set this value.\n`
    );
  }
}

const nextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ],
    }];
  },
};
module.exports = nextConfig;

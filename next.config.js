/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/image/**',
      },
      {
        protocol: 'https',
        hostname: '*.spotifycdn.com', // More general wildcard for Spotify CDN
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.scdn.co', // Another common Spotify domain
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
        port: '/**',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net', // For user profile pictures via Facebook
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
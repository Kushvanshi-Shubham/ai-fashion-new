/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
  },
  
  // Compression
  compress: true,
  
  // External packages for server components
  serverExternalPackages: ['sharp'],
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-slot'],
  },
}

export default nextConfig

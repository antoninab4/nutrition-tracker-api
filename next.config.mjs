/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Увеличиваем лимит до 10 МБ для загрузки изображений
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Разрешаем загрузку изображений с любых доменов (для будущих нужд)
      },
    ],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Исключаем 'ws' из клиентской сборки
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false,
      }
    }
    return config
  },
}

export default nextConfig

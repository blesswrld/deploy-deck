import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    webpack: (config, { isServer }) => {
        // Этот блок исправляет проблему с пакетами, которые используют 'fs' на клиенте.
        if (!isServer) {
            // Мы говорим сборщику не искать модуль 'fs' при сборке для браузера.
            config.resolve.fallback = {
                fs: false,
            };
        }

        // Обязательно возвращаем измененную конфигурацию.
        return config;
    },
};

export default nextConfig;

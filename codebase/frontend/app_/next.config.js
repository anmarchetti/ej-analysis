const CopyPlugin = require('copy-webpack-plugin');
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');
const path = require('path');

const distFolderName = '.next';
const distFolder = path.resolve(__dirname, distFolderName);
const isProd = process.env.NODE_ENV === 'production';
const ASSET_PREFIX = process.env.ASSET_PREFIX ?? '';
const STATIC_PREFIX = process.env.STATIC_PREFIX ?? '';
const NEXT_IMAGE_CACHE = parseInt(process.env.NEXT_IMAGE_CACHE) ?? 60;

// When RENDERING_HOST is set, assetPrefix becomes an absolute URL so that
// dynamically-injected CSS <link> tags resolve against the rendering host
// instead of the Sitecore CM origin (which causes 404s in Experience Editor).
const RENDERING_HOST = process.env.RENDERING_HOST_URL ?? '';

/**
 * Don't be scared of the generics here.
 * All they do is to give us autocompletion when using this.
 *
 * @template {import('next').NextConfig} T
 * @param {T} config - A generic parameter that flows through to the return type
 * @constraint {{import('next').NextConfig}}
 */
function defineNextConfig(config) {
    return config;
}

const nextConfig = defineNextConfig({
    transpilePackages: [
        '@sitecore/byoc',
        '@sitecore-feaas/clientside',
        '@sitecore/components',
        'next-auth',
        'supercluster',
        'kdbush',
    ],
    distDir: distFolderName,
    assetPrefix: isProd ? (RENDERING_HOST ? RENDERING_HOST + ASSET_PREFIX : ASSET_PREFIX) : undefined,
    env: {
        NEXT_PUBLIC_FONTS_URL: ASSET_PREFIX + STATIC_PREFIX + '/fonts',
        NEXT_PUBLIC_WORKER_URL: ASSET_PREFIX + STATIC_PREFIX + '/js/service-worker.js',
        NEXT_PUBLIC_IMG_URL: ASSET_PREFIX + STATIC_PREFIX + '/img',
        NEXT_PUBLIC_APPLEPAY_URL: ASSET_PREFIX + STATIC_PREFIX + '/apple-pay',
        ASSET_PREFIX,
    },
    reactStrictMode: true,
    experimental: {
        // Increase the limit from 128kB to 512kB to reduce console warnings
        largePageDataBytes: 512 * 1000,
        // next-auth/react uses React.createContext at module init time.
        // When bundled via transpilePackages on the server, webpack can resolve
        // react to the stripped react-server build (no createContext), making
        // SessionContext undefined and breaking SessionProvider + useSession.
        // Marking it as external forces the server to load it via Node require,
        // which always gets the full React build.
        serverComponentsExternalPackages: ['next-auth'],
    },
    images: {
        domains: [
            'easyjet-holidays-images-nonprod.s3-eu-west-1.amazonaws.com',
            'easyjet-holidays-images-preproduction.s3-eu-west-1.amazonaws.com',
            'easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com',
            'ejh-web-dev-images.s3-eu-west-1.amazonaws.com',
            'ejh-web-test-images.s3-eu-west-1.amazonaws.com',
            'ejh-web-prod-images.s3-eu-west-1.amazonaws.com',
            'ejh-web-prod-images.s3.amazonaws.com',
            'photos.hotelbeds.com',
            'secure.holidayextras.co.uk',
        ],
        minimumCacheTTL: NEXT_IMAGE_CACHE,
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    async rewrites() {
        const rules = [
            // fix prefixed _next paths
            {
                source: `${ASSET_PREFIX}${STATIC_PREFIX}/:path*`,
                destination: `${STATIC_PREFIX}/:path*`,
            },
            {
                source: `${ASSET_PREFIX}/_next/:path*`,
                destination: `/_next/:path*`,
            },
            // prefixing /api/auth paths for production configuration
            {
                source: `${ASSET_PREFIX}/api/auth/:path*`,
                destination: `/api/auth/:path*`,
            },
            // iFrames
            {
                source: '/:locale/:holidays/external/api/partial/offers-widget',
                destination: '/external_iframe/_promotingHolidays',
            },
        ];

        return rules;
    },
    generateBuildId: async () => {
        return `holidays-${Date.now().toString(36)}`;
    },
    webpack: (config, { dev, isServer }) => {
        const copyPatterns = [
            {
                from: '*.{woff,woff2}',
                context: path.resolve(__dirname, '../Prototypes/src/static/fonts/'),
                to: `${dev ? __dirname : distFolder}/public/static/fonts`,
            },
            {
                from: path.resolve(__dirname, './src/frontend/services/workers/service-worker.js'),
                to: `${dev ? __dirname : distFolder}/public/static/js`,
            },
            {
                from: '*',
                context: path.resolve(__dirname, './public/static/img/'),
                to: `${dev ? __dirname : distFolder}/public/static/img`,
            },
            {
                from: '*',
                context: path.resolve(__dirname, './public/static/akamai/'),
                to: `${dev ? __dirname : distFolder}/public/static/akamai`,
            },
            {
                from: '**/*',
                context: path.resolve(__dirname, './public/static/apple-pay/'),
                to: `${dev ? __dirname : distFolder}/public/static/apple-pay`,
                info: { minimized: true }, // Skip running JavaScript files through a minimizer
            },
        ];

        if (!dev) {
            copyPatterns.push(
                ...[
                    {
                        from: path.resolve(__dirname, './env.json'),
                        to: distFolder,
                    },
                    {
                        from: path.resolve(__dirname, '.env'),
                        to: distFolder,
                    },
                ],
            );
        }

        config.plugins.push(
            new CopyPlugin({
                patterns: copyPatterns,
            }),
        );

        // Resolves issue "Cannot resolve module 'fs'"
        if (!isServer) {
            config.resolve.fallback.fs = false;

            // When next-auth is in transpilePackages, webpack resolves `react` to
            // react.shared-subset.js (the react-server export condition) which strips
            // createContext, making SessionContext undefined → SessionProvider throws.
            // Aliasing to index.js bypasses the exports field and forces the full build.
            // Client-only: the server side is handled by serverComponentsExternalPackages.
            // Safe to remove when migrating to App Router + next-auth v5.
            // The $ suffix means exact-match only — 'react/jsx-runtime' and other
            // subpaths are not affected and continue to resolve normally.
            config.resolve.alias = {
                ...config.resolve.alias,
                'react$': path.resolve(__dirname, 'node_modules/react/index.js'),
                'react-dom$': path.resolve(__dirname, 'node_modules/react-dom/index.js'),
            };
        }

        return config;
    },
    sassOptions: {
        includePaths: [path.join(__dirname, './styles'), path.join(__dirname, './src')],
        additionalData: '@import "styles/common.scss";',
    },
});

module.exports = phase => {
    const nextAuthHeaders = [
        {
            key: 'Access-Control-Allow-Origin',
            value: ':origin',
        },
        {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
        },
        {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        },
        {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
        },
    ];
    if (phase === PHASE_DEVELOPMENT_SERVER) {
        return {
            ...nextConfig,
            // Enable CORS for local development
            async headers() {
                return [
                    {
                        source: `${ASSET_PREFIX}/_next/:path*`,

                        headers: [
                            { key: 'Access-Control-Allow-Credentials', value: 'true' },

                            { key: 'Access-Control-Allow-Origin', value: '*' },

                            { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },

                            {
                                key: 'Access-Control-Allow-Headers',

                                value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
                            },
                        ],
                    },
                    {
                        source: '/holidays/api/auth/:path*',
                        has: [
                            {
                                type: 'header',
                                key: 'Origin',
                                value: '(?<origin>.*)',
                            },
                        ],
                        headers: nextAuthHeaders,
                    },
                ];
            },
        };
    }

    return {
        ...nextConfig,
        async headers() {
            return [
                {
                    source: '/holidays/api/auth/:path*',
                    has: [
                        {
                            type: 'header',
                            key: 'Origin',
                            value: '(?<origin>^https://.*.easyjet.com$)',
                        },
                    ],
                    headers: nextAuthHeaders,
                },
                // Allow cross-origin CSS loading when assetPrefix points to the
                // rendering host (needed when Sitecore Experience Editor serves
                // the page from the CM host).
                ...(RENDERING_HOST
                    ? [
                          {
                              source: '/_next/static/:path*',
                              headers: [
                                  {
                                      key: 'Access-Control-Allow-Origin',
                                      value: '*',
                                  },
                                  {
                                      key: 'Access-Control-Allow-Methods',
                                      value: 'GET,OPTIONS',
                                  },
                              ],
                          },
                      ]
                    : []),
            ];
        },
        compress: true,
        typescript: {
            // !! WARN !!
            // Dangerously allow production builds to successfully complete even if
            // your project has type errors.
            // !! WARN !!
            // ignoreBuildErrors: true,
        },
        eslint: {
            dirs: ['app_'],
        },
    };
};

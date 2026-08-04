process.env.TZ = 'UTC';

module.exports = {
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    moduleDirectories: ['node_modules', 'src'],
    testEnvironment: 'jsdom',
    clearMocks: true,
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
    },
    transformIgnorePatterns: [
        '[/\\\\]node_modules[/\\\\](?!(@sitecore-jss|@sitecore|@sitecore-feaas|axios|react-leaflet|supercluster|kdbush)/)',
    ],
    testMatch: ['**/(src|scripts)/**/*.test.(ts|tsx|js)'],
    testResultsProcessor: './jest.testresultsprocessor.js',
    coverageReporters: ['lcov', 'text'],
    coverageDirectory: './reports/coverage',
    collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}'],
    coveragePathIgnorePatterns: [
        '.*\\.d\\.ts',
        '.*\\.test\\.ts',
        '.*\\.test\\.tsx',
        '.*\\.test\\.js',
        '.*\\.mocks\\.ts',
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
        '<rootDir>/src/backend/',
        '<rootDir>/src/code/localUrls.ts',
        '<rootDir>/src/code/routes.ts',
        '<rootDir>/src/code/settings.ts',
        '<rootDir>/src/code/tokens.ts',
        '<rootDir>/src/code/validation.config.ts',
        '<rootDir>/src/frontend/components/icons/',
        '<rootDir>/src/frontend/components/icons-new/',
        '<rootDir>/src/typings/',
        '<rootDir>/src/models/enum/',
        '<rootDir>/src/models/sitecore/',
        '<rootDir>/src/frontend/utils/tests.utils.ts',
        '<rootDir>/src/temp/',
    ],
    setupFilesAfterEnv: ['./jest.setup.js', 'jest-localstorage-mock'],
    globals: {
        NEXT_ENV: {
            WEBAPI_URL: 'http://test/api',
            SITECORE_URL: 'http://sitecore-test.com',
            PAYMENT_ORIGIN: 'http://test/api',
            SITECORE_PERSONALIZE: {
                clientKey: 'test-key',
                targetURL: 'https://test-target.com',
                pointOfSale: 'default',
                cookieDomain: '.test-cookie.com',
                includeUTMParameters: 'true',
                cookieExpiryDays: 365,
            },
            USER_MANAGEMENT_API_URL: 'http://test/user-management-api',
            NOTIFICATIONS_URL: 'http://test/notification',
            CMS_API: 'http://test/cms-api',
        },
    },
    moduleNameMapper: {
        '^@sitecore-feaas/clientside/react$': '<rootDir>/node_modules/@sitecore-feaas/clientside/dist/node/react.cjs',

        '^@sitecore-jss/sitecore-jss-nextjs$':
            '<rootDir>/node_modules/@sitecore-jss/sitecore-jss-nextjs/dist/cjs/index.js',
        '^@sitecore-jss/sitecore-jss/layout$':
            '<rootDir>/node_modules/@sitecore-jss/sitecore-jss/dist/cjs/layout/index.js',
        '^@sitecore-jss/sitecore-jss$': '<rootDir>/node_modules/@sitecore-jss/sitecore-jss/dist/cjs/index.js',
        '\\.(css|less|scss|sss|styl)$': '<rootDir>/node_modules/jest-css-modules',
    },
    reporters: ['default', 'summary'],
};

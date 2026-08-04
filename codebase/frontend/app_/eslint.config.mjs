import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import yaml from 'eslint-plugin-yml';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import typescriptSortKeys from 'eslint-plugin-typescript-sort-keys';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import eslintDataTidPlugin from './eslintCustomRules/eslint-data-tid-plugin.js';
import arrowFuncRule from './eslintCustomRules/eslint-arrow-func-plugin.js';
import preferArrow from 'eslint-plugin-prefer-arrow';
import itShouldRule from './eslintCustomRules/it-should-start-with-plugin.js';
import carouselRule from './eslintCustomRules/carousel-plugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    {
        ignores: ['.generated/**/*', '**/*.d.ts', '**/*.js'],
    },
    ...compat.extends(
        'next',
        'next/core-web-vitals',
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
        'plugin:prettier/recommended',
        'plugin:jest-formatting/recommended',
    ),
    ...yaml.configs['flat/recommended'],
    {
        files: ['**/*.ts', '**/*.tsx'],
        plugins: {
            '@typescript-eslint': typescriptEslint,
            prettier,
            yaml,
            'simple-import-sort': simpleImportSort,
            'no-relative-import-paths': noRelativeImportPaths,
            'typescript-sort-keys': typescriptSortKeys,
            eslintDataTidPlugin,
            arrowFuncRule,
            'prefer-arrow': preferArrow,
            itShouldRule,
            carouselRule,
        },
        languageOptions: {
            ecmaVersion: 6,
            sourceType: 'script',

            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            '@next/next/no-img-element': 'off', // Don't force next/image (not currently compatible with Sitecore editing)
            'jsx-a11y/alt-text': [
                'warn',
                {
                    elements: ['img'],
                },
            ], // Don't force alt for <Image/> (sourced from Sitecore media)
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    varsIgnorePattern: '_',
                    ignoreRestSiblings: true,
                },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'warn',
            'jsx-quotes': ['error', 'prefer-single'],
            '@typescript-eslint/no-empty-interface': 'error',
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'interface',
                    format: ['PascalCase'],
                    prefix: ['I'],
                    filter: {
                        regex: '^Window$',
                        match: false,
                    },
                },
                {
                    selector: 'typeAlias',
                    format: ['PascalCase'],
                    prefix: ['T'],
                },
                {
                    selector: 'enum',
                    format: ['PascalCase'],
                },
                {
                    selector: 'enumMember',
                    format: ['PascalCase'],
                },
            ],
            '@typescript-eslint/padding-line-between-statements': [
                'error',
                {
                    blankLine: 'always',
                    prev: '*',
                    next: 'return',
                },
                {
                    blankLine: 'always',
                    prev: '*',
                    next: 'if',
                },
                {
                    blankLine: 'always',
                    prev: 'if',
                    next: '*',
                },
            ],
            'react/display-name': 'off',
            'no-magic-numbers': [
                'warn',
                {
                    ignoreArrayIndexes: true,
                    ignore: [0, 1, -1],
                },
            ],
            '@typescript-eslint/no-inferrable-types': 'off', // legacy
            '@typescript-eslint/no-non-null-assertion': 'off', // legacy, set warn later
            '@typescript-eslint/lines-between-class-members': [
                'error',
                'always',
                {
                    exceptAfterSingleLine: true,
                },
            ],
            'simple-import-sort/imports': [
                'error',
                {
                    groups: [
                        // Node.js builtins.
                        [
                            '^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)',
                        ],
                        // Packages. `react` related packages come first.
                        ['^react', '^@?\\w'],
                        // Internal packages.
                        ['^(frontend(?!/components)|models|lib|code)(/.*|$)', '^(frontend/components)(/.*|$)'],
                        // Parent imports. Put `..` last.
                        ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
                        // Other relative imports. Put same-folder imports and `.` last.
                        ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
                        // Style imports.
                        ['^.+\\.s?css$'],
                    ],
                },
            ],
            'no-relative-import-paths/no-relative-import-paths': [
                'error',
                {
                    allowSameFolder: true,
                    rootDir: 'src',
                },
            ],
            // Indent rules are clashing with prettier rules
            'react/jsx-indent': 'off',
            'react/jsx-indent-props': 'off',
            'react/require-default-props': 'off',
            // This is getting flagged in every test file
            'react/jsx-props-no-spreading': 'off',
            'typescript-sort-keys/interface': [
                'error',
                'asc',
                {
                    natural: false,
                    requiredFirst: true,
                },
            ],
            'react/no-unknown-property': ['error', { ignore: ['global', 'jsx'] }],
            '@next/next/no-sync-scripts': ['warn'], // legacy
            '@typescript-eslint/ban-ts-comment': ['warn'], // legacy
            '@typescript-eslint/ban-types': ['warn'], // legacy
            '@typescript-eslint/no-empty-function': ['warn'], // legacy
            '@typescript-eslint/no-var-requires': ['warn'], // legacy
            'prefer-const': ['error'],
            'prefer-spread': ['warn'], // legacy
            'prettier/prettier': ['error'],
            'react-hooks/rules-of-hooks': ['warn'], // legacy
            'react/jsx-key': ['error'],
            'react/jsx-no-target-blank': ['warn'], // legacy
            'react/no-deprecated': ['warn'], // legacy
            'react/no-unescaped-entities': ['error'],
            'arrow-body-style': ['error', 'as-needed'],
            'no-else-return': ['error'],
            'no-restricted-syntax': [
                'error',
                {
                    selector: "CallExpression[callee.object.name='jest'][callee.property.name='clearAllMocks']",
                    message:
                        '`clearMocks` has been enabled for tests, so is already being called automatically by Jest`',
                },
            ],
            'no-duplicate-imports': [
                'error',
                {
                    includeExports: true,
                },
            ],
            'eslintDataTidPlugin/data-tid-in-snake-case': 'error',
            'arrowFuncRule/prefer-arrow-functions-in-interfaces': 'error',
            'itShouldRule/it-should-start-with': 'warn',
            'carouselRule/carousel-rule': 'error',
            'react/self-closing-comp': [
                'error',
                {
                    component: true,
                    html: true,
                },
            ],
            '@typescript-eslint/explicit-function-return-type': 'warn',
            'prefer-arrow-callback': 'warn',
            'func-style': 'warn',
            'prefer-arrow/prefer-arrow-functions': [
                'warn',
                {
                    disallowPrototype: true,
                    singleReturnOnly: false,
                    classPropertiesAllowed: true,
                },
            ],
            '@typescript-eslint/prefer-optional-chain': 'warn',
        },
    },
    {
        files: ['**/*.test.ts', '**/*.test.tsx', 'src/frontend/__mocks__/*'],
        rules: {
            'no-magic-numbers': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
        },
    },
    {
        files: [
            'src/frontend/components/common/CarouselWrapper/CarouselWrapper.tsx',
            'src/frontend/components/common/CarouselWrapper/CarouselWrapper.utils.ts',
        ],
        rules: {
            'carouselRule/carousel-rule': 'off',
        },
    },
];

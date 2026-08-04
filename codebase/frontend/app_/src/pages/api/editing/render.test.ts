import { EditingRenderMiddleware } from '@sitecore-jss/sitecore-jss-nextjs/editing';
import { NextApiRequest, NextApiResponse } from 'next';

import { buildBasePathByLang } from 'code/basePath';

import handler from './render';

const mockGetHandler = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs/editing', () => ({
    EditingDataDiskCache: jest.fn(),
    BasicEditingDataService: jest.fn(),
    editingDataService: {},
    EditingRenderMiddleware: jest.fn().mockImplementation(() => ({
        getHandler: jest.fn().mockReturnValue(mockGetHandler),
    })),
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    AxiosDataFetcher: jest.fn(),
}));

jest.mock('code/basePath', () => ({
    buildBasePathByLang: jest.fn().mockReturnValue('/mock/base/path'),
}));

jest.mock('code/env.server', () => ({
    getEnv: jest.fn().mockReturnValue({
        PUBLIC_URL: 'https://example.com',
        ASSET_PREFIX: '/holidays',
    }),
}));

import { getEnv } from 'code/env.server';
const mockGetEnv = getEnv as jest.Mock;

describe('Render', () => {
    let req: Partial<NextApiRequest>;
    let res: Partial<NextApiResponse>;
    let originalJson: jest.Mock;
    let originalSend: jest.Mock;
    let originalEnd: jest.Mock;
    let originalWrite: jest.Mock;

    beforeEach(() => {
        mockGetEnv.mockReturnValue({
            PUBLIC_URL: 'https://example.com',
            ASSET_PREFIX: '/holidays',
        });

        originalJson = jest.fn().mockReturnThis();
        originalSend = jest.fn().mockReturnThis();
        originalEnd = jest.fn().mockReturnThis();
        originalWrite = jest.fn().mockReturnThis();

        req = {
            body: {
                id: 'TradePortal',
                args: ['/path', '{}', JSON.stringify({ language: 'fr-FR' })],
            },
            headers: {
                host: 'localhost:3000',
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: originalJson,
            send: originalSend,
            end: originalEnd,
            write: originalWrite,
        };
    });

    it('should initialize middleware and call the handler successfully', async () => {
        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(EditingRenderMiddleware).toHaveBeenCalledTimes(1);
        expect(mockGetHandler).toHaveBeenCalledWith(req, expect.any(Object));
        expect(buildBasePathByLang).toHaveBeenCalledWith('fr-FR', true);
    });

    it('should handle errors and log them', async () => {
        const error = new Error('Middleware failed');
        mockGetHandler.mockRejectedValueOnce(error);

        await handler(req as NextApiRequest, res as NextApiResponse);

        // Error is logged via logger.error
        expect(mockGetHandler).toHaveBeenCalled();
    });

    it('should handle malformed request body gracefully', async () => {
        req.body = {};

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(mockGetHandler).toHaveBeenCalled();
    });

    it('should use default language when viewBag has no language', async () => {
        req.body = {
            id: 'Holidays',
            args: ['/path', '{}', JSON.stringify({})],
        };

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(buildBasePathByLang).toHaveBeenCalledWith('en', false);
    });

    it('should handle non-TradePortal site name', async () => {
        req.body = {
            id: 'Holidays',
            args: ['/path', '{}', JSON.stringify({ language: 'de-DE' })],
        };

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(buildBasePathByLang).toHaveBeenCalledWith('de-DE', false);
    });

    it('should handle missing site name', async () => {
        req.body = {
            args: ['/path', '{}', JSON.stringify({ language: 'en' })],
        };

        await handler(req as NextApiRequest, res as NextApiResponse);

        expect(buildBasePathByLang).toHaveBeenCalledWith('en', false);
    });

    describe('Middleware callbacks', () => {
        let config: any;

        beforeEach(async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);
            config = (EditingRenderMiddleware as jest.Mock).mock.calls[0][0];
        });

        it('should correctly format the URL with resolvePageUrl', () => {
            const serverUrl = 'http://localhost';
            const itemPath = '/home';

            const result = config.resolvePageUrl(serverUrl, itemPath);

            expect(result).toBe('http://localhost/mock/base/path/home');
        });

        it('should remove trailing slashes with resolvePageUrl', () => {
            const serverUrl = 'http://localhost';
            const itemPath = '/home/';

            const result = config.resolvePageUrl(serverUrl, itemPath);

            expect(result).toBe('http://localhost/mock/base/path/home');
        });

        it('should remove multiple trailing slashes with resolvePageUrl', () => {
            const serverUrl = 'http://localhost';
            const itemPath = '/home///';

            const result = config.resolvePageUrl(serverUrl, itemPath);

            expect(result).toBe('http://localhost/mock/base/path/home');
        });

        it('should resolve server URL based on NODE_ENV', () => {
            const mockReq = { headers: { host: 'example.com' } } as NextApiRequest;

            const result = config.resolveServerUrl(mockReq);

            expect(result).toBe('http://example.com');
        });
    });

    describe('Asset URL fixing', () => {
        it('should fix relative CSS URLs in JSON response', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlWithRelativeUrls = {
                html: '<html><head><link href="/holidays/_next/static/css/styles.css" rel="stylesheet" /></head></html>',
            };

            wrappedRes.json(htmlWithRelativeUrls);

            expect(originalJson).toHaveBeenCalledWith({
                html: '<html><head><link href="https://example.com/holidays/_next/static/css/styles.css" rel="stylesheet" /></head></html>',
            });
        });

        it('should fix relative JS URLs in JSON response', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlWithRelativeUrls = {
                html: '<html><body><script src="/holidays/_next/static/chunks/main.js"></script></body></html>',
            };

            wrappedRes.json(htmlWithRelativeUrls);

            expect(originalJson).toHaveBeenCalledWith({
                html: '<html><body><script src="https://example.com/holidays/_next/static/chunks/main.js"></script></body></html>',
            });
        });

        it('should fix multiple asset URLs in JSON response', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlWithMultipleUrls = {
                html: `
                    <html>
                        <head>
                            <link href="/holidays/_next/static/css/one.css" />
                            <link href="/holidays/_next/static/css/two.css" />
                        </head>
                        <body>
                            <script src="/holidays/_next/static/chunks/main.js"></script>
                        </body>
                    </html>
                `,
            };

            wrappedRes.json(htmlWithMultipleUrls);

            const result = originalJson.mock.calls[0][0].html;
            expect(result).toContain('href="https://example.com/holidays/_next/static/css/one.css"');
            expect(result).toContain('href="https://example.com/holidays/_next/static/css/two.css"');
            expect(result).toContain('src="https://example.com/holidays/_next/static/chunks/main.js"');
        });

        it('should not modify URLs that are already absolute', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlWithAbsoluteUrls = {
                html: '<html><head><link href="https://other.com/holidays/_next/static/css/styles.css" /></head></html>',
            };

            wrappedRes.json(htmlWithAbsoluteUrls);

            expect(originalJson).toHaveBeenCalledWith({
                html: '<html><head><link href="https://other.com/holidays/_next/static/css/styles.css" /></head></html>',
            });
        });

        it('should not modify non-_next URLs', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlWithOtherUrls = {
                html: '<html><head><link href="/holidays/static/custom.css" /></head></html>',
            };

            wrappedRes.json(htmlWithOtherUrls);

            expect(originalJson).toHaveBeenCalledWith({
                html: '<html><head><link href="/holidays/static/custom.css" /></head></html>',
            });
        });

        it('should handle response without HTML property', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const bodyWithoutHtml = { error: 'Something went wrong' };

            wrappedRes.json(bodyWithoutHtml);

            expect(originalJson).toHaveBeenCalledWith({ error: 'Something went wrong' });
        });

        it('should handle null body in JSON response', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            wrappedRes.json(null);

            expect(originalJson).toHaveBeenCalledWith(null);
        });

        it('should fix URLs in string body via send', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlString = '<html><head><link href="/holidays/_next/static/css/styles.css" /></head></html>';

            wrappedRes.send(htmlString);

            expect(originalSend).toHaveBeenCalledWith(
                '<html><head><link href="https://example.com/holidays/_next/static/css/styles.css" /></head></html>',
            );
        });

        it('should not modify non-string body via send', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const objectBody = { data: 'test' };

            wrappedRes.send(objectBody);

            expect(originalSend).toHaveBeenCalledWith({ data: 'test' });
        });

        it('should fix URLs in string body via end', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlString = '<html><head><link href="/holidays/_next/static/css/styles.css" /></head></html>';

            wrappedRes.end(htmlString);

            expect(originalEnd).toHaveBeenCalledWith(
                '<html><head><link href="https://example.com/holidays/_next/static/css/styles.css" /></head></html>',
                undefined,
                undefined,
            );
        });

        it('should fix URLs in Buffer body via end', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlString = '<html><head><link href="/holidays/_next/static/css/styles.css" /></head></html>';
            const buffer = Buffer.from(htmlString, 'utf8');

            wrappedRes.end(buffer);

            const expectedHtml =
                '<html><head><link href="https://example.com/holidays/_next/static/css/styles.css" /></head></html>';
            expect(originalEnd).toHaveBeenCalledWith(Buffer.from(expectedHtml, 'utf8'), undefined, undefined);
        });

        it('should fix URLs in string body via write', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlString = '<html><head><link href="/holidays/_next/static/css/styles.css" /></head></html>';

            wrappedRes.write(htmlString);

            expect(originalWrite).toHaveBeenCalledWith(
                '<html><head><link href="https://example.com/holidays/_next/static/css/styles.css" /></head></html>',
                undefined,
                undefined,
            );
        });

        it('should use default ASSET_PREFIX when not set in getEnv', async () => {
            mockGetEnv.mockReturnValue({
                PUBLIC_URL: 'https://example.com',
                ASSET_PREFIX: undefined,
            });

            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlWithRelativeUrls = {
                html: '<html><head><link href="/holidays/_next/static/css/styles.css" /></head></html>',
            };

            wrappedRes.json(htmlWithRelativeUrls);

            expect(originalJson).toHaveBeenCalledWith({
                html: '<html><head><link href="https://example.com/holidays/_next/static/css/styles.css" /></head></html>',
            });
        });

        it('should handle empty HTML string', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlWithEmptyString = { html: '' };

            wrappedRes.json(htmlWithEmptyString);

            expect(originalJson).toHaveBeenCalledWith({ html: '' });
        });

        it('should fix URLs without asset prefix (just /_next/)', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlWithNoPrefix = {
                html: '<html><head><link href="/_next/static/css/styles.css" /></head></html>',
            };

            wrappedRes.json(htmlWithNoPrefix);

            expect(originalJson).toHaveBeenCalledWith({
                html: '<html><head><link href="https://example.com/holidays/_next/static/css/styles.css" /></head></html>',
            });
        });

        it('should fix CSS url() references', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlWithCssUrl = {
                html: '<style>body { background: url(/holidays/_next/static/media/bg.png); }</style>',
            };

            wrappedRes.json(htmlWithCssUrl);

            expect(originalJson).toHaveBeenCalledWith({
                html: '<style>body { background: url(https://example.com/holidays/_next/static/media/bg.png); }</style>',
            });
        });

        it('should fix JSON escaped URLs in inline scripts', async () => {
            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlWithJsonUrls = {
                html: '<script>var config = {"assetPath":"/holidays/_next/static/"};</script>',
            };

            wrappedRes.json(htmlWithJsonUrls);

            expect(originalJson).toHaveBeenCalledWith({
                html: '<script>var config = {"assetPath":"https://example.com/holidays/_next/static/"};</script>',
            });
        });

        it('should use PUBLIC_URL from getEnv', async () => {
            mockGetEnv.mockReturnValue({
                PUBLIC_URL: 'https://from-env-json.com',
                ASSET_PREFIX: '/holidays',
            });

            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlWithRelativeUrls = {
                html: '<html><head><link href="/holidays/_next/static/css/styles.css" /></head></html>',
            };

            wrappedRes.json(htmlWithRelativeUrls);

            expect(originalJson).toHaveBeenCalledWith({
                html: '<html><head><link href="https://from-env-json.com/holidays/_next/static/css/styles.css" /></head></html>',
            });
        });

        it('should not fix URLs when PUBLIC_URL is empty', async () => {
            mockGetEnv.mockReturnValue({
                PUBLIC_URL: '',
                ASSET_PREFIX: '/holidays',
            });

            await handler(req as NextApiRequest, res as NextApiResponse);

            const wrappedRes = mockGetHandler.mock.calls[0][1];

            const htmlWithRelativeUrls = {
                html: '<html><head><link href="/holidays/_next/static/css/styles.css" /></head></html>',
            };

            wrappedRes.json(htmlWithRelativeUrls);

            expect(originalJson).toHaveBeenCalledWith({
                html: '<html><head><link href="/holidays/_next/static/css/styles.css" /></head></html>',
            });
        });
    });
});

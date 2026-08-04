import { NextRequest } from 'next/server';
import { match } from 'node-match-path';

import { middleware } from './middleware';

jest.mock('node-match-path', () => ({
    match: jest.fn(),
}));

jest.mock('code/env', () => ({
    envAll: {
        SITECORE_URL: 'https://mock-sitecore.com',
        CMS_MEDIA: '/holidays/cms/media',
        CMS_API: '/holidays/cms/api',
        CMS_TRACK_API: '/holidays/cms/track',
        CMS_LAYOUTS_SYSTEM: '/holidays/layouts/system',
        SITECORE_API_KEY: 'mock-api-key-123',
    },
}));

const mockRewrite = jest.fn();
const mockNext = jest.fn();
const mockHeadersSet = jest.fn();

jest.mock('next/server', () => ({
    NextResponse: {
        rewrite: (...args: any[]) => {
            mockRewrite(...args);

            return { type: 'rewrite', url: args[0] };
        },
        next: (...args: any[]) => {
            mockNext(...args);

            return {
                type: 'next',
                headers: {
                    set: mockHeadersSet,
                },
            };
        },
    },
    NextRequest: jest.fn(),
}));

const createMockRequest = (pathname: string, search: string = '', basePath: string = ''): NextRequest => {
    const url = `http://localhost:3000${basePath}${pathname}${search}`;

    return {
        nextUrl: {
            basePath: basePath,
            pathname: pathname,
            search: search,
            href: url,
            origin: 'http://localhost:3000',
        },
        url: url,
    } as any;
};

describe('Middleware', () => {
    const mockedMatch = match as jest.MockedFunction<typeof match>;

    beforeEach(() => {
        mockedMatch.mockReturnValue({ matches: false, params: {} });
    });

    it('should proxy favicon.ico requests', async () => {
        const request = createMockRequest('/favicon.ico');
        const expectedRewriteUrl = 'https://mock-sitecore.com/-/media/CC737152BF1348EEA704ECFAD8BDFF9F.ashx';

        const response = await middleware(request);

        expect(mockRewrite).toHaveBeenCalledTimes(1);
        expect(mockRewrite).toHaveBeenCalledWith(expectedRewriteUrl);
        expect(mockNext).not.toHaveBeenCalled();
        expect(response).toEqual({ type: 'rewrite', url: expectedRewriteUrl });
    });

    it('should NOT proxy CMS media requests if path does not match pattern', async () => {
        const pathname = '/holidays/cms/media/other/stuff.jpg';
        const request = createMockRequest(pathname);
        const normalizedPath = '/other/stuff.jpg';

        // mock match will return false
        const response = await middleware(request);

        expect(mockedMatch).toHaveBeenCalledWith('/-/:path/*', normalizedPath);
        expect(mockRewrite).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(response?.type).toBe('next');
    });

    it('should proxy CMS API requests', async () => {
        const pathname = '/holidays/cms/api/content/search';
        const search = '?term=beach';
        const request = createMockRequest(pathname, search);
        const expectedRewriteUrl = `${'https://mock-sitecore.com'}/api/content/search${search}`;

        const response = await middleware(request);

        expect(mockRewrite).toHaveBeenCalledTimes(1);
        expect(mockRewrite).toHaveBeenCalledWith(expectedRewriteUrl);
        expect(mockNext).not.toHaveBeenCalled();
        expect(response).toEqual({ type: 'rewrite', url: expectedRewriteUrl });
    });

    it('should proxy CMS Track API requests', async () => {
        const pathname = '/holidays/cms/track/event';
        const request = createMockRequest(pathname);
        const expectedRewriteUrl = 'https://mock-sitecore.com/event?sc_apikey=mock-api-key-123';

        const response = await middleware(request);

        expect(mockRewrite).toHaveBeenCalledTimes(1);
        expect(mockRewrite).toHaveBeenCalledWith(expectedRewriteUrl);
        expect(mockNext).not.toHaveBeenCalled();
        expect(response).toEqual({ type: 'rewrite', url: expectedRewriteUrl });
    });

    it('should proxy CMS Layouts System requests', async () => {
        const pathname = '/holidays/layouts/system/visitor-identification';
        const search = '?vid=test';
        const request = createMockRequest(pathname, search);
        const expectedRewriteUrl = `${'https://mock-sitecore.com'}/layouts/system/visitor-identification${search}`;

        const response = await middleware(request);

        expect(mockRewrite).toHaveBeenCalledTimes(1);
        expect(mockRewrite).toHaveBeenCalledWith(expectedRewriteUrl);
        expect(mockNext).not.toHaveBeenCalled();
        expect(response).toEqual({ type: 'rewrite', url: expectedRewriteUrl });
    });

    it('should add CSP header for /login path', async () => {
        const pathname = '/holidays/login';
        const request = createMockRequest(pathname);

        const response = await middleware(request);

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockHeadersSet).toHaveBeenCalledTimes(1);
        expect(mockHeadersSet).toHaveBeenCalledWith('Content-Security-Policy', "frame-ancestors 'self';");
        expect(mockRewrite).not.toHaveBeenCalled();
        expect(response?.type).toBe('next');
    });

    it('should add CSP header for trade portal /log-in path', async () => {
        const pathname = '/holidays/trade-portal/log-in';
        const request = createMockRequest(pathname);

        const response = await middleware(request);

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockHeadersSet).toHaveBeenCalledTimes(1);
        expect(mockHeadersSet).toHaveBeenCalledWith('Content-Security-Policy', "frame-ancestors 'self';");
        expect(mockRewrite).not.toHaveBeenCalled();
        expect(response?.type).toBe('next');
    });

    it('should call next() for unhandled paths', async () => {
        const pathname = '/some/other/unmatched/path';
        const request = createMockRequest(pathname);

        const response = await middleware(request);

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockHeadersSet).not.toHaveBeenCalled();
        expect(mockRewrite).not.toHaveBeenCalled();
        expect(response?.type).toBe('next');
    });
});

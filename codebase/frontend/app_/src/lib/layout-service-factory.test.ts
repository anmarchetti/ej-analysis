import { layoutServiceFactory } from 'lib/layout-service-factory';

const mockedAxiosDataFetcher = jest.fn();
const mockedConfigOnReq = jest.fn();
let capturedOnReq: ((reqConfig: any) => any) | undefined;
let capturedOnRes: ((serverRes: any) => any) | undefined;
let capturedOnResError: ((error: any) => Promise<never>) | undefined;

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    AxiosDataFetcher: function (config: any) {
        mockedAxiosDataFetcher(config);
        capturedOnReq = config.onReq;
        capturedOnRes = config.onRes;
        capturedOnResError = config.onResError;
        config.onReq && mockedConfigOnReq(config.onReq({ headers: { common: {} } }));
    },
}));

/** Creates an AxiosHeaders-like object (axios v1.x) with .get() / .set() methods. */
const createAxiosHeaders = (initialCookie?: string) => {
    const store: Record<string, string> = {};

    if (initialCookie) {
        store['cookie'] = initialCookie;
    }

    return {
        get: jest.fn((key: string) => store[key.toLowerCase()] ?? null),
        set: jest.fn((key: string, value: string) => {
            store[key.toLowerCase()] = value;
        }),
        common: {} as any,
    };
};

describe('LayoutServiceFactory', () => {
    const layoutService = layoutServiceFactory.create();

    beforeEach(() => {
        capturedOnReq = undefined;
        capturedOnRes = undefined;
        capturedOnResError = undefined;

        const mockSetupReq = jest.fn(p => p);
        const mockSetupRes = jest.fn(p => p);

        layoutService['setupReqHeaders'] = jest.fn(() => mockSetupReq);
        layoutService['setupResHeaders'] = jest.fn(() => mockSetupRes);
    });

    describe('getDefaultFetcher', () => {
        it('should be called with empty config when req and res undefined', () => {
            layoutService['getDefaultFetcher']();

            expect(mockedAxiosDataFetcher).toHaveBeenCalledWith({});
            expect(mockedConfigOnReq).not.toHaveBeenCalled();
        });

        describe('onReq - plain headers object (hasHeaderMethods = false)', () => {
            it('should be called with common headers in req config', () => {
                layoutService['getDefaultFetcher'](
                    {} as any,
                    {
                        req: {
                            cookies: {
                                EASYJET_ENSIGHTEN_PRIVACY_BANNER_LOADED: 1,
                            },
                        },
                        locals: { publicIp: 'publicIp' },
                    } as any,
                );

                expect(mockedConfigOnReq).toHaveBeenCalledWith({
                    headers: {
                        common: { 'X-Forwarded-For': 'publicIp' },
                        Cookie: '',
                    },
                });
                expect(layoutService['setupReqHeaders']).toHaveBeenCalledWith({});
            });

            it('should be called with browser id cookies when they exist', () => {
                layoutService['getDefaultFetcher'](
                    {} as any,
                    {
                        req: {
                            cookies: {
                                EASYJET_ENSIGHTEN_PRIVACY_BANNER_LOADED: 1,
                                bid_262ffdbe2e64ebf37cce23351ebb445e: '54e3d0b3-44fc-4dc7-b022-8615700c2b69',
                                bid_123ffdbe2e64ebf37cce23351ebb445e: '4563d0b3-44fc-4dc7-b022-8615700c2b69',
                            },
                        },
                        locals: {},
                    } as any,
                );

                expect(mockedConfigOnReq).toHaveBeenCalledWith({
                    headers: {
                        common: {},
                        Cookie: 'bid_262ffdbe2e64ebf37cce23351ebb445e=54e3d0b3-44fc-4dc7-b022-8615700c2b69; bid_123ffdbe2e64ebf37cce23351ebb445e=4563d0b3-44fc-4dc7-b022-8615700c2b69',
                    },
                });
                expect(layoutService['setupReqHeaders']).toHaveBeenCalledWith({});
            });
        });

        describe('onReq - AxiosHeaders (hasHeaderMethods = true)', () => {
            it('should set X-Forwarded-For via headers.set when publicIp is present', () => {
                layoutService['getDefaultFetcher'](
                    {} as any,
                    {
                        req: { cookies: {} },
                        locals: { publicIp: '1.2.3.4' },
                    } as any,
                );

                const headers = createAxiosHeaders();

                capturedOnReq!({ headers });

                expect(headers.set).toHaveBeenCalledWith('X-Forwarded-For', '1.2.3.4');
            });

            it('should forward User-Agent header when present on req', () => {
                layoutService['getDefaultFetcher'](
                    { headers: { 'user-agent': 'Mozilla/5.0 TestBrowser' } } as any,
                    {
                        req: { cookies: {} },
                        locals: {},
                    } as any,
                );

                const headers = createAxiosHeaders();

                capturedOnReq!({ headers });

                expect(headers.set).toHaveBeenCalledWith('User-Agent', 'Mozilla/5.0 TestBrowser');
            });

            it('should not set User-Agent when absent from req', () => {
                layoutService['getDefaultFetcher'](
                    { headers: {} } as any,
                    {
                        req: { cookies: {} },
                        locals: {},
                    } as any,
                );

                const headers = createAxiosHeaders();

                capturedOnReq!({ headers });

                const uaCall = headers.set.mock.calls.find(([key]) => key === 'User-Agent');

                expect(uaCall).toBeUndefined();
            });

            it('should forward Referer header when present on req', () => {
                layoutService['getDefaultFetcher'](
                    { headers: { referer: 'https://example.com/page' } } as any,
                    {
                        req: { cookies: {} },
                        locals: {},
                    } as any,
                );

                const headers = createAxiosHeaders();

                capturedOnReq!({ headers });

                expect(headers.set).toHaveBeenCalledWith('Referer', 'https://example.com/page');
            });

            it('should not set Referer when absent from req', () => {
                layoutService['getDefaultFetcher'](
                    { headers: {} } as any,
                    {
                        req: { cookies: {} },
                        locals: {},
                    } as any,
                );

                const headers = createAxiosHeaders();

                capturedOnReq!({ headers });

                const refererCall = headers.set.mock.calls.find(([key]) => key === 'Referer');

                expect(refererCall).toBeUndefined();
            });

            it('should not set X-Forwarded-For when publicIp is absent', () => {
                layoutService['getDefaultFetcher'](
                    {} as any,
                    {
                        req: { cookies: {} },
                        locals: {},
                    } as any,
                );

                const headers = createAxiosHeaders();

                capturedOnReq!({ headers });

                const forwardedCall = headers.set.mock.calls.find(([key]) => key === 'X-Forwarded-For');

                expect(forwardedCall).toBeUndefined();
            });

            it('should forward User-Agent header when present on req', () => {
                layoutService['getDefaultFetcher'](
                    { headers: { 'user-agent': 'Mozilla/5.0 TestBrowser' } } as any,
                    {
                        req: { cookies: {} },
                        locals: {},
                    } as any,
                );

                const headers = createAxiosHeaders();

                capturedOnReq!({ headers });

                expect(headers.set).toHaveBeenCalledWith('User-Agent', 'Mozilla/5.0 TestBrowser');
            });

            it('should not set User-Agent when absent from req', () => {
                layoutService['getDefaultFetcher'](
                    { headers: {} } as any,
                    {
                        req: { cookies: {} },
                        locals: {},
                    } as any,
                );

                const headers = createAxiosHeaders();

                capturedOnReq!({ headers });

                const uaCall = headers.set.mock.calls.find(([key]) => key === 'User-Agent');

                expect(uaCall).toBeUndefined();
            });

            it('should forward Referer header when present on req', () => {
                layoutService['getDefaultFetcher'](
                    { headers: { referer: 'https://example.com/page' } } as any,
                    {
                        req: { cookies: {} },
                        locals: {},
                    } as any,
                );

                const headers = createAxiosHeaders();

                capturedOnReq!({ headers });

                expect(headers.set).toHaveBeenCalledWith('Referer', 'https://example.com/page');
            });

            it('should not set Referer when absent from req', () => {
                layoutService['getDefaultFetcher'](
                    { headers: {} } as any,
                    {
                        req: { cookies: {} },
                        locals: {},
                    } as any,
                );

                const headers = createAxiosHeaders();

                capturedOnReq!({ headers });

                const refererCall = headers.set.mock.calls.find(([key]) => key === 'Referer');

                expect(refererCall).toBeUndefined();
            });

            it('should fall back to req.headers.cookie when AxiosHeaders has no Cookie set', () => {
                layoutService['getDefaultFetcher'](
                    { headers: { cookie: 'SC_ANALYTICS_GLOBAL_COOKIE=abc123; ASP.NET_SessionId=sess' } } as any,
                    {
                        req: { cookies: {} },
                        locals: {},
                    } as any,
                );

                const headers = createAxiosHeaders(); // no pre-set Cookie

                capturedOnReq!({ headers });

                const cookieCall = headers.set.mock.calls.find(([key]) => key === 'Cookie');

                expect(cookieCall).toBeDefined();
                expect(cookieCall![1]).toContain('SC_ANALYTICS_GLOBAL_COOKIE=abc123');
                expect(cookieCall![1]).toContain('ASP.NET_SessionId=sess');
            });

            it('should prefer AxiosHeaders Cookie over req.headers.cookie when already set', () => {
                layoutService['getDefaultFetcher'](
                    { headers: { cookie: 'original=should-not-appear' } } as any,
                    {
                        req: { cookies: { bid_abc: 'bid-value' } },
                        locals: {},
                    } as any,
                );

                const headers = createAxiosHeaders('pre-existing=cookie');

                capturedOnReq!({ headers });

                const cookieCall = headers.set.mock.calls.find(([key]) => key === 'Cookie');

                expect(cookieCall![1]).toContain('pre-existing=cookie');
                expect(cookieCall![1]).toContain('bid_abc=bid-value');
                expect(cookieCall![1]).not.toContain('original=should-not-appear');
            });
        });

        describe('onRes', () => {
            beforeEach(() => {
                layoutService['getDefaultFetcher'](
                    {} as any,
                    {
                        req: { cookies: {} },
                        locals: {},
                    } as any,
                );
            });

            it('should pass serverRes through setupResHeaders and return its result', () => {
                const serverRes = {
                    status: 200,
                    data: { sitecore: { context: {} } },
                    headers: {},
                };

                const result = capturedOnRes!(serverRes);

                // setupResHeaders is an identity mock (p => p), so result === serverRes
                expect(result).toBe(serverRes);
            });
        });

        describe('onResError', () => {
            let mockRes: any;

            beforeEach(() => {
                mockRes = {
                    req: { cookies: {} },
                    locals: {},
                    setHeader: jest.fn(),
                };

                layoutService['getDefaultFetcher']({} as any, mockRes);
            });

            it('should call res.setHeader with set-cookie and reject with the error when set-cookie header is present', async () => {
                const setCookieValue = ['session=abc; Path=/', 'token=xyz; HttpOnly'];
                const error = { response: { headers: { 'set-cookie': setCookieValue } } };

                await expect(capturedOnResError!(error)).rejects.toBe(error);

                expect(mockRes.setHeader).toHaveBeenCalledWith('set-cookie', setCookieValue);
            });

            it('should not call res.setHeader and still reject when error response has no set-cookie header', async () => {
                const error = { response: { headers: { 'content-type': 'application/json' } } };

                await expect(capturedOnResError!(error)).rejects.toBe(error);

                expect(mockRes.setHeader).not.toHaveBeenCalled();
            });

            it('should not call res.setHeader and still reject when error has no response property', async () => {
                const error = new Error('network failure');

                await expect(capturedOnResError!(error)).rejects.toBe(error);

                expect(mockRes.setHeader).not.toHaveBeenCalled();
            });

            it('should not call res.setHeader and still reject when error is null', async () => {
                await expect(capturedOnResError!(null)).rejects.toBeNull();

                expect(mockRes.setHeader).not.toHaveBeenCalled();
            });
        });
    });
});

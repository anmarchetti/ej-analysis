import { ISitecoreLayout } from 'models/data/SitecoreLayout';

import { getRedirectFromLayout } from './redirect.utils';

describe('redirect.utils', () => {
    describe('getRedirectParams', () => {
        it('should return redirect params from context', () => {
            const res = getRedirectFromLayout(
                {
                    sitecore: {
                        context: {
                            redirect: {
                                preserveQueryString: false,
                                redirectType: 301,
                                redirectUrl: '/test-1',
                            },
                        },
                        route: { fields: undefined },
                    },
                } as ISitecoreLayout,
                '/test',
            );

            expect(res).toEqual({ destination: '/test-1', statusCode: 301 });
        });

        it('should return redirect params from fields', () => {
            const res = getRedirectFromLayout(
                {
                    sitecore: {
                        context: { redirect: undefined },
                        route: {
                            fields: {
                                RedirectType: { value: 302 },
                                RedirectUrl: { value: { href: '/test-2' } },
                            },
                        },
                    },
                } as ISitecoreLayout,
                '/test',
            );

            expect(res).toEqual({ destination: '/test-2', statusCode: 302 });
        });

        it('should return redirect params from fields if there are fields and context', () => {
            const res = getRedirectFromLayout(
                {
                    sitecore: {
                        context: {
                            redirect: {
                                preserveQueryString: false,
                                redirectType: 301,
                                redirectUrl: '/test-1',
                            },
                        },
                        route: {
                            fields: {
                                RedirectType: { value: 302 },
                                RedirectUrl: { value: { href: '/test-2' } },
                            },
                        },
                    },
                } as ISitecoreLayout,
                '/test',
            );

            expect(res).toEqual({ destination: '/test-2', statusCode: 302 });
        });

        it('should return Null if no redirect url', () => {
            const res = getRedirectFromLayout(
                {
                    sitecore: {
                        context: { redirect: undefined },
                        route: { fields: undefined },
                    },
                } as ISitecoreLayout,
                '/test',
            );

            expect(res).toBeNull();
        });

        it('should return Null if redirect url equals current path', () => {
            const res = getRedirectFromLayout(
                {
                    sitecore: {
                        context: {
                            redirect: {
                                preserveQueryString: false,
                                redirectType: 301,
                                redirectUrl: '/test',
                            },
                        },
                    },
                } as ISitecoreLayout,
                '/test',
            );

            expect(res).toBeNull();
        });
    });
});

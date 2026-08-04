import { Request as ExpressRequest } from 'express';
import { GetServerSidePropsContext } from 'next';

import { TServerSidePageContext, TServerSidePageContextResProps } from 'lib/page-props';

export const createServerSidePageContext = (context?: Partial<TServerSidePageContext>): TServerSidePageContext => ({
    params: {
        path: ['en', 'holidays', 'mixedresultlist'],
    },
    res: {
        locals: {
            basePath: '/en/holidays',
        },
    } as TServerSidePageContextResProps,
    req: {
        originalUrl: '/',
        cookies: {},
        headers: {
            'user-agent': 'user-agent-header',
        },
    } as GetServerSidePropsContext['req'] & ExpressRequest,
    resolvedUrl: '',
    query: {},
    ...(!!context && { context }),
});

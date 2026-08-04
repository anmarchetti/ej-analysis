import { NextRequest, NextResponse } from 'next/server';
import { match } from 'node-match-path';

import { envAll } from 'code/env';

export function middleware(request: NextRequest): Promise<Response | undefined> | Response | undefined {
    const pathName = request.nextUrl.basePath + request.nextUrl.pathname;

    // Hardcoded favicon proxy
    if (pathName === '/favicon.ico') {
        return NextResponse.rewrite(envAll.SITECORE_URL + '/-/media/CC737152BF1348EEA704ECFAD8BDFF9F.ashx');
    }

    // proxy Sitecore media to Sitecore CMS
    if (pathName.startsWith(envAll.CMS_MEDIA)) {
        const normalizedPath = pathName.replace(envAll.CMS_MEDIA, '');

        if (match('/-/:path/*', normalizedPath).matches) {
            return NextResponse.rewrite(
                envAll.SITECORE_URL + normalizedPath.replace('(', '%28').replace(')', '%29') + request.nextUrl.search,
            );
        }
    }

    // proxy to Sitecore API call to Sitecore CMS
    if (pathName.startsWith(envAll.CMS_API)) {
        return NextResponse.rewrite(
            envAll.SITECORE_URL + pathName.replace('/holidays/cms', '') + request.nextUrl.search,
        );
    }

    // proxy Sitecore tracking API to Sitecore CMS
    if (pathName.startsWith(envAll.CMS_TRACK_API)) {
        return NextResponse.rewrite(
            `${envAll.SITECORE_URL}${pathName.replace('/holidays/cms/track', '')}?sc_apikey=${envAll.SITECORE_API_KEY}`,
        );
    }

    // proxy Sitecore layouts/system to Sitecore CMS (used for visitor identification)
    if (pathName.startsWith(envAll.CMS_LAYOUTS_SYSTEM)) {
        return NextResponse.rewrite(envAll.SITECORE_URL + pathName.replace('/holidays', '') + request.nextUrl.search);
    }

    // prevent login page from being embedded in an iframe
    if (pathName.endsWith('/login') || pathName.endsWith('/log-in')) {
        const response = NextResponse.next();
        response.headers.set('Content-Security-Policy', "frame-ancestors 'self';");

        return response;
    }

    return NextResponse.next();
}

// The payload of certain page requests exceeds what middleware is
// currently able to handle (e.g. '/booking/payment'). This means we must
// be careful about which paths we want to handle with middleware.

// See: https://jira.build.easyjet.com/browse/EJH-16083

export const config = {
    runtime: 'nodejs',

    // Dynamic values are NOT supported in the matcher so we need to
    // use forgiving regexes to account for prefixed or nested paths in
    // our environment variables.

    // Testing: https://codesandbox.io/s/path-to-regex-test-forked-7jp8jl?file=/src/index.js:177-334

    matcher: [
        '/favicon.ico',

        // CMS_MEDIA
        '/(.*)cms/media/:path*',

        // CMS_API
        '/(.*)cms/api/:path*',

        // CMS_TRACK_API
        '/(.*)cms/track/:path*',

        // CMS_LAYOUTS_SYSTEM
        '/(.*)layouts/system/:path*',

        // login
        '/(.*)/holidays/login',
        '/(.*)/holidays/trade-portal/log-in',
    ],
};

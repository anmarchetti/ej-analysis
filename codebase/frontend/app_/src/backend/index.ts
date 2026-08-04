import path from 'path';

import { getPublicUrl } from '@sitecore-jss/sitecore-jss-nextjs/utils';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
/* eslint-disable import/no-duplicates */
import nextJS from 'next';
import { NextServerOptions } from 'next/dist/server/next';
/* eslint-enable */
import parseUrl from 'parse-url';
import qs from 'qs';

import { getEnv } from 'code/env.server';
import { buildRoomsQueryParams } from 'frontend/utils/url.utils';
import { IQueryRoomParams } from 'models/data/URLQueryRooms';
import HttpsStatusCodes from 'models/enum/HttpStatusCodes';
import { QueryParamName } from 'models/enum/QueryParamName';
import { SiteName } from 'models/enum/SiteName';

import { getLocalsFromNextUrl } from './utils/getLocalsFromNextUrl';
import { getSitecorePlaceholderLayout } from './utils/getPlaceholderLayout';
import { isDotcomQuery } from './utils/isDotcomQuery';
import holidaysApp, { holidaysRoutes } from './holidays';
import tradePortalApp, { tradePortalRoutes } from './tradePortal';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT ?? '3000', 10);

dotenv.config({ path: path.resolve(process.cwd(), dev ? '.env' : '.next/.env') });

const envAll = getEnv();
const isTradePortal = envAll.APP_NAME === SiteName.TradePortal;
const isLocalExperienceEditor = process.env.IS_LOCAL_EXPERIENCE_EDITOR === 'true';
const ASSET_PREFIX = process.env.ASSET_PREFIX ?? '';
const STATIC_PREFIX = process.env.STATIC_PREFIX ?? '';
const STATIC_FILES = ASSET_PREFIX + STATIC_PREFIX;
const NEXT_API_DATA_URL = '/_next/data';

const STATIC_PATHS = [`${STATIC_FILES}/fonts`, `${ASSET_PREFIX}/_next/static/media`, '.next/static/media'];
const MEDIA_PATHS = [envAll.CMS_MEDIA, envAll.CMS_API, envAll.CMS_LAYOUTS_SYSTEM, '/favicon.ico'];
const API_PATHS = [envAll.CMS_TRACK_API, envAll.CMS_API, NEXT_API_DATA_URL];
const LAYOUT_PATHS = [envAll.CMS_LAYOUT];

const SERVICE_PATHS = [...STATIC_PATHS, ...MEDIA_PATHS, ...API_PATHS, ...LAYOUT_PATHS, '/_next'].filter(Boolean);

const routes = isTradePortal ? tradePortalRoutes : holidaysRoutes;

const nextOptions = { dev, customServer: true, port, hostname: parseUrl(getPublicUrl()).resource } as NextServerOptions;

// https://github.com/vercel/next.js/discussions/33374
if (envAll.PUBLIC_URL) {
    nextOptions.hostname = parseUrl(envAll.PUBLIC_URL).resource;
}

const app = nextJS(nextOptions);

// Only do this in production, otherwise it breaks Next.js Fast Refresh
// Note: setAssetPrefix() doesn't fully work in Next.js 14 with custom servers (GitHub issue #59940)
// The main fix for Experience Editor is in /api/editing/render.ts which post-processes HTML
if (!dev) {
    const finalAssetPrefix = isLocalExperienceEditor
        ? parseUrl(getPublicUrl()).resource + ASSET_PREFIX
        : envAll.PUBLIC_URL + ASSET_PREFIX;

    app.setAssetPrefix(finalAssetPrefix);
}

const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    // WP-183: Added special header for troubleshooting purposes
    server.use((req, res, next) => {
        res.setHeader('X-Web-Host', process.env.X_WEB_HOST_HEADER ?? '');
        next();
    });

    // WP-182: health check endpoint
    server.use(`${ASSET_PREFIX}/hc`, (req, res) => {
        res.json({ success: true });
    });

    // INS-1585: Redirect to lowercase url
    server.use(routes, (req, res, next) => {
        const [path, query] = req.originalUrl.split('?');

        const hasUpperCase = /\p{Lu}/u.test(path);

        const isIgnoredPath = SERVICE_PATHS.some(p => req.originalUrl.startsWith(p));

        if (hasUpperCase && !isIgnoredPath) {
            const lowerPath = path.toLowerCase();
            const redirectUrl = query ? `${lowerPath}?${query}` : lowerPath;

            return res.redirect(HttpsStatusCodes.MovedPermanently, redirectUrl);
        }

        next();
    });

    // Parse URL-encoded bodies (as sent by HTML forms f.e. payment pages), except sitecore experience editor requests
    server.use((req, res, next) => {
        if (req.url.includes('api/editing')) {
            next();
        } else {
            express.urlencoded()(req, res, next);
        }
    });

    server.use(`${envAll.CMS_LAYOUT}/placeholder`, async (req, res) => {
        if (!req.query.lang || !req.query.item || !req.query.placeholderName) {
            res.sendStatus(HttpsStatusCodes.BadRequest);

            return;
        }

        try {
            const config = req.headers.cookie ? { headers: { Cookie: req.headers.cookie } } : undefined;

            const data = await getSitecorePlaceholderLayout(
                req.query.lang as string,
                req.query.item as string,
                req.query.placeholderName as string,
                config,
            );

            res.send(data);
        } catch (e) {
            // logger.error({ e });

            res.status(HttpsStatusCodes.InternalServerError).json({
                exceptionMessage: e.message,
                message: 'exception while loading sitecore placeholder layout',
            });
        }
    });

    /**
     *  This will be handled by Next.js middleware
     */
    server.use(MEDIA_PATHS, (req, res) => {
        req.url = req.originalUrl;

        return handle(req, res);
    });

    server.use(STATIC_PATHS, cors());

    server.use(
        STATIC_FILES,
        express.static(path.join(__dirname, '../public', '/static'), {
            immutable: true,
            maxAge: 86400000, // 1 day (in milliseconds)
            redirect: false,
        }),
    );

    server.use(NEXT_API_DATA_URL, (req, res, next) => {
        res.locals = { ...res.locals, ...getLocalsFromNextUrl(req.url, routes), sameSession: true };
        next();
    });

    // Set base and current paths.
    // Don't set protocol here, because next.js proxies requests and express always returns 'http'.
    // It's more reliable to set protocol in getServerSideProps().
    server.use(routes, (req, res, next) => {
        res.locals.basePath = req.baseUrl;
        res.locals.path = req.path;

        next();
    });

    // WP-219: redirect tool to make redirect from old URLs (like org[0]=LTN&org[1]=LGW) to new ones (org=LTN,LGW)
    server.use(routes, (req, res, next) => {
        // dotcom query will be handled by dotcom router
        if (isDotcomQuery(req.query)) {
            next();

            return;
        }

        const url = req.originalUrl.split('?')[0] || req.baseUrl + '/' + req.path;
        const query = qs.parse(req.originalUrl.split('?')[1], {
            decoder: s => {
                try {
                    return decodeURIComponent(s);
                } catch {
                    return s;
                }
            },
        });

        let shouldRedirectToNewQuery = false;

        for (const key in req.query) {
            // express will see a query as an array only when it looks like this: org[0]=LTN&org[1]=LGW
            if (Array.isArray(req.query[key])) {
                shouldRedirectToNewQuery = true;

                // need special format for rooms
                if (key === QueryParamName.Rooms || key === QueryParamName.OfferRooms) {
                    query[key] = buildRoomsQueryParams(query[key] as IQueryRoomParams[]).join(',');
                } else {
                    query[key] = (query[key] as string[]).join(',');
                }
            }
        }

        if (shouldRedirectToNewQuery) {
            res.redirect(`${url}?${qs.stringify(query, { encode: true })}`);

            return;
        }

        next();
    });

    server.use((req, res, next) => (isTradePortal ? tradePortalApp(req, res, next) : holidaysApp(req, res, next)));

    server.all('*', (req, res) => handle(req, res));

    server.listen(port, () => {
        // if (err) throw err;
        // eslint-disable-next-line no-console
        console.log(`> Ready on http://localhost:${port}`);
    });
});

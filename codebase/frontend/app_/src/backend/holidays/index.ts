import express from 'express';

import { buildBasePathByLang } from 'code/basePath';
import { isLanguageAvailableInCMS } from 'code/cmsLang';
import SitePath from 'models/enum/SitePath';

import dotcomRouter from './routes/dotcom';
import { routerPublic } from './routes/public';
import sitemapRouter from './routes/sitemap';
import { routes } from './constants';

const holidaysApp = express();
holidaysApp.enable('trust proxy');

holidaysApp.use(routes, (req, res, next) => {
    const lang = req.baseUrl.split('/').filter(Boolean)[0].toLowerCase();
    res.locals.lang = lang;

    if (!isLanguageAvailableInCMS(lang) && req.path !== SitePath.NotAvailable) {
        const holidayUrl = buildBasePathByLang(lang.toLowerCase());
        res.redirect(`${holidayUrl}${SitePath.NotAvailable}`);

        return;
    }

    next();
});

/**
 * Sitemap
 */
holidaysApp.use(routes, sitemapRouter);

/**
 * dotcomRouter - handles requests that comes from easyJet.com website
 */
holidaysApp.use(routes, dotcomRouter);

/**
 * App router
 */
holidaysApp.use(routes, routerPublic);

export { routes as holidaysRoutes };
export default holidaysApp;

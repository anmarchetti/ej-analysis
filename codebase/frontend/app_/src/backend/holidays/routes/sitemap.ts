import express from 'express';
import { EnumChangefreq, SitemapItemLoose, SitemapStream } from 'sitemap';

import { buildBasePathByLang } from 'code/basePath';
import { getLangByCMSLang } from 'code/cmsLang';
import { sitecoreUrls } from 'code/sitecoreUrls';
import { logger } from 'frontend/services/logging';
import AxiosRequest from 'frontend/utils/request';
import { purifyUrl } from 'frontend/utils/url.utils';
import { ISitecoreSitemapItem } from 'models/data/ISitecoreSitemap';

const sitemapRouter = express.Router();

/**
 * Build sitemap items from sitecore items
 */
const buildSitemapItems = (sitecoreItems: ISitecoreSitemapItem[]) => {
    const sitemapItems = sitecoreItems.reduce((items: SitemapItemLoose[], sitecorePage: ISitecoreSitemapItem) => {
        if (sitecorePage.Url) {
            const pageLang = getLangByCMSLang(sitecorePage.Language) || 'en';
            const pageBaseUrl = buildBasePathByLang(pageLang);

            // Build full url in lower case and remove duplicate and trailing slashes
            const url = `${pageBaseUrl}${purifyUrl(sitecorePage.Url)}`
                .toLowerCase()
                .replace(/\/+/g, '/')
                .replace(/\/+$/, '');

            items.push({
                url: url,
                changefreq: (sitecorePage.ChangeFrequency?.toLowerCase() as EnumChangefreq) || undefined,
                priority: sitecorePage.Priority || undefined,
            });
        }

        return items;
    }, [] as SitemapItemLoose[]);

    return sitemapItems;
};

const buildSitemap = async (sitemapUrl: string, req, res) => {
    res.setHeader('Content-Type', 'application/xml');

    try {
        const hostname = `${req.protocol}://${req.headers.host}`;
        const sitecoreSitemap = await AxiosRequest.get(sitemapUrl);
        const sitemapItems = buildSitemapItems(sitecoreSitemap.data);

        const smStream = new SitemapStream({ hostname });
        sitemapItems.forEach(sitemapItem => {
            smStream.write(sitemapItem);
        });
        smStream.end();
        smStream.pipe(res).on('error', e => {
            throw e;
        });
    } catch (e) {
        logger.error({ e });

        const statusCode = e?.response?.status || 500;
        res.setHeader('Content-Type', 'application/json');
        res.status(statusCode).send({
            exceptionMessage: e.message,
            message: 'exception in getting sitemap',
        });
    }
};

/*
    Route for Main Sitemap: 
        en/holidays/sitemap.xml   
    and Sub-Sitemaps:
        en/holidays/sitemap-xml/countries.xml
        en/holidays/sitemap-xml/regions.xml
        en/holidays/sitemap-xml/resorts.xml
        en/holidays/sitemap-xml/hotels.xml
*/
sitemapRouter.get(['/sitemap.xml', '/sitemap-xml/:name([a-zA-Z]+).xml'], async (req, res) => {
    const sitemapType = req.params.name;
    const lang = res.locals.lang;
    const sitemapUrl = sitecoreUrls.sitemap(lang, sitemapType);
    buildSitemap(sitemapUrl, req, res);
});

/**
 * Master sitemap, that contains all sitemaps URLs for all languages
 */
sitemapRouter.get('/sitemap-index.xml', async (req, res) => {
    const sitemapUrl = sitecoreUrls.sitemapIndex();
    buildSitemap(sitemapUrl, req, res);
});

export default sitemapRouter;

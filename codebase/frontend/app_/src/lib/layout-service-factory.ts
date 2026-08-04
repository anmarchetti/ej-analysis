import { AxiosDataFetcher, RestLayoutService } from '@sitecore-jss/sitecore-jss-nextjs';
import { Response } from 'express';
import parseUrl from 'parse-url';
import qs from 'qs';

import { envAll } from 'code/env';
import { CookiesKeys } from 'models/enum/CookiesKeys';

export class LayoutServiceFactory {
    create(): RestLayoutService {
        const restLayoutService = new RestLayoutService({
            apiHost: envAll.SITECORE_URL,
            apiKey: envAll.SITECORE_API_KEY,
            siteName: envAll.APP_NAME ?? '',
            configurationName: 'jss',
            tracking: true,
        });

        // here we intercept fetcher request to normalize sitecore layout url
        // /sitecore/api/layout/render/jss?item=/hotel-details%26theme=beach%26accId=ESLZ0012&sc_lang=en => /sitecore/api/layout/render/jss?item=/hotel-details&theme=beach&accId=ESLZ0012&sc_lang=en
        restLayoutService['getDefaultFetcher'] = function (req, res) {
            const config: any = {};

            if (req && res) {
                config.onReq = reqConfig => {
                    // call default request headers setup
                    reqConfig = this['setupReqHeaders'](req)(reqConfig);

                    const { req: { cookies } = {}, locals } = res as Response;
                    const bidCookies = Object.keys(cookies)
                        .filter(key => key.includes(CookiesKeys.BrowserId))
                        .reduce((bidObject, key) => {
                            bidObject[key] = cookies[key];

                            return bidObject;
                        }, {});

                    const hasHeaderMethods = typeof reqConfig.headers?.set === 'function';

                    if (hasHeaderMethods) {
                        if (locals.publicIp) {
                            reqConfig.headers.set('X-Forwarded-For', locals.publicIp);
                        }

                        // setupReqHeaders() also intended to forward User-Agent and Referer but
                        // can't via headers.common in axios v1.x — compensate here.
                        if (req.headers?.['user-agent']) {
                            reqConfig.headers.set('User-Agent', req.headers['user-agent']);
                        }

                        if (req.headers?.referer) {
                            reqConfig.headers.set('Referer', req.headers.referer);
                        }
                    } else {
                        reqConfig.headers.common = Object.assign(
                            Object.assign({}, reqConfig.headers.common),
                            locals.publicIp && { 'X-Forwarded-For': locals.publicIp },
                        );
                    }

                    // In axios v1.x, setupReqHeaders() uses headers.common (axios v0.x pattern)
                    // which is ignored in request interceptors. Fall back to the raw
                    // incoming Cookie header so all browser cookies (SC_ANALYTICS_GLOBAL_COOKIE,
                    // ASP.NET_SessionId, etc.) reach Sitecore for proper visitor identification.
                    const existingCookies = hasHeaderMethods
                        ? reqConfig.headers.get('Cookie') || req.headers?.cookie || ''
                        : reqConfig.headers?.Cookie || reqConfig.headers?.cookie || req.headers?.cookie || '';

                    const bidCookieString = Object.entries(bidCookies)
                        .map(([key, val]) => `${key}=${val}`)
                        .join('; ');

                    const mergedCookies = [existingCookies, bidCookieString].filter(Boolean).join('; ');

                    if (hasHeaderMethods) {
                        reqConfig.headers.set('Cookie', mergedCookies);
                    } else {
                        reqConfig.headers['Cookie'] = mergedCookies;
                    }

                    return reqConfig;
                };

                config.onRes = this['setupResHeaders'](res);
                // Ensure that on 404 page nav, the holidays#lang cookie is set in the response so that the next request to Sitecore has the correct language context.
                config.onResError = error => {
                    if (error?.response?.headers?.['set-cookie']) {
                        res.setHeader('set-cookie', error.response.headers['set-cookie']);
                    }

                    return Promise.reject(error);
                };
            }

            const axiosFetcher = new AxiosDataFetcher(config);

            const fetcher = (url, data) => {
                const parsed = parseUrl(url);
                const query = parsed.query;

                const parsedItem = qs.parse('item=' + query.item);

                let newUrl =
                    parsed.protocol +
                    '://' +
                    parsed.resource +
                    (parsed.port ? `:${parsed.port}` : '') +
                    parsed.pathname +
                    '?';

                if (query.item) {
                    delete query.item;
                }

                const params = {
                    ...parsedItem,
                    ...query,
                };

                newUrl = newUrl + qs.stringify(params);

                return axiosFetcher.fetch<any>(newUrl, data);
            };

            return fetcher;
        };

        return restLayoutService;
    }
}

export const layoutServiceFactory = new LayoutServiceFactory();

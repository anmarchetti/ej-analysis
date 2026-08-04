import { IncomingMessage, ServerResponse } from 'http';

import { initServer } from '@sitecore/engage';
import {
    ComponentPropsService,
    DictionaryService,
    LayoutServiceData,
    RestLayoutService,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { editingDataService } from '@sitecore-jss/sitecore-jss-nextjs/editing';
import { getRequestIP } from 'backend/utils/getRequestIP';
import { GetServerSidePropsContext, GetStaticPropsContext } from 'next';
import { ParsedUrlQuery } from 'node:querystring';
import { componentModule } from 'temp/componentFactory';
import truncate from 'truncate-html';

import { getCMSLang } from 'code/cmsLang';
import { envAll } from 'code/env';
import appSettings from 'code/settings';
import { logger } from 'frontend/services/logging';
import OffersService from 'frontend/services/offers.service';
import {
    addParamsToPath,
    getPathFromLayoutPath,
    isHotelDetails,
    ISitecoreLayoutParams,
} from 'frontend/utils/buildSitecorePath';
import isStaticPath from 'frontend/utils/isStaticPath';
import { updateImagesWithLazyLoading } from 'frontend/utils/layout.utils';
import { dictionaryServiceFactory } from 'lib/dictionary-service-factory';
import { layoutServiceFactory } from 'lib/layout-service-factory';
import { TServerSidePageContext, TSitecorePageProps } from 'lib/page-props';
import { IHotel } from 'models/data/IHotel';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';

import { RestSitecoreService, sitecoreServiceFactory } from './sitecore-service-factory';

export const DEFAULT_CACHE_TIMEOUT_SECONDS = 60;

/** Get page path from Next context */
export const getPagePathFromContext = (context: TServerSidePageContext): string => {
    const path = Array.from(context.params?.path || '/').map(p => p.toLowerCase());
    const basePath = context.res.locals?.basePath?.toLowerCase();

    /**
     * Hack for Next.js, as it doesn't support basePath with i18n locales.
     * So we need to remove basePath from path manually.
     * (e.g. path = ['en', 'holidays', 'spain'] should be just ['spain'])
     */
    if (basePath) {
        basePath
            .split('/')
            .filter(Boolean)
            .forEach(segment => {
                if (path[0] === segment) {
                    path.splice(0, 1);
                }
            });
    }

    let resolvedPath = path.join('/');

    // Ensure leading '/'
    if (!resolvedPath.startsWith('/')) {
        resolvedPath = '/' + resolvedPath;
    }

    return resolvedPath;
};

/**
 * Extract normalized Sitecore item path from query
 */
export function extractPaths(context: TServerSidePageContext): string[] {
    const possiblePaths: string[] = [];
    const { query } = context;
    const path = getPagePathFromContext(context);

    let layoutParams: ISitecoreLayoutParams = { isHotelDetails: false };

    if (isHotelDetails(query)) {
        layoutParams = {
            isHotelDetails: true,
            theme: query[QueryParamName.Theme] as string | undefined,
            accId: query[QueryParamName.AccommodationId] as string | undefined,
        };
    }

    const searchParams: string[][] = [];

    [
        QueryParamName.Campaign,
        QueryParamName.Goal,
        QueryParamName.IsPreview,
        QueryParamName.ExperienceId,
        QueryParamName.SelectionAttr,
        QueryParamName.UtmCampaign,
        QueryParamName.ExperienceContextProvider,
    ].forEach(param => {
        const layoutParam = query[param] as string | undefined;

        if (layoutParam) {
            searchParams.push([param, layoutParam]);
        }
    });

    if (isStaticPath(path)) {
        return [addParamsToPath(path, searchParams)];
    }

    if (layoutParams.isHotelDetails) {
        const path = '/hotel-details';

        const hotelDetailsParams = [...searchParams];

        if (layoutParams.theme) {
            hotelDetailsParams.push([QueryParamName.Theme, layoutParams.theme]);
        }

        if (layoutParams.accId) {
            hotelDetailsParams.push([QueryParamName.AccommodationId, layoutParams.accId]);
        }

        possiblePaths.push(addParamsToPath(path, hotelDetailsParams));
    }

    const pathWithParams = addParamsToPath(path, searchParams);

    possiblePaths.push(pathWithParams);

    return possiblePaths;
}

/**
 * Determines whether context is GetServerSidePropsContext (SSR) or GetStaticPropsContext (SSG)
 * @param {GetServerSidePropsContext | GetStaticPropsContext} context
 */
const isServerSidePropsContext = function (
    context: GetServerSidePropsContext | GetStaticPropsContext,
): context is GetServerSidePropsContext {
    return (<GetServerSidePropsContext>context).req !== undefined;
};

export class SitecorePagePropsFactory {
    private dictionaryService: DictionaryService;
    private readonly layoutService: RestLayoutService;
    private sitecoreService: RestSitecoreService;
    private componentPropsService: ComponentPropsService;

    constructor() {
        this.dictionaryService = dictionaryServiceFactory.create();
        this.layoutService = layoutServiceFactory.create();
        this.componentPropsService = new ComponentPropsService();
    }

    /**
     * Create SitecorePageProps for given context (SSR / GetServerSidePropsContext or SSG / GetStaticPropsContext)
     * @param {TServerSidePageContext} context
     * @see TSitecorePageProps
     */
    public async create(
        context: TServerSidePageContext,
        isInit = false,
        forcedPath?: string,
    ): Promise<TSitecorePageProps | null> {
        this.sitecoreService = sitecoreServiceFactory.create(context);

        if (context.preview) {
            return await this.createPreviewModePage(context);
        }

        return await this.createNormalModePageProps(context, isInit, forcedPath);
    }

    /** Get page props for preview (editing) mode */
    private async createPreviewModePage(context: TServerSidePageContext): Promise<TSitecorePageProps> {
        // Don't load Google Analytic in Experience Editor
        context.res.locals = context.res.locals || {};
        context.res.locals.noAnalytics = true;
        context.res.locals.isExperienceEditor = true;

        // Use data already sent along with the editing request
        const data = await editingDataService.getEditingData(context.previewData);

        if (!data) {
            const e = new Error(`Unable to get editing data for preview ${JSON.stringify(context.previewData)}`);
            logger.error({ e });
            throw e;
        }

        return {
            locale: data.language,
            layout: data.layoutData as any,
            dictionary: data.dictionary,
            componentProps: {},
        };
    }

    shouldFetchHotelInfo = (isInit: boolean, query: ParsedUrlQuery, pagePath: SitePath): boolean =>
        isInit && isHotelDetails(query, pagePath, true) && !!query[QueryParamName.AccommodationId];

    shouldDisableAPPDScript = (isInit: boolean, pagePath: SitePath): boolean =>
        isInit && [SitePath.Payment, SitePath.PayBalance, SitePath.AmendPayment].includes(pagePath);

    set404IfNotFound = (layout: ISitecoreLayout, context: TServerSidePageContext): void => {
        if (layout?.sitecore?.route?.templateId === SitecoreTemplateId.NotFoundPage) {
            context.res.status(404);
        }
    };

    setExtraRouteDataFromHotel = (
        layout: ISitecoreLayout,
        hotelResp: PromiseFulfilledResult<IHotel> | PromiseRejectedResult,
    ): void => {
        if (hotelResp.status === 'fulfilled' && hotelResp.value) {
            const { name, description, images } = hotelResp.value;

            layout.extraRouteData = {
                pageTitle: name || '',
                pageImage: images?.[0]?.medium || '',
                pageDescription: truncate(description, appSettings.HotelDetails.HotelDescriptionTruncateOptions),
            };
        }
    };

    /** Get page props for normal mode */
    private readonly createNormalModePageProps = async (
        context: TServerSidePageContext,
        isInit = false,
        forcedPath?: string,
    ): Promise<TSitecorePageProps | null> => {
        context.res.locals = { ...context.res.locals };

        const ip = await getRequestIP(context.req);

        if (ip) {
            context.res.locals.publicIp = ip;
        }

        const requests: Promise<any>[] = [];
        const paths = forcedPath ? [forcedPath] : extractPaths(context);
        const locale = getCMSLang(context.res.locals.lang ?? context.locale ?? 'en');

        requests.push(
            this.fetchLayout(
                paths,
                locale,
                isServerSidePropsContext(context) ? context.req : undefined,
                isServerSidePropsContext(context) ? context.res : undefined,
            ),
        );

        const pagePath = getPagePathFromContext(context) as SitePath;

        let hotelInfoPromise = Promise.resolve() as unknown as Promise<IHotel>;

        if (this.shouldFetchHotelInfo(isInit, context.query, pagePath)) {
            hotelInfoPromise = OffersService.loadHotelInfo(context.query[QueryParamName.AccommodationId] as string);
        }

        if (this.shouldDisableAPPDScript(isInit, pagePath)) {
            context.res.locals.isAPPDScriptDisabled = true;
        }

        requests.push(hotelInfoPromise);

        const engage = initServer({
            ...envAll.SITECORE_PERSONALIZE,
            forceServerCookieMode: false,
        });

        if (isInit) {
            requests.push(this.fetchDictionaryAndSettings(locale));
            requests.push(engage.handleCookie(context.req, context.res));
        }

        const [layoutResp, hotelResp, additionalPageResp] = (await Promise.allSettled(requests)) as [
            PromiseSettledResult<ISitecoreLayout>,
            PromiseSettledResult<IHotel>,
            PromiseSettledResult<any>,
        ];

        const layout = layoutResp.status === 'fulfilled' ? layoutResp.value : null;
        const additionalPageData = additionalPageResp?.status === 'fulfilled' ? additionalPageResp.value : null;

        const keysToExtract = [
            SiteSettings.IsLivePriceEnabled,
            SiteSettings.ExcludeLivePriceForDestinations,
            SiteSettings.DestinationHeroBannerLivePrice,
        ];

        context.res.settings = (additionalPageData?.settings ?? []).reduce((acc, obj) => {
            for (const key of keysToExtract) {
                if (obj[key] !== undefined) {
                    acc[key] = obj[key];
                }
            }

            return acc;
        }, {});

        if (layoutResp.status === 'rejected' || !layout?.sitecore?.route) {
            return null;
        }

        this.set404IfNotFound(layout, context);

        this.setExtraRouteDataFromHotel(layout, hotelResp);

        const modifiedLayout = updateImagesWithLazyLoading(layout, 'DisableLazyLoading', 'Image', 'priority', true);

        const componentProps = isServerSidePropsContext(context)
            ? await this.componentPropsService.fetchServerSideComponentProps({
                  layoutData: modifiedLayout,
                  context,
                  moduleFactory: componentModule,
              })
            : {};

        return {
            componentProps,
            locale,
            layout: modifiedLayout,
            ...additionalPageData,
        };
    };

    private async fetchDictionaryAndSettings(locale: string): Promise<Partial<TSitecorePageProps>> {
        const [dictionary, settings, tooltipSettings, allMarketsSettings] = await Promise.all([
            this.dictionaryService.fetchDictionaryData(locale),
            this.sitecoreService.fetchApplicationSettings(locale, true),
            this.sitecoreService.fetchPriceTooltipSetting(locale, true),
            this.sitecoreService.fetchMarketSettings(),
        ]);

        return {
            dictionary,
            settings,
            tooltipSettings,
            allMarketsSettings,
        };
    }

    async fetchLayout(
        paths: string[],
        locale: string,
        req?: IncomingMessage | undefined,
        res?: ServerResponse | undefined,
    ): Promise<LayoutServiceData> {
        let resultData: any;

        for (const pathItem of paths) {
            let result: any;

            try {
                result = await this.layoutService.fetchLayoutData(pathItem, locale, req, res);
            } catch (e) {
                // FIXME: actually test this scenario
                if (e.response?.status === 302) {
                    if (e.response.data) {
                        e.response.data.meta = {
                            shouldRedirect: true,
                            url: getPathFromLayoutPath(e.response.data.sitecore?.context?.url),
                        };
                    }

                    result = e.response.data;
                } else {
                    resultData = e.response ? e.response.data : e;
                    logger.error({ e });
                    continue;
                }
            }

            if (result) {
                resultData = result;
                break;
            }
        }

        return resultData;
    }
}

export const sitecorePagePropsFactory = new SitecorePagePropsFactory();

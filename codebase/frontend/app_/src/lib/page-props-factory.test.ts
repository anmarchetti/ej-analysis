import * as sitecoreEngage from '@sitecore/engage';
import { ComponentPropsService } from '@sitecore-jss/sitecore-jss-nextjs';
import { Request as ExpressRequest } from 'express';
import { GetServerSidePropsContext } from 'next';
import { ParsedUrlQuery } from 'node:querystring';
import { componentModule } from 'temp/componentFactory';

import OffersService from 'frontend/services/offers.service';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import { SiteName } from 'models/enum/SiteName';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';

import { TServerSidePageContext, TServerSidePageContextResProps } from './page-props';
import { extractPaths, getPagePathFromContext, sitecorePagePropsFactory } from './page-props-factory';

const mockGetHotelInfo = jest.spyOn(OffersService, 'loadHotelInfo').mockImplementation(() => null as any);

jest.mock('backend/utils/getRequestIP');

jest.mock('code/cmsLang', () => ({
    getCMSLang: jest.fn().mockReturnValue('en'),
    ENGLISH: 'en',
}));

jest.mock('frontend/utils/layout.utils', () => ({
    updateImagesWithLazyLoading: jest.fn(layout => layout),
}));

const engage = { handleCookie: jest.fn() };
jest.spyOn<any, 'initServer'>(sitecoreEngage, 'initServer').mockReturnValue(engage);

jest.mock('temp/componentFactory');
const mockComponentModule = componentModule as jest.MockedFn<typeof componentModule>;

const createContext = () =>
    ({
        params: {
            path: ['en', 'holidays', 'mixedresultlist'],
        },
        res: {
            locals: {
                basePath: '/en/holidays',
            },
            setHeader: jest.fn(),
            status: jest.fn(),
        } as TServerSidePageContextResProps & { setHeader: jest.Mock; status: jest.Mock },
        req: {
            cookies: {},
            headers: {},
        } as GetServerSidePropsContext['req'] & ExpressRequest,
        resolvedUrl: '',
        query: {},
    } as TServerSidePageContext);

const createLayout = () => ({
    sitecore: {
        route: {
            templateId: SitecoreTemplateId.SearchResultsPage,
        },
        context: {
            site: {
                name: SiteName.Holidays,
            },
        },
    },
});

describe('getPagePathFromContext', () => {
    let context;

    beforeEach(() => {
        context = createContext();
    });

    it('should return path', () => {
        expect(getPagePathFromContext(context)).toBe('/mixedresultlist');
    });

    it('should return empty path for home page', () => {
        context.params.path = ['en', 'holidays'];

        expect(getPagePathFromContext(context)).toBe('/');
    });

    it('should return empty path as for home page when ServerSidePageContext is empty', () => {
        context.params.path = '';

        context.res.locals.basePath = '';

        expect(getPagePathFromContext(context)).toBe('/');
    });

    it('should convert all path to lower case', () => {
        context.params.path = ['en', 'Holidays', 'mixedresultlist'];

        context.res.locals.basePath = '/en/Holidays';

        expect(getPagePathFromContext(context)).toBe('/mixedresultlist');
    });
});

describe('extractPaths', () => {
    let context;

    beforeEach(() => {
        context = createContext();
    });

    it('should return possible paths', () => {
        expect(extractPaths(context)[0]).toBe('/mixedresultlist');
    });

    it('should save specific params in returned paths', () => {
        context.query = {
            sc_camp: 'Campaign',
            sc_trk: 'Goal',
            isPreview: 'IsPreview',
            experienceId: 'ExperienceId',
            selectionAttr: 'SelectionAttr',
            utm_campaign: 'UtmCampaign',
            ecp: 'ExperienceContextProvider',
        };

        expect(extractPaths(context)[0]).toBe(
            '/mixedresultlist&sc_camp=Campaign&sc_trk=Goal&isPreview=IsPreview&experienceId=ExperienceId&selectionAttr=SelectionAttr&utm_campaign=UtmCampaign&ecp=ExperienceContextProvider',
        );
    });
});

describe('SitecorePagePropsFactory', () => {
    describe('createNormalModePageProps', () => {
        let context;
        let layout;
        let mockFetchLayout;
        let mockFetchDictionaryAndSettings;
        let mockFetchServerSideComponentProps;
        const componentProps = { uid: {} };

        beforeEach(() => {
            context = createContext();
            layout = createLayout();
            mockFetchLayout = jest
                .spyOn<any, 'fetchLayout'>(sitecorePagePropsFactory, 'fetchLayout')
                .mockResolvedValue(layout);
            mockFetchDictionaryAndSettings = jest
                .spyOn<any, 'fetchDictionaryAndSettings'>(sitecorePagePropsFactory, 'fetchDictionaryAndSettings')
                .mockResolvedValue({});
            mockFetchServerSideComponentProps = jest
                .spyOn(ComponentPropsService.prototype, 'fetchServerSideComponentProps')
                .mockResolvedValue(componentProps);
        });

        afterAll(() => {
            mockFetchLayout.mockRestore();
            mockFetchDictionaryAndSettings.mockRestore();
        });

        describe('Experiments prop', () => {
            it('should invoke handleCookies() on init', async () => {
                await sitecorePagePropsFactory.create(context, true);

                expect(engage.handleCookie).toHaveBeenCalledWith(context.req, context.res);
            });
        });

        describe('ComponentProps prop', () => {
            it('should return componentProps', async () => {
                const pageProps = await sitecorePagePropsFactory.create(context, true);

                expect(mockFetchServerSideComponentProps).toHaveBeenCalledWith({
                    layoutData: layout,
                    context: context,
                    moduleFactory: mockComponentModule,
                });
                expect(pageProps?.componentProps).toEqual(componentProps);
            });

            const testCases = [
                {
                    page: 'Payment page',
                    path: ['en', 'holidays', 'booking', 'payment'],
                    expectedIsAPPDScriptDisabled: true,
                },
                {
                    page: 'Home page',
                    path: ['en', 'holidays'],
                    expectedIsAPPDScriptDisabled: undefined,
                },
                {
                    page: 'Pay Balance Page',
                    path: ['en', 'holidays', 'booking', 'pay-balance'],
                    expectedIsAPPDScriptDisabled: true,
                },
                {
                    page: 'Amend Payment Page',
                    path: ['en', 'holidays', 'booking', 'amend-payment'],
                    expectedIsAPPDScriptDisabled: true,
                },
            ];

            test.each(testCases)(
                'should set isAPPDScriptDisabled correctly on $page',
                async ({ path, expectedIsAPPDScriptDisabled }) => {
                    context.params.path = path;

                    await sitecorePagePropsFactory.create(context, true);

                    expect(mockFetchServerSideComponentProps).toHaveBeenCalledWith({
                        layoutData: layout,
                        context: {
                            ...context,
                            res: {
                                ...context.res,
                                locals: {
                                    ...context.res.locals,
                                    isAPPDScriptDisabled: expectedIsAPPDScriptDisabled,
                                },
                            },
                        },
                        moduleFactory: mockComponentModule,
                    });
                },
            );

            it('should return componentProps as empty object when isServerSidePropsContext is false', async () => {
                context.req = undefined as any;
                const pageProps = await sitecorePagePropsFactory.create(context, true);

                expect(mockFetchServerSideComponentProps).not.toHaveBeenCalled();
                expect(pageProps?.componentProps).toEqual({});
            });

            describe('Hotel details page', () => {
                it('should call loadHotelInfo with correct params on hotel details page', async () => {
                    context.query = {
                        [QueryParamName.IsBookingFlow]: true,
                        [QueryParamName.AccommodationId]: '123',
                    };
                    context.params.path = ['en', 'holidays', 'hotel'];

                    await sitecorePagePropsFactory.create(context, true);

                    expect(mockGetHotelInfo).toHaveBeenCalledWith(context.query[QueryParamName.AccommodationId]);
                });
            });
        });

        it('should add settings to context', async () => {
            const spy = jest.spyOn(Promise, 'allSettled').mockResolvedValueOnce([
                { status: 'fulfilled' },
                { status: 'fulfilled' },
                {
                    status: 'fulfilled',
                    value: {
                        settings: [
                            { [SiteSettings.IsLivePriceEnabled]: '1' },
                            { [SiteSettings.ExcludeLivePriceForDestinations]: [] },
                            { [SiteSettings.DestinationHeroBannerLivePrice]: '1' },
                        ],
                    },
                },
            ]);

            await sitecorePagePropsFactory.create(context, false);

            expect(context.res.settings).toEqual({
                [SiteSettings.IsLivePriceEnabled]: '1',
                [SiteSettings.ExcludeLivePriceForDestinations]: [],
                [SiteSettings.DestinationHeroBannerLivePrice]: '1',
            });

            spy.mockRestore();
        });
    });

    describe('fetchDictionaryAndSettings', () => {
        it('should return data', async () => {
            const context = createContext();
            context.req = undefined as any;

            await sitecorePagePropsFactory.create(context, true);

            const data = {};

            jest.spyOn(sitecorePagePropsFactory['dictionaryService'], 'fetchDictionaryData').mockResolvedValue(data);
            jest.spyOn(sitecorePagePropsFactory['sitecoreService'], 'fetchApplicationSettings').mockResolvedValue(data);
            jest.spyOn(sitecorePagePropsFactory['sitecoreService'], 'fetchPriceTooltipSetting').mockResolvedValue({
                Children: [],
            });
            jest.spyOn(sitecorePagePropsFactory['sitecoreService'], 'fetchMarketSettings').mockResolvedValue(data);

            const result = await sitecorePagePropsFactory['fetchDictionaryAndSettings']('es-ES');

            expect(result).toStrictEqual({
                dictionary: data,
                settings: data,
                tooltipSettings: { Children: [] },
                allMarketsSettings: data,
            });
        });
    });

    describe('shouldFetchHotelInfo', () => {
        it('should return true for hotel details page with accommodationId', () => {
            const query: ParsedUrlQuery = {
                [QueryParamName.IsBookingFlow]: 'true',
                [QueryParamName.AccommodationId]: '123',
            };
            const pagePath = '/hotel-details' as SitePath;

            expect(sitecorePagePropsFactory.shouldFetchHotelInfo(true, query, pagePath)).toBe(true);
        });

        it('should return false when isInit is false', () => {
            const query: ParsedUrlQuery = {
                [QueryParamName.IsBookingFlow]: 'true',
                [QueryParamName.AccommodationId]: '123',
            };
            const pagePath = '/hotel-details' as SitePath;

            expect(sitecorePagePropsFactory.shouldFetchHotelInfo(false, query, pagePath)).toBe(false);
        });

        it('should return false when accommodationId is missing', () => {
            const query: ParsedUrlQuery = {
                [QueryParamName.IsBookingFlow]: 'true',
            };
            const pagePath = '/hotel-details' as SitePath;

            expect(sitecorePagePropsFactory.shouldFetchHotelInfo(true, query, pagePath)).toBe(false);
        });
    });

    describe('shouldDisableAPPDScript', () => {
        it('should return true for payment pages', () => {
            expect(sitecorePagePropsFactory.shouldDisableAPPDScript(true, SitePath.Payment)).toBe(true);
            expect(sitecorePagePropsFactory.shouldDisableAPPDScript(true, SitePath.PayBalance)).toBe(true);
            expect(sitecorePagePropsFactory.shouldDisableAPPDScript(true, SitePath.AmendPayment)).toBe(true);
        });

        it('should return false for non-payment pages', () => {
            expect(sitecorePagePropsFactory.shouldDisableAPPDScript(true, SitePath.Home)).toBe(false);
        });

        it('should return false when isInit is false', () => {
            expect(sitecorePagePropsFactory.shouldDisableAPPDScript(false, SitePath.Payment)).toBe(false);
        });
    });

    describe('set404IfNotFound', () => {
        let context;
        let layout;

        beforeEach(() => {
            context = createContext();
            layout = createLayout();
        });

        it('should set 404 status for not found page', () => {
            layout.sitecore.route.templateId = SitecoreTemplateId.NotFoundPage;
            sitecorePagePropsFactory.set404IfNotFound(layout, context);
            expect(context.res.status).toHaveBeenCalledWith(404);
        });

        it('should not set status for other pages', () => {
            layout.sitecore.route.templateId = SitecoreTemplateId.SearchResultsPage;
            sitecorePagePropsFactory.set404IfNotFound(layout, context);
            expect(context.res.status).not.toHaveBeenCalled();
        });
    });
});

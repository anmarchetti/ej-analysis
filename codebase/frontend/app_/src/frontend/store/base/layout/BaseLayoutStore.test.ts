import type { ReactSDKClient } from '@optimizely/react-sdk';
import { ComponentRendering, LayoutServicePageState } from '@sitecore-jss/sitecore-jss-nextjs';

import settings from 'code/settings';
import { createMockStores } from 'frontend/__mocks__';
import { sitecoreLayoutContextMock, sitecoreLayoutRouteMock } from 'frontend/__mocks__/layout';
import { mockedOffer } from 'frontend/__mocks__/offer';
import AppStore from 'frontend/store/holidays/app/AppStore';
import TradePortalAppStore from 'frontend/store/tradePortal/app/TradePortalAppStore';
import { fixExpEditorClickEvents } from 'frontend/utils/expEditor.utils';
import isBackend from 'frontend/utils/isBackend';
import { localizeFlatpickr } from 'frontend/utils/l10n.utils';
import { findComponentsByParam, getAllPlaceholdersPathsFromParentComponents } from 'frontend/utils/layout.utils';
import * as utils from 'frontend/utils/offer.utils';
import AxiosRequest from 'frontend/utils/request';
import { BagsPromotionCode } from 'models/data/BagsPromotionSettings';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import { QueryParamName } from 'models/enum/QueryParamName';
jest.mock('frontend/utils/request');
import * as cookiesUtils from 'frontend/utils/cookies.utils';
import * as facilitiesUtils from 'frontend/utils/facilities.utils';
import { IFacilityGroup } from 'models/data/IHotel';
import { CookiesKeys } from 'models/enum/CookiesKeys';
import { ExperimentVariants } from 'models/enum/cro/Experiment';
import { FacilitiesDesignVariant } from 'models/enum/FacilitiesDesignVariant';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import { SiteName } from 'models/enum/SiteName';
import SiteSettings from 'models/enum/SiteSettings';
import { VirtualFacilityGroupCode } from 'models/enum/VirtualFacilityGroupCode';
import { IOptimizelyDecision } from 'models/optimizely';
import { OptimizelyDecisionSource } from 'models/optimizely/OptimizelyDecision';

import { BaseLayoutStore, FORCE_RELOAD_PARAM_NAME } from './BaseLayoutStore';

jest.mock('frontend/utils/layout.utils');
AxiosRequest.post = jest.fn().mockResolvedValue({ data: {} });
jest.mock('frontend/utils/expEditor.utils', () => ({
    fixExpEditorClickEvents: jest.fn(),
}));

jest.mock('frontend/utils/isBackend', () => jest.fn());
const mockedIsBacked = isBackend as jest.MockedFn<typeof isBackend>;

jest.mock('frontend/utils/l10n.utils');
const mockLocalizeFlatpickr = localizeFlatpickr as jest.MockedFn<typeof localizeFlatpickr>;

jest.mock('frontend/utils/cookies.utils', () => ({
    ...jest.requireActual('frontend/utils/cookies.utils'),
    getCookieFromContext: jest.fn(),
}));
const mockGetCookieFromContext = cookiesUtils.getCookieFromContext as jest.MockedFn<
    typeof cookiesUtils.getCookieFromContext
>;
const mockGetTotalDiscount = jest.spyOn(utils, 'getTotalDiscount');

const createRootStore = () =>
    createMockStores({
        appStore: { isScreenLarge: false },
        layoutStore: { isCabinBagsEnabled: false },
        queryParamsStore: { query: {} },
    });

const layoutMock = {
    sitecore: {
        context: sitecoreLayoutContextMock,
        route: sitecoreLayoutRouteMock,
    },
};

let rootStore = createRootStore();

describe('BaseLayoutStore', () => {
    let store;
    const originalWindow = global.window;

    beforeEach(() => {
        rootStore = createRootStore();
        store = new BaseLayoutStore(rootStore);
        global.window = originalWindow;
    });

    describe('giataDestinationCode', () => {
        it('should return giata code', () => {
            store.layout = {
                sitecore: {
                    context: { baseTemplates: [store.siteTemplatesIds.DestinationPage] },
                    route: sitecoreLayoutRouteMock,
                },
            };

            expect(store.giataHotelCode).toBe('GiataCode');
        });
    });

    describe('accommodation code helpers', () => {
        it('should return accommodation codes from context', () => {
            store.layout = {
                sitecore: {
                    context: {
                        ...sitecoreLayoutContextMock,
                        accommodationCodes: ['ACC_1', 'ACC_2'],
                        baseTemplates: [store.siteTemplatesIds.DestinationPage],
                    },
                    route: sitecoreLayoutRouteMock,
                },
            };

            expect(store.allAccommodationCodes).toEqual(['ACC_1', 'ACC_2']);
            expect(store.accommodationOrDestinationCode).toBe('ACC_1');
        });

        it('should fallback to destination code when accommodation codes are empty', () => {
            store.layout = {
                sitecore: {
                    context: {
                        ...sitecoreLayoutContextMock,
                        accommodationCodes: [],
                        baseTemplates: [store.siteTemplatesIds.DestinationPage],
                    },
                    route: {
                        ...sitecoreLayoutRouteMock,
                        fields: {
                            ...sitecoreLayoutRouteMock.fields,
                            Code: { value: 'HOTEL_CODE' },
                        },
                    },
                },
            };

            expect(store.allAccommodationCodes).toEqual([]);
            expect(store.accommodationOrDestinationCode).toBe('HOTEL_CODE');
        });
    });

    describe('isCameFromMicroAppManage', () => {
        it('should return false if no window', () => {
            Reflect.deleteProperty(global, 'window');

            expect(store.isCameFromMicroAppManage).toBe(false);
        });

        it('should return false if prevUrl exists', () => {
            rootStore.routerStore.prevUrl = '/prev-url';

            expect(store.isCameFromMicroAppManage).toBe(false);
        });

        it('should return false if window.document.referrer not contain /manage part', () => {
            expect(store.isCameFromMicroAppManage).toBe(false);
        });

        it('should return true if window.document.referrer contain /manage part and prevUrl not exists', () => {
            rootStore.routerStore.prevUrl = undefined;
            Object.defineProperty(document, 'referrer', {
                value: '/manage',
                configurable: true,
            });

            expect(store.isCameFromMicroAppManage).toBe(true);
        });
    });

    describe('isHotelDetailsBrowsePagePreview', () => {
        beforeEach(() => {
            store.rootStore.routerStore.router = {
                query: {},
            };
            store.rootStore.queryParamsStore = {
                query: {},
            };
        });

        it('should return false if isHotelDetailsBrowsePage is false', () => {
            jest.spyOn(store, 'isHotelDetailsBrowsePage', 'get').mockReturnValue(false);

            expect(store.isHotelDetailsBrowsePagePreview).toBe(false);
        });

        it('should return false if router query do not has QueryParamName.HotelPreview', () => {
            store.rootStore.queryParamsStore.query[QueryParamName.HotelPreview] = '1';
            expect(store.isHotelDetailsBrowsePagePreview).toBe(false);
        });

        it('should return false if queryParamsStore do not has QueryParamName.HotelPreview', () => {
            store.rootStore.routerStore.router.query[QueryParamName.HotelPreview] = '1';
            expect(store.isHotelDetailsBrowsePagePreview).toBe(false);
        });

        it('should return true if router query QueryParamName.HotelPreview is 1, isHotelDetailsBrowsePage is true, queryParamsStore.query.HotelPreview is 1', () => {
            jest.spyOn(store, 'isHotelDetailsBrowsePage', 'get').mockReturnValue(true);
            store.rootStore.routerStore.router.query[QueryParamName.HotelPreview] = '1';
            store.rootStore.queryParamsStore.query[QueryParamName.HotelPreview] = '1';

            expect(store.isHotelDetailsBrowsePagePreview).toBe(true);
        });
    });

    describe('isSearchResultsPagePrev', () => {
        it('should return true when search results is prev page', () => {
            store.prevTemplateId = store.siteTemplatesIds.SearchResultsPage;
            expect(store.isSearchResultsPagePrev).toBe(true);
        });

        it('should return false when search results is NOT prev page', () => {
            store.prevTemplateId = store.siteTemplatesIds.HomePage;
            expect(store.isSearchResultsPagePrev).toBe(false);
        });
    });

    describe('isAmendDatesSummaryPage', () => {
        it('should return true if sitecore template equal AmendDatesSummaryPage', () => {
            store.layout = {
                sitecore: {
                    route: {
                        templateId: SitecoreTemplateId.AmendDatesSummaryPage,
                    },
                },
            } as ISitecoreLayout;

            expect(store.isAmendDatesSummaryPage).toBe(true);
        });

        it('should return false if sitecore template NOT equal AmendDatesSummaryPage', () => {
            store.layout = {
                sitecore: {
                    route: {
                        templateId: SitecoreTemplateId.AccomodationBoard,
                    },
                },
            } as ISitecoreLayout;

            expect(store.isAmendDatesSummaryPage).toBe(false);
        });
    });

    describe('isAmendDatesPage', () => {
        it('should return true if sitecore template equal isAmendDatesPage', () => {
            store.layout = {
                sitecore: {
                    route: {
                        templateId: SitecoreTemplateId.AmendDatesPage,
                    },
                },
            } as ISitecoreLayout;

            expect(store.isAmendDatesPage).toBe(true);
        });

        it('should return false if sitecore template NOT equal isAmendDatesPage', () => {
            store.layout = {
                sitecore: {
                    route: {
                        templateId: SitecoreTemplateId.AccomodationBoard,
                    },
                },
            } as ISitecoreLayout;

            expect(store.isAmendDatesPage).toBe(false);
        });
    });

    describe('isAmendRoomAndBoardPage', () => {
        it('should return true if sitecore template equal AmendRoomAndBoardPage', () => {
            const store = new BaseLayoutStore(rootStore);
            store.layout = {
                sitecore: {
                    route: {
                        templateId: SitecoreTemplateId.ChangeRoomAndBoardTemplate,
                    },
                },
            } as ISitecoreLayout;

            expect(store.isAmendRoomAndBoardPage).toBe(true);
        });

        it('should return false if sitecore template NOT equal AmendRoomAndBoardPage', () => {
            const store = new BaseLayoutStore(rootStore);
            store.layout = {
                sitecore: {
                    route: {
                        templateId: SitecoreTemplateId.AccomodationBoard,
                    },
                },
            } as ISitecoreLayout;

            expect(store.isAmendRoomAndBoardPage).toBe(false);
        });
    });

    describe('isAmendHotelSummaryPage', () => {
        it('should return true if sitecore templateId equals AmendHotelSummaryPage', () => {
            store.layout = {
                sitecore: {
                    route: {
                        templateId: SitecoreTemplateId.AmendHotelSummaryPage,
                    },
                },
            } as ISitecoreLayout;

            expect(store.isAmendHotelSummaryPage).toBe(true);
        });

        it('should return false if sitecore templateId does NOT equal AmendHotelSummaryPage', () => {
            store.layout = {
                sitecore: {
                    route: {
                        templateId: SitecoreTemplateId.AccomodationBoard,
                    },
                },
            } as ISitecoreLayout;

            expect(store.isAmendHotelSummaryPage).toBe(false);
        });
    });

    describe('isAmendHotelPage', () => {
        it('should return true if sitecore templateId equals isAmendHotelPage', () => {
            store.layout = {
                sitecore: {
                    route: {
                        templateId: SitecoreTemplateId.AmendHotelPage,
                    },
                },
            };

            expect(store.isAmendHotelPage).toBe(true);
        });

        it('should return false if sitecore templateId does NOT equal isAmendHotelPage', () => {
            store.layout = {
                sitecore: {
                    route: {
                        templateId: SitecoreTemplateId.AccomodationBoard,
                    },
                },
            };

            expect(store.isAmendHotelPage).toBe(false);
        });
    });

    describe('deserialize', () => {
        it('should deserialize layout', () => {
            store.deserialize({ layout: layoutMock });

            expect(store.layout).toEqual(layoutMock);
        });

        it('should deserialize layout AND fix EE', () => {
            const layout = {
                ...layoutMock,
                sitecore: { context: { pageEditing: true } },
            };

            store.deserialize({ layout });

            expect(store.layout).toEqual(layout);
            expect(fixExpEditorClickEvents).toHaveBeenCalled();
        });

        it('should NOT fix EE on backend', () => {
            mockedIsBacked.mockReturnValue(true);
            const layout = {
                ...layoutMock,
                sitecore: { context: { pageEditing: true } },
            };

            store.deserialize({ layout });

            expect(fixExpEditorClickEvents).not.toHaveBeenCalled();
        });

        it('should deserialize dictionary', () => {
            const dictionary = { phrases: { test: 'test' } };

            store.deserialize({ dictionary });

            expect(store.dictionary).toEqual(dictionary);
        });

        it('should deserialize currentPath', () => {
            const currentPath = '/test';

            store.deserialize({ currentPath });

            expect(store.currentPath).toEqual(currentPath);
        });

        it('should deserialize lang', () => {
            const lang = 'EN';

            store.deserialize({ lang });

            expect(store.lang).toEqual(lang);
        });

        it('should deserialize domain', () => {
            const domain = 'test.com';

            store.deserialize({ domain });

            expect(store.domain).toEqual(domain);
        });

        it('should deserialize referrer', () => {
            const referrer = 'test2.com';
            store.deserialize({ referrer });

            expect(store.referrer).toEqual(referrer);
        });

        it('should deserialize protocol', () => {
            const protocol = 'https';

            store.deserialize({ protocol });

            expect(store.protocol).toEqual(protocol);
        });

        it('should deserialize fullPath', () => {
            const fullUrl = 'https://test.com';

            store.deserialize({ fullUrl });

            expect(store.fullUrl).toEqual(fullUrl);
        });

        it('should deserialize basepath for holidays site', () => {
            store.deserialize({ basePath: '' });

            expect(store.basePath).toBe('/en/holidays');
        });

        it('should deserialize basepath for TradePortal site', () => {
            store.layout = {
                ...layoutMock,
                sitecore: { context: { site: { name: SiteName.TradePortal } } },
            };

            store.deserialize({ basePath: '' });

            expect(store.basePath).toBe('/en/holidays/trade-portal');
        });

        it('should deserialize user device type', () => {
            store.deserialize({ isMobileDeviceDetectedDuringSSR: true });

            expect(store.isMobileDeviceDetectedDuringSSR).toBe(true);
        });
    });

    describe('serialize', () => {
        it('should return appropriate data', () => {
            store.dictionary = [];
            store.settings = [];
            store.isMobileDeviceDetectedDuringSSR = true;
            store.basePath = 'basePath';
            store.dateLocale = 'dateLocale';
            store.currentPath = 'currentPath';
            store.tooltipSettings = 'tooltipSettings';
            store.lang = 'en';
            store.domain = 'domain';
            store.protocol = 'https';
            store.fullUrl = 'fullUrl';
            store.referrer = 'referrer';
            store.rawCookies = 'cookies';

            expect(store.serialize()).toStrictEqual({
                dictionary: [],
                settings: [],
                tooltipSettings: 'tooltipSettings',
                currentPath: 'currentPath',
                lang: 'en',
                domain: 'domain',
                protocol: 'https',
                fullUrl: 'fullUrl',
                basePath: 'basePath',
                dateLocale: 'dateLocale',
                isMobileDeviceDetectedDuringSSR: true,
                referrer: 'referrer',
                cookies: 'cookies',
            });
        });
    });

    describe('isTradePortal', () => {
        it('should return false when there is NO layout', () => {
            expect(store.isTradePortal).toBe(false);
        });

        it('should return false when site name is NOT TradePortal', () => {
            store.layout = layoutMock;

            expect(store.isTradePortal).toBe(false);
        });

        it('should return true when site name is TradePortal', () => {
            store.layout = {
                ...layoutMock,
                sitecore: { context: { site: { name: SiteName.TradePortal } } },
            };

            expect(store.isTradePortal).toBe(true);
        });
    });

    describe('context', () => {
        it('should return undefined when NO layout defined', () => {
            expect(store.context).toBeUndefined();
        });

        it('should return context', () => {
            store.layout = layoutMock;

            expect(store.context).toEqual(sitecoreLayoutContextMock);
        });
    });

    describe('route', () => {
        it('should return undefined when there is NO layout', () => {
            expect(store.route).toBeUndefined();
        });

        it('should return route from layout', () => {
            store.layout = layoutMock;

            expect(store.route).toEqual(sitecoreLayoutRouteMock);
        });
    });

    describe('layoutId', () => {
        it('should return empty string when there is NO layout', () => {
            expect(store.layoutId).toBe('');
        });

        it('should return layoutId', () => {
            store.layout = layoutMock;

            expect(store.layoutId).toBe('routeItemId');
        });
    });

    describe('layoutName', () => {
        it('should return empty string when there is NO layout', () => {
            expect(store.layoutName).toBe('');
        });

        it('should return layoutName', () => {
            store.layout = layoutMock;

            expect(store.layoutName).toBe('Home');
        });
    });

    describe('displayName', () => {
        it('should return empty string when there is NO layout', () => {
            expect(store.displayName).toBe('');
        });

        it('should return displayName', () => {
            store.layout = layoutMock;

            expect(store.displayName).toBe('Spain');
        });
    });

    describe('templateId', () => {
        it('should return undefined when there is NO layout', () => {
            expect(store.templateId).toBeUndefined();
        });

        it('should return templateId', () => {
            store.layout = layoutMock;

            expect(store.templateId).toBe(SitecoreTemplateId.HomePage);
        });
    });

    describe('pageFields', () => {
        it('should return null when there is NO layout', () => {
            expect(store.pageFields).toBeNull();
        });

        it('should return pageFields', () => {
            store.layout = layoutMock;

            expect(store.pageFields).toEqual(sitecoreLayoutRouteMock.fields);
        });
    });

    describe('pageTitle', () => {
        it('should return empty string when there is NO layout', () => {
            expect(store.pageTitle).toBe('');
        });

        it('should return pageTitle', () => {
            store.layout = layoutMock;

            expect(store.pageTitle).toEqual('Home Page Title');
        });
    });

    describe('pageName', () => {
        it('should return empty string when there is NO layout', () => {
            expect(store.pageName).toBe('');
        });

        it('should return pageName', () => {
            store.layout = layoutMock;

            expect(store.pageName).toBe('Home');
        });
    });

    describe('pageUrls', () => {
        it('should return undefined when there is NO layout', () => {
            expect(store.pageUrls).toBeUndefined();
        });

        it('should return pageUrls', () => {
            store.layout = layoutMock;

            expect(store.pageUrls).toBe(sitecoreLayoutContextMock.pageUrls);
        });
    });

    describe('shouldTrackUrl', () => {
        it('should return false when there is NO layout', () => {
            expect(store.shouldTrackUrl).toBe(false);
        });

        it('should return pageTitle', () => {
            store.layout = layoutMock;

            expect(store.shouldTrackUrl).toBe(true);
        });
    });

    describe('trackingGoalId', () => {
        it('should return empty string when there is NO layout', () => {
            expect(store.trackingGoalId).toBe('');
        });

        it('should return trackingGoalId', () => {
            store.layout = layoutMock;

            expect(store.trackingGoalId).toBe('1');
        });
    });

    describe('pageProfile', () => {
        it('should return pageProfile from context', () => {
            store.layout = layoutMock;

            expect(store.pageProfile).toStrictEqual({
                hotelTheme: {
                    beach: 1,
                    city: 1,
                    lake: 1,
                },
            });
        });

        it('should return undefined when pageProfile is NOT provided', () => {
            expect(store.pageProfile).toBeUndefined();
        });
    });

    describe('isEditMode', () => {
        it('should return false when there is NO layout', () => {
            expect(store.isEditMode).toBe(false);
        });

        it('should return false when pageEditing is false', () => {
            store.layout = layoutMock;

            expect(store.isEditMode).toBe(false);
        });

        it('should return true when pageEditing is true', () => {
            store.layout = {
                ...layoutMock,
                sitecore: { context: { pageEditing: true } },
            };

            expect(store.isEditMode).toBe(true);
        });
    });

    describe('isPreviewMode', () => {
        it('should return false when there is NO layout', () => {
            expect(store.isPreviewMode).toBe(false);
        });

        it('should return false when pageEditing is false', () => {
            store.layout = layoutMock;

            expect(store.isPreviewMode).toBe(false);
        });

        it('should return true when pageEditing is true', () => {
            store.layout = {
                ...layoutMock,
                sitecore: { context: { pageState: LayoutServicePageState.Preview } },
            };

            expect(store.isPreviewMode).toBe(true);
        });
    });

    describe('maintenance', () => {
        it('should be false maintenance when there is NO layout', () => {
            expect(store.isFullMaintenance).toBe(false);
            expect(store.isSoftMaintenance).toBe(false);
            expect(store.isMaintenance).toBe(false);
        });

        it('should be full maintenance', () => {
            store.layout = {
                ...layoutMock,
                sitecore: { context: { isFullMode: true } },
            };

            expect(store.isSoftMaintenance).toBe(false);
            expect(store.isFullMaintenance).toBe(true);
            expect(store.isMaintenance).toBe(true);
        });

        it('should be soft maintenance', () => {
            store.layout = {
                ...layoutMock,
                sitecore: { context: { isSoftMode: true } },
            };

            expect(store.isFullMaintenance).toBe(false);
            expect(store.isSoftMaintenance).toBe(true);
            expect(store.isMaintenance).toBe(true);
        });
    });

    describe('simple page detector', () => {
        [
            { pageName: 'VirtualResortBrowsePage', prop: 'isVirtualResortBrowsePage' },
            { pageName: 'CountryBrowsePage', prop: 'isCountryBrowsePage' },
            { pageName: 'RegionBrowsePage', prop: 'isRegionBrowsePage' },
            { pageName: 'RegionCityBrowsePage', prop: 'isRegionCityBrowsePage' },
            { pageName: 'VirtualRegionBrowsePage', prop: 'isVirtualRegionBrowsePage' },
            { pageName: 'ResortBrowsePage', prop: 'isResortBrowsePage' },
            { pageName: 'HotelDetailsBrowse', prop: 'isHotelDetailsBrowsePage' },
            { pageName: 'AmendPassengerDetailsPage', prop: 'isAmendPassengerDetailsPage' },
            { pageName: 'HotelDetailsBook', prop: 'isHotelDetailsBookPage' },
            { pageName: 'ExtrasPage', prop: 'isExtrasPage' },
            { pageName: 'DealsPage', prop: 'isDealsHubPage' },
            { pageName: 'GuestDetailsPage', prop: 'isGuestDetailsPage' },
            { pageName: 'MyBookingPage', prop: 'isViewBookingPage' },
            { pageName: 'MyBookingsPage', prop: 'isBookingsListPage' },
            { pageName: 'BookingConfirmationPage', prop: 'isConfirmationPage' },
            { pageName: 'HomePage', prop: 'isHomePage' },
            { pageName: 'PromoPage', prop: 'isPromoPage' },
            { pageName: 'NotFoundPage', prop: 'isNotFoundPage' },
            { pageName: 'DynamicPromoPage', prop: 'isOldDynamicPromoPage' },
            { pageName: 'DynamicPromoPageLayout', prop: 'isDynamicPromoPageLayout' },
            { pageName: 'RecurringPromoPage', prop: 'isRecurringPromoPage' },
            { pageName: 'PeriodDrivenPromoPage', prop: 'isPeriodDrivenPromoPage' },
            { pageName: 'SearchResultsPage', prop: 'isSearchResultsPage' },
            { pageName: 'GenericPage', prop: 'isGenericPage' },
            { pageName: 'ShortlistPage', prop: 'isShortlistPage' },
            { pageName: 'PricePromisePage', prop: 'isPricePromisePage' },
            { pageName: 'ShortlistNoResultsPage', prop: 'isShortlistNoResultsPage' },
            { pageName: 'AllHolidayTypesPage', prop: 'isAllHolidayTypesPage' },
            { pageName: 'HolidayTypePage', prop: 'isHolidayTypePage' },
            { pageName: 'HolidayInspirationPage', prop: 'isHolidayInspirationPage' },
            { pageName: 'AmendTransfersPage', prop: 'isAmendTransfersPage' },
            { pageName: 'AmendDatesSummaryPage', prop: 'isAmendDatesSummaryPage' },
            { pageName: 'AmendDatesPage', prop: 'isAmendDatesPage' },
            { pageName: 'AmendFlightsPage', prop: 'isAmendFlightsPage' },
            { pageName: 'ChangeRoomAndBoardTemplate', prop: 'isAmendRoomAndBoardPage' },
            { pageName: 'AmendPaymentPage', prop: 'isAmendPaymentPage' },
            { pageName: 'TradePortalAmendPaymentPage', prop: 'isAmendPaymentPage' },
        ].forEach(({ pageName, prop }) => {
            it(`should return false when templateId is NOT equal to ${pageName} Sitecore TemplateId`, () => {
                expect(store[prop]).toBe(false);
            });

            it(`should return true when templateId is equal to ${pageName} Sitecore TemplateId`, () => {
                store.layout = {
                    ...layoutMock,
                    sitecore: { route: { templateId: SitecoreTemplateId[pageName] } },
                };

                expect(store[prop]).toBe(true);
            });
        });
    });

    describe('isDestinationPage', () => {
        it('should return true if sitecore baseTemplates include DestinationPage', () => {
            store.layout = {
                ...layoutMock,
                sitecore: { context: { baseTemplates: [store.siteTemplatesIds.DestinationPage] } },
            };
            expect(store.isDestinationPage).toBe(true);
        });

        it('should return false if sitecore baseTemplates do NOT include DestinationPage', () => {
            store.layout = {
                ...layoutMock,
                sitecore: { context: { baseTemplates: [store.siteTemplatesIds.HomePage] } },
            };
            expect(store.isDestinationPage).toBe(false);
        });
    });

    describe('isDestinationPagePrev', () => {
        it('should return true when destination page is prev page', () => {
            store.prevBaseTemplates = [store.siteTemplatesIds.DestinationPage];
            expect(store.isDestinationPagePrev).toBe(true);
        });

        it('should return false when destination page is NOT prev page', () => {
            store.prevBaseTemplates = [store.siteTemplatesIds.HomePage];
            expect(store.isDestinationPagePrev).toBe(false);
        });
    });

    describe('isHotelDetailsBookPagePrev', () => {
        it('should return false when prevTemplateId is NOT equal to HotelDetailsBook Sitecore TemplateId', () => {
            store.prevTemplateId = SitecoreTemplateId.DynamicPromoPageLayout;

            expect(store.isHotelDetailsBookPagePrev).toBe(false);
        });

        it('should return true when prevTemplateId is equal to HotelDetailsBook Sitecore TemplateId', () => {
            store.prevTemplateId = SitecoreTemplateId.HotelDetailsBook;

            expect(store.isHotelDetailsBookPagePrev).toBe(true);
        });
    });

    describe('isDynamicPromoPagePrev', () => {
        it('should return false when prevTemplateId is NOT equal to DynamicPromoPageLayout Sitecore TemplateId', () => {
            store.prevTemplateId = SitecoreTemplateId.HotelDetailsBook;

            expect(store.isDynamicPromoPagePrev).toBe(false);
        });

        it('should return true when prevTemplateId is equal to DynamicPromoPageLayout Sitecore TemplateId', () => {
            store.prevTemplateId = SitecoreTemplateId.DynamicPromoPageLayout;

            expect(store.isDynamicPromoPagePrev).toBe(true);
        });
    });

    describe('isPostBookingPages', () => {
        it('should return true when isViewBookingPage', () => {
            jest.spyOn(store, 'isViewBookingPage', 'get').mockReturnValue(true);

            expect(store.isPostBookingPages).toBe(true);
        });

        it('should return true when isConfirmationPage', () => {
            jest.spyOn(store, 'isConfirmationPage', 'get').mockReturnValue(true);

            expect(store.isPostBookingPages).toBe(true);
        });

        it('should return false when it is neither isViewBookingPage nor isConfirmationPage', () => {
            jest.spyOn(store, 'isConfirmationPage', 'get').mockReturnValue(false);
            jest.spyOn(store, 'isViewBookingPage', 'get').mockReturnValue(false);

            expect(store.isPostBookingPages).toBe(false);
        });
    });

    describe('isPromoPage', () => {
        it('should return true when isDynamicPromoPage is true', () => {
            jest.spyOn(store, 'isDynamicPromoPage', 'get').mockReturnValue(true);

            expect(store.isPromoPage).toBe(true);
        });

        it('should return true when isRecurringPromoPage is true', () => {
            jest.spyOn(store, 'isRecurringPromoPage', 'get').mockReturnValue(true);

            expect(store.isPromoPage).toBe(true);
        });

        it('should return true when isPeriodDrivenPromoPage is true', () => {
            jest.spyOn(store, 'isPeriodDrivenPromoPage', 'get').mockReturnValue(true);

            expect(store.isPromoPage).toBe(true);
        });
    });

    describe('isPromoPagePrev', () => {
        beforeEach(() => {
            store.prevTemplateId = SitecoreTemplateId.PromoPage;
        });

        it('should return true when isDynamicPromoPage is true', () => {
            jest.spyOn(store, 'isDynamicPromoPage', 'get').mockReturnValueOnce(true);

            expect(store.isPromoPagePrev).toBe(true);
        });

        it('should return true when isRecurringPromoPage is true', () => {
            jest.spyOn(store, 'isRecurringPromoPage', 'get').mockReturnValueOnce(true);

            expect(store.isPromoPagePrev).toBe(true);
        });

        it('should return true when isPeriodDrivenPromoPage is true', () => {
            jest.spyOn(store, 'isPeriodDrivenPromoPage', 'get').mockReturnValueOnce(true);

            expect(store.isPromoPagePrev).toBe(true);
        });

        it('should return false when it is non-promo-page', () => {
            store.prevTemplateId = 'non-promo-page-id';

            expect(store.isPromoPagePrev).toBe(false);
        });
    });

    describe('isDynamicPromoPage', () => {
        it('should return false when both isOldDynamicPromoPage AND isDynamicPromoPageLayout false', () => {
            jest.spyOn(store, 'isOldDynamicPromoPage', 'get').mockReturnValue(false);
            jest.spyOn(store, 'isDynamicPromoPageLayout', 'get').mockReturnValue(false);

            expect(store.isDynamicPromoPage).toBe(false);
        });

        it('should return true when both isOldDynamicPromoPage is true', () => {
            jest.spyOn(store, 'isOldDynamicPromoPage', 'get').mockReturnValue(true);

            expect(store.isDynamicPromoPage).toBe(true);
        });

        it('should return true when both isDynamicPromoPageLayout is true', () => {
            jest.spyOn(store, 'isDynamicPromoPageLayout', 'get').mockReturnValue(true);

            expect(store.isDynamicPromoPage).toBe(true);
        });
    });

    describe('isShortlistPagePrev', () => {
        it('should return true when shortlist is prev page', () => {
            store.prevTemplateId = store.siteTemplatesIds.ShortlistPage;

            expect(store.isShortlistPagePrev).toBe(true);
        });

        it('should return false when shortlist is NOT prev page', () => {
            store.prevTemplateId = store.siteTemplatesIds.HomePage;

            expect(store.isShortlistPagePrev).toBe(false);
        });
    });

    describe('isNumberOfNightsLabelsEnabled', () => {
        it('should return false when getSetting returns false', () => {
            expect(store.isNumberOfNightsLabelsEnabled).toBe(false);
        });

        it('should return true when getSetting returns true', () => {
            store.getSetting = jest.fn(() => true);
            expect(store.isNumberOfNightsLabelsEnabled).toBe(true);
        });
    });

    describe('isSmartSeerCarouselCTANoFollowLinkEnabled', () => {
        it('should return false when getSetting returns false', () => {
            expect(store.isSmartSeerCarouselCTANoFollowLinkEnabled).toBe(false);
        });

        it('should return true when getSetting returns true', () => {
            store.getSetting = jest.fn(() => true);
            expect(store.isSmartSeerCarouselCTANoFollowLinkEnabled).toBe(true);
        });
    });

    describe('shouldInitSubscribeFlow', () => {
        beforeEach(() => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce(true);
            store.layout = layoutMock;
        });

        it('should return true when isSearchResultsPage, trackingGoalId are true and isNotificationsTimerStarted is false', () => {
            store.layout.sitecore.route.fields = { TrackingGoal: { id: '1' } };
            store.layout.sitecore.route.templateId = SitecoreTemplateId.SearchResultsPage;

            expect(store.shouldInitSubscribeFlow).toBe(true);
        });

        it('should return true when isHotelDetailsBookPage and trackingGoalId are true', () => {
            store.layout.sitecore.route.templateId = SitecoreTemplateId.HotelDetailsBook;

            expect(store.shouldInitSubscribeFlow).toBe(true);
        });

        it('should return true when isHomePage and trackingGoalId are true', () => {
            store.layout.sitecore.route.templateId = SitecoreTemplateId.HomePage;

            expect(store.shouldInitSubscribeFlow).toBe(true);
        });

        it('should return false when is NOT searchResultsPage, hotelDetailsBookPage, or homePage', () => {
            store.layout.sitecore.route.templateId = SitecoreTemplateId.PromoPage;

            expect(store.shouldInitSubscribeFlow).toBe(false);
        });

        it('should return false when TrackingGoaLId is NOT provided', () => {
            store.layout.sitecore.route.fields = { TrackingGoal: { id: '' } };
            store.layout.sitecore.route.templateId = SitecoreTemplateId.SearchResultsPage;

            expect(store.shouldInitSubscribeFlow).toBe(false);
        });

        it('should return false when isNotificationsTimerStarted is true', () => {
            store.isNotificationsTimerStarted = true;

            expect(store.shouldInitSubscribeFlow).toBe(false);
        });
    });

    describe('isFullScreenCarouselEnabledHotelDetailsDesktop', () => {
        it('should return false when getSetting returns false', () => {
            expect(store.isFullScreenCarouselEnabledHotelDetailsDesktop).toBe(false);
        });

        it('should return true when getSetting returns true', () => {
            store.getSetting = jest.fn(() => true);

            expect(store.isFullScreenCarouselEnabledHotelDetailsDesktop).toBe(true);
        });
    });

    describe('isFullScreenCarouselEnabledHotelDetailsMobile', () => {
        it('should return false when getSetting returns false', () => {
            expect(store.isFullScreenCarouselEnabledHotelDetailsMobile).toBe(false);
        });

        it('should return true when getSetting returns true', () => {
            store.getSetting = jest.fn(() => true);

            expect(store.isFullScreenCarouselEnabledHotelDetailsMobile).toBe(true);
        });
    });

    describe('isFullScreenCarouselEnabledPromoMobile', () => {
        it('should return false when getSetting returns false', () => {
            expect(store.isFullScreenCarouselEnabledPromoMobile).toBe(false);
        });

        it('should return true when getSetting returns true', () => {
            store.getSetting = jest.fn(() => true);

            expect(store.isFullScreenCarouselEnabledPromoMobile).toBe(true);
        });
    });

    describe('isFullScreenCarouselEnabledPromoDesktop', () => {
        it('should return false when getSetting returns false', () => {
            expect(store.isFullScreenCarouselEnabledPromoDesktop).toBe(false);
        });

        it('should return true when getSetting returns true', () => {
            store.getSetting = jest.fn(() => true);

            expect(store.isFullScreenCarouselEnabledPromoDesktop).toBe(true);
        });
    });

    describe('isFullScreenEnabledHotelDetails', () => {
        it('should call isFullScreenCarouselEnabledHotelDetailsMobile when isScreenLarge is false', () => {
            const mockIsFullScreenCarouselEnabledHotelDetailsMobile = jest
                .spyOn(store, 'isFullScreenCarouselEnabledHotelDetailsMobile', 'get')
                .mockReturnValue(true);

            expect(store.isFullScreenEnabledHotelDetails).toBe(true);
            expect(mockIsFullScreenCarouselEnabledHotelDetailsMobile).toHaveBeenCalled();
        });

        it('should call isFullScreenCarouselEnabledHotelDetailsDesktop when isScreenLarge is false', () => {
            rootStore.appStore = { isScreenLarge: true } as AppStore | TradePortalAppStore;
            const store = new BaseLayoutStore(rootStore);

            const mockIsFullScreenCarouselEnabledHotelDetailsDesktop = jest
                .spyOn(store, 'isFullScreenCarouselEnabledHotelDetailsDesktop', 'get')
                .mockReturnValue(true);

            expect(store.isFullScreenEnabledHotelDetails).toBe(true);
            expect(mockIsFullScreenCarouselEnabledHotelDetailsDesktop).toHaveBeenCalled();
        });
    });

    describe('isFullScreenEnabledPromo', () => {
        it('should call isFullScreenCarouselEnabledPromoMobile when isScreenLarge is false', () => {
            const mockIsFullScreenCarouselEnabledPromoMobile = jest
                .spyOn(store, 'isFullScreenCarouselEnabledPromoMobile', 'get')
                .mockReturnValue(true);

            expect(store.isFullScreenEnabledPromo).toBe(true);
            expect(mockIsFullScreenCarouselEnabledPromoMobile).toHaveBeenCalled();
        });

        it('should call isFullScreenCarouselEnabledPromoDesktop when isScreenLarge is false', () => {
            rootStore.appStore = { isScreenLarge: true } as AppStore | TradePortalAppStore;
            const store = new BaseLayoutStore(rootStore);

            const mockIsFullScreenCarouselEnabledPromoDesktop = jest
                .spyOn(store, 'isFullScreenCarouselEnabledPromoDesktop', 'get')
                .mockReturnValue(true);

            expect(store.isFullScreenEnabledPromo).toBe(true);
            expect(mockIsFullScreenCarouselEnabledPromoDesktop).toHaveBeenCalled();
        });
    });

    describe('isFullScreenCarouselEnabledSearchResultsDesktop', () => {
        it('should return false when getSetting returns false', () => {
            expect(store.isFullScreenCarouselEnabledSearchResultsDesktop).toBe(false);
        });

        it('should return true when getSetting returns true', () => {
            store.getSetting = jest.fn(() => true);

            expect(store.isFullScreenCarouselEnabledSearchResultsDesktop).toBe(true);
        });
    });

    describe('isFullScreenCarouselEnabledSearchResultsMobile', () => {
        it('should return false when getSetting returns false', () => {
            expect(store.isFullScreenCarouselEnabledSearchResultsMobile).toBe(false);
        });

        it('should return true when getSetting returns true', () => {
            store.getSetting = jest.fn(() => true);

            expect(store.isFullScreenCarouselEnabledSearchResultsMobile).toBe(true);
        });
    });

    describe('isFullScreenEnabledSearchResults', () => {
        it('should call isFullScreenCarouselEnabledSearchResultsMobile when isScreenLarge is false', () => {
            const mockIsFullScreenCarouselEnabledSearchResultsMobile = jest
                .spyOn(store, 'isFullScreenCarouselEnabledSearchResultsMobile', 'get')
                .mockReturnValue(true);

            expect(store.isFullScreenEnabledSearchResults).toBe(true);
            expect(mockIsFullScreenCarouselEnabledSearchResultsMobile).toHaveBeenCalled();
        });

        it('should call isFullScreenCarouselEnabledSearchResultsDesktop when isScreenLarge is false', () => {
            rootStore.appStore = { isScreenLarge: true } as AppStore | TradePortalAppStore;
            const store = new BaseLayoutStore(rootStore);

            const mockIsFullScreenCarouselEnabledSearchResultsDesktop = jest
                .spyOn(store, 'isFullScreenCarouselEnabledSearchResultsDesktop', 'get')
                .mockReturnValue(true);

            expect(store.isFullScreenEnabledSearchResults).toBe(true);
            expect(mockIsFullScreenCarouselEnabledSearchResultsDesktop).toHaveBeenCalled();
        });
    });

    describe('isTransferDurationEnabled', () => {
        it('should return true when isExtrasPage AND TransferDurationEnabled', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce(true);

            store.layout = layoutMock;

            store.updateLayout({
                ...layoutMock,
                sitecore: { route: { templateId: SitecoreTemplateId.ExtrasPage } },
            });

            expect(store.isTransferDurationEnabled).toBe(true);
        });

        it('should return true when isConfirmationPage AND TransferDurationEnabled', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce(true);
            store.layout = layoutMock;

            store.updateLayout({
                ...layoutMock,
                sitecore: { route: { templateId: SitecoreTemplateId.BookingConfirmationPage } },
            });

            expect(store.isTransferDurationEnabled).toBe(true);
        });

        it('should return true when isViewBookingPage AND TransferDurationEnabled', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce(true);
            store.layout = layoutMock;

            store.updateLayout({
                ...layoutMock,
                sitecore: { route: { templateId: SitecoreTemplateId.MyBookingPage } },
            });

            expect(store.isTransferDurationEnabled).toBe(true);
        });

        it('should return false when TransferDuration Disabled', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce(false);
            store.layout = layoutMock;

            store.updateLayout({
                ...layoutMock,
                sitecore: { route: { templateId: SitecoreTemplateId.BookingConfirmationPage } },
            });

            expect(store.isTransferDurationEnabled).toBe(false);
        });

        it('should return false when NOT confirmation, extras OR view booking page', () => {
            jest.spyOn(store, 'getSetting').mockReturnValueOnce(true);
            store.layout = layoutMock;

            store.updateLayout({
                ...layoutMock,
                sitecore: { route: { templateId: SitecoreTemplateId.AllHolidayTypesPage } },
            });

            expect(store.isTransferDurationEnabled).toBe(false);
        });
    });

    describe('Extra luggage settings section', () => {
        it('should return true if isHoldLuggageEnabled is enabled', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(true);

            expect(store.isHoldLuggageEnabled).toBe(true);
        });

        it('should return true if isSportsEquipmentEnabled is enabled', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(true);

            expect(store.isSportsEquipmentEnabled).toBe(true);
        });

        it('should return true for isCabinBagsEnabled', () => {
            const spy = jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(true);

            expect(store.isCabinBagsEnabled).toBe(true);
            expect(spy).toHaveBeenCalledWith(SiteSettings.IsCabinBagsEnabled);
        });

        describe('isExtraLuggageEnabled', () => {
            beforeEach(() => {
                jest.spyOn(store, 'isHoldLuggageEnabled', 'get').mockReturnValue(false);
                jest.spyOn(store, 'isSportsEquipmentEnabled', 'get').mockReturnValue(false);
            });

            it('should return false when HoldLuggage and SportsEquipment disabled', () => {
                expect(store.isExtraLuggageEnabled).toBe(false);
            });

            it('should return true when at least HoldLuggage enabled', () => {
                jest.spyOn(store, 'isHoldLuggageEnabled', 'get').mockReturnValue(true);

                expect(store.isExtraLuggageEnabled).toBe(true);
            });

            it('should return true when at least SportsEquipment enabled', () => {
                jest.spyOn(store, 'isSportsEquipmentEnabled', 'get').mockReturnValue(true);

                expect(store.isExtraLuggageEnabled).toBe(true);
            });

            it('should return true when both HoldLuggage and SportsEquipment enabled', () => {
                jest.spyOn(store, 'isHoldLuggageEnabled', 'get').mockReturnValue(true);
                jest.spyOn(store, 'isSportsEquipmentEnabled', 'get').mockReturnValue(true);

                expect(store.isExtraLuggageEnabled).toBe(true);
            });
        });

        describe('includedLuggageCode', () => {
            it('should return first included luggage code from FreeBagsPerPassenger', () => {
                jest.spyOn(store, 'getSetting').mockReturnValue('LUG=1&LUS=2');

                expect(store.includedLuggageCode).toBe('LUG');
            });

            it('should return empty string when FreeBagsPerPassenger setting undefined', () => {
                jest.spyOn(store, 'getSetting').mockReturnValue(undefined);

                expect(store.includedLuggageCode).toBe('');
            });
        });

        describe('maxNumberOfAdditionalLuggage and maxNumberOfSportEquipments and maxNumberOfLargeSportsEquipment', () => {
            it('should return max number of luggage', () => {
                jest.spyOn(store, 'getSetting').mockReturnValue('3');

                expect(store.maxNumberOfAdditionalLuggage).toBe(3);
                expect(store.maxNumberOfSportEquipments).toBe(3);
                expect(store.maxNumberOfLargeSportsEquipment).toBe(3);
            });

            it('should return 0 when corresponding setting is undefined', () => {
                jest.spyOn(store, 'getSetting').mockReturnValue(undefined);

                expect(store.maxNumberOfAdditionalLuggage).toBe(0);
                expect(store.maxNumberOfSportEquipments).toBe(0);
                expect(store.maxNumberOfLargeSportsEquipment).toBe(0);
            });
        });

        describe('extraLuggageCategoryCodes', () => {
            it('should return a combined array of holdLuggageCategoryCodes and sportEquipmentCategoryCodes', () => {
                jest.spyOn(store, 'holdLuggageCategoryCodes', 'get').mockReturnValue(['BAGE']);
                jest.spyOn(store, 'sportEquipmentCategoryCodes', 'get').mockReturnValue(['SEO', 'SEC']);

                expect(store.extraLuggageCategoryCodes).toStrictEqual(['BAGE', 'SEO', 'SEC']);
            });
        });

        describe('largeCabinBagsCategoryCode', () => {
            it('should return splitted luggage category code', () => {
                jest.spyOn(store, 'getSetting').mockReturnValue('CABI');

                expect(store.largeCabinBagsCategoryCode).toEqual(['CABI']);
            });

            it('should return splitted luggage category codes', () => {
                jest.spyOn(store, 'getSetting').mockReturnValue('CABI,SYK,ABL,YA');

                expect(store.largeCabinBagsCategoryCode).toEqual(['CABI', 'SYK', 'ABL', 'YA']);
            });

            it('should return [] when corresponding setting is undefined', () => {
                jest.spyOn(store, 'getSetting').mockReturnValue(undefined);

                expect(store.largeCabinBagsCategoryCode).toEqual([]);
            });
        });

        describe('holdLuggageCategoryCodes and sportEquipmentCategoryCodes', () => {
            it('should return splitted luggage category codes', () => {
                jest.spyOn(store, 'getSetting').mockReturnValue('BAGE,SEO,SEC');

                expect(store.holdLuggageCategoryCodes).toEqual(['BAGE', 'SEO', 'SEC']);
                expect(store.sportEquipmentCategoryCodes).toEqual(['BAGE', 'SEO', 'SEC']);
            });

            it('should return [] when corresponding setting is undefined', () => {
                jest.spyOn(store, 'getSetting').mockReturnValue(undefined);

                expect(store.holdLuggageCategoryCodes).toEqual([]);
                expect(store.sportEquipmentCategoryCodes).toEqual([]);
            });
        });

        describe('largeCabinBagCode', () => {
            it('should return cabin bag code', () => {
                const spy = jest.spyOn(store, 'getSetting').mockReturnValue('SCB1');

                expect(store.largeCabinBagCode).toEqual('SCB1');
                expect(spy).toHaveBeenCalledWith(SiteSettings.LargeCabinBagCode);
            });

            it('should return undefined when corresponding setting is undefined', () => {
                const spy = jest.spyOn(store, 'getSetting').mockReturnValue(undefined);

                expect(store.largeCabinBagCode).toBeUndefined();
                expect(spy).toHaveBeenCalledWith(SiteSettings.LargeCabinBagCode);
            });
        });

        describe('maxNumberOfCabinBagsPP', () => {
            it('should return max number of cabin bags per person', () => {
                const spy = jest.spyOn(store, 'getSetting').mockReturnValue('3');

                expect(store.maxNumberOfCabinBagsPP).toBe(3);
                expect(spy).toHaveBeenCalledWith(SiteSettings.LargeCabinBagMaxPerPassenger);
            });

            it('should return 0 when corresponding setting is undefined', () => {
                const spy = jest.spyOn(store, 'getSetting').mockReturnValue(undefined);

                expect(store.maxNumberOfCabinBagsPP).toBe(0);
                expect(spy).toHaveBeenCalledWith(SiteSettings.LargeCabinBagMaxPerPassenger);
            });
        });

        describe('SEAccommodationNoticePeriod', () => {
            it('should return SE accommodation notice period', () => {
                const spy = jest.spyOn(store, 'getSettingAsNumber').mockReturnValue(5);

                expect(store.SEAccommodationNoticePeriod).toBe(5);
                expect(spy).toHaveBeenCalledWith(SiteSettings.SportEquipmentAccommodationNoticePeriod);
            });
        });
    });

    describe('shouldPromoteBags', () => {
        it('should return false when no BagsPromotionUpSell setting', () => {
            jest.spyOn(store, 'getSetting').mockReturnValue(undefined);

            expect(store.shouldPromoteBags).toBe(false);
        });

        it('should return false when BagsPromotionUpSell is none', () => {
            jest.spyOn(store, 'getSetting').mockReturnValue(BagsPromotionCode.None);

            expect(store.shouldPromoteBags).toBe(false);
        });

        it('should return true when BagsPromotionUpSell is all', () => {
            jest.spyOn(store, 'getSetting').mockReturnValue(BagsPromotionCode.All);

            expect(store.shouldPromoteBags).toBe(true);
        });

        it('should return true when BagsPromotionUpSell is Zero AND defaultBagsNumber == 0', () => {
            jest.spyOn(store, 'getSetting').mockReturnValue(BagsPromotionCode.Zero);

            expect(store.shouldPromoteBags).toBe(true);
        });

        it('should return false when BagsPromotionUpSell is Zero AND defaultBagsNumber != 0', () => {
            store.rootStore.bookingStore.extraLuggage.defaultBagsNumber = 2;
            jest.spyOn(store, 'getSetting').mockReturnValue(BagsPromotionCode.Zero);

            expect(store.shouldPromoteBags).toBe(false);
        });
    });

    describe('setIsNotificationsTimerStarted', () => {
        it('should set isNotificationsTimerStarted state', () => {
            store.isNotificationsTimerStarted = true;

            store.setIsNotificationsTimerStarted(false);

            expect(store.isNotificationsTimerStarted).toBe(false);
        });
    });

    describe('isAmendBookingPage', () => {
        it('should return false by default', () => {
            expect(store.isAmendBookingPage).toBe(false);
        });

        it('should return true when isAmendFlightsPage is true', () => {
            jest.spyOn(store, 'isAmendFlightsPage', 'get').mockReturnValue(true);

            expect(store.isAmendBookingPage).toBe(true);
        });

        it('should return true when isAmendTransfersPage is true', () => {
            jest.spyOn(store, 'isAmendTransfersPage', 'get').mockReturnValue(true);

            expect(store.isAmendBookingPage).toBe(true);
        });

        it('should return true when isAmendPassengerDetailsPage is true', () => {
            jest.spyOn(store, 'isAmendPassengerDetailsPage', 'get').mockReturnValue(true);

            expect(store.isAmendBookingPage).toBe(true);
        });
    });

    describe('isViewBookingRedirectsEnabled', () => {
        it('should return true from setting', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(true);

            expect(store.isViewBookingRedirectsEnabled).toBe(true);
        });
    });

    describe('viewBookingLinks', () => {
        it('should return correct value from setting', () => {
            const expectedUrl = 'test-url';
            jest.spyOn(store, 'getSettingAsUrlString').mockReturnValue(expectedUrl);

            expect(store.viewBookingLinks).toEqual({
                inDestination: expectedUrl,
                preTravel: expectedUrl,
                postTravel: expectedUrl,
                viewBooking: expectedUrl,
                cancelled: expectedUrl,
            });
        });
    });

    describe('bookingHoursPreTravelStarts', () => {
        it('should return correct value from setting', () => {
            jest.spyOn(store, 'getSettingAsNumber').mockReturnValue(1);

            expect(store.bookingHoursPreTravelStarts).toBe(1);
        });
    });

    describe('bookingHoursPostTravelStarts', () => {
        it('should return correct value from setting', () => {
            jest.spyOn(store, 'getSettingAsNumber').mockReturnValue(1);

            expect(store.bookingHoursPostTravelStarts).toBe(1);
        });
    });

    describe('areStrikethroughPricesEnabled', () => {
        beforeEach(() => {
            store.getSetting = jest.fn(() => true);

            jest.spyOn(store, 'isPromoPage', 'get').mockReturnValue(true);
        });

        it('should return true when getSetting and isPromoPage are true', () => {
            expect(store.areStrikethroughPricesEnabled).toBe(true);
        });

        it('should return true when getSetting and isSearchResultsPage are true', () => {
            jest.spyOn(store, 'isPromoPage', 'get').mockReturnValue(false);
            jest.spyOn(store, 'isSearchResultsPage', 'get').mockReturnValue(true);

            expect(store.areStrikethroughPricesEnabled).toBe(true);
        });

        it('should return false when isPromoPage and isSearchResultsPage are false', () => {
            jest.spyOn(store, 'isPromoPage', 'get').mockReturnValue(false);

            expect(store.areStrikethroughPricesEnabled).toBe(false);
        });

        it('should return false when getSetting returns false', () => {
            store.getSetting = jest.fn(() => false);

            expect(store.areStrikethroughPricesEnabled).toBe(false);
        });
    });

    describe('isPageHasTemplateId', () => {
        beforeEach(() => {
            store.layout = {
                ...layoutMock,
                sitecore: { route: { templateId: SitecoreTemplateId.HomePage } },
            };
        });

        it('should return true when the template ID matches', () => {
            expect(store.isPageHasTemplateId(SitecoreTemplateId.HomePage)).toBe(true);
        });

        it('should return false when the template ID does not match', () => {
            expect(store.isPageHasTemplateId('some-other-template-id')).toBe(false);
        });
    });

    describe('trackPatternCard', () => {
        it('should track data for notification', () => {
            store.layout = {
                ...layoutMock,
                sitecore: { route: { templateId: SitecoreTemplateId.HotelDetailsBook } },
            };
            store.rootStore.queryParamsStore.query[QueryParamName.Theme] = 'Theme';
            store.trackPatternCard();

            expect(AxiosRequest.post).toHaveBeenCalledWith('http://test/cms-api/HotelTheme/TriggerPatternCard', {
                hotelType: 'Theme',
            });
        });
    });

    describe('updateLayout', () => {
        it('should update layout data and set prev templateId', () => {
            store.layout = layoutMock;
            store.layout.sitecore.route.templateId = SitecoreTemplateId.HomePage;

            const newLayout = {
                ...layoutMock,
                sitecore: { route: { templateId: SitecoreTemplateId.GuestDetailsPage } },
            };

            store.updateLayout(newLayout);

            expect(store.layout).toEqual(newLayout);
            expect(store.templateId).toBe(SitecoreTemplateId.GuestDetailsPage);
            expect(store.prevTemplateId).toBe(SitecoreTemplateId.HomePage);

            const destinationLayout = {
                ...layoutMock,
                sitecore: { route: { templateId: SitecoreTemplateId.DestinationPage } },
            };

            store.updateLayout(destinationLayout);

            expect(store.prevGiataHotelCode).toBe('');
        });
    });

    describe('updateLang', () => {
        it('should update lang and localize Flatpickr', async () => {
            await store.updateLang('EN');

            expect(store.lang).toBe('EN');
            expect(mockLocalizeFlatpickr).toHaveBeenCalledWith('EN');
        });

        it('should NOT call localizeFlatpickr if lang does not change', async () => {
            store.lang = 'EN';

            await store.updateLang('EN');

            expect(mockLocalizeFlatpickr).not.toHaveBeenCalled();
        });
    });

    describe('sitePath', () => {
        it('should return site path', () => {
            store.protocol = 'https';
            store.domain = 'www.easyjet.com';
            store.basePath = '/holidays/booking/spain';

            expect(store.sitePath).toBe('https://www.easyjet.com/holidays/booking/spain');
        });
    });

    describe('getSitePathInLang', () => {
        it('should return site path in new lang', () => {
            store.protocol = 'https';
            store.domain = 'www.easyjet.com';

            expect(store.getSitePathInLang('ch-fr')).toBe('https://www.easyjet.com/ch-fr/vacances');
        });
    });

    describe('getPageUrlInLang()', () => {
        beforeEach(() => {
            store.layout = layoutMock;
        });

        it('should return url in new lang', () => {
            expect(store.getPageUrlInLang('ch-fr')).toBe('/espagne');
        });

        it('should return undefined when no url for lang', () => {
            expect(store.getPageUrlInLang('lang')).toBeUndefined();
        });

        it('should return undefined when no lang', () => {
            expect(store.getPageUrlInLang('')).toBeUndefined();
        });

        it('should return undefined when no pageUrls', () => {
            store.layout = {
                ...layoutMock,
                sitecore: { context: {} },
            };

            expect(store.getPageUrlInLang('lang')).toBeUndefined();
        });
    });

    describe('resetLayoutError', () => {
        it('should set layout error to false', () => {
            store.isLayoutError = true;

            store.resetLayoutError();

            expect(store.isLayoutError).toBe(false);
        });
    });

    describe('setIsBodyScrollLocked', () => {
        it('should set isBodyScrollLocked state', () => {
            store.isBodyScrollLocked = false;

            store.setIsBodyScrollLocked(true);

            expect(store.isBodyScrollLocked).toBe(true);
        });
    });

    describe('getSettingAsUrlString', () => {
        it('should return URL string from setting', () => {
            store.settings.set('setting', { Url: 'test' });

            expect(store.getSettingAsUrlString('setting')).toBe('test');
        });

        it('should return an empty string when there is no URL in setting', () => {
            store.settings.set('setting', {});

            expect(store.getSettingAsUrlString('setting')).toBe('');
        });
    });

    describe('shouldDisplayStrikethroughPrices', () => {
        beforeEach(() => {
            mockGetTotalDiscount.mockReturnValue(200);
            jest.spyOn(store, 'areStrikethroughPricesEnabled', 'get').mockReturnValue(true);
        });

        it('should return true when getSetting, getTotalDiscount, areStrikethroughPricesEnabled are true', () => {
            expect(store.shouldDisplayStrikethroughPrices(mockedOffer)).toBe(true);
        });

        it('should return false when areStrikethroughPricesEnabled returns false', () => {
            jest.spyOn(store, 'areStrikethroughPricesEnabled', 'get').mockReturnValue(false);

            expect(store.shouldDisplayStrikethroughPrices(mockedOffer)).toBe(false);
        });

        it('should return false when getTotalDiscount returns 0', () => {
            mockGetTotalDiscount.mockReturnValue(0);

            expect(store.shouldDisplayStrikethroughPrices(mockedOffer)).toBe(false);
        });
    });

    describe('defaultSearchResultsNumber', () => {
        it('should return number from getSettingAsNumber', () => {
            jest.spyOn(store, 'getSettingAsNumber').mockReturnValue(10);

            expect(store.defaultSearchResultsNumber).toBe(10);
        });

        it('should return settings.Default.itemsPerPage when getSettingAsNumber returns null', () => {
            jest.spyOn(store, 'getSettingAsNumber').mockReturnValue(null);

            expect(store.defaultSearchResultsNumber).toBe(settings.Default.itemsPerPage);
        });
    });

    describe('promoPageSearchResultsNumber', () => {
        it('should return number from getSettingAsNumber', () => {
            jest.spyOn(store, 'getSettingAsNumber').mockReturnValue(10);

            expect(store.promoPageSearchResultsNumber).toBe(10);
        });

        it('should return settings.Default.itemsPerPage when getSettingAsNumber returns null', () => {
            jest.spyOn(store, 'getSettingAsNumber').mockReturnValue(null);

            expect(store.promoPageSearchResultsNumber).toBe(settings.Default.itemsPerPage);
        });
    });

    describe('numberOfResultsPerPage', () => {
        beforeEach(() => {
            jest.spyOn(store, 'promoPageSearchResultsNumber', 'get').mockReturnValue(10);
            jest.spyOn(store, 'defaultSearchResultsNumber', 'get').mockReturnValue(20);
        });

        it('should return promoPageSearchResultsNumber when isPromoPage is true', () => {
            jest.spyOn(store, 'isPromoPage', 'get').mockReturnValue(true);

            expect(store.numberOfResultsPerPage).toBe(store.promoPageSearchResultsNumber);
        });

        it('should return defaultSearchResultsNumber when isPromoPage is false', () => {
            jest.spyOn(store, 'isPromoPage', 'get').mockReturnValue(false);

            expect(store.numberOfResultsPerPage).toBe(store.defaultSearchResultsNumber);
        });
    });

    describe('forceReloadComponents', () => {
        const componentsMock = [
            { component: {} as ComponentRendering, placeholderPath: 'placeholderPath1' },
            { component: {} as ComponentRendering, placeholderPath: 'placeholderPath2' },
        ];

        beforeEach(() => {
            store.layout = layoutMock;
            jest.mocked(findComponentsByParam).mockReturnValue(componentsMock);
            jest.mocked(getAllPlaceholdersPathsFromParentComponents).mockReturnValue([
                'placeholderPath1',
                'placeholderPath2',
            ]);
        });

        it('should force reload components', async () => {
            store.currentPath = '/test';
            store.lang = 'EN';

            await store.forceReloadComponents();

            expect(findComponentsByParam).toHaveBeenCalledWith(layoutMock, FORCE_RELOAD_PARAM_NAME);
            expect(getAllPlaceholdersPathsFromParentComponents).toHaveBeenCalledWith(componentsMock);
        });
    });

    describe('isHotelCheckInEnabled', () => {
        it('should return true when IsHotelCheckInEnabled setting is true', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(true);

            expect(store.isHotelCheckInEnabled).toBe(true);
        });

        it('should return false when IsHotelCheckInEnabled setting is false', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(false);

            expect(store.isHotelCheckInEnabled).toBe(false);
        });
    });

    describe('isCompareDealsEnabledOnSearchResultsPage', () => {
        it('should return true when IsCompareDealsEnabledOnSearchResultsPage setting is true', () => {
            const spy = jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(true);

            expect(store.isCompareDealsEnabledOnSearchResultsPage).toBe(true);
            expect(spy).toHaveBeenCalledWith(SiteSettings.IsCompareDealsEnabledOnSearchResultsPage);
        });

        it('should return false when IsCompareDealsEnabledOnSearchResultsPage setting is false', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(false);

            expect(store.isCompareDealsEnabledOnSearchResultsPage).toBe(false);
        });
    });

    describe('isDiscountPercentagePillEnabled', () => {
        it('should return true when IsDiscountPercentagePillEnabled setting is true', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(true);

            expect(store.isDiscountPercentagePillEnabled).toBe(true);
        });

        it('should return false when IsDiscountPercentagePillEnabled setting is false', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(false);

            expect(store.isDiscountPercentagePillEnabled).toBe(false);
        });
    });

    describe('getSettingAsBoolean', () => {
        it('should return false if the setting does not exist', () => {
            expect(store.getSettingAsBoolean('toggleThatDoesNotExist')).toBe(false);
        });
    });

    describe('getFlexDays', () => {
        it('should return 0 when isFlexibleSearch is false', () => {
            expect(store.getFlexDays(false)).toBe(0);
        });

        it('should return 0 when isFlexibleSearch is undefined', () => {
            expect(store.getFlexDays(undefined)).toBe(0);
        });

        it('should return the number of flexible days when isFlexibleSearch is true', () => {
            jest.spyOn(store, 'getSettingAsNumber').mockReturnValue(3);

            expect(store.getFlexDays(true)).toBe(3);
        });
    });

    describe('getDestinationParentBreadcrumb', () => {
        it('should returns empty string if breadcrumbs is empty', () => {
            const layout = {
                ...layoutMock,
                sitecore: { context: { parentPages: [] } },
            };
            store.layout = layout;
            expect(store.getDestinationParentBreadcrumb()).toBe('');
        });

        it('should returns correct path if breadcrumbs has one element', () => {
            const layout = {
                ...layoutMock,
                sitecore: {
                    context: {
                        parentPages: [
                            {
                                key: 'Destination Hub',
                                value: '/destinations',
                            },
                        ],
                    },
                },
            };
            store.layout = layout;
            expect(store.getDestinationParentBreadcrumb()).toBe(`${store.sitePath}${store.pageBreadcrumbs[0].value}`);
        });

        it('should returns correct second latest element for two elements', () => {
            const layout = {
                ...layoutMock,
                sitecore: {
                    context: {
                        parentPages: [
                            {
                                key: 'Destination Hub',
                                value: '/destinations',
                            },
                            {
                                key: 'Jordan',
                                value: '/jordan',
                            },
                        ],
                    },
                },
            };
            store.layout = layout;
            expect(store.getDestinationParentBreadcrumb()).toBe(`${store.sitePath}${store.pageBreadcrumbs[0].value}`);
        });

        it('should returns correct path second latest element for more then two elements', () => {
            const layout = {
                ...layoutMock,
                sitecore: {
                    context: {
                        parentPages: [
                            {
                                key: 'Destination Hub',
                                value: '/destinations',
                            },
                            {
                                key: 'Jordan',
                                value: '/jordan',
                            },
                            {
                                key: 'Aqaba',
                                value: '/jordan/aqaba',
                            },
                            {
                                key: 'Aqaba',
                                value: '/jordan/aqaba/aqaba',
                            },
                        ],
                    },
                },
            };
            store.layout = layout;
            expect(store.getDestinationParentBreadcrumb()).toBe(`${store.sitePath}${store.pageBreadcrumbs[2].value}`);
        });
    });

    describe('isMonthSearchEnabled', () => {
        it('should return true when enabled', () => {
            const spy = jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(true);

            expect(store.isMonthSearchEnabled).toBe(true);
            expect(spy).toHaveBeenCalledWith(SiteSettings.IsSearchPodMonthSearchEnabled);
        });

        it('should return false when disabled', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(false);

            expect(store.isMonthSearchEnabled).toBe(false);
        });
    });

    describe('isCloudinaryDisabled', () => {
        it('should return true when DisableCloudinaryPlayer setting is enabled', () => {
            jest.spyOn(store, 'getSetting').mockReturnValue(true);

            expect(store.isCloudinaryDisabled).toBe(true);
        });

        it('should return false when DisableCloudinaryPlayer setting is disabled', () => {
            jest.spyOn(store, 'getSetting').mockReturnValue(false);

            expect(store.isCloudinaryDisabled).toBe(false);
        });

        it('should return false when DisableCloudinaryPlayer setting is undefined', () => {
            jest.spyOn(store, 'getSetting').mockReturnValue(undefined);

            expect(store.isCloudinaryDisabled).toBe(false);
        });
    });

    describe('promoCollections', () => {
        it('should return promo codes from route fields', () => {
            store.layout = {
                sitecore: {
                    route: {
                        fields: {
                            PromoCollections: [
                                { fields: { PromotionCodes: { value: 'PROMO-001' } } },
                                { fields: { PromotionCodes: { value: 'PROMO-002' } } },
                                { fields: { PromotionCodes: { value: undefined } } },
                            ],
                        },
                    },
                },
            } as ISitecoreLayout;

            expect(store.promoCollections).toEqual(['PROMO-001', 'PROMO-002']);
        });

        it('should return empty array when promo collections field missing', () => {
            store.layout = {
                sitecore: {
                    route: {
                        fields: {},
                    },
                },
            } as ISitecoreLayout;

            expect(store.promoCollections).toEqual([]);
        });
    });

    describe('isSummaryBarHidden', () => {
        it('should return false when setting is turned off', () => {
            const getSettingsSpy = jest.spyOn(store, 'getSettingAsBoolean');
            getSettingsSpy.mockReturnValue(false);

            expect(store.isSummaryBarHidden).toBe(false);
            expect(getSettingsSpy).toHaveBeenCalledWith(SiteSettings.IsSummaryBarHidden);
        });

        it('should return true when setting is turned on', () => {
            const getSettingsSpy = jest.spyOn(store, 'getSettingAsBoolean');
            getSettingsSpy.mockReturnValue(true);

            expect(store.isSummaryBarHidden).toBe(true);
            expect(getSettingsSpy).toHaveBeenCalledWith(SiteSettings.IsSummaryBarHidden);
        });
    });

    describe('isShortlistsLivePriceEnabled', () => {
        beforeEach(() => {
            jest.spyOn(store, 'getSetting').mockReturnValue(true);
            jest.spyOn(store, 'isLivePriceEnabled', 'get').mockReturnValue(true);
        });

        it('should return false when getSetting returns false', () => {
            jest.spyOn(store, 'getSetting').mockReturnValue(false);

            expect(store.isShortlistsLivePriceEnabled).toBe(false);
        });

        it('should return true when getSetting returns true', () => {
            expect(store.isShortlistsLivePriceEnabled).toBe(true);
        });

        it('should return false when getSetting returns true and isLivePriceEnabled is false', () => {
            jest.spyOn(store, 'isLivePriceEnabled', 'get').mockReturnValue(false);

            expect(store.isShortlistsLivePriceEnabled).toBe(false);
        });
    });

    describe('isStaticPromoPage', () => {
        it('should return true when isPromoPage is true and isDynamicPromoPage is false', () => {
            const store = new BaseLayoutStore(rootStore);
            jest.spyOn(store, 'isPromoPage', 'get').mockReturnValue(true);
            jest.spyOn(store, 'isDynamicPromoPage', 'get').mockReturnValue(false);

            const result = store.isStaticPromoPage;

            expect(result).toBe(true);
        });

        it('should return false when isPromoPage is false and isDynamicPromoPage is false', () => {
            const store = new BaseLayoutStore(rootStore);
            jest.spyOn(store, 'isPromoPage', 'get').mockReturnValue(false);
            jest.spyOn(store, 'isDynamicPromoPage', 'get').mockReturnValue(false);
            const result = store.isStaticPromoPage;

            expect(result).toBe(false);
        });

        it('should return false when isPromoPage is true and isDynamicPromoPage is true', () => {
            const store = new BaseLayoutStore(rootStore);
            jest.spyOn(store, 'isPromoPage', 'get').mockReturnValue(true);
            jest.spyOn(store, 'isDynamicPromoPage', 'get').mockReturnValue(true);

            const result = store.isStaticPromoPage;

            expect(result).toBe(false);
        });

        it('should return false when both isPromoPage and isDynamicPromoPage are false', () => {
            const store = new BaseLayoutStore(rootStore);
            jest.spyOn(store, 'isPromoPage', 'get').mockReturnValue(false);
            jest.spyOn(store, 'isDynamicPromoPage', 'get').mockReturnValue(false);
            const result = store.isStaticPromoPage;

            expect(result).toBe(false);
        });
    });

    describe('Optimizely Feature Experimentation', () => {
        const store = new BaseLayoutStore(rootStore);
        const mockGetSettingAsBoolean = jest.spyOn(store, 'getSettingAsBoolean');
        const mockGetSetting = jest.spyOn(store, 'getSetting');

        describe('isOptimizelyEnabled', () => {
            it('should return true when getSettingAsBoolean returns true', () => {
                mockGetSettingAsBoolean.mockReturnValue(true);

                expect(store.isOptimizelyEnabled).toBe(true);
                expect(store.getSettingAsBoolean).toHaveBeenCalledWith(SiteSettings.IsOptimizelyExperimentationEnabled);
            });

            it('should return false when getSettingAsBoolean returns false', () => {
                mockGetSettingAsBoolean.mockReturnValue(false);

                expect(store.isOptimizelyEnabled).toBe(false);
                expect(store.getSettingAsBoolean).toHaveBeenCalledWith(SiteSettings.IsOptimizelyExperimentationEnabled);
            });
        });

        describe('optimizelyUserId', () => {
            it('should return userId from getSetting', () => {
                const userId = 'oeu1754639239050r0.6723461017688855321';
                mockGetSetting.mockReturnValue(userId);

                expect(store.optimizelyUserId).toBe(userId);
                expect(store.getSetting).toHaveBeenCalledWith(SiteSettings.OptimizelyUserId);
            });

            it('should return empty string when getSetting returns undefined', () => {
                mockGetSetting.mockReturnValue(undefined);

                expect(store.optimizelyUserId).toBe('');
                expect(store.getSetting).toHaveBeenCalledWith(SiteSettings.OptimizelyUserId);
            });
        });

        describe('optimizelyUserAttributes', () => {
            it('should parse valid JSON from getSetting', () => {
                const attributes = { site: 'Holidays', language: 'en' };
                mockGetSetting.mockReturnValue(JSON.stringify(attributes));

                expect(store.optimizelyUserAttributes).toEqual(attributes);
                expect(store.getSetting).toHaveBeenCalledWith(SiteSettings.OptimizelyUserAttributes);
            });

            it('should return empty object when getSetting returns empty string', () => {
                mockGetSetting.mockReturnValue('');

                expect(store.optimizelyUserAttributes).toEqual({});
            });

            it('should return empty object when getSetting returns undefined', () => {
                mockGetSetting.mockReturnValue(undefined);

                expect(store.optimizelyUserAttributes).toEqual({});
            });

            it('should parse complex nested attributes', () => {
                const attributes = {
                    site: 'Holidays',
                    language: 'en',
                    user: { type: 'guest', country: 'UK' },
                    features: ['feature1', 'feature2'],
                };
                mockGetSetting.mockReturnValue(JSON.stringify(attributes));

                expect(store.optimizelyUserAttributes).toEqual(attributes);
            });
        });

        describe('optimizelySettingsDecisions', () => {
            it('should parse valid JSON array from getSetting', () => {
                const decisions = [
                    {
                        featureKey: 'sitesettings',
                        variationKey: null,
                        experimentKey: null,
                        isDisabled: true,
                    },
                    {
                        featureKey: 'sitesettings_2',
                        variationKey: '50_results',
                        experimentKey: 'search_results',
                        isDisabled: false,
                    },
                ];
                mockGetSetting.mockReturnValue(JSON.stringify(decisions));

                expect(store.optimizelySettingsDecisions).toEqual(decisions);
                expect(store.getSetting).toHaveBeenCalledWith(SiteSettings.OptimizelyDecisions);
            });

            it('should return empty array when getSetting returns empty string', () => {
                mockGetSetting.mockReturnValue('');

                expect(store.optimizelySettingsDecisions).toEqual([]);
            });

            it('should return empty array when getSetting returns undefined', () => {
                mockGetSetting.mockReturnValue(undefined);

                expect(store.optimizelySettingsDecisions).toEqual([]);
            });

            it('should handle empty decisions array', () => {
                mockGetSetting.mockReturnValue('[]');

                expect(store.optimizelySettingsDecisions).toEqual([]);
            });
        });

        describe('optimizelyComponentDecisions', () => {
            it('should return decisions from layout context', () => {
                const decisions: IOptimizelyDecision[] = [
                    {
                        featureKey: 'component_test',
                        variationKey: 'variant_a',
                        experimentKey: 'test',
                        isDisabled: false,
                    },
                    {
                        featureKey: 'component_test_2',
                        variationKey: 'variant_b',
                        experimentKey: 'test_2',
                        isDisabled: false,
                    },
                ];

                store.layout = {
                    sitecore: {
                        context: { optimizelyDecisions: decisions },
                        route: {},
                    },
                } as ISitecoreLayout;

                expect(store.optimizelyComponentDecisions).toEqual(decisions);
            });

            it('should return empty array when no layout', () => {
                store.layout = {} as ISitecoreLayout;
                expect(store.optimizelyComponentDecisions).toEqual([]);
            });

            it('should return empty array when no context', () => {
                store.layout = {
                    sitecore: {
                        route: {},
                    },
                } as ISitecoreLayout;
                expect(store.optimizelyComponentDecisions).toEqual([]);
            });

            it('should return empty array when optimizelyDecisions is undefined in context', () => {
                store.layout = {
                    sitecore: {
                        context: {},
                        route: {},
                    },
                } as ISitecoreLayout;
                expect(store.optimizelyComponentDecisions).toEqual([]);
            });

            it('should handle empty component decisions array', () => {
                store.layout = {
                    sitecore: {
                        context: { optimizelyDecisions: [] },
                        route: {},
                    },
                } as unknown as ISitecoreLayout;
                expect(store.optimizelyComponentDecisions).toEqual([]);
            });
        });

        describe('optimizelyComponentUserId', () => {
            it('should return optimizelyComponentUserId from context', () => {
                const userId = 'context-user-123';
                store.layout = {
                    sitecore: {
                        context: { optimizelyUserId: userId },
                        route: {},
                    },
                } as ISitecoreLayout;

                expect(store.optimizelyComponentUserId).toBe(userId);
            });

            it('should return empty string when context optimizelyUserId is undefined', () => {
                store.layout = {
                    sitecore: {
                        context: {},
                        route: {},
                    },
                } as ISitecoreLayout;

                expect(store.optimizelyComponentUserId).toBe('');
            });

            it('should return empty string when context is undefined', () => {
                store.layout = {
                    sitecore: {
                        route: {},
                    },
                } as ISitecoreLayout;

                expect(store.optimizelyComponentUserId).toBe('');
            });
        });

        describe('optimizelyComponentUserAttributes', () => {
            it('should return optimizelyComponentUserAttributes from context', () => {
                const userAttributes = { site: 'Holidays', language: 'en', page: 'hotel-details' };
                store.layout = {
                    sitecore: {
                        context: { optimizelyUserAttributes: userAttributes },
                        route: {},
                    },
                } as unknown as ISitecoreLayout;

                expect(store.optimizelyComponentUserAttributes).toEqual(userAttributes);
            });

            it('should return empty object when context optimizelyUserAttributes is undefined', () => {
                store.layout = {
                    sitecore: {
                        context: {},
                        route: {},
                    },
                } as ISitecoreLayout;

                expect(store.optimizelyComponentUserAttributes).toEqual({});
            });

            it('should return empty object when context is undefined', () => {
                store.layout = {
                    sitecore: {
                        route: {},
                    },
                } as ISitecoreLayout;

                expect(store.optimizelyComponentUserAttributes).toEqual({});
            });

            it('should handle complex userAttributes object', () => {
                const userAttributes = {
                    site: 'Holidays',
                    language: 'en',
                    nested: { key: 'value' },
                    array: [1, 2, 3],
                };
                store.layout = {
                    sitecore: {
                        context: { optimizelyUserAttributes: userAttributes },
                        route: {},
                    },
                } as unknown as ISitecoreLayout;

                expect(store.optimizelyComponentUserAttributes).toEqual(userAttributes);
            });
        });
    });

    describe('isTouristTaxEnabled', () => {
        it('should returns true when getSettingAsBoolean returns true', () => {
            store.getSettingAsBoolean = jest.fn(() => true);
            expect(store.isTouristTaxEnabled).toBe(true);
        });

        it('should returns false when getSettingAsBoolean returns false', () => {
            store.getSettingAsBoolean = jest.fn(() => false);
            expect(store.isTouristTaxEnabled).toBe(false);
        });
    });

    describe('isHolidayPackageCostHighlighted', () => {
        it('should returns true when getSettingAsBoolean returns true', () => {
            store.getSettingAsBoolean = jest.fn(() => true);
            expect(store.isHolidayPackageCostHighlighted).toBe(true);
        });

        it('should returns false when getSettingAsBoolean returns false', () => {
            store.getSettingAsBoolean = jest.fn(() => false);
            expect(store.isHolidayPackageCostHighlighted).toBe(false);
        });
    });

    describe('filterFacilitiesByDesignVariant', () => {
        let mockFacilityGroups: IFacilityGroup[];
        let filterOutOverviewGroupSpy;

        beforeEach(() => {
            mockFacilityGroups = [
                {
                    code: VirtualFacilityGroupCode.Accommodation,
                    description: 'Accommodation facilities',
                    iconUrl: 'accommodation-icon.png',
                    id: '1',
                    image: {
                        id: '1',
                        small: 'small.jpg',
                        medium: 'medium.jpg',
                        large: 'large.jpg',
                        selected: true,
                        description: 'Accommodation',
                    },
                    items: [],
                    name: 'Accommodation',
                    title: 'Accommodation',
                },
                {
                    code: VirtualFacilityGroupCode.FoodAndDrink,
                    description: 'Food and drink facilities',
                    iconUrl: 'food-icon.png',
                    id: '2',
                    image: {
                        id: '2',
                        small: 'small.jpg',
                        medium: 'medium.jpg',
                        large: 'large.jpg',
                        selected: true,
                        description: 'Food & Drink',
                    },
                    items: [],
                    name: 'Food & Drink',
                    title: 'Food & Drink',
                },
                {
                    code: VirtualFacilityGroupCode.SportsAndHealth,
                    description: 'Sports and health facilities',
                    iconUrl: 'sports-icon.png',
                    id: '3',
                    image: {
                        id: '3',
                        small: 'small.jpg',
                        medium: 'medium.jpg',
                        large: 'large.jpg',
                        selected: true,
                        description: 'Sports & Health',
                    },
                    items: [],
                    name: 'Sports & Health',
                    title: 'Sports & Health',
                },
                {
                    code: VirtualFacilityGroupCode.Overview,
                    description: 'Overview',
                    iconUrl: 'overview-icon.png',
                    id: '4',
                    image: {
                        id: '4',
                        small: 'small.jpg',
                        medium: 'medium.jpg',
                        large: 'large.jpg',
                        selected: true,
                        description: 'Overview',
                    },
                    items: [],
                    name: 'Overview',
                    title: 'Overview',
                },
            ];

            filterOutOverviewGroupSpy = jest
                .spyOn(facilitiesUtils, 'filterOutOverviewGroup')
                .mockImplementation(groups => groups);
        });

        afterEach(() => {
            filterOutOverviewGroupSpy.mockRestore();
        });

        describe('when variant is List', () => {
            it('should filter facilities by List variant codes from settings', () => {
                const listVariantCodes = [
                    VirtualFacilityGroupCode.Accommodation,
                    VirtualFacilityGroupCode.FoodAndDrink,
                ];
                jest.spyOn(store, 'getSetting').mockReturnValue(listVariantCodes);

                const result = store.filterFacilitiesByDesignVariant(
                    mockFacilityGroups,
                    FacilitiesDesignVariant.List,
                    false,
                );

                expect(store.getSetting).toHaveBeenCalledWith(SiteSettings.HotelFacilitiesVariantListDesign);
                expect(result).toHaveLength(2);
                expect(result[0].code).toBe(VirtualFacilityGroupCode.Accommodation);
                expect(result[1].code).toBe(VirtualFacilityGroupCode.FoodAndDrink);
            });

            it('should return empty array when no facilities match List variant codes', () => {
                const listVariantCodes = ['NON_EXISTENT_CODE'];
                jest.spyOn(store, 'getSetting').mockReturnValue(listVariantCodes);

                const result = store.filterFacilitiesByDesignVariant(
                    mockFacilityGroups,
                    FacilitiesDesignVariant.List,
                    false,
                );

                expect(result).toHaveLength(0);
            });

            it('should sort facilities according to order in variant codes', () => {
                const listVariantCodes = [
                    VirtualFacilityGroupCode.SportsAndHealth,
                    VirtualFacilityGroupCode.FoodAndDrink,
                    VirtualFacilityGroupCode.Accommodation,
                ];
                jest.spyOn(store, 'getSetting').mockReturnValue(listVariantCodes);

                const result = store.filterFacilitiesByDesignVariant(
                    mockFacilityGroups,
                    FacilitiesDesignVariant.List,
                    false,
                );

                expect(result).toHaveLength(3);
                expect(result[0].code).toBe(VirtualFacilityGroupCode.SportsAndHealth);
                expect(result[1].code).toBe(VirtualFacilityGroupCode.FoodAndDrink);
                expect(result[2].code).toBe(VirtualFacilityGroupCode.Accommodation);
            });
        });

        describe('when variant is Tabs', () => {
            it('should filter facilities by Tabs variant codes from settings', () => {
                const tabsVariantCodes = [VirtualFacilityGroupCode.SportsAndHealth, VirtualFacilityGroupCode.Overview];
                jest.spyOn(store, 'getSetting').mockReturnValue(tabsVariantCodes);

                const result = store.filterFacilitiesByDesignVariant(
                    mockFacilityGroups,
                    FacilitiesDesignVariant.Tabs,
                    false,
                );

                expect(store.getSetting).toHaveBeenCalledWith(SiteSettings.HotelFacilitiesVariantTabsDesign);
                expect(result).toHaveLength(2);
                expect(result[0].code).toBe(VirtualFacilityGroupCode.SportsAndHealth);
                expect(result[1].code).toBe(VirtualFacilityGroupCode.Overview);
            });

            it('should return empty array when no facilities match Tabs variant codes', () => {
                const tabsVariantCodes = ['NON_EXISTENT_CODE'];
                jest.spyOn(store, 'getSetting').mockReturnValue(tabsVariantCodes);

                const result = store.filterFacilitiesByDesignVariant(
                    mockFacilityGroups,
                    FacilitiesDesignVariant.Tabs,
                    false,
                );

                expect(result).toHaveLength(0);
            });
        });

        describe('when getSetting returns empty array', () => {
            it('should return empty array', () => {
                jest.spyOn(store, 'getSetting').mockReturnValue([]);

                const result = store.filterFacilitiesByDesignVariant(
                    mockFacilityGroups,
                    FacilitiesDesignVariant.List,
                    false,
                );

                expect(result).toHaveLength(0);
            });
        });

        describe('when getSetting returns undefined', () => {
            it('should return empty array', () => {
                jest.spyOn(store, 'getSetting').mockReturnValue(undefined);

                const result = store.filterFacilitiesByDesignVariant(
                    mockFacilityGroups,
                    FacilitiesDesignVariant.List,
                    false,
                );

                expect(result).toHaveLength(0);
            });
        });

        describe('filterOutOverviewGroup util', () => {
            it('should call filterOutOverviewGroup with correct parameters for List', () => {
                const listVariantCodes = [VirtualFacilityGroupCode.Accommodation];
                jest.spyOn(store, 'getSetting').mockReturnValue(listVariantCodes);
                jest.spyOn(store, 'isEcoCertifiedEnabledInFacilitiesTabs', 'get').mockReturnValue(false);

                store.filterFacilitiesByDesignVariant(mockFacilityGroups, FacilitiesDesignVariant.List, false);

                expect(filterOutOverviewGroupSpy).toHaveBeenCalledWith(expect.any(Array), false);
            });

            it('should call filterOutOverviewGroup with correct parameters for Tabs', () => {
                const tabsVariantCodes = [VirtualFacilityGroupCode.Accommodation];
                jest.spyOn(store, 'getSetting').mockReturnValue(tabsVariantCodes);
                jest.spyOn(store, 'isEcoCertifiedEnabledInFacilitiesTabs', 'get').mockReturnValue(false);

                store.filterFacilitiesByDesignVariant(mockFacilityGroups, FacilitiesDesignVariant.Tabs, false);

                expect(filterOutOverviewGroupSpy).toHaveBeenCalledWith(expect.any(Array), false);
            });

            it('should pass isEcoFacility=true when both isEcoCertifiedEnabledInFacilitiesTabs and isEcoFacility are true', () => {
                const listVariantCodes = [VirtualFacilityGroupCode.Accommodation];
                jest.spyOn(store, 'getSetting').mockReturnValue(listVariantCodes);
                jest.spyOn(store, 'isEcoCertifiedEnabledInFacilitiesTabs', 'get').mockReturnValue(true);

                store.filterFacilitiesByDesignVariant(mockFacilityGroups, FacilitiesDesignVariant.List, true);

                expect(filterOutOverviewGroupSpy).toHaveBeenCalledWith(expect.any(Array), true);
            });

            it('should pass isEcoFacility=false when isEcoCertifiedEnabledInFacilitiesTabs is false', () => {
                const listVariantCodes = [VirtualFacilityGroupCode.Accommodation];
                jest.spyOn(store, 'getSetting').mockReturnValue(listVariantCodes);
                jest.spyOn(store, 'isEcoCertifiedEnabledInFacilitiesTabs', 'get').mockReturnValue(false);

                store.filterFacilitiesByDesignVariant(mockFacilityGroups, FacilitiesDesignVariant.List, true);

                expect(filterOutOverviewGroupSpy).toHaveBeenCalledWith(expect.any(Array), false);
            });

            it('should return the result from filterOutOverviewGroup', () => {
                const listVariantCodes = [VirtualFacilityGroupCode.Accommodation];
                jest.spyOn(store, 'getSetting').mockReturnValue(listVariantCodes);

                const mockFilteredGroups = [mockFacilityGroups[0]];
                filterOutOverviewGroupSpy.mockReturnValue(mockFilteredGroups);

                const result = store.filterFacilitiesByDesignVariant(
                    mockFacilityGroups,
                    FacilitiesDesignVariant.List,
                    false,
                );

                expect(result).toEqual(mockFilteredGroups);
            });
        });
    });

    describe('isCheapestMonthPriceEnabled', () => {
        it('should return false if whenDropdownExperimentTestVariant is VariantA', () => {
            store.whenDropdownExperimentTestVariant = ExperimentVariants.VariantA;

            expect(store.isCheapestMonthPriceEnabled).toBe(false);
        });

        it('should return true if whenDropdownExperimentTestVariant is VariantC', () => {
            store.whenDropdownExperimentTestVariant = ExperimentVariants.VariantC;

            expect(store.isCheapestMonthPriceEnabled).toBe(true);
        });

        it('should return true if whenDropdownExperimentTestVariant is undefined and setting is true', () => {
            const spy = jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(true);

            expect(store.isCheapestMonthPriceEnabled).toBe(true);
            expect(spy).toHaveBeenCalledWith(SiteSettings.IsSearchCheapestMonthEnabled);
        });

        it('should return false if whenDropdownExperimentTestVariant is undefined and setting is false', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(false);

            expect(store.isCheapestMonthPriceEnabled).toBe(false);
        });
    });

    describe('isMonthSearchEnabled', () => {
        it('should return false if whenDropdownExperimentTestVariant is VariantA', () => {
            store.whenDropdownExperimentTestVariant = ExperimentVariants.VariantA;

            expect(store.isMonthSearchEnabled).toBe(false);
        });

        it('should return true if whenDropdownExperimentTestVariant is VariantC', () => {
            store.whenDropdownExperimentTestVariant = ExperimentVariants.VariantC;

            expect(store.isMonthSearchEnabled).toBe(true);
        });

        it('should return true if whenDropdownExperimentTestVariant is VariantB', () => {
            store.whenDropdownExperimentTestVariant = ExperimentVariants.VariantB;

            expect(store.isMonthSearchEnabled).toBe(true);
        });

        it('should return true if testVariant is undefined and setting is true', () => {
            const spy = jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(true);

            expect(store.isMonthSearchEnabled).toBe(true);
            expect(spy).toHaveBeenCalledWith(SiteSettings.IsSearchPodMonthSearchEnabled);
        });

        it('should return false if testVariant is undefined and setting is false', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(false);

            expect(store.isMonthSearchEnabled).toBe(false);
        });
    });

    describe('setWhenDropdownExperimentTestVariant', () => {
        it('should update whenDropdownExperimentTestVariant value', () => {
            expect(store.whenDropdownExperimentTestVariant).toBeUndefined();

            store.setWhenDropdownExperimentTestVariant('value');

            expect(store.whenDropdownExperimentTestVariant).toBe('value');
        });
    });

    describe('untrackedOptimizelyComponentDecisions', () => {
        it('should return all component decisions when none have been tracked', () => {
            const decisions = [
                {
                    featureKey: 'feature_a',
                    variationKey: 'variation_1',
                    experimentKey: 'experiment_1',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
                {
                    featureKey: 'feature_b',
                    variationKey: 'variation_2',
                    experimentKey: 'experiment_2',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
            ];
            store.layout = {
                sitecore: {
                    context: { optimizelyDecisions: decisions },
                    route: {},
                },
            } as unknown as ISitecoreLayout;

            expect(store.untrackedOptimizelyComponentDecisions).toHaveLength(2);
            expect(store.untrackedOptimizelyComponentDecisions).toEqual(decisions);
        });

        it('should filter out tracked feature keys', () => {
            const decisions = [
                {
                    featureKey: 'feature_a',
                    variationKey: 'variation_1',
                    experimentKey: 'experiment_1',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
                {
                    featureKey: 'feature_b',
                    variationKey: 'variation_2',
                    experimentKey: 'experiment_2',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
                {
                    featureKey: 'feature_c',
                    variationKey: 'variation_3',
                    experimentKey: 'experiment_3',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
            ];
            store.layout = {
                sitecore: {
                    context: { optimizelyDecisions: decisions },
                    route: {},
                },
            } as unknown as ISitecoreLayout;

            store.addTrackedOptimizelyComponentFeatureKeys(['feature_a', 'feature_c']);

            const untracked = store.untrackedOptimizelyComponentDecisions;
            expect(untracked).toHaveLength(1);
            expect(untracked[0].featureKey).toBe('feature_b');
        });

        it('should return empty array when all decisions are tracked', () => {
            const decisions = [
                {
                    featureKey: 'feature_a',
                    variationKey: 'variation_1',
                    experimentKey: 'experiment_1',
                    isDisabled: false,
                },
                {
                    featureKey: 'feature_b',
                    variationKey: 'variation_2',
                    experimentKey: 'experiment_2',
                    isDisabled: false,
                },
            ];
            store.layout = {
                sitecore: {
                    context: { optimizelyDecisions: decisions },
                    route: {},
                },
            } as unknown as ISitecoreLayout;

            store.addTrackedOptimizelyComponentFeatureKeys(['feature_a', 'feature_b']);

            expect(store.untrackedOptimizelyComponentDecisions).toHaveLength(0);
        });

        it('should return empty array when context has no decisions', () => {
            store.layout = {
                sitecore: {
                    context: {},
                    route: {},
                },
            } as ISitecoreLayout;

            expect(store.untrackedOptimizelyComponentDecisions).toHaveLength(0);
        });

        it('should handle disabled decisions correctly', () => {
            const decisions = [
                {
                    featureKey: 'feature_enabled',
                    variationKey: 'variation_1',
                    experimentKey: 'experiment_1',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
                {
                    featureKey: 'feature_disabled',
                    variationKey: null,
                    experimentKey: null,
                    isDisabled: true,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
            ];
            store.layout = {
                sitecore: {
                    context: { optimizelyDecisions: decisions },
                    route: {},
                },
            } as unknown as ISitecoreLayout;

            store.addTrackedOptimizelyComponentFeatureKeys(['feature_enabled']);

            const untracked = store.untrackedOptimizelyComponentDecisions;
            expect(untracked).toHaveLength(1);
            expect(untracked[0].featureKey).toBe('feature_disabled');
        });
    });

    describe('addTrackedOptimizelyComponentFeatureKeys', () => {
        it('should add feature keys to tracked set', () => {
            const decisions = [
                {
                    featureKey: 'feature_a',
                    variationKey: 'variation_1',
                    experimentKey: 'experiment_1',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
                {
                    featureKey: 'feature_b',
                    variationKey: 'variation_2',
                    experimentKey: 'experiment_2',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
                {
                    featureKey: 'feature_c',
                    variationKey: 'variation_3',
                    experimentKey: 'experiment_3',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
            ];
            store.layout = {
                sitecore: {
                    context: { optimizelyDecisions: decisions },
                    route: {},
                },
            } as unknown as ISitecoreLayout;

            store.addTrackedOptimizelyComponentFeatureKeys(['feature_a', 'feature_b']);

            const untracked = store.untrackedOptimizelyComponentDecisions;
            expect(untracked).toHaveLength(1);
            expect(untracked[0].featureKey).toBe('feature_c');
        });

        it('should add keys incrementally across multiple calls', () => {
            const decisions = [
                {
                    featureKey: 'feature_a',
                    variationKey: 'variation_1',
                    experimentKey: 'experiment_1',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
                {
                    featureKey: 'feature_b',
                    variationKey: 'variation_2',
                    experimentKey: 'experiment_2',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
                {
                    featureKey: 'feature_c',
                    variationKey: 'variation_3',
                    experimentKey: 'experiment_3',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
            ];
            store.layout = {
                sitecore: {
                    context: { optimizelyDecisions: decisions },
                    route: {},
                },
            } as unknown as ISitecoreLayout;

            store.addTrackedOptimizelyComponentFeatureKeys(['feature_a']);
            store.addTrackedOptimizelyComponentFeatureKeys(['feature_c']);

            const untracked = store.untrackedOptimizelyComponentDecisions;
            expect(untracked).toHaveLength(1);
            expect(untracked[0].featureKey).toBe('feature_b');
        });

        it('should handle duplicate feature keys (Set behavior)', () => {
            const decisions = [
                {
                    featureKey: 'feature_a',
                    variationKey: 'variation_1',
                    experimentKey: 'experiment_1',
                    isDisabled: false,
                },
            ];
            store.layout = {
                sitecore: {
                    context: { optimizelyDecisions: decisions },
                    route: {},
                },
            } as unknown as ISitecoreLayout;

            store.addTrackedOptimizelyComponentFeatureKeys(['feature_a']);
            store.addTrackedOptimizelyComponentFeatureKeys(['feature_a']); // duplicate

            expect(store.untrackedOptimizelyComponentDecisions).toHaveLength(0);
        });

        it('should handle empty array', () => {
            const decisions = [
                {
                    featureKey: 'feature_a',
                    variationKey: 'variation_1',
                    experimentKey: 'experiment_1',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
            ];
            store.layout = {
                sitecore: {
                    context: { optimizelyDecisions: decisions },
                    route: {},
                },
            } as unknown as ISitecoreLayout;

            store.addTrackedOptimizelyComponentFeatureKeys([]);

            expect(store.untrackedOptimizelyComponentDecisions).toHaveLength(1);
        });
    });

    describe('untrackedOptimizelyComponentDecisions - source filtering', () => {
        it('should filter out decisions with source === ComponentParamFlag and Default', () => {
            const decisions = [
                {
                    featureKey: 'feature_layout',
                    variationKey: 'variation_1',
                    experimentKey: 'experiment_1',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.Default,
                },
                {
                    featureKey: 'feature_component',
                    variationKey: 'variation_2',
                    experimentKey: 'experiment_2',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentParamFlag,
                },
                {
                    featureKey: 'feature_component',
                    variationKey: 'variation_4',
                    experimentKey: 'experiment_4',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
                {
                    featureKey: 'feature_no_source',
                    variationKey: 'variation_3',
                    experimentKey: 'experiment_3',
                    isDisabled: false,
                },
            ];

            store.layout = {
                sitecore: {
                    context: { optimizelyDecisions: decisions },
                    route: {},
                },
            } as unknown as ISitecoreLayout;

            expect(store.untrackedOptimizelyComponentDecisions).toHaveLength(1);
            expect(store.untrackedOptimizelyComponentDecisions).toEqual([decisions[2]]);
        });

        it('should combine source filtering with tracked feature keys filtering', () => {
            const decisions = [
                {
                    featureKey: 'feature_a',
                    variationKey: 'variation_1',
                    experimentKey: 'experiment_1',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
                {
                    featureKey: 'feature_b',
                    variationKey: 'variation_2',
                    experimentKey: 'experiment_2',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentParamFlag,
                },
                {
                    featureKey: 'feature_c',
                    variationKey: 'variation_3',
                    experimentKey: 'experiment_3',
                    isDisabled: false,
                    source: OptimizelyDecisionSource.ComponentPersonalization,
                },
            ];

            store.layout = {
                sitecore: {
                    context: { optimizelyDecisions: decisions },
                    route: {},
                },
            } as unknown as ISitecoreLayout;

            store.addTrackedOptimizelyComponentFeatureKeys(['feature_a']);

            expect(store.untrackedOptimizelyComponentDecisions).toHaveLength(1);
            expect(store.untrackedOptimizelyComponentDecisions[0].featureKey).toBe('feature_c');
        });
    });

    describe('optimizelyClient', () => {
        it('should return null when client is not set', () => {
            expect(store.optimizelyClient).toBeNull();
        });

        it('should return client instance when set', () => {
            const mockClient = {
                decideForKeys: jest.fn(),
                onReady: jest.fn(),
            } as unknown as ReactSDKClient;

            store.setOptimizelyClient(mockClient);

            expect(store.optimizelyClient).toBeTruthy();
            expect(store.optimizelyClient?.decideForKeys).toBeDefined();
            expect(store.optimizelyClient?.onReady).toBeDefined();
        });
    });

    describe('setOptimizelyClient', () => {
        it('should set client instance', () => {
            const mockClient = {
                decideForKeys: jest.fn(),
                onReady: jest.fn(),
                notificationCenter: {
                    addNotificationListener: jest.fn(),
                    removeNotificationListener: jest.fn(),
                },
            } as unknown as ReactSDKClient;

            store.setOptimizelyClient(mockClient);

            expect(store.optimizelyClient).toBeTruthy();
            expect(store.optimizelyClient?.decideForKeys).toBeDefined();
            expect(store.optimizelyClient?.onReady).toBeDefined();
            expect(store.optimizelyClient?.notificationCenter).toBeDefined();
        });

        it('should set client to null', () => {
            const mockClient = { decideForKeys: jest.fn() } as unknown as ReactSDKClient;

            store.setOptimizelyClient(mockClient);
            expect(store.optimizelyClient).toBeTruthy();

            store.setOptimizelyClient(null);
            expect(store.optimizelyClient).toBeNull();
        });
    });

    describe('isAssistedTravelOnlineFormEnabled', () => {
        it('should return true when isAssistedTravelOnlineFormEnabled setting is true', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(true);

            expect(store.isAssistedTravelOnlineFormEnabled).toBe(true);
        });

        it('should return false when isAssistedTravelOnlineFormEnabled setting is false', () => {
            jest.spyOn(store, 'getSettingAsBoolean').mockReturnValue(false);

            expect(store.isAssistedTravelOnlineFormEnabled).toBe(false);
        });
    });

    describe('daysBeforeDepartureTravelAssistanceCanBeRequested', () => {
        it('should return the correct number of days before departure when setting is available', () => {
            jest.spyOn(store, 'getSettingAsNumber').mockReturnValue(5);

            expect(store.daysBeforeDepartureTravelAssistanceCanBeRequested).toBe(5);
        });
    });

    describe('Mobile App Cookie Getters', () => {
        describe('mobileAppCookieQuery', () => {
            it('should return empty object when cookie is empty', () => {
                mockGetCookieFromContext.mockReturnValue('');

                expect(store.mobileAppCookieQuery).toEqual({});
            });

            it('should parse cookie with HideFeatures parameter', () => {
                mockGetCookieFromContext.mockReturnValue('hideFeatures=true');

                expect(store.mobileAppCookieQuery).toEqual({ hideFeatures: 'true' });
            });

            it('should parse cookie with DarkMode parameter', () => {
                mockGetCookieFromContext.mockReturnValue('darkMode=true');

                expect(store.mobileAppCookieQuery).toEqual({ darkMode: 'true' });
            });

            it('should parse cookie with multiple parameters', () => {
                mockGetCookieFromContext.mockReturnValue('hideFeatures=true&darkMode=false');
                store.rawCookies = 'test=cookies';

                const mobileAppCookieQuery = store.mobileAppCookieQuery;
                expect(mobileAppCookieQuery).toEqual({
                    hideFeatures: 'true',
                    darkMode: 'false',
                });
                expect(mockGetCookieFromContext).toHaveBeenCalledWith(CookiesKeys.EjMobileAppContext, 'test=cookies');
            });
        });

        describe('isMobileApp', () => {
            it('should return false when cookie is empty', () => {
                mockGetCookieFromContext.mockReturnValue('');

                expect(store.isMobileApp).toBe(false);
            });

            it('should return true when cookie has HideFeatures parameter', () => {
                mockGetCookieFromContext.mockReturnValue('hideFeatures=true');

                expect(store.isMobileApp).toBe(true);
            });

            it('should return true when cookie has DarkMode parameter', () => {
                mockGetCookieFromContext.mockReturnValue('darkMode=false');

                expect(store.isMobileApp).toBe(true);
            });

            it('should return true when cookie has multiple parameters', () => {
                mockGetCookieFromContext.mockReturnValue('version=1.0.0+1&platform=iOS&hideFeatures=true');

                expect(store.isMobileApp).toBe(true);
            });
        });

        describe('isMobileAppHideFeatures', () => {
            it('should return false when cookie is empty', () => {
                mockGetCookieFromContext.mockReturnValue('');

                expect(store.isMobileAppHideFeatures).toBe(false);
            });

            it('should return false when HideFeatures is not set', () => {
                mockGetCookieFromContext.mockReturnValue('darkMode=true');

                expect(store.isMobileAppHideFeatures).toBe(false);
            });

            it('should return false when HideFeatures is false string', () => {
                mockGetCookieFromContext.mockReturnValue('hideFeatures=false');

                expect(store.isMobileAppHideFeatures).toBe(false);
            });

            it('should return true when HideFeatures is true string', () => {
                mockGetCookieFromContext.mockReturnValue('hideFeatures=true');

                expect(store.isMobileAppHideFeatures).toBe(true);
            });

            it('should return false when HideFeatures has invalid value', () => {
                mockGetCookieFromContext.mockReturnValue('hideFeatures=1');

                expect(store.isMobileAppHideFeatures).toBe(false);
            });
        });

        describe('isMobileAppDarkMode', () => {
            it('should return false when cookie is empty', () => {
                mockGetCookieFromContext.mockReturnValue('');

                expect(store.isMobileAppDarkMode).toBe(false);
            });

            it('should return false when DarkMode is not set', () => {
                mockGetCookieFromContext.mockReturnValue('hideFeatures=true');

                expect(store.isMobileAppDarkMode).toBe(false);
            });

            it('should return false when DarkMode is false string', () => {
                mockGetCookieFromContext.mockReturnValue('darkMode=false');

                expect(store.isMobileAppDarkMode).toBe(false);
            });

            it('should return true when DarkMode is true string', () => {
                mockGetCookieFromContext.mockReturnValue('darkMode=true');

                expect(store.isMobileAppDarkMode).toBe(true);
            });

            it('should return false when DarkMode has invalid value', () => {
                mockGetCookieFromContext.mockReturnValue('darkMode=1');

                expect(store.isMobileAppDarkMode).toBe(false);
            });
        });
    });
});

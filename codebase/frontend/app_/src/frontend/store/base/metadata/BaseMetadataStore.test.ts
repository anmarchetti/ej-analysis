import { holidayThemeMock } from 'frontend/__mocks__/holidayTheme';
import { isIOS } from 'frontend/utils/browser.utils';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SiteSettings from 'models/enum/SiteSettings';

const mockGetLocationHierarchy = jest.fn();
jest.mock('frontend/utils/getLocationHierarchy', () => ({
    getLocationHierarchy: (...params) => mockGetLocationHierarchy(...params),
}));

import { BaseMetadataStore } from './BaseMetadataStore';

jest.mock('frontend/utils/browser.utils', () => ({ isIOS: jest.fn(() => false) }));

import { ILivePrice } from 'models/data/ILivePrice';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

const mockGetPriceWithTouristTax = jest.fn();
jest.mock('frontend/utils/touristTax.utils', () => ({
    __esModule: true,
    getPriceWithTouristTax: (...params) => mockGetPriceWithTouristTax(...params),
}));

const createRootStore = () =>
    ({
        promoPageStore: {
            getSeasonName: jest.fn(),
        },
        layoutStore: {
            lang: 'en',
            fullUrl: 'https://www.easyjet.com/en/holidays/test?param1=1&param2=2',
            sitePath: 'https://www.easyjet.com/en/holidays',
            getSetting: jest.fn(value => value),
            getPhrase: jest.fn(key => key),
            layout: {
                sitecore: {
                    route: {
                        name: 'Home',
                        displayName: 'Home',
                        databaseName: 'web',
                        deviceId: 'fe5d7fdf-89c0-4d99-9aa3-b5fbd009c9f3',
                        itemId: '0518d8c6-b7ca-4c73-86c2-a29d971ebeab',
                        itemLanguage: 'en',
                        itemVersion: 3,
                        layoutId: '4696e3cc-7da0-4264-bf00-b6e49c11b857',
                        templateId: '5cb2e852-45b1-47c9-a315-4038eb539cdc',
                        templateName: 'Home Page',
                        fields: {
                            'google-site-verification': mockSitecoreField('Test google-site-verification'),
                            PageCategory: mockSitecoreField('Test page category value'),
                            PageTitle: mockSitecoreField('{holidayTheme} country holidays'),
                            HolidayThemes: [holidayThemeMock],
                            PageImage: mockSitecoreField(mockSitecoreImageField('Test src')),
                            Robots: [
                                {
                                    id: '2ed5e200-068a-4d3f-ab14-86dd81bea30f',
                                    fields: {
                                        MetaValue: {
                                            value: 'nofollow',
                                        },
                                    },
                                },
                                {
                                    id: '2ed5e200-068a-4d3f-ab14-86dd81bea30f',
                                    fields: {
                                        MetaValue: {
                                            value: 'follow',
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
                extraRouteData: {
                    pageDescription: null,
                },
            },
        },
        hotelsStore: {},
        marketStore: {
            formatMoney: jest.fn(a => `£${a}`),
        },
    } as any);

describe('BaseMetadataStore', () => {
    let rootStore: any = createRootStore();
    let store: BaseMetadataStore;

    beforeEach(() => {
        rootStore = createRootStore();
        store = new BaseMetadataStore(rootStore);
    });

    it('all getters should correctly return values', () => {
        expect(store.route).toEqual(rootStore.layoutStore.layout.sitecore.route);
        expect(store.metaPageTitle).toBe('{holidayTheme} country holidays');
        expect(store.metaCategory).toBe('Test page category value');
        expect(store.metaRobots).toBe('nofollow, follow');
        expect(store.metaImage).toBe('Test src');
        expect(store.metaGoogleVerification).toBe('Test google-site-verification');
        expect(store.metaCanonical).toBe('https://www.easyjet.com/en/holidays/test?param1=1&param2=2');
        expect(store.metaType).toBe('website');
    });

    it('should NOT return route because of invalid data', () => {
        rootStore.layoutStore.layout = undefined;

        expect(store.route).toEqual(undefined);
    });

    it('should return country page title and country page description', () => {
        rootStore.layoutStore.isCountryBrowsePage = true;

        expect(store.metaPropertiesFromSettings).toEqual({
            title: SiteSettings.CountryTitle,
            description: SiteSettings.CountryDescription,
        });
    });

    it('should return region page title and region page description', () => {
        rootStore.layoutStore.isRegionBrowsePage = true;

        expect(store.metaPropertiesFromSettings).toEqual({
            title: SiteSettings.RegionTitle,
            description: SiteSettings.RegionDescription,
        });
    });

    it('should return resort page title and resort page description', () => {
        rootStore.layoutStore.isResortBrowsePage = true;

        expect(store.metaPropertiesFromSettings).toEqual({
            title: SiteSettings.ResortTitle,
            description: SiteSettings.ResortDescription,
        });
    });

    it('should return hotel page title and hotel page description', () => {
        rootStore.layoutStore.isHotelDetailsBrowsePage = true;

        expect(store.metaPropertiesFromSettings).toEqual({
            title: SiteSettings.HotelTitle,
            description: SiteSettings.HotelDescription,
        });
    });

    it('should NOT return meta category', () => {
        rootStore.layoutStore.layout.sitecore.route.fields.PageCategory = undefined;

        expect(store.metaCategory).toBe('');
    });

    it('should NOT return meta robots', () => {
        rootStore.layoutStore.layout.sitecore.route.fields.Robots = undefined;

        expect(store.metaRobots).toBe('');
    });

    it('should NOT return meta image', () => {
        rootStore.layoutStore.layout.sitecore.route.fields.PageImage = undefined;

        expect(store.metaImage).toBe('');
    });

    it('should NOT return google verification meta', () => {
        rootStore.layoutStore.layout.sitecore.route.fields['google-site-verification'] = undefined;

        expect(store.metaGoogleVerification).toBe('');
    });

    describe('metaPageTitle', () => {
        it('should return page title for dynamic promo pages', () => {
            rootStore.layoutStore.isDynamicPromoPage = true;
            rootStore.layoutStore.layout.sitecore.route.fields = {
                PageTitle: mockSitecoreField('Title without theme'),
                HolidayThemes: [],
            };

            expect(store.metaPageTitle).toEqual('Title without theme');
        });

        it('should return page title with {destinationName} and {season} replaced', () => {
            rootStore.layoutStore.isDynamicPromoPage = true;
            rootStore.layoutStore.layout.sitecore.route.fields = {
                PageTitle: mockSitecoreField('Welcome to {destinationName} during {season}'),
            };

            rootStore.promoPageStore.pageDestination = { name: 'Greece' };
            rootStore.promoPageStore.getSeasonName = jest.fn(() => 'Summer');

            expect(store.metaPageTitle).toEqual('Welcome to Greece during Summer');
        });

        it('should return page title for dynamic promo pages when no theme name in holiday themes', () => {
            rootStore.layoutStore.isDynamicPromoPage = true;
            rootStore.layoutStore.layout.sitecore.route.fields = {
                PageTitle: mockSitecoreField('Title without theme {holidayTheme}'),
                HolidayThemes: [{ fields: {} }],
            };

            expect(store.metaPageTitle).toEqual('Title without theme ');
        });

        it('should return page title for dynamic promo pages with holiday theme', () => {
            rootStore.layoutStore.isDynamicPromoPage = true;

            expect(store.metaPageTitle).toEqual('Beach country holidays');
        });

        it('should return title for HotelDetailsBrowsePage', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.PageTitle = mockSitecoreField(
                'Meta Hotel Details Browse Page Title',
            );
            rootStore.layoutStore.isHotelDetailsBrowsePage = true;

            expect(store.metaPageTitle).toEqual('Meta Hotel Details Browse Page Title');
        });

        it('should return title from settings for HotelDetailsBrowsePage when no meta properties for page', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.PageTitle = undefined;
            rootStore.layoutStore.isHotelDetailsBrowsePage = true;

            expect(store.metaPageTitle).toEqual(SiteSettings.HotelTitle);
        });

        it('should return empty title because of unavailable properties for page', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.PageTitle = undefined;
            rootStore.layoutStore.isDestinationPage = true;

            expect(store.metaPageTitle).toEqual('');
            expect(rootStore.layoutStore.getSetting).not.toHaveBeenCalled();
        });

        it('should return empty title because of destination page', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.PageTitle = undefined;

            expect(store.metaPageTitle).toEqual('');
        });
    });

    describe('metaCanonical', () => {
        it('should return formatted canonical url from sitecore', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.CanonicalUrl = { value: 'Canonical-Url/' };

            expect(store.metaCanonical).toBe('https://www.easyjet.com/en/holidays/canonical-url');
        });

        it('should return full url without query string on Destination Page', () => {
            rootStore.layoutStore.isDestinationPage = true;

            expect(store.metaCanonical).toBe('https://www.easyjet.com/en/holidays/test');
        });

        it('should return full url without query string on Hotel Book Page', () => {
            rootStore.layoutStore.isHotelDetailsBookPage = true;

            expect(store.metaCanonical).toBe('https://www.easyjet.com/en/holidays/test');
        });

        it("should NOT encode url when it's not ios", () => {
            rootStore.layoutStore.fullUrl = '/test 1';

            expect(store.metaCanonical).toBe('/test 1');
        });

        it('should encode url on ios', () => {
            (isIOS as jest.MockedFunction<typeof isIOS>).mockReturnValueOnce(true);
            rootStore.layoutStore.fullUrl = '/test 1';

            expect(store.metaCanonical).toBe('/test%201');
        });

        it('should return empty string when url is not defined', () => {
            rootStore.layoutStore.fullUrl = undefined;

            expect(store.metaCanonical).toBe('');
        });
    });

    describe('metaPageDescription', () => {
        it('should return description from extraRouteData', () => {
            rootStore.layoutStore.layout.extraRouteData.pageDescription = 'Meta description';

            expect(store.metaPageDescription).toEqual(rootStore.layoutStore.layout.extraRouteData.pageDescription);
        });

        it('should return description from route', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.Description = mockSitecoreField('Meta description');

            expect(store.metaPageDescription).toEqual(
                rootStore.layoutStore.layout.sitecore.route.fields.Description.value,
            );
        });

        it('should return description for destination page', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.Description =
                mockSitecoreField('Meta destination description');
            rootStore.layoutStore.isDestinationPage = true;

            expect(store.metaPageDescription).toEqual('Meta destination description');
        });

        it('should return description for HotelDetailsBrowsePage', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.Description = mockSitecoreField(
                'Meta Hotel Details Browse Page description',
            );
            rootStore.layoutStore.isHotelDetailsBrowsePage = true;

            expect(store.metaPageDescription).toEqual('Meta Hotel Details Browse Page description');
        });

        it('should return description from settings for HotelDetailsBrowsePage when no meta properties for page', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.Description = undefined;
            rootStore.layoutStore.isHotelDetailsBrowsePage = true;

            expect(store.metaPageDescription).toEqual(SiteSettings.HotelDescription);
        });

        it('should return empty description when no meta properties for page', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.Description = undefined;
            rootStore.layoutStore.isDestinationPage = true;

            expect(store.metaPageDescription).toEqual('');
            expect(rootStore.layoutStore.getSetting).not.toHaveBeenCalled();
        });

        it('should return empty description if page description if undefined', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.Description = undefined;

            expect(store.metaPageDescription).toEqual('');
        });
    });

    describe('metaImage', () => {
        it('should return extra route data page image when available', () => {
            rootStore.layoutStore.layout.extraRouteData = { pageImage: 'extra-route-image.jpg' };

            expect(store.metaImage).toBe('extra-route-image.jpg');
        });

        it('should return page image src when extra route data is not available', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.PageImage = mockSitecoreField({ src: 'page-image.jpg' });

            expect(store.metaImage).toBe('page-image.jpg');
        });

        it('should return empty string when page image src is not available', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.PageImage = mockSitecoreField(undefined);

            expect(store.metaImage).toBe('');
        });

        it('should return empty string when both extra route data and page image are unavailable', () => {
            rootStore.layoutStore.layout.extraRouteData = undefined;
            rootStore.layoutStore.layout.sitecore.route.fields.PageImage = undefined;

            expect(store.metaImage).toBe('');
        });
    });

    describe('replaceLivePrice', () => {
        let cheapestLivePrice: ILivePrice;

        beforeEach(() => {
            cheapestLivePrice = {
                pricePP: 120.2,
                pricePPExcludingTouristTax: 118,
                currency: 'GBP',
            } as ILivePrice;
            rootStore.layoutStore.isTouristTaxEnabled = false;
            mockGetPriceWithTouristTax.mockReturnValue(123);
        });

        it('should replace live price tokens with formatted price and label when cheapestLivePrice exists', () => {
            const content = 'Test content';

            const result = store.replaceLivePrice(content, cheapestLivePrice);

            expect(mockGetPriceWithTouristTax).toHaveBeenCalledWith(120.2, 118, false);
            expect(rootStore.marketStore.formatMoney).toHaveBeenCalledWith(123, {
                currency: 'GBP',
                maximumFractionDigits: 0,
            });
            expect(rootStore.layoutStore.getPhrase).toHaveBeenCalledWith(
                SitecoreDictionary.DestinationsLabelsLivePrice,
            );
            expect(result).toEqual('Test content');
        });

        it('should use tourist tax enabled flag when validating price', () => {
            rootStore.layoutStore.isTouristTaxEnabled = true;
            cheapestLivePrice.pricePP = 100;
            cheapestLivePrice.pricePPExcludingTouristTax = 90;

            const result = store.replaceLivePrice('Test content', cheapestLivePrice);

            expect(result).toEqual('Test content');
        });

        it('should ceil calculated price before formatting', () => {
            mockGetPriceWithTouristTax.mockReturnValue(123.1);
            cheapestLivePrice.pricePP = 120;
            cheapestLivePrice.pricePPExcludingTouristTax = 118;

            const result = store.replaceLivePrice('Test content', cheapestLivePrice);

            expect(rootStore.marketStore.formatMoney).toHaveBeenCalledWith(123.1, {
                currency: 'GBP',
                maximumFractionDigits: 0,
            });
            expect(result).toEqual('Test content');
        });

        it('should return empty live price tokens when cheapestLivePrice is null', () => {
            const content = 'Test content';

            const result = store.replaceLivePrice(content, null);

            expect(mockGetPriceWithTouristTax).not.toHaveBeenCalled();
            expect(rootStore.marketStore.formatMoney).not.toHaveBeenCalled();
            expect(rootStore.layoutStore.getPhrase).not.toHaveBeenCalled();
            expect(result).toEqual('Test content');
        });

        it('should use default price values when cheapestLivePrice has no price fields', () => {
            cheapestLivePrice.pricePP = 0;
            cheapestLivePrice.pricePPExcludingTouristTax = 0;

            const result = store.replaceLivePrice('Test content', cheapestLivePrice);

            expect(mockGetPriceWithTouristTax).not.toHaveBeenCalled();
            expect(result).toEqual('Test content');
        });

        it('should return empty LivePriceFrom when formatted price is empty', () => {
            rootStore.marketStore.formatMoney = jest.fn(() => '');
            cheapestLivePrice.pricePP = 100;
            cheapestLivePrice.pricePPExcludingTouristTax = 90;

            const result = store.replaceLivePrice('Test content', cheapestLivePrice);

            expect(rootStore.layoutStore.getPhrase).not.toHaveBeenCalled();
            expect(result).toEqual('Test content');
        });
    });

    describe('replaceHotelData', () => {
        beforeEach(() => {
            rootStore.layoutStore.layout.sitecore.route.fields.Name = mockSitecoreField('Grand Hotel');
        });

        it('should replace {name}, {resort} and {region} tokens when hierarchy is available', () => {
            mockGetLocationHierarchy.mockReturnValue({
                resort: { name: 'Costa Brava', code: 'CB' },
                region: { name: 'Catalonia', code: 'CAT' },
            });

            const result = store.replaceHotelData('Stay at {name} in {resort}, {region}');

            expect(result).toBe('Stay at Grand Hotel in Costa Brava, Catalonia');
        });

        it('should use empty strings for missing resort and region in hierarchy', () => {
            mockGetLocationHierarchy.mockReturnValue({});

            const result = store.replaceHotelData('{name} - {resort} - {region}');

            expect(result).toBe('Grand Hotel -  - ');
        });

        it('should use empty string for hotel name when Name field is not set', () => {
            rootStore.layoutStore.layout.sitecore.route.fields.Name = undefined;
            mockGetLocationHierarchy.mockReturnValue({
                resort: { name: 'Marbella', code: 'MB' },
                region: { name: 'Andalusia', code: 'AND' },
            });

            const result = store.replaceHotelData('{name}');

            expect(result).toBe('');
        });

        it('should return content unchanged when hierarchy is null', () => {
            mockGetLocationHierarchy.mockReturnValue(null);

            const result = store.replaceHotelData('unchanged content');

            expect(result).toBe('unchanged content');
        });

        it('should pass layout to getLocationHierarchy', () => {
            mockGetLocationHierarchy.mockReturnValue(null);

            store.replaceHotelData('content');

            expect(mockGetLocationHierarchy).toHaveBeenCalledWith(rootStore.layoutStore.layout);
        });
    });
});

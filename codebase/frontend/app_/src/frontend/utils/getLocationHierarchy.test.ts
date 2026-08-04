import { ISitecoreLayout } from 'models/data/SitecoreLayout';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';

import { getLocationHierarchy } from './getLocationHierarchy';

describe('getLocationHierarchy', () => {
    it(`should return NULL if no layout`, () => {
        const res = getLocationHierarchy(null as any);
        expect(res).toBeNull();
    });

    it(`should return NULL if it's not destination page`, () => {
        const res = getLocationHierarchy({
            sitecore: {
                route: { templateId: 'test', fields: {} },
            },
        } as any);
        expect(res).toBeNull();
    });

    it(`should return hierarchy for country`, () => {
        const res = getLocationHierarchy({
            sitecore: {
                route: {
                    templateId: SitecoreTemplateId.CountryBrowsePage,
                    fields: { Code: { value: 'ES' }, Name: { value: 'Spain' } },
                },
            },
        } as any);
        expect(res).toEqual({ country: { code: 'ES', name: 'Spain' } });
    });

    it(`should return hierarchy for region`, () => {
        const res = getLocationHierarchy({
            sitecore: {
                route: {
                    templateId: SitecoreTemplateId.RegionBrowsePage,
                    fields: { Code: { value: 'ESTF' }, Name: { value: 'Tenerife' } },
                },
                context: {
                    parents: [{ code: 'ES', name: 'Spain' }],
                },
            },
        } as any);
        expect(res).toEqual({ country: { code: 'ES', name: 'Spain' }, region: { code: 'ESTF', name: 'Tenerife' } });
    });

    it(`should return hierarchy for region - city`, () => {
        const res = getLocationHierarchy({
            sitecore: {
                route: {
                    templateId: SitecoreTemplateId.RegionCityBrowsePage,
                    fields: { Code: { value: 'ESBA' }, Name: { value: 'Barcelona' } },
                },
                context: {
                    parents: [{ code: 'ES', name: 'Spain' }],
                },
            },
        } as any);
        expect(res).toEqual({ country: { code: 'ES', name: 'Spain' }, region: { code: 'ESBA', name: 'Barcelona' } });
    });

    it(`should return hierarchy for resort`, () => {
        const res = getLocationHierarchy({
            sitecore: {
                route: {
                    templateId: SitecoreTemplateId.ResortBrowsePage,
                    fields: { Code: { value: 'ESTFCA' }, Name: { value: 'Costa Adeje' } },
                },
                context: {
                    parents: [
                        { code: 'ESTF', name: 'Tenerife' },
                        { code: 'ES', name: 'Spain' },
                    ],
                },
            },
        } as any);
        expect(res).toEqual({
            country: { code: 'ES', name: 'Spain' },
            region: { code: 'ESTF', name: 'Tenerife' },
            resort: { code: 'ESTFCA', name: 'Costa Adeje' },
        });
    });

    it(`should return hierarchy for hotel`, () => {
        const res = getLocationHierarchy({
            sitecore: {
                route: {
                    templateId: SitecoreTemplateId.HotelDetailsBrowse,
                    fields: { Code: { value: 'X9079836' }, Name: { value: 'Hotel' } },
                },
                context: {
                    parentPages: [
                        { key: 'Spain', value: '/spain' },
                        { key: 'Tenerife', value: '/spain/tenerife' },
                        { key: 'Costa Adeje', value: '/spain/tenerife/costa-adeje' },
                    ],
                    parents: [
                        { code: 'ESTFCA', name: 'Costa Adeje' },
                        { code: 'ESTF', name: 'Tenerife' },
                        { code: 'ES', name: 'Spain' },
                    ],
                },
            },
        } as any);
        expect(res).toEqual({
            country: { code: 'ES', name: 'Spain', url: '/spain' },
            region: { code: 'ESTF', name: 'Tenerife', url: '/spain/tenerife' },
            resort: { code: 'ESTFCA', name: 'Costa Adeje', url: '/spain/tenerife/costa-adeje' },
            hotel: { code: 'X9079836', name: 'Hotel' },
        });
    });

    it(`should return hierarchy for virtual region`, () => {
        const res = getLocationHierarchy({
            sitecore: {
                route: {
                    templateId: SitecoreTemplateId.VirtualRegionBrowsePage,
                    fields: {
                        Code: { value: 'VAND' },
                        Name: { value: 'Andalucia' },
                        Regions: [
                            { fields: { Code: { value: 'ESCD' }, Name: { value: 'Costa Del Sol' } } },
                            { fields: { Code: { value: 'ESAL' }, Name: { value: 'Costa De Almeria' } } },
                        ],
                    },
                },
                context: {
                    parents: [{ code: 'ES', name: 'Spain' }],
                },
            },
        } as any);
        expect(res).toEqual({
            country: { code: 'ES', name: 'Spain' },
            region: {
                code: 'VAND',
                name: 'Andalucia',
                relatedRegions: ['ESCD', 'ESAL'],
            },
        });
    });

    it(`should return hierarchy for virtual resort`, () => {
        const res = getLocationHierarchy({
            sitecore: {
                route: {
                    templateId: SitecoreTemplateId.VirtualResortBrowsePage,
                    fields: {
                        Code: { value: 'GRCRNW' },
                        Name: { value: 'North West Crete' },
                        Resorts: [
                            { fields: { Code: { value: 'GRCRAK' }, Name: { value: 'Akamai' } } },
                            { fields: { Code: { value: 'GRCROG' }, Name: { value: 'Original G' } } },
                        ],
                    },
                },
                context: {
                    parents: [
                        { code: 'CR', name: 'Crete' },
                        { code: 'GR', name: 'Greece' },
                    ],
                },
            },
        } as ISitecoreLayout);

        expect(res).toEqual({
            country: { code: 'GR', name: 'Greece' },
            region: {
                code: 'CR',
                name: 'Crete',
            },
            resort: {
                code: 'GRCRNW',
                name: 'North West Crete',
                relatedResorts: ['GRCRAK', 'GRCROG'],
            },
        });
    });
});

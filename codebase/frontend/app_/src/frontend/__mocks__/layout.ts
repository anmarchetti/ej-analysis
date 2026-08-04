import { INestedObject } from '@sitecore/engage/types/lib/utils/flatten-object';
import { LayoutServicePageState } from '@sitecore-jss/sitecore-jss-nextjs';

import { TCmsLang } from 'code/cmsLang';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { ISitecoreLayoutContext, ISitecoreLayoutRoute } from 'models/data/SitecoreLayout';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';
import { SiteName } from 'models/enum/SiteName';

export const getLayoutMock = (isExpected?: boolean) => ({
    sitecore: {
        route: {
            placeholders: {
                body: [
                    {
                        componentName: 'Component Wrapper',
                        dataSource: '',
                        params: { DisableLazyLoading: '1' },
                        placeholders: {
                            [PlaceholderNames.ComponentWrapperInner]: [
                                {
                                    componentName: 'Promo Blocks',
                                    dataSource: '',
                                    fields: {
                                        Link: {
                                            value: {
                                                href: '/destinations',
                                                id: '',
                                                linktype: 'internal',
                                                text: 'View all destinations',
                                            },
                                        },
                                        Children: [
                                            {
                                                displayName: 'Mosaic 1',
                                                fields: {
                                                    Description: {
                                                        value: '',
                                                    },
                                                    Image: {
                                                        value: {
                                                            src: '/holidays/cms/media/-/jssmedia/project/holidays/destination-guides/turkeydestguides/antalya-beach-and-sea.ashx?h=665&iar=0&w=1000&hash=D8A93071AAD9B1D2468D8FA072A37D40',
                                                            alt: '',
                                                            width: '1000',
                                                            height: '665',
                                                            mfx: '',
                                                            mfy: '',
                                                            dfx: '',
                                                            dfy: '',
                                                            ...(isExpected ? { priority: true } : {}),
                                                        },
                                                    },
                                                },
                                                id: '1',
                                                name: 'Mosaic 1',
                                                url: '',
                                            },
                                            {
                                                displayName: 'Mosaic 2',
                                                fields: {
                                                    Description: {
                                                        value: '',
                                                    },
                                                    Image: {
                                                        value: {
                                                            src: '/holidays/cms/media/-/jssmedia/project/holidays/destination-guides/turkeydestguides/antalya-beach-and-sea.ashx?h=665&iar=0&w=1000&hash=D8A93071AAD9B1D2468D8FA072A37D40',
                                                            alt: '',
                                                            width: '1000',
                                                            height: '665',
                                                            mfx: '',
                                                            mfy: '',
                                                            dfx: '',
                                                            dfy: '',
                                                            ...(isExpected ? { priority: true } : {}),
                                                        },
                                                    },
                                                },
                                                id: '2',
                                                name: 'Mosaic 2',
                                                url: '',
                                            },
                                        ],
                                    },
                                    params: {},
                                    placeholders: {
                                        [PlaceholderNames.TitleBlock]: [
                                            {
                                                componentName: 'Text Block',
                                                dataSource: '',
                                                fields: {
                                                    Description: {
                                                        value: 'Take a look at some of our featured destinations for ideas to add to your bucket list.',
                                                    },
                                                },
                                                params: {},
                                                placeholders: {},
                                                uid: '',
                                            },
                                        ],
                                    },
                                    uid: '',
                                },
                                {
                                    uid: '',
                                    componentName: 'Partnership Component',
                                    dataSource: '',
                                    params: {},
                                    fields: {
                                        Description: {
                                            value: '<span style="background-color: #ffffff; color: #242424;">Malta holidays offer something for all travellers. This rocky archipelago is ringed by gentle bays and gorgeous beaches. It&rsquo;s also home to some of Europe&rsquo;s finest prehistoric sites, including the Ġgantija Temples, and the Blue Lagoon. And with over 300 days of sunshine a year, Malta makes for the perfect destination any time of year.</span>',
                                        },
                                        Image: {
                                            value: {
                                                src: '/holidays/cms/media/-/jssmedia/images/homepage/destinations/malta_blue-lagoon-2.ashx?h=2858&iar=0&w=4013&hash=F0C160512701D8EE1E4AB090CDC551CE',
                                                alt: '',
                                                width: '4013',
                                                height: '2858',
                                                mfx: '',
                                                mfy: '',
                                                dfx: '50',
                                                dfy: '60',
                                                ...(isExpected ? { priority: true } : {}),
                                            },
                                        },
                                        Link: {
                                            value: {
                                                href: '/destinations/malta/malta',
                                                text: 'Find out more',
                                                anchor: '',
                                                linktype: 'internal',
                                                class: '',
                                                title: '',
                                                target: '',
                                                querystring: '',
                                                id: '',
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                        uid: '',
                    },
                ],
            },
        },
    },
});

export const sitecoreLayoutContextMock: ISitecoreLayoutContext = {
    baseTemplates: [SitecoreTemplateId.DestinationPage],
    isFullMode: false,
    isSoftMode: false,
    pageProfile: {
        hotelTheme: {
            beach: 1,
            city: 1,
            lake: 1,
        },
    } as INestedObject,
    pageUrls: { 'fr-CH': '/espagne', en: '/spain' } as Record<TCmsLang, string>,
    site: { name: SiteName.Holidays },
    pageEditing: false,
    pageState: LayoutServicePageState.Normal,
};

export const sitecoreLayoutRouteMock: ISitecoreLayoutRoute = {
    itemId: 'routeItemId',
    name: 'Home',
    templateId: SitecoreTemplateId.HomePage,
    displayName: 'Spain',
    fields: {
        PageTitle: mockSitecoreField('Home Page Title'),
        Name: mockSitecoreField('Home'),
        GiataCode: mockSitecoreField('GiataCode'),
        ShouldTrackUrl: mockSitecoreField(true),
        TrackingGoal: { id: '1' },
    },
    placeholders: {},
};

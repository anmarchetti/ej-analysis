import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { createMockStores, mockLivePrice } from 'frontend/__mocks__';
import hotelsService from 'frontend/services/offers.service';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { THeroBannerProps } from 'models/data/IHeroBanner';
import { ILivePrice } from 'models/data/ILivePrice';
import PageHeroBannerVariants from 'models/enum/PageHeroBannerVariants';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreTemplateId from 'models/enum/SitecoreTemplateId';

import PageHeroBanner, { getServerSideProps } from './PageHeroBanner';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockFloatingBannerComponent = jest.fn();
jest.mock('./components/FloatingBanner/FloatingBanner', () => ({
    __esModule: true,
    default: props => {
        mockFloatingBannerComponent(props);

        return <div data-tid='floating-banner' />;
    },
}));

const mockStaticBannerComponent = jest.fn();
jest.mock('./components/StaticBanner/StaticBanner', () => ({
    __esModule: true,
    default: props => {
        mockStaticBannerComponent(props);

        return <div data-tid='static-banner' />;
    },
}));

let mockedLivePrice: ILivePrice | null = mockLivePrice;
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    useComponentProps: jest.fn(() => ({
        cheapestLivePriceForDestinationPage: mockedLivePrice,
    })),
}));

jest.mock('frontend/utils/search/search.utils', () => ({
    getRelatedDestinationsCodes: jest.fn().mockReturnValue(['VirtualRegionCode']),
}));

jest.mock('./components/DestinationHead/DestinationHead', () => () => <div data-tid='destination-head' />);

let mockedIsLivePriceEnabledForDestinationPage = true;
jest.mock('frontend/utils/livePrice.utils.ts', () => ({
    isLivePriceEnabledForDestinationPage: jest.fn(() => mockedIsLivePriceEnabledForDestinationPage),
    getCheapestLivePrice: jest.fn(() => mockedLivePrice),
}));

const createProps = (): THeroBannerProps => ({
    rendering: {
        placeholders: {
            [PlaceholderNames.HeroBannerTopSection]: [],
            [PlaceholderNames.LivePrice]: [],
            [PlaceholderNames.FloatingSearchpod]: [],
        },
    },
    params: {
        Variant: PageHeroBannerVariants.TranslucentBottomStripe,
    },
    fields: {
        Name: { value: 'Name' },
        Image: mockSitecoreField(mockSitecoreImageField('src')),
        Subtitle: mockSitecoreField('Subtitle'),
        PageDescription: mockSitecoreField('PageDescription'),
        PageCategory: mockSitecoreField('PageCategory'),
        Code: mockSitecoreField('Code'),
    },
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isDestinationPage: false,
            isEditMode: false,
            isDestinationHeroBannerLivePriceEnabled: false,
            isVirtualRegionBrowsePage: false,
            isLivePriceEnabledForDestination: jest.fn(),
        },
        hotelsStore: {
            getLivePrice: jest.fn(),
        },
    });

let mockProps;
let mockStores;

describe('PageHeroBanner', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should renders FloatingBanner when PageHeroBannerVariant is ShadowFullBannerNoShard', () => {
        mockProps.params.Variant = PageHeroBannerVariants.ShadowFullBannerNoShard;

        render(<PageHeroBanner {...mockProps} />);

        expect(screen.getByTestId('floating-banner')).toBeInTheDocument();
    });

    it('should renders StaticBanner PageHeroBannerVariant is NOT ShadowFullBannerNoShard', () => {
        render(<PageHeroBanner {...mockProps} />);

        expect(screen.getByTestId('static-banner')).toBeInTheDocument();
    });

    describe('head on destination page', () => {
        beforeEach(() => {
            mockStores.layoutStore.isDestinationPage = true;
        });

        it('should render head on destination pages', () => {
            render(<PageHeroBanner {...mockProps} />);

            expect(screen.getByTestId('destination-head')).toBeInTheDocument();
        });

        it('should not render head on not destination pages', () => {
            mockStores.layoutStore.isDestinationPage = false;

            render(<PageHeroBanner {...mockProps} />);

            expect(screen.queryByTestId('destination-head')).not.toBeInTheDocument();
        });
    });

    describe('getServerSideProps', () => {
        const createSSRPropsMocks = () => ({
            rendering: {
                fields: {
                    Code: {
                        value: 'SPAIN',
                    },
                },
            },
            layout: {
                sitecore: {
                    context: {
                        baseTemplates: [SitecoreTemplateId.DestinationPage],
                        parents: [
                            {
                                fields: {
                                    Code: {
                                        value: 'SomeParentCode',
                                    },
                                },
                            },
                        ],
                        isSoftMode: false,
                        isFullMode: false,
                    },
                    route: {
                        templateId: SitecoreTemplateId.VirtualRegionBrowsePage,
                    },
                },
            },
            context: {
                preview: false,
                res: {
                    locals: {
                        lang: 'ch-de',
                    },
                    settings: {
                        IsLivePriceEnabled: '1',
                        DestinationHeroBannerLivePrice: '1',
                        ExcludeLivePriceForDestinations: [],
                    },
                },
            },
        });
        let SSRPropsMocks;

        beforeEach(() => {
            SSRPropsMocks = createSSRPropsMocks();
            hotelsService.getLivePrice = jest.fn().mockResolvedValue([mockLivePrice]);
        });

        it('should load live price with related regions codes on virtual region browse page', async () => {
            const result = await getServerSideProps(
                SSRPropsMocks.rendering,
                SSRPropsMocks.layout,
                SSRPropsMocks.context,
            );

            expect(hotelsService.getLivePrice).toHaveBeenCalledWith('VirtualRegionCode', true, false, {
                headers: { Cookie: 'holidays#lang=de-CH' },
            });
            expect(result).toMatchObject({ cheapestLivePriceForDestinationPage: mockLivePrice });
        });

        it('should load live price with related resorts codes on virtual resort browse page', async () => {
            SSRPropsMocks.layout.sitecore.route.templateId = SitecoreTemplateId.VirtualResortBrowsePage;
            const result = await getServerSideProps(
                SSRPropsMocks.rendering,
                SSRPropsMocks.layout,
                SSRPropsMocks.context,
            );

            expect(hotelsService.getLivePrice).toHaveBeenCalledWith('VirtualRegionCode', true, false, {
                headers: { Cookie: 'holidays#lang=de-CH' },
            });
            expect(result).toMatchObject({ cheapestLivePriceForDestinationPage: mockLivePrice });
        });

        it('should load live price with destination code on destination page', async () => {
            SSRPropsMocks.layout.sitecore.route.templateId = 'SomeOtherTemplateId';

            const result = await getServerSideProps(
                SSRPropsMocks.rendering,
                SSRPropsMocks.layout,
                SSRPropsMocks.context,
            );

            expect(hotelsService.getLivePrice).toHaveBeenCalledWith('VirtualRegionCode', true, false, {
                headers: { Cookie: 'holidays#lang=de-CH' },
            });
            expect(result).toMatchObject({ cheapestLivePriceForDestinationPage: mockLivePrice });
        });

        it('should not load live prise on edit mode', async () => {
            SSRPropsMocks.context.preview = true;

            await getServerSideProps(SSRPropsMocks.rendering, SSRPropsMocks.layout, SSRPropsMocks.context);

            expect(hotelsService.getLivePrice).not.toHaveBeenCalled();
        });

        it('should not load live price on not destination pages', async () => {
            SSRPropsMocks.layout.sitecore.context.baseTemplates = ['SomeOtherTemplateId'];

            await getServerSideProps(SSRPropsMocks.rendering, SSRPropsMocks.layout, SSRPropsMocks.context);

            expect(hotelsService.getLivePrice).not.toHaveBeenCalled();
        });

        it('should not load live price when no destination сode', async () => {
            SSRPropsMocks.rendering.fields.Code = [];

            await getServerSideProps(SSRPropsMocks.rendering, SSRPropsMocks.layout, SSRPropsMocks.context);

            expect(hotelsService.getLivePrice).not.toHaveBeenCalled();
        });

        it('should not load live price when live price is turned on', async () => {
            SSRPropsMocks.context.res.settings.IsLivePriceEnabled = '';

            await getServerSideProps(SSRPropsMocks.rendering, SSRPropsMocks.layout, SSRPropsMocks.context);

            expect(hotelsService.getLivePrice).not.toHaveBeenCalled();
        });

        it('should not load live price when isSoftMode is true', async () => {
            SSRPropsMocks.layout.sitecore.context.isSoftMode = true;

            await getServerSideProps(SSRPropsMocks.rendering, SSRPropsMocks.layout, SSRPropsMocks.context);

            expect(hotelsService.getLivePrice).not.toHaveBeenCalled();
        });

        it('should not load live price when isFullMode is true', async () => {
            SSRPropsMocks.layout.sitecore.context.isFullMode = true;

            await getServerSideProps(SSRPropsMocks.rendering, SSRPropsMocks.layout, SSRPropsMocks.context);

            expect(hotelsService.getLivePrice).not.toHaveBeenCalled();
        });

        it('should not load live price when live price is turned onn for destination hero banners', async () => {
            SSRPropsMocks.context.res.settings.DestinationHeroBannerLivePrice = '';

            await getServerSideProps(SSRPropsMocks.rendering, SSRPropsMocks.layout, SSRPropsMocks.context);

            expect(hotelsService.getLivePrice).not.toHaveBeenCalled();
        });

        it('should not load live price when destination is excluded', async () => {
            SSRPropsMocks.context.res.settings.ExcludeLivePriceForDestinations = ['SPAIN'];
            mockedIsLivePriceEnabledForDestinationPage = false;

            await getServerSideProps(SSRPropsMocks.rendering, SSRPropsMocks.layout, SSRPropsMocks.context);

            expect(hotelsService.getLivePrice).not.toHaveBeenCalled();
        });
    });

    it('should not load prices when ssrPrice is provided', async () => {
        render(<PageHeroBanner {...mockProps} />);

        await waitFor(() => expect(mockStores.hotelsStore.getLivePrice).not.toHaveBeenCalled());
    });

    it('should not load prices in edit mode', async () => {
        mockedLivePrice = null;
        mockStores.layoutStore.isEditMode = true;
        render(<PageHeroBanner {...mockProps} />);

        await waitFor(() => expect(mockStores.hotelsStore.getLivePrice).not.toHaveBeenCalled());
    });

    it('should load and set live price when conditions are met', async () => {
        mockedLivePrice = null;
        mockStores.layoutStore.isDestinationPage = true;
        mockStores.layoutStore.isDestinationHeroBannerLivePriceEnabled = true;
        mockStores.layoutStore.isLivePriceEnabledForDestination = jest.fn(() => true);
        render(<PageHeroBanner {...mockProps} />);

        await waitFor(() => expect(mockStores.hotelsStore.getLivePrice).toHaveBeenCalled());
    });
});

import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import offersService from 'frontend/services/offers.service';
import { runAllPromises } from 'frontend/utils/tests.utils';
import { IOffer } from 'models/data/IOffer';
import { Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import * as utils from 'models/enum/DataStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import GenericRecommendedHotels, { IRecommendedHotelsProps } from './GenericRecommendedHotels';

jest.mock('frontend/services/offers.service');

const mockRecommendedHotelsCarousel = jest.fn();
jest.mock('../../common/RecommendedHotels/RecommendedHotelsCarousel/RecommendedHotelsCarousel', () => ({
    __esModule: true,
    default: props => {
        mockRecommendedHotelsCarousel(props);

        return <div data-tid='recommended-hotels-carousel' />;
    },
}));

const mockPlaceholder = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholder(props);

        return <div data-tid='placeholder' />;
    },
}));

const createStores = () =>
    createMockStores({
        layoutStore: {
            isMaintenance: false,
            isLivePriceEnabled: false,
            isPromoPage: false,
            isNotFoundPage: true,
            holidayThemeTypes: [],
            promoCollections: [],
            pageName: 'mockPageName',
            isTradePortal: false,
        },
        hotelsStore: {
            getLivePrice: jest.fn().mockResolvedValue([]),
        },
        trackingStore: {
            setBd4RecommenderPlacementId: jest.fn(),
            setBd4RecommenderTracking: jest.fn(),
            trackRecommenderNotLoaded: jest.fn(),
        },
        viewBookingStore: {
            booking: null,
            isCancelledBookingPage: false,
        },
    });

const createProps = () =>
    ({
        fields: {
            Title: { value: 'Title' },
        },
        params: {
            MaximumNumberSlider: '9',
            MinimumNumberSlider: '1',
            IsLeftAligned: '1',
            IsNarrowContainer: '1',
            OpenLinksInNewTab: '1',
        },
        rendering: {},
    } as Partial<IRecommendedHotelsProps>);

let mockStores;
let props: Partial<IRecommendedHotelsProps>;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<GenericRecommendedHotels />', () => {
    (offersService.fetchGenericRecommendedOffers as jest.Mock).mockResolvedValue({
        offers: [{ accom: { code: '111' } }, { accom: { code: '222' } }] as IOffer[],
        status: { tracking: 'tracking' },
    });

    beforeEach(() => {
        mockStores = createStores();
        props = createProps();
        (offersService.fetchGenericRecommendedOffers as jest.Mock).mockClear();
        jest.spyOn(utils, 'isLoadingStatus').mockReturnValue(false);
        jest.spyOn(utils, 'isNotLoadedStatus').mockReturnValue(false);
    });

    it('should NOT render when isMaintenance', async () => {
        mockStores.layoutStore.isMaintenance = true;

        let container;

        await act(async () => {
            container = render(<GenericRecommendedHotels {...props} />).container;
        });

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOR render when isCancelledBookingPage and booking is external agency', async () => {
        mockStores.viewBookingStore.isCancelledBookingPage = true;
        mockStores.viewBookingStore.booking = { isExternalAgency: true };
        let container;

        await act(async () => {
            container = render(<GenericRecommendedHotels {...props} />).container;
        });

        expect(container).toBeEmptyDOMElement();
    });

    it('should call fetchGenericRecommendedOffers with page name for Trade Portal', async () => {
        mockStores.layoutStore.isTradePortal = true;
        mockStores.layoutStore.pageName = 'Trade Portal Page Name';

        await act(async () => {
            render(<GenericRecommendedHotels {...props} />);
        });

        expect(offersService.fetchGenericRecommendedOffers).toHaveBeenCalledWith(
            Bd4TravelPlacementId.NotFoundPageExternal,
            'Trade Portal Page Name',
            true,
            false,
            '',
            expect.anything(),
        );
    });

    it('should pass holiday theme types and promo collections to fetchGenericRecommendedOffers', async () => {
        mockStores.layoutStore.holidayThemeTypes = ['family', 'beach'];
        mockStores.layoutStore.promoCollections = ['promo-one', 'promo-two'];

        await act(async () => {
            render(<GenericRecommendedHotels {...props} />);
        });

        expect(offersService.fetchGenericRecommendedOffers).toHaveBeenCalledWith(
            Bd4TravelPlacementId.NotFoundPageExternal,
            'mockPageName',
            true,
            false,
            'family,beach,promo-one,promo-two',
            expect.anything(),
        );
    });

    it('should return offers with live prices', async () => {
        mockStores.layoutStore.isLivePriceEnabled = true;
        mockStores.layoutStore.isNotFoundPage = true;

        await act(async () => {
            render(<GenericRecommendedHotels {...props} />);
        });

        expect(offersService.fetchGenericRecommendedOffers).toHaveBeenCalledWith(
            Bd4TravelPlacementId.NotFoundPageExternal,
            mockStores.layoutStore.pageName,
            true,
            true,
            '',
            expect.anything(),
        );
    });

    it('should not load live prices if it is disabled', async () => {
        mockStores.layoutStore.isLivePriceEnabled = false;
        mockStores.layoutStore.isNotFoundPage = true;

        await act(async () => {
            render(<GenericRecommendedHotels {...props} />);
        });

        expect(offersService.fetchGenericRecommendedOffers).toHaveBeenCalledWith(
            Bd4TravelPlacementId.NotFoundPageExternal,
            mockStores.layoutStore.pageName,
            true,
            false,
            '',
            expect.anything(),
        );
    });

    it('should track not loaded hotels if api returns less hotels then min', async () => {
        props!.params!.MinimumNumberSlider = '3';

        await act(async () => {
            render(<GenericRecommendedHotels {...props} />);
        });

        await runAllPromises();

        expect(mockStores.trackingStore.trackRecommenderNotLoaded).toHaveBeenCalled();
    });

    it('should track not loaded hotels if api returns 0 results', async () => {
        (offersService.fetchGenericRecommendedOffers as jest.Mock).mockResolvedValue({
            offers: [] as IOffer[],
            status: { tracking: 'tracking' },
        });

        await act(async () => {
            render(<GenericRecommendedHotels {...props} />);
        });

        await runAllPromises();

        expect(mockStores.trackingStore.trackRecommenderNotLoaded).toHaveBeenCalled();
    });

    it('should track not loaded hotels if api rejected', async () => {
        (offersService.fetchGenericRecommendedOffers as jest.Mock).mockRejectedValue('error');

        await act(async () => {
            render(<GenericRecommendedHotels {...props} />);
        });

        await runAllPromises();

        expect(mockStores.trackingStore.trackRecommenderNotLoaded).toHaveBeenCalled();
    });

    it('should render Placeholder when rendering is provided', async () => {
        (offersService.fetchGenericRecommendedOffers as jest.Mock).mockRejectedValue('error');

        await act(async () => {
            render(<GenericRecommendedHotels {...props} />);
        });

        await runAllPromises();

        expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        expect(mockPlaceholder).toHaveBeenCalledWith({
            name: PlaceholderNames.RecommendedHotelsFallback,
            rendering: {},
        });
    });

    it('should NOT render when rendering is provided', async () => {
        (offersService.fetchGenericRecommendedOffers as jest.Mock).mockRejectedValue('error');
        props.rendering = undefined;

        let container;

        await act(async () => {
            container = render(<GenericRecommendedHotels {...props} />).container;
        });

        await runAllPromises();

        expect(container).toBeEmptyDOMElement();
        expect(mockPlaceholder).not.toHaveBeenCalled();
    });

    it('should render RecommendedHotelsCarousel when isLoadingStatus is true', async () => {
        (offersService.fetchGenericRecommendedOffers as jest.Mock).mockRejectedValue('error');
        jest.spyOn(utils, 'isLoadingStatus').mockReturnValue(true);

        await act(async () => {
            render(<GenericRecommendedHotels {...props} />);
        });

        await runAllPromises();

        expect(screen.getByTestId('recommended-hotels-carousel')).toBeInTheDocument();
        expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: props.fields,
                withoutPadding: undefined,
                numberOfShowItem: 9,
                title: 'Title',
            }),
        );
    });

    it('should render RecommendedHotelsCarousel when isNotLoadedStatus is true', async () => {
        (offersService.fetchGenericRecommendedOffers as jest.Mock).mockRejectedValue('error');
        jest.spyOn(utils, 'isNotLoadedStatus').mockReturnValue(true);
        props.withoutPadding = true;
        props.params!.MaximumNumberSlider = '';

        await act(async () => {
            render(<GenericRecommendedHotels {...props} />);
        });

        await runAllPromises();

        expect(screen.getByTestId('recommended-hotels-carousel')).toBeInTheDocument();
        expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
            expect.objectContaining({
                fields: props.fields,
                withoutPadding: true,
                numberOfShowItem: 0,
                title: 'Title',
            }),
        );
    });

    it('should pass correct isLeftAligned, isNarrowContainer, openLinksInNewTab params to RecommendedHotelsCarousel', async () => {
        jest.spyOn(utils, 'isLoadingStatus').mockReturnValue(true);

        render(<GenericRecommendedHotels {...props} />);

        expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
            expect.objectContaining({
                isLeftAligned: true,
                openLinksInNewTab: true,
            }),
        );
    });

    describe('displaySponsoredLabel', () => {
        it('should pass displaySponsoredLabel as true to RecommendedHotelsCarousel when DisplaySponsoredLabel param is set to "1"', async () => {
            props.params!.DisplaySponsoredLabel = '1';
            jest.spyOn(utils, 'isLoadingStatus').mockReturnValue(true);

            render(<GenericRecommendedHotels {...props} />);

            expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    displaySponsoredLabel: true,
                }),
            );
        });

        it('should pass displaySponsoredLabel as false to RecommendedHotelsCarousel when DisplaySponsoredLabel param is set to "0"', async () => {
            props.params!.DisplaySponsoredLabel = undefined;
            jest.spyOn(utils, 'isLoadingStatus').mockReturnValue(true);

            render(<GenericRecommendedHotels {...props} />);

            expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    displaySponsoredLabel: false,
                }),
            );
        });

        it('should pass displaySponsoredLabel as false to RecommendedHotelsCarousel when DisplaySponsoredLabel param is undefined', async () => {
            props.params!.DisplaySponsoredLabel = undefined;
            jest.spyOn(utils, 'isLoadingStatus').mockReturnValue(true);

            render(<GenericRecommendedHotels {...props} />);

            expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    displaySponsoredLabel: false,
                }),
            );
        });
    });

    describe('showSponsoredHotelsOnly', () => {
        it('should filter to only sponsored hotels when ShowSponsoredHotelsOnly param is set to "1"', async () => {
            (offersService.fetchGenericRecommendedOffers as jest.Mock).mockResolvedValue({
                offers: [
                    { accom: { code: '111' }, isSponsored: true },
                    { accom: { code: '222' }, isSponsored: false },
                    { accom: { code: '333' }, isSponsored: true },
                ] as IOffer[],
                status: { tracking: 'tracking' },
            });

            props.params!.ShowSponsoredHotelsOnly = '1';

            render(<GenericRecommendedHotels {...props} />);

            await act(async () => {
                await runAllPromises();
            });

            expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    offers: [
                        { accom: { code: '111' }, isSponsored: true },
                        { accom: { code: '333' }, isSponsored: true },
                    ],
                }),
            );
        });

        it('should show all hotels when ShowSponsoredHotelsOnly param is undefined', async () => {
            (offersService.fetchGenericRecommendedOffers as jest.Mock).mockResolvedValue({
                offers: [
                    { accom: { code: '111' }, isSponsored: true },
                    { accom: { code: '222' }, isSponsored: false },
                ] as IOffer[],
                status: { tracking: 'tracking' },
            });

            props.params!.ShowSponsoredHotelsOnly = undefined;

            render(<GenericRecommendedHotels {...props} />);

            await act(async () => {
                await runAllPromises();
            });

            expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    offers: [
                        { accom: { code: '111' }, isSponsored: true },
                        { accom: { code: '222' }, isSponsored: false },
                    ],
                }),
            );
        });

        it('should apply minimum hotels check after filtering sponsored hotels', async () => {
            (offersService.fetchGenericRecommendedOffers as jest.Mock).mockResolvedValue({
                offers: [
                    { accom: { code: '111' }, isSponsored: true },
                    { accom: { code: '222' }, isSponsored: false },
                    { accom: { code: '333' }, isSponsored: false },
                ] as IOffer[],
                status: { tracking: 'tracking' },
            });

            props.params!.ShowSponsoredHotelsOnly = '1';
            props.params!.MinimumNumberSlider = '2';

            render(<GenericRecommendedHotels {...props} />);

            await act(async () => {
                await runAllPromises();
            });

            expect(mockRecommendedHotelsCarousel).not.toHaveBeenCalled();
            expect(mockStores.trackingStore.trackRecommenderNotLoaded).toHaveBeenCalled();
        });
    });
});

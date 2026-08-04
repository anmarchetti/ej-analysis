import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import offersService from 'frontend/services/offers.service';
import { Bd4TravelPlacementId } from 'models/enum/Bd4TravelListId';
import { RecommendedType } from 'models/enum/RecommendedType';
import SiteSettings from 'models/enum/SiteSettings';

import DestinationRecommendedHotels from './DestinationRecommendedHotels';

const createProps = () => ({
    recommendedHotels: [{ id: '1' }, { id: '2' }],
    layout: {},
    layoutId: 'layoutId',
    loadRecommendedHotels: jest.fn(),
    isHotelDetailsBookPage: true,
    setBd4RecommenderTracking: jest.fn(),
    setBd4RecommenderPlacementId: jest.fn(),
    trackRecommenderNotLoaded: jest.fn(),
    clearRecommendedHotels: jest.fn(),
    isHotelDetailsBrowsePage: false,
    isHomePage: false,
    selectedOffer: { id: '1' },
    onSelectRecommendedOffer: jest.fn(),
    isMaintenance: false,
    isEditMode: false,
    isTradePortal: false,
    params: { IsWhiteBackground: false, MaximumNumberSlider: 5 },
    fields: {
        BD4PlacementId: { value: 'bd4' },
        NumberOfRequestedHotelBD4: { value: '5' },
        InitialNumberOfHotelsDesktop: { value: 10 },
        InitialNumberOfHotelsMobile: { value: 11 },
        MinNumberOfHotelsToShowComponent: { value: 0 },
        Title: { value: 'title' },
        Name: { value: 'name' },
    },
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            onSelectRecommendedOffer: jest.fn(),
            loadRecommendedHotels: jest.fn(),
            recommendedHotels: [{ id: '1' }, { id: '2' }],
            clearRecommendedHotels: jest.fn(),
            selectedOffer: { id: '1' },
        },
        layoutStore: {
            layout: {},
            layoutId: 'layoutId',
            isHotelDetailsBookPage: true,
            isHotelDetailsBrowsePage: false,
            isHomePage: false,
            isMaintenance: false,
            isEditMode: false,
            isTradeStore: false,
        },
        trackingStore: {
            setBd4RecommenderTracking: jest.fn(),
            setBd4RecommenderPlacementId: jest.fn(),
            trackRecommenderNotLoaded: jest.fn(),
        },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

Object.defineProperties(window, {
    dataLayer: { value: [], writable: true },
});

const mockRecommendedHotelsGrid = jest.fn();
jest.mock('../../common/RecommendedHotels/RecommendedHotelsGrid/RecommendedHotelsGrid', () => ({
    __esModule: true,
    default: props => {
        mockRecommendedHotelsGrid(props);

        return <div data-tid='recommended-hotels-grid' />;
    },
}));

const mockRecommendedHotelsCarousel = jest.fn();
jest.mock('../../common/RecommendedHotels/RecommendedHotelsCarousel/RecommendedHotelsCarousel', () => ({
    __esModule: true,
    default: props => {
        mockRecommendedHotelsCarousel(props);

        return <div data-tid='recommended-hotels-carousel' />;
    },
}));

const mockGetLocationHierarchy = jest.fn();
jest.mock('frontend/utils/getLocationHierarchy', () => ({
    __esModule: true,
    getLocationHierarchy: (...params) => mockGetLocationHierarchy(...params),
}));

describe('<DestinationRecommendedHotels />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        offersService.fetchRecommendedOffersBrowse = jest.fn();
        dataLayer = [];
    });

    it('should render wrapper-component-container--grey when background is NOT white', () => {
        const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

        expect(container.getElementsByClassName('wrapper-component-container--grey').length).toBe(1);
    });

    it('should NOT render wrapper-component-container--grey when background is white', () => {
        mockProps.params.IsWhiteBackground = true;

        const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

        expect(container.getElementsByClassName('wrapper-component-container--grey').length).toBe(0);
    });

    it('should render wrapper-component-container--grey when params NOT provided', () => {
        mockProps.params = null;

        const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

        expect(container.getElementsByClassName('wrapper-component-container--grey').length).toBe(1);
    });

    it('should render wrapper-shape--start wrapper-shape--end when background is NOT white', () => {
        const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

        expect(container.getElementsByClassName('wrapper-shape--start wrapper-shape--end').length).toBe(1);
    });

    it('should NOT render wrapper-shape--start wrapper-shape--end when background is white', () => {
        mockProps.params.IsWhiteBackground = true;

        const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

        expect(container.getElementsByClassName('wrapper-shape--start wrapper-shape--end').length).toBe(0);
    });

    it('should render wrapper-shape--start wrapper-shape--end when params NOT provided', () => {
        mockProps.params = null;

        const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

        expect(container.getElementsByClassName('wrapper-shape--start wrapper-shape--end').length).toBe(1);
    });

    it('should render RecommendedHotelsGrid when fields are provided and isHotelDetailsBrowsePage', async () => {
        mockProps.isHotelDetailsBookPage = false;
        mockStores.layoutStore.isHotelDetailsBookPage = false;
        mockStores.layoutStore.isHotelDetailsBrowsePage = true;
        mockProps.fields.MinNumberOfHotelsToShowComponent = { value: '1' };
        mockGetLocationHierarchy.mockReturnValue({
            country: { code: 'ES' },
            region: { code: 'REG1' },
            resort: { code: 'RES1' },
        });
        offersService.fetchRecommendedOffersBrowse = jest.fn().mockResolvedValue({
            offers: [{ id: '1' }, { id: '2' }],
            status: { tracking: {} },
        });

        render(<DestinationRecommendedHotels {...mockProps} />);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(screen.getByTestId('recommended-hotels-grid')).toBeInTheDocument();
    });

    it('should render RecommendedHotelsCarousel when fields are provided and is NOT HotelDetailsBrowsePage', () => {
        render(<DestinationRecommendedHotels {...mockProps} />);

        expect(screen.getByTestId('recommended-hotels-carousel')).toBeInTheDocument();
        expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith({
            offers: [{ id: '1' }, { id: '2' }],
            onSelectedOffer: expect.any(Function),
            fallbackImage: SiteSettings.HotelFallbackImage,
            title: 'title',
            isSlimCardsDesign: false,
            numberOfShowItem: 5,
            recommendedType: RecommendedType.Booking,
            displaySponsoredLabel: false,
            fields: mockProps.fields,
        });
    });

    it('should render RecommendedHotelsCarousel when fields are NOT provided', () => {
        mockProps.fields = null;

        render(<DestinationRecommendedHotels {...mockProps} />);

        expect(screen.getByTestId('recommended-hotels-carousel')).toBeInTheDocument();
        expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith({
            offers: [{ id: '1' }, { id: '2' }],
            onSelectedOffer: expect.any(Function),
            fallbackImage: SiteSettings.HotelFallbackImage,
            title: '',
            isSlimCardsDesign: false,
            numberOfShowItem: 5,
            recommendedType: RecommendedType.Booking,
            displaySponsoredLabel: false,
            fields: null,
        });
    });

    it('should render RecommendedHotelsCarousel when InitialNumberOfHotelsDesktop is NOT provided', () => {
        mockProps.fields.InitialNumberOfHotelsDesktop = null;

        render(<DestinationRecommendedHotels {...mockProps} />);

        expect(screen.getByTestId('recommended-hotels-carousel')).toBeInTheDocument();
    });

    it('should render RecommendedHotelsCarousel when InitialNumberOfHotelsMobile is NOT provided', () => {
        mockProps.fields.InitialNumberOfHotelsMobile = null;

        render(<DestinationRecommendedHotels {...mockProps} />);

        expect(screen.getByTestId('recommended-hotels-carousel')).toBeInTheDocument();
    });

    it('should render RecommendedHotelsCarousel when NumberOfRequestedHotelBD4 is NOT provided', () => {
        mockProps.fields.NumberOfRequestedHotelBD4 = null;

        render(<DestinationRecommendedHotels {...mockProps} />);

        expect(screen.getByTestId('recommended-hotels-carousel')).toBeInTheDocument();
    });

    it('should render RecommendedHotelsCarousel when MinNumberOfHotelsToShowComponent is NOT provided', () => {
        mockProps.fields.MinNumberOfHotelsToShowComponent = null;

        render(<DestinationRecommendedHotels {...mockProps} />);

        expect(screen.getByTestId('recommended-hotels-carousel')).toBeInTheDocument();
    });

    it('should NOT render component if isHotelDetailsBrowsePagePreview', () => {
        mockStores.layoutStore.isHotelDetailsBrowsePagePreview = true;

        const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('displaySponsoredLabel', () => {
        it('should pass displaySponsoredLabel as true to RecommendedHotelsCarousel when DisplaySponsoredLabel param is set to "1"', () => {
            mockProps.params.DisplaySponsoredLabel = '1';

            render(<DestinationRecommendedHotels {...mockProps} />);

            expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    displaySponsoredLabel: true,
                }),
            );
        });

        it('should pass displaySponsoredLabel as false to RecommendedHotelsCarousel when DisplaySponsoredLabel param is set to "0"', () => {
            mockProps.params.DisplaySponsoredLabel = '0';

            render(<DestinationRecommendedHotels {...mockProps} />);

            expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    displaySponsoredLabel: false,
                }),
            );
        });

        it('should pass displaySponsoredLabel as false to RecommendedHotelsCarousel when DisplaySponsoredLabel param is undefined', () => {
            mockProps.params.DisplaySponsoredLabel = undefined;

            render(<DestinationRecommendedHotels {...mockProps} />);

            expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    displaySponsoredLabel: false,
                }),
            );
        });

        it('should pass displaySponsoredLabel as true to RecommendedHotelsGrid when DisplaySponsoredLabel param is set to "1"', async () => {
            mockProps.isHotelDetailsBookPage = false;
            mockStores.layoutStore.isHotelDetailsBookPage = false;
            mockStores.layoutStore.isHotelDetailsBrowsePage = true;
            mockProps.fields.MinNumberOfHotelsToShowComponent = { value: '1' };
            mockProps.params.DisplaySponsoredLabel = '1';
            mockGetLocationHierarchy.mockReturnValue({
                country: { code: 'ES' },
                region: { code: 'REG1' },
                resort: { code: 'RES1' },
            });
            offersService.fetchRecommendedOffersBrowse = jest.fn().mockResolvedValue({
                offers: [{ id: '1' }, { id: '2' }],
                status: { tracking: {} },
            });

            render(<DestinationRecommendedHotels {...mockProps} />);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockRecommendedHotelsGrid).toHaveBeenCalledWith(
                expect.objectContaining({
                    displaySponsoredLabel: true,
                }),
            );
        });

        it('should pass displaySponsoredLabel as false to RecommendedHotelsGrid when DisplaySponsoredLabel param is set to "0"', async () => {
            mockProps.isHotelDetailsBookPage = false;
            mockStores.layoutStore.isHotelDetailsBookPage = false;
            mockStores.layoutStore.isHotelDetailsBrowsePage = true;
            mockProps.fields.MinNumberOfHotelsToShowComponent = { value: '1' };
            mockProps.params.DisplaySponsoredLabel = '0';
            mockGetLocationHierarchy.mockReturnValue({
                country: { code: 'ES' },
                region: { code: 'REG1' },
                resort: { code: 'RES1' },
            });
            offersService.fetchRecommendedOffersBrowse = jest.fn().mockResolvedValue({
                offers: [{ id: '1' }, { id: '2' }],
                status: { tracking: {} },
            });

            render(<DestinationRecommendedHotels {...mockProps} />);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockRecommendedHotelsGrid).toHaveBeenCalledWith(
                expect.objectContaining({
                    displaySponsoredLabel: false,
                }),
            );
        });

        it('should pass displaySponsoredLabel as false to RecommendedHotelsGrid when DisplaySponsoredLabel param is undefined', async () => {
            mockProps.isHotelDetailsBookPage = false;
            mockStores.layoutStore.isHotelDetailsBookPage = false;
            mockStores.layoutStore.isHotelDetailsBrowsePage = true;
            mockProps.fields.MinNumberOfHotelsToShowComponent = { value: '1' };
            mockProps.params.DisplaySponsoredLabel = undefined;
            mockGetLocationHierarchy.mockReturnValue({
                country: { code: 'ES' },
                region: { code: 'REG1' },
                resort: { code: 'RES1' },
            });
            offersService.fetchRecommendedOffersBrowse = jest.fn().mockResolvedValue({
                offers: [{ id: '1' }, { id: '2' }],
                status: { tracking: {} },
            });

            render(<DestinationRecommendedHotels {...mockProps} />);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockRecommendedHotelsGrid).toHaveBeenCalledWith(
                expect.objectContaining({
                    displaySponsoredLabel: false,
                }),
            );
        });
    });

    describe('showSponsoredHotelsOnly', () => {
        beforeEach(() => {
            mockProps.isHotelDetailsBookPage = false;
            mockProps.recommendedHotels = null;
            mockStores.layoutStore.isHotelDetailsBookPage = false;
            mockStores.bookingStore.recommendedHotels = null;
            mockStores.layoutStore.isHotelDetailsBrowsePage = false;
            mockGetLocationHierarchy.mockReturnValue({
                country: { code: 'ES' },
                region: { code: 'REG1' },
                resort: { code: 'RES1' },
            });
        });

        it('should filter to only sponsored hotels when ShowSponsoredHotelsOnly param is set to "1"', async () => {
            offersService.fetchRecommendedOffersBrowse = jest.fn().mockResolvedValue({
                offers: [
                    { id: '1', isSponsored: true },
                    { id: '2', isSponsored: false },
                    { id: '3', isSponsored: true },
                ],
                status: { tracking: {} },
            });

            mockProps.params.ShowSponsoredHotelsOnly = '1';

            render(<DestinationRecommendedHotels {...mockProps} />);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    offers: [
                        { id: '1', isSponsored: true },
                        { id: '3', isSponsored: true },
                    ],
                }),
            );
        });

        it('should show all hotels when ShowSponsoredHotelsOnly param is undefined', async () => {
            offersService.fetchRecommendedOffersBrowse = jest.fn().mockResolvedValue({
                offers: [
                    { id: '1', isSponsored: true },
                    { id: '2', isSponsored: false },
                ],
                status: { tracking: {} },
            });

            mockProps.params.ShowSponsoredHotelsOnly = undefined;

            render(<DestinationRecommendedHotels {...mockProps} />);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    offers: [
                        { id: '1', isSponsored: true },
                        { id: '2', isSponsored: false },
                    ],
                }),
            );
        });

        it('should filter book mode offers to only sponsored hotels when ShowSponsoredHotelsOnly param is set to "1"', () => {
            mockStores.layoutStore.isHotelDetailsBookPage = true;
            mockStores.layoutStore.isHotelDetailsBrowsePage = false;
            mockStores.bookingStore.recommendedHotels = [
                { id: '1', isSponsored: true },
                { id: '2', isSponsored: false },
                { id: '3', isSponsored: true },
            ];
            mockProps.recommendedHotels = mockStores.bookingStore.recommendedHotels;
            mockProps.isHotelDetailsBookPage = true;
            mockProps.params.ShowSponsoredHotelsOnly = '1';

            render(<DestinationRecommendedHotels {...mockProps} />);

            expect(mockRecommendedHotelsCarousel).toHaveBeenCalledWith(
                expect.objectContaining({
                    offers: [
                        { id: '1', isSponsored: true },
                        { id: '3', isSponsored: true },
                    ],
                }),
            );
        });

        it('should not render wrapper-shape when filtered sponsored hotels are below minimum requirement', () => {
            mockStores.layoutStore.isHotelDetailsBookPage = true;
            mockStores.layoutStore.isHotelDetailsBrowsePage = false;
            mockStores.bookingStore.recommendedHotels = [
                { id: '1', isSponsored: false },
                { id: '2', isSponsored: false },
                { id: '3', isSponsored: false },
            ];
            mockProps.recommendedHotels = mockStores.bookingStore.recommendedHotels;
            mockProps.isHotelDetailsBookPage = true;
            mockProps.params.ShowSponsoredHotelsOnly = '1';
            mockProps.fields.MinNumberOfHotelsToShowComponent = { value: '1' };

            const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

            expect(container.getElementsByClassName('wrapper-shape').length).toBe(0);
            expect(container.getElementsByClassName('wrapper-shape__triangle-start').length).toBe(0);
            expect(mockRecommendedHotelsCarousel).not.toHaveBeenCalled();
        });

        it('should not render when total offers below MinNumberOfHotelsToShowComponent', () => {
            mockStores.layoutStore.isHotelDetailsBookPage = true;
            mockStores.layoutStore.isHotelDetailsBrowsePage = false;
            mockStores.bookingStore.recommendedHotels = [{ id: '1' }, { id: '2' }];
            mockProps.recommendedHotels = mockStores.bookingStore.recommendedHotels;
            mockProps.isHotelDetailsBookPage = true;
            mockProps.fields.MinNumberOfHotelsToShowComponent = { value: '3' };

            const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

            expect(container.getElementsByClassName('wrapper-shape').length).toBe(0);
            expect(mockRecommendedHotelsCarousel).not.toHaveBeenCalled();
        });
    });

    it('should load recommended hotels when recommendedHotels is empty on hotel details page', () => {
        mockStores.layoutStore.isHotelDetailsBookPage = true;
        delete mockStores.bookingStore.recommendedHotels;

        render(<DestinationRecommendedHotels {...mockProps} />);

        expect(mockStores.bookingStore.loadRecommendedHotels).toHaveBeenCalledWith(Bd4TravelPlacementId.HotelBook);
    });

    it('should load recommended hotels when recommendedHotels is empty on hotel details page for trade', () => {
        mockStores.layoutStore.isHotelDetailsBookPage = true;
        mockStores.layoutStore.isTradePortal = true;
        delete mockStores.bookingStore.recommendedHotels;

        render(<DestinationRecommendedHotels {...mockProps} />);

        expect(mockStores.bookingStore.loadRecommendedHotels).toHaveBeenCalledWith(Bd4TravelPlacementId.TradeHotelBook);
    });

    describe('isHomePage functionality', () => {
        it('should NOT render component when isHomePage is true and BD4PlacementId field is not provided', () => {
            mockStores.layoutStore.isHomePage = true;
            mockStores.bookingStore.recommendedHotels = null;
            mockProps.isHomePage = true;
            mockProps.recommendedHotels = null;
            mockProps.fields.BD4PlacementId = null;

            const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
            expect(offersService.fetchRecommendedOffersBrowse).not.toHaveBeenCalled();
        });

        it('should NOT render component when isHomePage is true and BD4PlacementId field value is empty', () => {
            mockStores.layoutStore.isHomePage = true;
            mockStores.bookingStore.recommendedHotels = null;
            mockProps.isHomePage = true;
            mockProps.recommendedHotels = null;
            mockProps.fields.BD4PlacementId = { value: '' };

            const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
            expect(offersService.fetchRecommendedOffersBrowse).not.toHaveBeenCalled();
        });

        it('should render component when isHomePage is true but BD4PlacementId field is provided', () => {
            mockStores.layoutStore.isHomePage = true;
            mockProps.isHomePage = true;
            mockProps.fields.BD4PlacementId = { value: 'custom-placement-id' };

            render(<DestinationRecommendedHotels {...mockProps} />);

            expect(screen.getByTestId('recommended-hotels-carousel')).toBeInTheDocument();
        });

        it('should render component when isHomePage is false and BD4PlacementId field is not provided', () => {
            mockStores.layoutStore.isHomePage = false;
            mockProps.isHomePage = false;
            mockProps.fields.BD4PlacementId = null;

            render(<DestinationRecommendedHotels {...mockProps} />);

            expect(screen.getByTestId('recommended-hotels-carousel')).toBeInTheDocument();
        });

        it('should NOT render triangle-start div when isHomePage is true', () => {
            mockStores.layoutStore.isHomePage = true;
            mockProps.isHomePage = true;

            const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

            expect(container.getElementsByClassName('wrapper-shape__triangle-start').length).toBe(0);
        });

        it('should render triangle-start div when isHomePage is false', () => {
            mockStores.layoutStore.isHomePage = false;
            mockProps.isHomePage = false;

            const { container } = render(<DestinationRecommendedHotels {...mockProps} />);

            expect(container.getElementsByClassName('wrapper-shape__triangle-start').length).toBe(1);
        });

        it('should use fallback placement ID for hotel browse page when isHomePage is false and BD4PlacementId not provided', () => {
            mockProps.isHotelDetailsBookPage = false;
            mockStores.layoutStore.isHotelDetailsBookPage = false;
            mockStores.layoutStore.isHomePage = false;
            mockStores.layoutStore.isHotelDetailsBrowsePage = true;
            mockProps.isHomePage = false;
            mockProps.fields.BD4PlacementId = null;

            render(<DestinationRecommendedHotels {...mockProps} />);

            expect(mockStores.trackingStore.setBd4RecommenderPlacementId).toHaveBeenCalledWith(
                Bd4TravelPlacementId.HotelBrowse,
            );
        });

        it('should use fallback placement ID for destination page when isHomePage is false and BD4PlacementId not provided', () => {
            mockProps.isHotelDetailsBookPage = false;
            mockStores.layoutStore.isHotelDetailsBookPage = false;
            mockStores.layoutStore.isHomePage = false;
            mockProps.isHomePage = false;
            mockProps.fields.BD4PlacementId = null;

            render(<DestinationRecommendedHotels {...mockProps} />);

            expect(mockStores.trackingStore.setBd4RecommenderPlacementId).toHaveBeenCalledWith(
                Bd4TravelPlacementId.Destination,
            );
        });

        it('should return early from loadRecommendedOffersBrowse when isHomePage is true and no BD4PlacementId', () => {
            mockProps.isHotelDetailsBookPage = false;
            mockStores.layoutStore.isHotelDetailsBookPage = false;
            mockStores.layoutStore.isHomePage = true;
            mockStores.bookingStore.recommendedHotels = null;
            mockProps.isHomePage = true;
            mockProps.recommendedHotels = null;
            mockProps.fields.BD4PlacementId = { value: '' };

            render(<DestinationRecommendedHotels {...mockProps} />);

            expect(mockStores.trackingStore.setBd4RecommenderPlacementId).not.toHaveBeenCalled();
        });
    });

    it('should pass related resorts as resort destinations when resort.relatedResorts is provided', async () => {
        mockProps.isHotelDetailsBookPage = false;
        mockStores.layoutStore.isHotelDetailsBookPage = false;
        mockProps.recommendedHotels = null;
        mockProps.layout = {
            sitecore: {
                route: {
                    fields: {},
                },
            },
        };

        offersService.fetchRecommendedOffersBrowse = jest.fn().mockResolvedValue({
            status: { tracking: null },
            offers: [{ id: '1' }, { id: '2' }],
        });
        mockGetLocationHierarchy.mockReturnValue({
            region: { code: 'GRCR' },
            resort: {
                code: 'GRCRMAF',
                relatedResorts: ['GRCRMAA', 'GRCRMAC', 'GRCRMAB'],
            },
        });

        render(<DestinationRecommendedHotels {...mockProps} />);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(offersService.fetchRecommendedOffersBrowse).toHaveBeenCalledWith(
            ['region:GRCR', 'resort:GRCRMAA', 'resort:GRCRMAC', 'resort:GRCRMAB'],
            true,
            'bd4',
            undefined,
            '',
            undefined,
            5,
        );
    });

    it('should pass resort.code as resort destination when resort.relatedResorts is not provided', async () => {
        mockProps.isHotelDetailsBookPage = false;
        mockStores.layoutStore.isHotelDetailsBookPage = false;
        mockProps.recommendedHotels = null;
        mockProps.layout = {
            sitecore: {
                route: {
                    fields: {},
                },
            },
        };

        offersService.fetchRecommendedOffersBrowse = jest.fn().mockResolvedValue({
            status: { tracking: null },
            offers: [{ id: '1' }, { id: '2' }],
        });

        mockGetLocationHierarchy.mockReturnValue({
            resort: {
                code: 'GRCRMAF',
            },
        });

        render(<DestinationRecommendedHotels {...mockProps} />);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(offersService.fetchRecommendedOffersBrowse).toHaveBeenCalledWith(
            ['resort:GRCRMAF'],
            true,
            'bd4',
            undefined,
            '',
            undefined,
            5,
        );
    });

    it('should call trackRecommenderNotLoaded when recommended offers returns an empty array', async () => {
        mockProps.isHotelDetailsBookPage = false;
        mockStores.layoutStore.isHotelDetailsBookPage = false;
        mockStores.layoutStore.isHotelDetailsBrowsePage = false;
        mockStores.bookingStore.recommendedHotels = null;
        mockProps.recommendedHotels = null;

        offersService.fetchRecommendedOffersBrowse = jest.fn().mockResolvedValue({
            status: { tracking: {} },
            offers: [],
        });

        mockGetLocationHierarchy.mockReturnValue({
            country: { code: 'ES' },
            region: { code: 'REG1' },
            resort: { code: 'RES1' },
        });

        render(<DestinationRecommendedHotels {...mockProps} />);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockStores.trackingStore.trackRecommenderNotLoaded).toHaveBeenCalled();
    });
});

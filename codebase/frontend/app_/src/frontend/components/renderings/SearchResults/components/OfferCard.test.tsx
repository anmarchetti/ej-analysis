import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockShortlistFields } from 'frontend/__mocks__/shortlist';
import * as luggageUtils from 'frontend/utils/luggage.utils';
import * as shortlistUtils from 'frontend/utils/shortlist.utils';
import * as transferUtils from 'frontend/utils/transfer.utils';
import { IOffer } from 'models/data/IOffer';
import { ITransfer } from 'models/data/ITransfer';
import { MarketCode } from 'models/data/MarketSettings';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ShortlistType } from 'models/enum/ShortlistType';
import { IActiveExperiment } from 'frontend/components/cro/ExperimentOptimizely/utils/experiment.utils';

import OfferCard, { IOfferCardProps } from './OfferCard';

const createProps = (): IOfferCardProps => ({
    rendering: undefined,
    offer: {
        date: '123',
        transport: { routes: [{ depT: 'example' }, {}] },
        isSponsored: true,
        accom: { isExt: true },
        shortlist: { type: ShortlistType.Hotel },
    } as IOffer,
    fallbackImage: '',
    offerIndex: 0,
    onSelect: mockOnSelect,
    isSelectedToEdit: false,
    onToggleEditSelection: mockOnToggleEditSelection,
    alternativeFlightsSortOrders: [
        {
            label: 'Price: high to low',
            value: AlternativeFlightsSortBy.PriceHightToLow,
        },
    ],
    alternativeFlightsDefaultSort: AlternativeFlightsSortBy.PriceLowToHigh,
    isSelectedToCompare: false,
    ShortlistFields: mockShortlistFields,
});

const mockOnSelect = jest.fn();
const mockOnToggleEditSelection = jest.fn();

const createStores = () =>
    createMockStores({
        appStore: {
            isScreenLessMedium: false,
        },
        routerStore: {
            hotelDetailsUrl: () => jest.fn(),
        },
        layoutStore: {
            isShortlistPage: false,
            isSearchResultsPage: true,
            isPromoPage: false,
            currentPath: 'example',
        },
        queryParamStore: {
            buildHotelDetailsQuery: jest.fn(),
            buildBD4HotelParam: jest.fn(),
        },
        searchStore: {
            page: 2,
            take: 2,
        },
        marketStore: {
            marketCode: MarketCode.UK,
        },
        shortlistStore: {
            getShortlistHotelLink: jest.fn(),
            isOfferFromAnotherMarket: jest.fn(() => false),
        },
    });

jest.mock('frontend/components/cro/ExperimentOptimizely/hooks/useOptimizelyExperiment', () => () => mockOptimizely);

const mockOptimizelyExperiment: IActiveExperiment = {
    activeVariantId: '28579720055',
    config: {
        experimentId: '28580050047',
        pagesId: '28585400053',
        originalVariant: '28592940040',
        variantA: '28579720055',
    },
};

let mocksProps = createProps();
let mockStores = createStores();
let mockOptimizely;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPackageIconsComponent = jest.fn();
jest.mock('frontend/components/common/PackageIcons/PackageIcons', () => ({
    __esModule: true,
    default: props => {
        mockPackageIconsComponent(props);

        return <div data-tid='package-icons' />;
    },
}));

jest.mock('frontend/components/common/UrgencyMessage/UrgencyMessage', () => ({
    __esModule: true,
    default: () => <div data-tid='urgency-message' />,
}));

jest.mock(
    'frontend/components/renderings/SearchResults/components/ImageCarouselContainer/ImageCarouselContainer',
    () => ({
        __esModule: true,
        default: () => <div data-tid='image-carousel-container' />,
    }),
);

jest.mock('frontend/components/renderings/SearchResults/components/OfferCardHotelHead', () => ({
    __esModule: true,
    default: () => <div data-tid='offer-card-hotel-head' />,
}));

const mockOfferPrice = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/OfferPrice/OfferPrice', () => ({
    __esModule: true,
    default: props => {
        mockOfferPrice(props);

        return <div data-tid='offer-price' />;
    },
}));

const mockOfferCardOptionsProps = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/OfferCardOptions', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardOptionsProps(props);

        return <div data-tid='offer-card-options' />;
    },
}));

const mockPlaceholderComponentProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderComponentProps(props);

        return <div data-tid='placeholder' />;
    },
}));

jest.mock('frontend/utils/urgencyMessage.utils', () => ({
    getRoomsUrgencyMessageVisibility: () => mockIsUrgencyMessageVisable,
    getRoomsUrgencyMessage: () => 'Urgency message',
}));

let mockIsUrgencyMessageVisable;

describe('<OfferCard />', () => {
    beforeEach(() => {
        mocksProps = createProps();
        mockStores = createStores();
        mockOptimizely = undefined;
        jest.spyOn(luggageUtils, 'getExtraLuggageFromLivePriceAndOffer').mockReturnValue({ items: [] });
        jest.spyOn(transferUtils, 'getTransferFromLivePriceAndOffer').mockReturnValue(null);
    });

    it('should render', () => {
        render(<OfferCard {...mocksProps} />);

        expect(screen.getByTestId('offer-card-hotel-head')).toBeInTheDocument();
        expect(screen.getByTestId('offer-card-options')).toBeInTheDocument();
        expect(screen.getByTestId('package-icons')).toBeInTheDocument();
        expect(mockPackageIconsComponent).toHaveBeenCalledWith({
            packageIcons: [],
            transfer: null,
            extraLuggage: { items: [] },
            className: 'packageIcons',
            isLuxury: false,
        });
        expect(screen.getByTestId('offer-price')).toBeInTheDocument();
        expect(mockOfferPrice).toHaveBeenCalledWith({
            isShortlistHotelType: true,
            link: expect.any(Function),
            livePrice: undefined,
            offer: mocksProps.offer,
            onClickViewHoliday: expect.any(Function),
            isLuxury: false,
            ShortlistFields: mocksProps.ShortlistFields,
        });
    });

    it('should render urgencyMessage on UK region on Mobile if rooms more then 5', () => {
        mockStores.appStore.isScreenLessMedium = true;
        mockStores.marketStore.marketCode = 'UK';
        mockIsUrgencyMessageVisable = true;
        render(<OfferCard {...mocksProps} />);
        expect(screen.getByTestId('urgency-message')).toBeInTheDocument();
    });

    it('should NOT render urgencyMessage on UK region on Desktop if rooms more then 5', () => {
        mockStores.appStore.isScreenLessMedium = true;
        mockStores.marketStore.marketCode = 'UK';
        mockIsUrgencyMessageVisable = false;
        render(<OfferCard {...mocksProps} />);
        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
    });

    it('should NOT render urgencyMessage on UK region on Mobile if rooms less then 5', () => {
        mockStores.appStore.isScreenLessMedium = true;
        mockStores.marketStore.marketCode = 'UK';
        mockIsUrgencyMessageVisable = false;
        render(<OfferCard {...mocksProps} />);
        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
    });

    it('should NOT render urgencyMessage on UK region on Desktop', () => {
        mockStores.appStore.isScreenLessMedium = false;
        mockStores.marketStore.marketCode = 'UK';
        render(<OfferCard {...mocksProps} />);
        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
    });

    it('should NOT render urgencyMessage on EUX region on Desktop', () => {
        mockStores.appStore.isScreenLessMedium = false;
        mockStores.marketStore.marketCode = 'FR';
        render(<OfferCard {...mocksProps} />);
        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
    });

    it('should render urgencyMessage on EUX region with AB Experiment on Mobile ', () => {
        mockStores.appStore.isScreenLessMedium = true;
        mockStores.marketStore.marketCode = 'FR';
        mockIsUrgencyMessageVisable = true;
        mockOptimizely = mockOptimizelyExperiment;
        render(<OfferCard {...mocksProps} />);
        expect(screen.getByTestId('urgency-message')).toBeInTheDocument();
    });

    it('should NOT render urgencyMessage on EUX region with AB Experiment on Desktop', () => {
        mockStores.appStore.isScreenLessMedium = false;
        mockStores.marketStore.marketCode = 'FR';
        mockOptimizely = mockOptimizelyExperiment;
        render(<OfferCard {...mocksProps} />);
        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
    });

    it('should render NOT urgencyMessage on EUX region with AB Experiment on Mobile if rooms less then 5', () => {
        mockStores.appStore.isScreenLessMedium = true;
        mockStores.marketStore.marketCode = 'FR';
        mockIsUrgencyMessageVisable = false;
        mockOptimizely = mockOptimizelyExperiment;
        render(<OfferCard {...mocksProps} />);
        expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
    });

    it('should render ImageCarouselContainer', () => {
        render(<OfferCard {...mocksProps} />);
        expect(screen.getByTestId('image-carousel-container')).toBeInTheDocument();
    });

    it('should render OfferCardOptions', () => {
        render(<OfferCard {...mocksProps} />);

        expect(screen.getByTestId('offer-card-options')).toBeInTheDocument();
        expect(mockOfferCardOptionsProps).toHaveBeenCalledWith({
            alternativeFlightsDefaultSort: mocksProps.alternativeFlightsDefaultSort,
            alternativeFlightsSortOrders: mocksProps.alternativeFlightsSortOrders,
            boardType: mocksProps.offer.accom?.unit?.[0]?.boardType,
            closestFacility: undefined,
            holidayTheme: undefined,
            holidayType: undefined,
            night: undefined,
            offer: mocksProps.offer,
            roomType: mocksProps.offer.accom?.unit?.[0]?.roomType,
            routeArr: mocksProps.offer.transport.routes[1],
            routeDep: mocksProps.offer.transport.routes[0],
            isABVariantTest: undefined,
            isUrgencyMessageVisible: false,
            isShortlistPage: false,
            isShortlistHotelType: true,
        });
    });

    it('should render promotional messages if isOfferUnavailableInShortlist = false', () => {
        jest.spyOn(shortlistUtils, 'isShortlistOfferUnavailable').mockReturnValue(false);
        render(<OfferCard {...mocksProps} />);
        expect(screen.getByTestId('image-carousel-container')).toBeInTheDocument();
    });

    it('should NOT render promotional messages if isOfferUnavailableInShortlist = true', () => {
        jest.spyOn(shortlistUtils, 'isShortlistOfferUnavailable').mockReturnValue(true);
        render(<OfferCard {...mocksProps} />);
        expect(screen.getByTestId('image-carousel-container')).toBeInTheDocument();
    });

    describe('Placeholder', () => {
        it('should NOT render Placeholder when isShortlistOfferUnavailable is true', () => {
            jest.spyOn(shortlistUtils, 'isShortlistOfferUnavailable').mockReturnValue(true);
            render(<OfferCard {...mocksProps} />);

            expect(screen.queryByTestId('placeholder')).not.toBeInTheDocument();
            expect(mockPlaceholderComponentProps).not.toHaveBeenCalled();
        });

        it('should render Placeholder when isShortlistOfferUnavailable is false', () => {
            jest.spyOn(shortlistUtils, 'isShortlistOfferUnavailable').mockReturnValue(false);
            render(<OfferCard {...mocksProps} />);

            expect(screen.getByTestId('placeholder')).toBeInTheDocument();
            expect(mockPlaceholderComponentProps).toHaveBeenCalledWith({
                name: PlaceholderNames.PromotionalMessages,
                rendering: undefined,
                routeDep: mocksProps.offer.transport.routes[0],
                offer: mocksProps.offer,
            });
        });
    });

    describe('add highlight styles', () => {
        it('should add card--selected when offer isSelectedToEdit', () => {
            mocksProps.isSelectedToEdit = true;
            const { container } = render(<OfferCard {...mocksProps} />);
            expect(container.querySelector('.card--selected')).toBeInTheDocument();
        });

        it('should NOT add card--selected when offer is not isSelectedToEdit', () => {
            const { container } = render(<OfferCard {...mocksProps} />);
            expect(container.querySelector('.card--selected')).not.toBeInTheDocument();
        });

        it('should add card--selected when offer isSelectedToCompare', () => {
            mocksProps.isSelectedToCompare = true;
            const { container } = render(<OfferCard {...mocksProps} />);
            expect(container.querySelector('.card--selected')).toBeInTheDocument();
        });

        it('should NOT add card--selected when offer is not isSelectedToCompare', () => {
            const { container } = render(<OfferCard {...mocksProps} />);
            expect(container.querySelector('.card--selected')).not.toBeInTheDocument();
        });
    });

    it('should call getShortlistHotelLink to get hotel link on shortlist page', () => {
        mockStores.layoutStore.isShortlistPage = true;
        render(<OfferCard {...mocksProps} />);

        fireEvent.click(screen.getByTestId('offer-card-hotel-head'));

        expect(mockStores.shortlistStore.getShortlistHotelLink).toHaveBeenCalledWith(mocksProps.offer);
    });

    describe('PackageIcons', () => {
        it('should render both luggageIcon and transferIcon', () => {
            const transfer = {
                price: 100,
            } as ITransfer;

            jest.spyOn(transferUtils, 'getTransferFromLivePriceAndOffer').mockReturnValue(transfer);

            render(<OfferCard {...mocksProps} />);

            expect(mockPackageIconsComponent).toHaveBeenCalledWith({
                packageIcons: [],
                transfer,
                extraLuggage: {
                    items: [],
                },
                className: 'packageIcons',
                isLuxury: false,
            });
        });

        it('should NOT render both luggageIcon and transferIcon', () => {
            mockStores.shortlistStore.isOfferFromAnotherMarket = jest.fn(() => true);
            mockStores.layoutStore.isShortlistPage = true;

            render(<OfferCard {...mocksProps} />);

            expect(mockPackageIconsComponent).toHaveBeenCalledWith({
                packageIcons: [],
                transfer: null,
                extraLuggage: undefined,
                className: 'packageIcons',
                isLuxury: false,
            });
        });
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';

import OfferCardFooter, { IOfferCardFooterProps } from './OfferCardFooter';

const createProps = (): IOfferCardFooterProps => ({
    hotelLink: 'hotelLink',
    hotelLinkWithPrice: 'hotelLinkWithPrice',
    onClickSelect: jest.fn(),
    rendering: '',
    routeDep: {
        depDate: '2019-09-16T14:20:00+00:00',
        depName: 'Palma Airport',
        depPt: 'PMI',
        arrDate: '2019-09-16T11:55:00+00:00',
        arrName: 'London Gatwick Airport',
        arrPt: 'LGW',
    } as IRoute,
    offer: {} as IOffer,
    hasShortlistBookmark: true,
    isSelectionEditMode: false,
    isShortlistOfferUnavailable: false,
    isLuxury: false,
});

const createStores = () =>
    createMockStores({
        appStore: {
            isScreenExtraLarge: true,
        },
        layoutStore: {
            isEcoCertifiedEnabledOnSearchPage: false,
            isSearchResultsPage: true,
            isPromoPage: false,
            isPricesHidden: false,
            currentPath: 'example',
            shouldDisplayStrikethroughPrices: jest.fn(() => true),
            isTouristTaxEnabled: false,
        },
        shortlistStore: {
            isOfferFromAnotherMarket: false,
        },
    });

let mocksProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/getHotelLocation', () => ({
    getHotelLocation: jest.fn(),
}));

const mockPackageIconsComponent = jest.fn();

jest.mock('frontend/components/common/PackageIcons/PackageIcons', () => ({
    __esModule: true,
    default: props => {
        mockPackageIconsComponent(props);

        return <div data-tid='package-icons' />;
    },
}));

const mockOfferCardPillsComponent = jest.fn();

jest.mock(
    'frontend/components/renderings/SearchResults/components/OfferCardNew/components/OfferCardPills/OfferCardPills',
    () => ({
        __esModule: true,
        default: props => {
            mockOfferCardPillsComponent(props);

            return <div data-tid='offer-card-pills' />;
        },
    }),
);

const mockShortlistButtonComponent = jest.fn();

jest.mock('frontend/components/renderings/Shortlists/components/ShortlistButton/ShortlistButton', () => ({
    __esModule: true,
    default: props => {
        mockShortlistButtonComponent(props);

        return <div data-tid='shortlist-button' />;
    },
}));

const mockOfferCardPrices = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/OfferCardPrices/OfferCardPrices', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardPrices(props);

        return <div data-tid='offer-card-prices' />;
    },
}));

const mockOfferPriceButton = jest.fn();
jest.mock('frontend/components/common/OfferPriceButton/OfferPriceButton', () => ({
    __esModule: true,
    default: props => {
        mockOfferPriceButton(props);

        return <div data-tid='offer-price-button' />;
    },
}));

jest.mock('frontend/components/renderings/SearchResults/components/OfferPrice/OfferPricePills', () => ({
    __esModule: true,
    default: () => <div data-tid='offer-price-pills' />,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Placeholder: () => <div data-tid='placeholder' />,
}));

jest.mock('frontend/store/tradePortal', () => ({
    isTradeStore: () => true,
}));

jest.mock(
    'frontend/components/renderings/SearchResults/components/OfferCardNew/components/CompareCheckbox/CompareCheckbox',
    () => () => <div data-tid='compare-checkbox' />,
);

let mockIsDesktop = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useDesktopViewport: () => mockIsDesktop,
}));

describe('<OfferCardFooter />', () => {
    beforeEach(() => {
        mocksProps = createProps();
        mockStores = createStores();
        mockIsDesktop = true;
    });

    it('should standard render', () => {
        render(<OfferCardFooter {...mocksProps} />);

        expect(screen.getByTestId('offer-card-prices')).toBeInTheDocument();
        expect(screen.getByTestId('offer-price-button')).toBeInTheDocument();
        expect(screen.getByTestId('offer-price-pills')).toBeInTheDocument();
        expect(mockOfferCardPrices).toHaveBeenCalledWith({
            offer: mocksProps.offer,
            livePrice: mocksProps.offer.livePrice,
            shouldDisplayStrikethroughPrices: true,
        });
    });

    it('should render holiday package and shortlist button', () => {
        const packageIcons =
            mocksProps.offer.accom?.theme?.packageIcons || mocksProps.offer.hotel?.theme?.packageIcons || [];
        const transfer = mocksProps.offer.transfers?.length ? mocksProps.offer.transfers[0] : null;

        const { getByTestId } = render(<OfferCardFooter {...mocksProps} />);

        expect(getByTestId('shortlist-button')).toBeInTheDocument();
        expect(mockShortlistButtonComponent).toHaveBeenCalledWith({ offer: mocksProps.offer });
        expect(mockPackageIconsComponent).toHaveBeenCalledWith({
            packageIcons,
            transfer,
            isLuxury: false,
            extraLuggage: undefined,
            rendering: '',
        });
    });

    it('should render offer card pills of isScreenExtraLarge is false', () => {
        mockStores.appStore.isScreenExtraLarge = false;
        const { hotel } = mocksProps.offer;
        render(<OfferCardFooter {...mocksProps} />);

        expect(mockOfferCardPillsComponent).toHaveBeenCalledWith({
            isOfferUnavailableInShortlist: mocksProps.isShortlistOfferUnavailable,
            rendering: mocksProps.rendering,
            offer: mocksProps.offer,
            routeDep: mocksProps.routeDep,
            isEcoCertifiedPill: !!(
                hotel?.ecoFacility.name &&
                hotel?.ecoFacility?.tooltip &&
                mockStores.layoutStore.isEcoCertifiedEnabledOnSearchPage
            ),
        });
    });

    it('should NOT render price pills and price info if price was turn off on Trade Portal', () => {
        mockStores.layoutStore.isPricesHidden = true;

        render(<OfferCardFooter {...mocksProps} />);

        expect(screen.queryByTestId('offer-price-pills')).not.toBeInTheDocument();
        expect(screen.queryByTestId('offer-card-prices')).not.toBeInTheDocument();
        expect(mockOfferCardPrices).not.toHaveBeenCalled();
    });

    it('should pass all expected props to OfferPriceButton', () => {
        mocksProps.hotelLinkWithPrice = 'asLink';

        render(<OfferCardFooter {...mocksProps} />);

        expect(mockOfferPriceButton).toHaveBeenCalledWith({
            offer: mocksProps.offer,
            link: mocksProps.hotelLinkWithPrice,
            asLink: mocksProps.hotelLink,
            isLivePrice: !!mocksProps.offer.livePrice,
            onClick: mocksProps.onClickSelect,
            className: undefined,
        });
    });

    it('should pass right class for OfferPriceButton when it is luxury package', () => {
        mocksProps.isLuxury = true;

        render(<OfferCardFooter {...mocksProps} />);

        expect(mockOfferPriceButton).toHaveBeenCalledWith({
            offer: mocksProps.offer,
            link: mocksProps.hotelLinkWithPrice,
            asLink: mocksProps.hotelLink,
            isLivePrice: !!mocksProps.offer.livePrice,
            onClick: mocksProps.onClickSelect,
            className: 'btn--black',
        });
    });

    describe('tourist tax class name', () => {
        it('should apply footerWithTouristTax class when isTouristTaxEnabled is true', () => {
            mockStores.layoutStore.isTouristTaxEnabled = true;

            const { container } = render(<OfferCardFooter {...mocksProps} />);

            expect(container.firstChild).toHaveClass('footerWithTouristTax');
        });

        it('should NOT apply footerWithTouristTax class when isTouristTaxEnabled is false', () => {
            mockStores.layoutStore.isTouristTaxEnabled = false;

            const { container } = render(<OfferCardFooter {...mocksProps} />);

            expect(container.firstChild).not.toHaveClass('footerWithTouristTax');
        });
    });

    describe('compare label', () => {
        it('should render compare label on tablet and mobile', () => {
            render(<OfferCardFooter {...mocksProps} />);

            expect(screen.getByTestId('compare-checkbox')).toBeInTheDocument();
        });

        it('should not render compare label on screens larger than desktop', () => {
            mockIsDesktop = false;
            render(<OfferCardFooter {...mocksProps} />);

            expect(screen.queryByTestId('compare-checkbox')).not.toBeInTheDocument();
        });
    });
});

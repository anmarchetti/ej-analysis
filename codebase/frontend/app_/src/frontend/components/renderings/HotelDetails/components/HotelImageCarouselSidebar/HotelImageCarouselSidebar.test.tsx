import React from 'react';
import { ComponentRendering } from '@sitecore-jss/sitecore-jss-nextjs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencyCode } from 'code/currency';
import { createMockStores, mockHotel, mockTransfer } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockTouristTaxFields } from 'frontend/__mocks__/touristTax';
import { isTradeStore } from 'frontend/store/tradePortal';
import { distanceInfo } from 'frontend/utils/getHotelLocation';
import {
    containsLuxuryPromoCode,
    getIsShowGreatDealPill,
    getPricePill,
    getTotalDiscount,
    isFreeForKids,
    isPricePPShown,
} from 'frontend/utils/offer.utils';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { PillSizeVariants } from 'frontend/components/common/Pills/PillWithVariants/PillSizeVariants';

import HotelImageCarouselSidebar, { IHotelImageCarouselSidebarProps } from './HotelImageCarouselSidebar';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockContainsLuxuryPromoCode = false;
jest.mock('frontend/utils/offer.utils', () => ({
    getPricePill: jest.fn(),
    isPricePPShown: jest.fn(),
    getIsShowGreatDealPill: jest.fn(),
    getTotalDiscount: jest.fn(),
    includesDistressedSeats: jest.fn(),
    isFreeForKids: jest.fn(),
    containsLuxuryPromoCode: jest.fn(() => mockContainsLuxuryPromoCode),
}));

jest.mock('frontend/utils/touristTax.utils', () => ({
    ...jest.requireActual('frontend/utils/touristTax.utils'),
    getTouristTaxFieldsFromOffer: jest.fn().mockReturnValue(mockTouristTaxFields),
}));

jest.mock('frontend/utils/getHotelLocation', () => ({
    distanceInfo: jest.fn(),
    distanceTextFromSitecore: jest.fn(),
}));

jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => ({
    __esModule: true,
    default: ({ tooltip, ...props }) => {
        mockPriceLabelComponent(props);

        return <div data-tid='price-label'>{tooltip}</div>;
    },
}));

const mockDiscountPercentagePill = jest.fn();
jest.mock('frontend/components/common/Pills/DiscountPercentagePill/DiscountPercentagePill', () => ({
    __esModule: true,
    default: props => {
        mockDiscountPercentagePill(props);

        return <div data-tid='discount-percentage-pill' />;
    },
}));

const mockDiscountedBoardPill = jest.fn();
jest.mock('frontend/components/common/Pills/DiscountedBoardPill/DiscountedBoardPill', () => ({
    __esModule: true,
    default: props => {
        mockDiscountedBoardPill(props);

        return <div data-tid='discounted-board-pill' />;
    },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: () => <div data-tid='placeholder' />,
}));

const mockFreeBoardUpgradePill = jest.fn();
jest.mock('frontend/components/common/Pills/FreeBoardUpgradePill/FreeBoardUpgradePill', () => ({
    __esModule: true,
    default: props => {
        mockFreeBoardUpgradePill(props);

        return <div data-tid='free-board-upgrade-pill' />;
    },
}));

jest.mock('frontend/components/common/StartBookingButton', () => ({
    __esModule: true,
    default: ({ render }) => <div data-tid='start-booking-button'>{render()}</div>,
}));

jest.mock('frontend/components/common/Pills/FreeNightsIncludedPill/FreeNightsIncludedPill', () => ({
    __esModule: true,
    default: () => <div data-tid='free-nights-included-pill' />,
}));

jest.mock('frontend/components/renderings/SearchResults/components/ShortlistManaging', () => ({
    __esModule: true,
    default: () => <div data-tid='short-list-managing' />,
}));

jest.mock('frontend/components/common/KeySellingBulletPoint/KeySellingBulletPoint', () => ({
    __esModule: true,
    default: () => <div data-tid='key-selling-bullet-point' />,
}));

jest.mock('frontend/components/common/Pills/GreatDealPill/GreatDealPill', () => ({
    __esModule: true,
    default: () => <div data-tid='great-deal-pill' />,
}));

jest.mock('frontend/components/common/PackageIcons/PackageIcons', () => ({
    __esModule: true,
    default: props => {
        mockPackageIconsComponent(props);

        return <div data-tid='package-icons' />;
    },
}));

jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: ({ children }) => <div data-tid='tooltip-trigger'>{children}</div>,
    TooltipContent: ({ children }) => <div data-tid='tooltip-content'>{children}</div>,
}));

jest.mock('../HotelImageCarouselSidebarHead', () => ({
    __esModule: true,
    default: props => {
        mockHotelImageCarouselSidebarHeadComponent(props);

        return <div data-tid='hotel-image-carousel-sidebar-head' />;
    },
}));

jest.mock('frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill', () => ({
    __esModule: true,
    default: props => {
        mockFreeForKidsPillComponent(props);

        return <div data-tid='free-for-kids-pill' />;
    },
}));

jest.mock('frontend/components/common/Pills/HotelDiscountPill/HotelDiscountPill', () => ({
    __esModule: true,
    default: props => {
        mockHotelDiscountPillComponent(props);

        return <div data-tid='hotel-discount-pill' />;
    },
}));

const mockTouristTaxPriceTooltipComponent = jest.fn();
jest.mock('frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip', () => ({
    __esModule: true,
    TouristTaxPriceTooltip: ({ children, ...props }) => {
        mockTouristTaxPriceTooltipComponent(props);

        return <div data-tid='tourist-tax-price-tooltip'>{children}</div>;
    },
}));

const mockTouristTaxPriceLabelComponent = jest.fn();
jest.mock('frontend/components/common/TouristTaxPriceLabel/TouristTaxPriceLabel', () => ({
    __esModule: true,
    TouristTaxPriceLabel: ({ ...props }) => {
        mockTouristTaxPriceLabelComponent(props);

        return <div data-tid='tourist-tax-price-label' />;
    },
}));

const createProps = (): IHotelImageCarouselSidebarProps => ({
    offer: {
        ...mockedOffer,
        price: 14,
        pricePP: 7,
        currency: {
            code: CurrencyCode.EUR,
        },
    },
    hotelInfo: { ...mockHotel },
    reviewsAnchor: 'test anchor',
    selectedSeatsPricePP: undefined,
    selectedSeatsPrice: undefined,
    accommodationCodes: undefined,
    isPreview: true,
    rendering: {} as ComponentRendering,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            tooltipSettings: [],
            isMaintenance: false,
            isEditMode: false,
            isPricesHidden: true,
            isHotelDetailsBrowsePage: false,
            isHotelDetailsBrowseStateLivePriceEnabled: false,
            getSetting: jest.fn(p => p),
        },
        bookingStore: {
            extraLuggage: {
                extraLuggagePriceTotal: 0,
                extraLuggagePricePP: 0,
            },
            grabSearchValuesFromSearchStoreWithoutDestination: jest.fn(),
            grabSearchValuesFromSearchStore: jest.fn(),
            addExtrasToPrice: jest.fn(price => price),
        },
        searchStore: {
            validateSearchParameters: jest.fn(),
            setSelectedOfferIndex: jest.fn(),
        },
        routerStore: {
            redirectToSearchResultsPage: jest.fn(),
        },
        queryParamStore: {
            buildSearchQueryWithParams: jest.fn(e => e),
        },
        appStore: {
            isLoading: false,
        },
    });

let props;
let mockStores;

jest.mock('frontend/store/tradePortal', () => ({
    isTradeStore: jest.fn().mockReturnValue(false),
}));

const mockPriceLabelComponent = jest.fn();
const mockHotelImageCarouselSidebarHeadComponent = jest.fn();
const mockPackageIconsComponent = jest.fn();
const mockFreeForKidsPillComponent = jest.fn();
const mockHotelDiscountPillComponent = jest.fn();

describe('<HotelImageCarouselSidebar />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it("should return null when we don't have offer and isLoading is false", () => {
        props.offer = null;

        const { container } = render(<HotelImageCarouselSidebar {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should standard render', () => {
        render(<HotelImageCarouselSidebar {...props} />);

        expect(mockHotelImageCarouselSidebarHeadComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                offer: props.offer,
                hotelInfo: props.hotelInfo,
                reviewsAnchor: props.reviewsAnchor,
            }),
        );

        const btn = screen.getByRole('button');
        expect(btn).toHaveTextContent(SitecoreDictionary.HotelDetailsButtonsCheckAvailability);
        expect(btn).not.toHaveClass('btn--black');
        expect(btn).toHaveClass('submitButton');
        expect(screen.getByTestId('package-icons')).toBeInTheDocument();
        expect(screen.queryByTestId('great-deal-pill')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('key-selling-bullet-point')).toHaveLength(2);

        expect(mockPackageIconsComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                packageIcons: props.hotelInfo.theme.packageIcons,
                transfer: mockTransfer,
                extraLuggage: undefined,
                isLuxury: false,
            }),
        );

        expect(getTouristTaxFieldsFromOffer).toHaveBeenCalledWith(props.offer);
        expect(screen.getByTestId('tourist-tax-price-tooltip')).toBeInTheDocument();
        expect(mockTouristTaxPriceTooltipComponent).toHaveBeenCalledWith({
            touristTax: mockTouristTaxFields.touristTax,
            taxesAndFees: mockTouristTaxFields.taxesAndFees,
        });
        expect(screen.getByTestId('tourist-tax-price-label')).toBeInTheDocument();
        expect(mockTouristTaxPriceLabelComponent).toHaveBeenCalledWith({
            isPricePP: false,
            price: props.offer.price,
            pricePP: props.offer.pricePP,
            touristTax: mockTouristTaxFields.touristTax,
            touristTaxPP: mockTouristTaxFields.touristTaxPP,
        });
    });

    it('should pass first item from the offer transfers data to the PackageIcons component props', () => {
        props.offer.transfers = [{ id: '1' }, { id: '2' }];
        (containsLuxuryPromoCode as jest.Mock).mockReturnValue(true);

        render(<HotelImageCarouselSidebar {...props} />);

        expect(mockPackageIconsComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                packageIcons: props.hotelInfo.theme.packageIcons,
                transfer: props.offer.transfers[0],
                extraLuggage: undefined,
                isLuxury: true,
            }),
        );
    });

    it('should NOT render package icons', () => {
        props.hotelInfo.theme.packageIcons = [];

        render(<HotelImageCarouselSidebar {...props} />);

        expect(screen.queryByTestId('package-icons')).not.toBeInTheDocument();
    });

    it('should NOT render KeySellingBulletPoints when hotelInfo is NOT provided', () => {
        props.hotelInfo = null;

        render(<HotelImageCarouselSidebar {...props} />);

        expect(screen.queryByTestId('key-selling-bullet-point')).not.toBeInTheDocument();
    });

    it('should render button with black color when it is luxury package', () => {
        mockContainsLuxuryPromoCode = true;

        render(<HotelImageCarouselSidebar {...props} />);

        expect(screen.getByRole('button')).toHaveClass('btn--black');
    });

    describe('FreeBoardUpgradePill', () => {
        it('should render FreeBoardUpgradePill with isFreeBoardUpgrade set to true when hasFreeBoardUpdate is true', () => {
            props.offer.hasFreeBoardUpdate = true;
            props.isPreview = false;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.getByTestId('free-board-upgrade-pill')).toBeInTheDocument();
            expect(mockFreeBoardUpgradePill).toHaveBeenCalledWith({
                isFreeBoardUpgrade: true,
                pillSize: PillSizeVariants.Big,
            });
        });

        it('should render FreeBoardUpgradePill with isFreeBoardUpgrade set to false when hasFreeBoardUpdate is false', async () => {
            props.offer.hasFreeBoardUpdate = false;
            props.isPreview = false;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.getByTestId('free-board-upgrade-pill')).toBeInTheDocument();
            expect(mockFreeBoardUpgradePill).toHaveBeenCalledWith({
                isFreeBoardUpgrade: false,
                pillSize: PillSizeVariants.Big,
            });
        });
    });

    describe('DiscountPercentagePill', () => {
        it('should render DiscountPercentagePill', () => {
            props.offer.discountPercentage = 10;
            props.isPreview = false;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.getByTestId('discount-percentage-pill')).toBeInTheDocument();
            expect(mockDiscountPercentagePill).toHaveBeenCalledWith({
                discountPercentage: 10,
                icon: expect.any(Object),
                pillSize: PillSizeVariants.Big,
            });
        });
    });

    describe('<DiscountedBoardPill />', () => {
        it('should render DiscountedBoardPill when hasDiscountedBoardUpgrade is true and hasFreeBoardUpdate is false', () => {
            props.offer.hasDiscountedBoardUpgrade = true;
            props.offer.hasFreeBoardUpdate = false;
            props.isPreview = false;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.getByTestId('discounted-board-pill')).toBeInTheDocument();
            expect(mockDiscountedBoardPill).toHaveBeenCalledWith({
                large: true,
            });
        });

        it('should NOT render DiscountedBoardPill when both hasDiscountedBoardUpgrade/hasFreeBoardUpdate is true', () => {
            props.offer.hasDiscountedBoardUpgrade = true;
            props.offer.hasFreeBoardUpdate = true;
            props.isPreview = false;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByTestId('discounted-board-pill')).toBeNull();
        });
    });

    describe('check distance label', () => {
        const expectedDistanceLabel = 'distance info text';

        beforeEach(() => {
            (distanceInfo as jest.Mock).mockReturnValueOnce(expectedDistanceLabel);
        });

        it('should render with closestFacility with replaceTokens', () => {
            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.getByText(expectedDistanceLabel)).toBeInTheDocument();
        });

        it('should NOT render when theme value from accom is not defined and it is not a preview mode', () => {
            props.isPreview = false;
            props.offer.accom.theme = undefined;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByText(expectedDistanceLabel)).not.toBeInTheDocument();
        });

        it('should NOT render when hotelInfo is not defined', () => {
            props.hotelInfo = undefined;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByText(expectedDistanceLabel)).not.toBeInTheDocument();
        });

        it('should NOT render when closestFacility is not defined', () => {
            props.hotelInfo.closestFacility = undefined;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByText(expectedDistanceLabel)).not.toBeInTheDocument();
        });

        it('should NOT render when distance is not defined', () => {
            props.hotelInfo.closestFacility.distance = undefined;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByText(expectedDistanceLabel)).not.toBeInTheDocument();
        });
    });

    describe('check components when isPricesHidden is false', () => {
        beforeEach(() => {
            mockStores.layoutStore.isPricesHidden = false;
        });

        it('should render great deal pill', () => {
            (getIsShowGreatDealPill as jest.Mock).mockReturnValue(true);

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.getByTestId('great-deal-pill')).toBeInTheDocument();
        });

        it('should render free for kids pill', () => {
            (isFreeForKids as jest.Mock).mockReturnValue(true);

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByTestId('free-for-kids-pill')).not.toBeInTheDocument();
        });

        it('should NOT render hotel discount pill', () => {
            const expectedValue = '10';
            (getTotalDiscount as jest.Mock).mockReturnValue(expectedValue);

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByTestId('hotel-discount-pill')).not.toBeInTheDocument();
        });
    });

    describe('check components when isPricesHidden is false and it is not a preview mode', () => {
        beforeEach(() => {
            mockStores.layoutStore.isPricesHidden = false;
            props.isPreview = false;
        });

        it('should render hotel discount pill', () => {
            const expectedAmount = '10';
            (getTotalDiscount as jest.Mock).mockReturnValue(expectedAmount);

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.getByTestId('hotel-discount-pill')).toBeInTheDocument();
            expect(mockHotelDiscountPillComponent).toHaveBeenCalledWith({
                amount: expectedAmount,
                countryCode: props.offer.hotel.country.code,
                currency: props.offer.currency.code,
                tooltipMessage: SitecoreDictionary.HolidayCardPromotionPillTooltipsDiscount,
            });
        });

        it('should NOT render hotel discount pill when offer is not defined', () => {
            const expectedAmount = '10';
            props.offer = undefined;
            (getTotalDiscount as jest.Mock).mockReturnValue(expectedAmount);

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByTestId('hotel-discount-pill')).not.toBeInTheDocument();
        });

        it('should render great deal pill', () => {
            (getIsShowGreatDealPill as jest.Mock).mockReturnValue(true);

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.getByTestId('great-deal-pill')).toBeInTheDocument();
        });

        it('should render free for kids pill with empty country code when there is no hotel in offer', () => {
            props.offer.hotel = null;
            (isFreeForKids as jest.Mock).mockReturnValue(true);

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.getByTestId('free-for-kids-pill')).toBeInTheDocument();
            expect(mockFreeForKidsPillComponent).toHaveBeenCalledWith({
                countryCode: '',
                tooltipMessage: SitecoreDictionary.HolidayCardPromotionPillTooltipsFreeForKids,
            });
        });

        it('should NOT render free for kids pill', () => {
            (isFreeForKids as jest.Mock).mockReturnValue(false);

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByTestId('free-for-kids-pill')).not.toBeInTheDocument();
        });

        it('should NOT render when offer price is zero', () => {
            props.offer.price = 0;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(mockPriceLabelComponent).not.toHaveBeenCalled();
        });

        it('should render price labels when isPricesHidden is false and offer prices are defined', () => {
            const expectedPrice = 10;
            const expectedPriceTooltipText = 'price tooltip';
            props.duration = 7;

            mockStores.marketStore.formatMoney.mockReturnValue(expectedPrice);
            (getPricePill as jest.Mock).mockReturnValue(expectedPriceTooltipText);
            (isPricePPShown as jest.Mock).mockReturnValue(true);

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.getByTestId('free-nights-included-pill')).toBeInTheDocument();
            expect(screen.getAllByTestId('price-label')).toHaveLength(2);
            expect(screen.getByTestId('tooltip')).toBeInTheDocument();
            expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
            expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();

            expect(mockPriceLabelComponent).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    dataTid: 'price-total',
                    priceDictionary: undefined,
                    price: expectedPrice,
                }),
            );

            expect(mockPriceLabelComponent).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    dataTid: 'price-pp',
                    priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom,
                    price: expectedPrice,
                    numberOfNights: props.duration,
                }),
            );
        });

        it('should render price total tooltip and should NOT render second tooltip when isPricePPShown returns false', () => {
            const expectedPriceTooltipText = 'price tooltip';

            (getPricePill as jest.Mock).mockReturnValue(expectedPriceTooltipText);
            (isPricePPShown as jest.Mock).mockReturnValue(false);

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.getByTestId('free-nights-included-pill')).toBeInTheDocument();
            expect(screen.getAllByTestId('price-label')).toHaveLength(1);

            expect(screen.getByTestId('tooltip')).toBeInTheDocument();
            expect(screen.getByTestId('tooltip-trigger')).toBeInTheDocument();
            expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();

            expect(mockPriceLabelComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    dataTid: 'price-total',
                    priceDictionary: SitecoreDictionary.GlobalsPriceLabelsFrom,
                }),
            );
        });

        it('should not render tooltip when getPricePill returns undefined', () => {
            (getPricePill as jest.Mock).mockReturnValue(undefined);
            (isPricePPShown as jest.Mock).mockReturnValue(true);

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
            expect(mockPriceLabelComponent).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    dataTid: 'price-pp',
                }),
            );
        });
    });

    describe('check buttons clicks', () => {
        it('should call grabSearchValuesFromSearchStore when click on submit', async () => {
            render(<HotelImageCarouselSidebar {...props} />);
            const button = screen.getByRole('button');

            expect(button).toHaveTextContent(SitecoreDictionary.HotelDetailsButtonsCheckAvailability);

            await userEvent.click(button);

            expect(mockStores.bookingStore.grabSearchValuesFromSearchStore).toHaveBeenCalled();
        });

        it('should NOT call grabSearchValuesFromSearchStoreWithoutDestination, setSelectedOfferIndex and redirectToSearchResultsPage when validateSearchParameters is true', async () => {
            mockStores.searchStore.validateSearchParameters.mockReturnValueOnce(true);

            render(<HotelImageCarouselSidebar {...props} />);

            const button = screen.getByRole('button');

            expect(button).toHaveTextContent(SitecoreDictionary.HotelDetailsButtonsCheckAvailability);

            await userEvent.click(button);

            expect(mockStores.searchStore.validateSearchParameters).toHaveBeenCalled();
            expect(mockStores.bookingStore.grabSearchValuesFromSearchStoreWithoutDestination).not.toHaveBeenCalled();
            expect(mockStores.searchStore.setSelectedOfferIndex).not.toHaveBeenCalled();
            expect(mockStores.routerStore.redirectToSearchResultsPage).not.toHaveBeenCalled();
        });

        it('should NOT call grabSearchValuesFromSearchStoreWithoutDestination, setSelectedOfferIndex and redirectToSearchResultsPage when validateSearchParameters is true', async () => {
            mockStores.searchStore.validateSearchParameters.mockReturnValueOnce(true);

            render(<HotelImageCarouselSidebar {...props} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockStores.bookingStore.grabSearchValuesFromSearchStoreWithoutDestination).not.toHaveBeenCalled();
            expect(mockStores.searchStore.setSelectedOfferIndex).not.toHaveBeenCalled();
            expect(mockStores.routerStore.redirectToSearchResultsPage).not.toHaveBeenCalled();
        });

        it('should pass searchAccommodationCodes query to the redirect function params when accommodationCodes is defined in the props', async () => {
            const expectedQuery = 'ESTF0051,Z0003684,X9001141';

            props.accommodationCodes = ['ESTF0051', 'Z0003684', 'X9001141'];
            mockStores.searchStore.validateSearchParameters.mockReturnValueOnce(false);
            mockStores.queryParamStore.buildSearchQueryWithParams.mockReturnValueOnce(expectedQuery);

            render(<HotelImageCarouselSidebar {...props} />);

            await userEvent.click(screen.getByRole('button'));

            expect(mockStores.queryParamStore.buildSearchQueryWithParams).toHaveBeenCalledWith(true, {
                [QueryParamName.Destination]: expectedQuery,
                [QueryParamName.SearchAccommodationId]: expectedQuery,
            });
            expect(mockStores.routerStore.redirectToSearchResultsPage).toHaveBeenCalledWith(expectedQuery);
        });

        it('should render Button with "Continue" text in non-preview mode', async () => {
            props.isPreview = false;

            render(<HotelImageCarouselSidebar {...props} />);

            const button = screen.getByRole('button');
            expect(button).toHaveTextContent(SitecoreDictionary.GlobalsButtonsContinue);

            await userEvent.click(button);

            expect(mockStores.searchStore.validateSearchParameters).not.toHaveBeenCalled();
        });
    });

    describe('isPriceShown', () => {
        it('should be shown when isPriceVisible is true and isHotelPreview is false', () => {
            mockStores.layoutStore.isPricesHidden = false;
            props.isPreview = false;
            mockStores.layoutStore.isHotelDetailsBrowsePagePreview = false;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByTestId('hotel-price-placeholder')).toBeInTheDocument();
        });

        it('should be hidden when tradePortal and isPriceVisible is true', () => {
            jest.mocked(isTradeStore).mockReturnValue(true);

            mockStores.layoutStore.isPricesHidden = true;
            props.isPreview = false;
            mockStores.layoutStore.isHotelDetailsBrowsePagePreview = false;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByTestId('hotel-price-placeholder')).not.toBeInTheDocument();
        });

        it('should be hidden when isHotelPreview is true', () => {
            mockStores.layoutStore.isPricesHidden = false;
            props.isPreview = false;
            mockStores.layoutStore.isHotelDetailsBrowsePagePreview = true;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByTestId('hotel-price-placeholder')).not.toBeInTheDocument();
        });
    });

    describe('Price graph', () => {
        it('should render placeholder when setting is enabled', () => {
            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.getByTestId('placeholder')).toBeInTheDocument();
        });

        it('should NOT render placeholder when setting is disabled', () => {
            mockStores.layoutStore.getSetting = jest.fn();
            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByTestId('placeholder')).not.toBeInTheDocument();
        });
    });

    describe('TouristTaxPriceTooltip', () => {
        it('should render custom text when isHotelDetailsBrowsePage is true', () => {
            mockStores.layoutStore.isHotelDetailsBrowsePage = true;
            mockStores.layoutStore.isPricesHidden = false;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(mockTouristTaxPriceTooltipComponent).toHaveBeenCalledWith({
                touristTax: mockTouristTaxFields.touristTax,
                taxesAndFees: mockTouristTaxFields.taxesAndFees,
                text: SitecoreDictionary.TouristTaxTooltipsGenericContent,
            });
            expect(screen.getByTestId('tourist-tax-price-tooltip')).toBeInTheDocument();

            expect(screen.getByTestId('browse-page-tourist-tax-label')).toHaveTextContent(
                SitecoreDictionary.TouristTaxLabelsPriceIncludesTax,
            );
        });

        it('should be hidden when isHotelDetailsBrowsePage is true and no offer.price', () => {
            mockStores.layoutStore.isHotelDetailsBrowsePage = true;
            props.offer.price = 0;

            render(<HotelImageCarouselSidebar {...props} />);

            expect(screen.queryByTestId('tourist-tax-price-tooltip')).toBeNull();
        });
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockTouristTaxErrorFields, mockTouristTaxFields } from 'frontend/__mocks__/touristTax';
import { getTotalDiscount, isFreeForKids } from 'frontend/utils/offer.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { ExperimentTestIds, ExperimentVariants } from 'models/enum/cro/Experiment';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { PillSizeVariants } from 'frontend/components/common/Pills/PillWithVariants/PillSizeVariants';
import useExperiment from 'frontend/components/cro/Experiment/hooks/useExperiment';

import { mockPriceSummaryPlaceholders } from './__mocks__/mockPriceSummaryFields.mocks';
import { IPriceSummaryRendering } from './data/models';
import PriceSummary, { IPriceSummaryFields, IPriceSummaryProps } from './PriceSummary';

jest.mock('frontend/components/cro/Experiment/hooks/useExperiment');
const mockUseExperiment = useExperiment as jest.MockedFn<typeof useExperiment>;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/FeesPopup/FeesPopup', () => () => <div data-tid='fees-popup' />);

const mockPlaceholderComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder'>Placeholder</div>;
    },
    Text: ({ className, ...props }) => <div className={className} data-tid={`${props['data-tid']}-mock`} />,
}));

jest.mock('frontend/services/logging');

jest.mock('frontend/utils/offer.utils', () => ({
    getTotalDiscount: jest.fn(),
    isFreeForKids: jest.fn(),
    isPricePPShown: jest.fn(() => true),
    getIsShowGreatDealPill: jest.fn(),
    containsFAndHPromoCode: jest.fn(() => false),
}));
jest.mock('frontend/components/cro/ExperimentOptimizely/hooks/useOptimizelyExperiment', () =>
    jest.fn(() => mockOptimizely),
);
jest.mock('frontend/components/renderings/PriceSummary/components/ExportButton', () => ({
    __esModule: true,
    ExportButton: () => <div data-tid='export-holiday-details' />,
}));
jest.mock('./components/HolidaySummaryContent', () => ({
    __esModule: true,
    default: ({ breakdownItem, idx }) => (
        <div data-tid={`holiday-summary-content-${idx}`}>
            {breakdownItem.name} - {breakdownItem.amount}
        </div>
    ),
}));

const mockDiscountPercentagePill = jest.fn();
jest.mock('frontend/components/common/Pills/DiscountPercentagePill/DiscountPercentagePill', () => ({
    __esModule: true,
    default: props => {
        mockDiscountPercentagePill(props);

        return <div data-tid='discount-percentage-pill' />;
    },
}));

const mockFreeBoardUpgradePill = jest.fn();
jest.mock('frontend/components/common/Pills/FreeBoardUpgradePill/FreeBoardUpgradePill', () => ({
    __esModule: true,
    default: props => {
        mockFreeBoardUpgradePill(props);

        return <div data-tid='free-board-upgrade-pill' />;
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

jest.mock('frontend/components/cro/NoSelectedSeatsPopup/NoSelectedSeatsPopup', () => () => (
    <div data-tid='no-selected-seats-popup' />
));
jest.mock('frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill', () => () => (
    <div data-tid='free-for-kids-pill' />
));
jest.mock('frontend/components/common/Pills/HotelDiscountPill/HotelDiscountPill', () => () => (
    <div data-tid='hotel-discount-pill' />
));
jest.mock('frontend/components/renderings/SearchResults/components/HotelDeposit', () => () => (
    <div data-tid='hotel-deposit-pill' />
));
jest.mock(
    'frontend/components/renderings/PromocodeInput/components/MerchandisedBanner/MerchandisedBanner',
    () => () => <div data-tid='merchandised-banner' />,
);

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, ...props }) => {
        mockButtonProps(props);

        return (
            <button data-tid='button' onClick={onClick}>
                {children}
            </button>
        );
    },
}));

jest.mock('frontend/components/common/RichTextDictionary', () => ({
    __esModule: true,
    default: (props: any) => (
        <div data-tid='rich-text-dictionary' data-dictionary-key={props.dictionaryKey} className={props.className}>
            {props.dictionaryKey}
        </div>
    ),
}));

jest.mock('frontend/components/common/FlightPlusHotelDiscountPrice', () => ({
    __esModule: true,
    default: () => <div data-tid='flight-plus-hotel-discount' />,
}));

jest.mock('frontend/utils/touristTax.utils', () => ({
    ...jest.requireActual('frontend/utils/touristTax.utils'),
    getTouristTaxFieldsFromOffer: jest.fn(),
}));
const mockedGetTouristTaxFieldsFromOffer = getTouristTaxFieldsFromOffer as jest.Mock;

let mockProps;
let mockStores;
let mockOptimizely;

const createProps = (): IPriceSummaryProps => ({
    fields: createFieldsProps(),
    isPrintPreview: false,
    rendering: {
        componentName: 'PriceSummary',
        placeholders: mockPriceSummaryPlaceholders,
    } as IPriceSummaryRendering,
});

const createFieldsProps = (): IPriceSummaryFields => ({
    Title: mockSitecoreField('Price Summary'),
    FeesAndTaxesLabel: mockSitecoreField('FeesAndTaxesLabel'),
    AccommodationLabel: mockSitecoreField(''),
    BalanceLabel: mockSitecoreField(''),
    CommissionLabel: mockSitecoreField(''),
    DepositLabel: mockSitecoreField(''),
    PopupTitle: mockSitecoreField(''),
    TotalPriceLabel: mockSitecoreField(''),
    VATOnCommissionLabel: mockSitecoreField(''),
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isPricesHidden: false,
            isTradePortal: false,
            isTouristTaxEnabled: true,
        },
        bookingStore: {
            totalPrice: 100,
            totalPriceWithTouristTax: 100,
            merchandisedPromotion: {
                title: 'iberostar',
                displayOnExtrasPage: true,
            },
            selectedOffer: {
                extraLuggageInfo: {
                    items: [
                        {
                            routeId: '2',
                            passengerId: '1',
                            itemCode: 'GBAG',
                            itemCategoryCode: 'SEC',
                            quantity: 1,
                            price: 37,
                        },
                        {
                            routeId: '1',
                            passengerId: '1',
                            itemCode: 'GBAG',
                            itemCategoryCode: 'SEC',
                            quantity: 1,
                            price: 37,
                        },
                        {
                            routeId: '2',
                            passengerId: '2',
                            itemCode: 'BIKE',
                            itemCategoryCode: 'SEO',
                            quantity: 1,
                            price: 45,
                        },
                        {
                            routeId: '1',
                            passengerId: '2',
                            itemCode: 'BIKE',
                            itemCategoryCode: 'SEO',
                            quantity: 1,
                            price: 45,
                        },
                    ],
                },
                accom: { unit: [{ code: '01', isFreeForKids: true }], code: '12345' },
            },
            isPackageValid: true,
            packageInfo,
            totalAccomodationDiscount: 1,
            tradeAgentPriceBreakdown: [
                { code: 'Package Price', name: 'name1', amount: 'amount1', quantity: 1 },
                { code: 'Flight Tax', name: 'name3', amount: 'amount2', quantity: 2 },
            ],
            priceBreakdown: [
                {
                    name: 'name1',
                    amount: 10,
                    quantity: 1,
                    code: 'name1',
                },
                {
                    name: 'name2',
                    amount: -20,
                    quantity: 1,
                    code: 'name2',
                },
            ],
            extraPriceBreakdown: [
                {
                    name: 'Extra1',
                    amount: 15,
                    quantity: 1,
                    code: 'Extra1',
                },
                {
                    name: 'Extra2',
                    amount: -5,
                    quantity: 1,
                    code: 'Extra2',
                },
            ],
            isPriceVisible: true,
        },
        queryParamStore: {
            specialRequests: [{ code: 'R1', name: 'Request 1', displayName: 'Request 1' }],
        },
        seatMapStore: {
            haveOutboundSelectedSeats: false,
            haveInboundSelectedSeats: false,
            isEnabledToBookSeats: true,
        },
        routerStore: { redirectToGuestDetails: jest.fn() },
        trackingStore: {
            trackExtrasSpecialRequests: jest.fn(),
            trackEventWithParams: jest.fn(),
        },
    });

const packageInfo = {
    paymentInfo: {
        totalPrice: 100,
        pricePP: 50,
    },
    priceBreakdown: [
        {
            name: 'name1',
            amount: 10,
            quantity: 1,
        },
        {
            name: 'name2',
            amount: -20,
            quantity: 1,
        },
    ],
    extraPriceBreakdown: [
        {
            name: 'Extra1',
            amount: 15,
            quantity: 1,
        },
        {
            name: 'Extra2',
            amount: -5,
            quantity: 1,
        },
    ],
};

describe('<PriceSummary />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockOptimizely = undefined;
        mockedGetTouristTaxFieldsFromOffer.mockReturnValue(mockTouristTaxFields);
    });

    it('should render', () => {
        render(<PriceSummary {...mockProps} />);

        expect(screen.getByTestId('holiday-summary')).toBeInTheDocument();
        expect(screen.queryByTestId('fees-popup-link')).not.toBeInTheDocument();
        expect(screen.getByTestId('merchandised-banner')).toBeInTheDocument();
        expect(screen.getByTestId('holiday-summary-header')).toHaveClass('header withOutline');
    });

    it('should NOT render when isPackageValid is false', () => {
        mockStores.bookingStore.isPackageValid = false;

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('holiday-summary')).not.toBeInTheDocument();
        expect(screen.queryByTestId('total-price')).not.toBeInTheDocument();
    });

    it('should render fees-popup-link on trade portal', () => {
        mockStores.layoutStore.isTradePortal = true;

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('fees-popup-link')).toBeInTheDocument();
    });

    it('should NOT render when NO package', () => {
        mockProps.packageInfo = undefined;

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('fees-popup-link')).not.toBeInTheDocument();
    });

    it('should render correct number of price breakdown items', () => {
        mockStores.bookingStore.isPriceVisible = true;

        render(<PriceSummary {...mockProps} />);

        expect(screen.getAllByTestId(/^holiday-summary-content-/)).toHaveLength(
            mockStores.bookingStore.packageInfo.priceBreakdown.length,
        );
    });

    it('should NOT render Total Price when prices are hidden', () => {
        mockStores.layoutStore.isPricesHidden = true;
        mockStores.layoutStore.isTradePortal = true;

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('holiday-summary')).toBeInTheDocument();
        expect(screen.queryByTestId('total-price')).not.toBeInTheDocument();
    });

    it('should NOT render MerchandisedBanner when PromocodeInput fields undefined', () => {
        delete mockProps.rendering?.placeholders[PlaceholderNames.PromocodeInput]?.[0]?.fields;

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('merchandised-banner')).not.toBeInTheDocument();
        expect(screen.getByTestId('holiday-summary-header')).not.toHaveClass('withOutline');
    });

    it('should NOT render MerchandisedBanner when displayOnExtrasPage false', () => {
        mockStores.bookingStore.merchandisedPromotion.displayOnExtrasPage = false;

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('merchandised-banner')).not.toBeInTheDocument();
        expect(screen.getByTestId('holiday-summary-header')).not.toHaveClass('withOutline');
    });

    it('should render with No Price and Export button', () => {
        mockStores.layoutStore.isPricesHidden = true;
        mockStores.layoutStore.isTradePortal = true;
        mockProps.isPrintPreview = true;

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('holiday-summary')).toBeInTheDocument();
        expect(screen.queryByTestId('total-price')).not.toBeInTheDocument();
        expect(screen.queryByTestId('export-holiday-details')).not.toBeInTheDocument();
    });

    it('should NOT render Export button when isPrintPreview is true', () => {
        mockProps.isPrintPreview = true;
        mockProps.rendering.placeholders[PlaceholderNames.ExportHolidayDetails][0].fields.HideDownloadButton = {
            value: false,
        };

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('export-holiday-details')).not.toBeInTheDocument();
    });

    it('should NOT render Export button when HideDownloadButton from rendering is true', () => {
        mockProps.rendering.placeholders[PlaceholderNames.ExportHolidayDetails][0].fields.HideDownloadButton = {
            value: true,
        };

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('export-holiday-details')).not.toBeInTheDocument();
    });

    it('should render Export button when HideDownloadButton from rendering is false', async () => {
        mockProps.rendering.placeholders[PlaceholderNames.ExportHolidayDetails][0].fields.HideDownloadButton = {
            value: false,
        };

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('export-holiday-details')).toBeInTheDocument();
    });

    it('should render Export button with exportHolidayDetailsPlaceholder is not present', async () => {
        mockProps.rendering.placeholders[PlaceholderNames.ExportHolidayDetails] = undefined;

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('export-holiday-details')).toBeInTheDocument();
    });

    it('should renders with Price and Export button', () => {
        mockStores.bookingStore.isPriceVisible = true;
        mockProps.isPrintPreview = true;

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('holiday-summary')).toBeInTheDocument();
        expect(screen.queryByTestId('export-holiday-details')).not.toBeInTheDocument();
    });

    it('should render pills', () => {
        mockStores.bookingStore.selectedOffer.deposit = 60;
        (isFreeForKids as any).mockReturnValue(true);
        (getTotalDiscount as any).mockReturnValue(200);

        render(<PriceSummary {...mockProps} />);

        expect(screen.getByTestId('hotel-deposit-pill')).toBeInTheDocument();
        expect(screen.getByTestId('hotel-discount-pill')).toBeInTheDocument();
        expect(screen.getByTestId('free-for-kids-pill')).toBeInTheDocument();
    });

    it('should NOT render pills', () => {
        mockStores.bookingStore.selectedOffer.deposit = 0;
        (isFreeForKids as any).mockReturnValue(false);
        (getTotalDiscount as any).mockReturnValue(0);

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('hotel-deposit-pill')).not.toBeInTheDocument();
        expect(screen.queryByTestId('hotel-discount-pill')).not.toBeInTheDocument();
        expect(screen.queryByTestId('free-for-kids-pill')).not.toBeInTheDocument();
    });

    it('should NOT render NoSelectedPopup when AB Experiment not exist', () => {
        mockOptimizely = undefined;

        render(<PriceSummary {...mockProps} />);

        expect(screen.queryByTestId('no-selected-seats-popup')).not.toBeInTheDocument();
    });

    it('should sort and render price breakdown items with negative amounts at the end', async () => {
        render(<PriceSummary {...mockProps} />);

        const breakdownItems = screen.getAllByTestId(/^holiday-summary-content-/);

        expect(breakdownItems[breakdownItems.length - 1]).toHaveTextContent('-5');
    });

    it('should use priceBreakdown when extraPriceBreakdown is empty', () => {
        mockStores.bookingStore.packageInfo.extraPriceBreakdown = undefined;

        render(<PriceSummary {...mockProps} />);

        const breakdownItems = screen.getAllByTestId(/^holiday-summary-content-/);
        expect(breakdownItems).toHaveLength(2);
        expect(breakdownItems[0]).toHaveTextContent('name1 - 10');
        expect(breakdownItems[1]).toHaveTextContent('name2 - -20');
    });

    it('should render price breakdown with freeForKids', () => {
        (isFreeForKids as any).mockReturnValue(true);

        mockStores.bookingStore.packageInfo.priceBreakdown.push({
            name: 'Kids',
            code: 'Kids',
            amount: 0,
        });

        render(<PriceSummary {...mockProps} />);

        expect(screen.getByTestId('free-for-kids-pill')).toBeInTheDocument();
    });

    describe('FreeBoardUpgradePill', () => {
        it('should render FreeBoardUpgradePill with isFreeBoardUpgrade set to true when isFreeBoardUpgrade is true', () => {
            mockStores.bookingStore.selectedOffer.accom.unit[0] = { isFreeBoardUpgrade: true };

            render(<PriceSummary {...mockProps} />);

            expect(mockFreeBoardUpgradePill).toHaveBeenCalledWith({
                isFreeBoardUpgrade: true,
                pillSize: PillSizeVariants.Regular,
            });
        });

        it('should render FreeBoardUpgradePill with isFreeBoardUpgrade set to false when isFreeBoardUpgrade is false', async () => {
            mockStores.bookingStore.selectedOffer.accom.unit[0] = { isFreeBoardUpgrade: false };

            render(<PriceSummary {...mockProps} />);

            expect(mockFreeBoardUpgradePill).toHaveBeenCalledWith({
                isFreeBoardUpgrade: false,
                pillSize: PillSizeVariants.Regular,
            });
        });
    });

    describe('DiscountPercentagePill', () => {
        it('should render DiscountPercentagePill', () => {
            mockStores.bookingStore.selectedOffer.discountPercentage = 10;

            render(<PriceSummary {...mockProps} />);

            expect(screen.getByTestId('discount-percentage-pill')).toBeInTheDocument();
            expect(mockDiscountPercentagePill).toHaveBeenCalledWith({
                discountPercentage: 10,
                icon: expect.any(Object),
                pillSize: PillSizeVariants.Regular,
            });
        });
    });

    describe('<TouristTaxPriceTooltip />', () => {
        it('should render when tourist tax data is provided', () => {
            render(<PriceSummary {...mockProps} />);

            const localTaxElement = screen.getByTestId('price-summary-local-tax');
            const tooltip = screen.getByTestId('tourist-tax-price-tooltip');

            expect(getTouristTaxFieldsFromOffer).toHaveBeenCalledWith(mockStores.bookingStore.selectedOffer);
            expect(localTaxElement).toHaveClass('category', 'localTax');
            expect(localTaxElement).toContainElement(tooltip);
            expect(mockTouristTaxPriceTooltipComponent).toHaveBeenCalledWith({
                touristTax: mockTouristTaxFields.touristTax,
                taxesAndFees: mockTouristTaxFields.taxesAndFees,
            });
        });

        it('should NOT render when isPrintPreview is true', () => {
            mockProps.isPrintPreview = true;

            render(<PriceSummary {...mockProps} />);

            expect(screen.queryByTestId('tourist-tax-price-tooltip')).not.toBeInTheDocument();
        });

        it('should NOT render when tourist-tax is -1', () => {
            mockedGetTouristTaxFieldsFromOffer.mockReturnValue(mockTouristTaxErrorFields);

            const { container } = render(<PriceSummary {...mockProps} />);

            expect(container.querySelector('.touristTax')).toBeNull();
            expect(screen.queryByTestId('tourist-tax-price-tooltip')).toBeNull();
        });

        it('should NOT render when isTouristTaxEnabled is false', () => {
            mockStores.layoutStore.isTouristTaxEnabled = false;

            const { container } = render(<PriceSummary {...mockProps} />);

            expect(container.querySelector('.touristTax')).toBeNull();
            expect(screen.queryByTestId('tourist-tax-price-tooltip')).toBeNull();
        });
    });

    describe('isHolidayPackageCostHighlighted', () => {
        beforeEach(() => {
            mockStores.layoutStore.isTouristTaxEnabled = true;
            mockStores.bookingStore.totalPrice = 1200;
            mockedGetTouristTaxFieldsFromOffer.mockReturnValue(mockTouristTaxFields);
        });

        it('should apply packageCostHighlightedWrapper class when experiment is variantB', () => {
            mockUseExperiment.mockReturnValue({
                testId: ExperimentTestIds.SummaryBarTotalCostHighlight,
                testVariant: ExperimentVariants.VariantB,
            });

            const { container } = render(<PriceSummary {...mockProps} />);

            const wrapperElement = container.querySelector('.holiday-summary_content');
            expect(wrapperElement).toHaveClass('packageCostHighlightedWrapper');
        });

        it('should NOT apply packageCostHighlightedWrapper class when experiment is NOT variantB', () => {
            mockUseExperiment.mockReturnValue({
                testId: ExperimentTestIds.SummaryBarTotalCostHighlight,
                testVariant: ExperimentVariants.OriginalVariant,
            });

            const { container } = render(<PriceSummary {...mockProps} />);

            const wrapperElement = container.querySelector('.holiday-summary_content');
            expect(wrapperElement).not.toHaveClass('packageCostHighlightedWrapper');
        });

        it('should apply semantic classes to price sections', () => {
            render(<PriceSummary {...mockProps} />);

            const packageCostSection = screen.getByTestId('price-summary-package-cost');
            const localTaxSection = screen.getByTestId('price-summary-local-tax');
            const totalPriceSection = screen.getByTestId('price-summary-total-price');

            expect(packageCostSection).toHaveClass('packageCost');
            expect(localTaxSection).toHaveClass('localTax');
            expect(totalPriceSection).toHaveClass('total');
        });
    });

    describe('Flight Plus Hotel Package', () => {
        beforeEach(() => {
            mockStores.bookingStore.isFlightAndHotelPackage = true;
            mockStores.bookingStore.flightPlusHotelDiscount = 100;
        });

        it('should render price-summary-input-column with fphInputColumn class', () => {
            render(<PriceSummary {...mockProps} />);

            expect(screen.getByTestId('price-summary-input-column')).toHaveClass('fphInputColumn');
        });

        it('should render FlightPlusHotelDiscountPrice component', () => {
            render(<PriceSummary {...mockProps} />);

            expect(screen.getByTestId('flight-plus-hotel-discount')).toBeInTheDocument();
        });

        it('should NOT render price per person', () => {
            render(<PriceSummary {...mockProps} />);

            expect(screen.queryByTestId('price-pp')).not.toBeInTheDocument();
        });

        it('should render correct fph content when isFph is true', () => {
            render(<PriceSummary {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.FlightPlusHotelPricesPackageCost)).toBeInTheDocument();
            expect(screen.getByTestId('price-summary-package-cost')).toHaveClass('fphPackageCost');
            expect(screen.getByTestId('holiday-summary')).toHaveClass('fphSummary');
        });

        it('should render TouristTaxLabelsHolidayPackageCost dictionary key when isFph is false', () => {
            mockStores.bookingStore.isFlightAndHotelPackage = false;

            render(<PriceSummary {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.TouristTaxLabelsHolidayPackageCost)).toBeInTheDocument();
        });
    });
});

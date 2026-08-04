import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import {
    mockTouristTaxEmptyFields,
    mockTouristTaxErrorFields,
    mockTouristTaxFields,
} from 'frontend/__mocks__/touristTax';
import { getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { ExperimentTestIds, ExperimentVariants } from 'models/enum/cro/Experiment';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import useExperiment from 'frontend/components/cro/Experiment/hooks/useExperiment';
import { mockSummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/mocks';
import { ISummaryBarSitecoreFields } from 'frontend/components/renderings/SummaryBar/SummaryBar.interfaces';

import SummaryPriceDetails from './SummaryPriceDetails';

jest.mock('frontend/components/cro/Experiment/hooks/useExperiment');
const mockUseExperiment = useExperiment as jest.MockedFn<typeof useExperiment>;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/touristTax.utils', () => ({
    ...jest.requireActual('frontend/utils/touristTax.utils'),
    getTouristTaxFieldsFromOffer: jest.fn(),
    getTouristTaxPrice: jest.fn(value => value),
}));
const mockedGetTouristTaxFieldsFromOffer = getTouristTaxFieldsFromOffer as jest.Mock;

const mockTouristTaxPriceTooltipComponent = jest.fn();
jest.mock('frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip', () => ({
    __esModule: true,
    TouristTaxPriceTooltip: ({ children, ...props }) => {
        mockTouristTaxPriceTooltipComponent(props);

        return <div data-tid='tourist-tax-price-tooltip'>{children}</div>;
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

const createProps = (): ISummaryBarSitecoreFields => ({
    ...mockSummaryBarSitecoreFields,
});

const createPackageInfo = () => ({
    extraPriceBreakdown: [
        { name: 'Promo code discount', amount: -50 },
        { name: 'Extras', amount: 200 },
        { name: 'Free for kids', amount: 0 },
        { name: 'Holiday', amount: 1000 },
    ],
    priceBreakdown: [{ name: 'Holiday', amount: 1050 }],
    paymentInfo: {
        currency: 'GBP',
    },
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            packageInfo: createPackageInfo(),
            promoCode: { value: 'PROMO' },
            selectedOffer: { ...mockedOffer },
            totalPriceWithTouristTax: 1150,
            totalPrice: 1050,
        },
        layoutStore: {
            isTouristTaxEnabled: true,
        },
    });

let mockProps;
let mockStores;

describe('<SummaryPriceDetails />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockedGetTouristTaxFieldsFromOffer.mockReturnValue(mockTouristTaxFields);
    });

    it('should render all extras price breakdown items sorted by amount', () => {
        mockedGetTouristTaxFieldsFromOffer.mockReturnValue(mockTouristTaxEmptyFields);

        render(<SummaryPriceDetails {...mockProps} />);

        const labels = screen.getAllByTestId('price-details-holiday-label').map(e => e.textContent);
        expect(labels).toEqual(['Holiday', 'Extras', 'Free for kids', 'Promo code discount']);

        const values = screen.getAllByTestId('price-details-holiday-value').map(e => e.textContent);
        expect(values).toEqual(['£1000', '£200', 'CommonFieldsItemIncluded', '£-50']);

        expect(screen.getByText(SitecoreDictionary.TouristTaxLabelsTaxNotApplicable)).toBeInTheDocument();
        expect(screen.getByTestId('tourist-tax-price-tooltip')).toHaveTextContent(
            `£${mockTouristTaxEmptyFields.touristTax}`,
        );
    });

    it('should render all price breakdown items sorted by amount if extras price breakdown is not available', () => {
        mockStores.bookingStore.packageInfo.extraPriceBreakdown = undefined;
        mockedGetTouristTaxFieldsFromOffer.mockReturnValue(mockTouristTaxEmptyFields);

        render(<SummaryPriceDetails {...mockProps} />);

        const packageCostSection = screen.getByTestId('summary-package-cost');
        expect(packageCostSection).toBeInTheDocument();
        expect(packageCostSection).toHaveTextContent('£1050');

        expect(screen.getByText(SitecoreDictionary.TouristTaxLabelsTaxNotApplicable)).toBeInTheDocument();
    });

    it('should render total price and taxes', () => {
        render(<SummaryPriceDetails {...mockProps} />);

        expect(screen.getByTestId('price-details-total-label')).toHaveTextContent('Total');
        expect(screen.getByTestId('price-details-total-value')).toHaveTextContent('£1150');
        expect(screen.getByText(SitecoreDictionary.TouristTaxLabelsLocalTaxes)).toBeInTheDocument();
        expect(screen.getByTestId('tourist-tax-price-tooltip')).toHaveTextContent(
            `£${mockTouristTaxFields.touristTax}`,
        );
    });

    it('should NOT render if packageInfo is missing', () => {
        mockStores.bookingStore.packageInfo = null;

        render(<SummaryPriceDetails {...mockProps} />);

        expect(screen.queryByTestId('summary-bar-price-details')).not.toBeInTheDocument();
    });

    describe('<TouristTaxPriceTooltip />', () => {
        it('should render tourist tax tooltip trigger', () => {
            render(<SummaryPriceDetails {...createProps()} />);

            expect(getTouristTaxFieldsFromOffer).toHaveBeenCalledWith(mockStores.bookingStore.selectedOffer);
            expect(screen.getByTestId('tourist-tax-price-tooltip')).toBeInTheDocument();
            expect(mockTouristTaxPriceTooltipComponent).toHaveBeenCalledWith({
                touristTax: mockTouristTaxFields.touristTax,
                taxesAndFees: mockTouristTaxFields.taxesAndFees,
            });
        });

        it('should NOT render when tourist-tax is -1', () => {
            mockedGetTouristTaxFieldsFromOffer.mockReturnValue(mockTouristTaxErrorFields);

            render(<SummaryPriceDetails {...mockProps} />);

            expect(screen.queryByTestId('tourist-tax-price-tooltip')).toBeNull();
        });

        it('should NOT render when isTouristTaxEnabled is false', () => {
            mockStores.layoutStore.isTouristTaxEnabled = false;

            render(<SummaryPriceDetails {...mockProps} />);

            expect(screen.queryByTestId('tourist-tax-price-tooltip')).toBeNull();
        });
    });

    describe('isHolidayPackageCostHighlighted', () => {
        beforeEach(() => {
            mockStores.layoutStore.isTouristTaxEnabled = true;
            mockStores.bookingStore.totalPrice = 1050;
            mockedGetTouristTaxFieldsFromOffer.mockReturnValue(mockTouristTaxFields);
        });

        it('should apply packageCostHighlightedWrapper class when experiment is variantB', () => {
            mockUseExperiment.mockReturnValue({
                testId: ExperimentTestIds.SummaryBarTotalCostHighlight,
                testVariant: ExperimentVariants.VariantB,
            });

            render(<SummaryPriceDetails {...mockProps} />);

            const wrapperElement = screen.getByTestId('summary-bar-price-details');
            expect(wrapperElement).toHaveClass('packageCostHighlightedWrapper');
        });

        it('should NOT apply packageCostHighlightedWrapper class when experiment is NOT variantB', () => {
            mockUseExperiment.mockReturnValue(null);

            render(<SummaryPriceDetails {...mockProps} />);

            const wrapperElement = screen.getByTestId('summary-bar-price-details');
            expect(wrapperElement).not.toHaveClass('packageCostHighlightedWrapper');
        });

        it('should apply semantic classes to price sections', () => {
            render(<SummaryPriceDetails {...mockProps} />);

            const packageCostSection = screen.getByTestId('summary-package-cost');
            const totalPriceSection = screen.getByTestId('summary-total-price');

            expect(packageCostSection).toHaveClass('packageCost');
            expect(totalPriceSection).toHaveClass('total');
        });
    });

    describe('Flight Plus Hotel Package', () => {
        it('should render FlightPlusHotelDiscountPrice component', () => {
            mockStores.bookingStore.isFlightAndHotelPackage = true;
            mockStores.bookingStore.flightPlusHotelDiscount = 100;

            render(<SummaryPriceDetails {...mockProps} />);

            expect(screen.getByTestId('flight-plus-hotel-discount')).toBeInTheDocument();
        });

        it('should render fph content key when isFph is true', () => {
            mockStores.bookingStore.isFlightAndHotelPackage = true;
            mockStores.bookingStore.flightPlusHotelDiscount = 100;

            render(<SummaryPriceDetails {...mockProps} />);

            expect(screen.getByTestId('summary-package-cost')).toHaveClass('fphPackageCost');
            expect(screen.getByText(SitecoreDictionary.FlightPlusHotelPricesPackageCost)).toBeInTheDocument();
        });

        it('should render TouristTaxLabelsHolidayPackageCost dictionary key when isFph is false', () => {
            mockStores.bookingStore.isFlightAndHotelPackage = false;

            render(<SummaryPriceDetails {...mockProps} />);

            expect(screen.getByText(SitecoreDictionary.TouristTaxLabelsHolidayPackageCost)).toBeInTheDocument();
        });
    });
});

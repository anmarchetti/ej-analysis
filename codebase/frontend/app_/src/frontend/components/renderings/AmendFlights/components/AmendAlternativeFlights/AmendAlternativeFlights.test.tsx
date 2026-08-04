import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { CurrencyCode } from 'code/currency';
import { createMockStores, mockValidatedFlights } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IAmendFlightsFields } from 'models/data/IAmendFlights';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { DataStatus } from 'models/enum/DataStatus';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendAlternativeFlights, { IAmendAlternativeFlightsProps } from './AmendAlternativeFlights';

expect.extend(toHaveNoViolations);

export const mockAmendFlightsFields: IAmendFlightsFields = {
    DowngradePromoText: mockSitecoreField('ErrorPromoText'),
    ErrorPromoText: mockSitecoreField('ErrorPromoText'),
    NotValidPromoText: mockSitecoreField('NotValidPromoText'),
    UpgradePromoText: mockSitecoreField('UpgradePromoText'),
    AlternativeFlightsTitle: mockSitecoreField('AlternativeFlightsTitle'),
    FeePriceLabel: mockSitecoreField('FeePriceLabel {amount}'),
    FiltersOrder: [
        {
            fields: {
                Code: mockSitecoreField(FilterGroupCodes.Flights),
                Name: mockSitecoreField('Flight Name'),
            },
            id: 'filter_id',
        },
    ],
    IsShowPreFilteredMessage: mockSitecoreField(true),
    NoFlightsAvailableText: mockSitecoreField('NoFlightsAvailableText'),
    NoFlightsAvailableTitle: mockSitecoreField('NoFlightsAvailableTitle'),
    PopupCancelCTA: mockSitecoreField('PopupCancelCTA'),
    PopupText: mockSitecoreField('PopupText'),
    PopupTitle: mockSitecoreField('PopupTitle'),
    PriceTooltipPromoSeatsText: mockSitecoreField('PriceTooltipPromoSeatsText'),
    PriceTooltipText: mockSitecoreField('PriceTooltipText'),
    SignpostIcon: mockSitecoreField(mockSitecoreImageField('SignpostIcon')),
    SignpostText: mockSitecoreField('SignpostText'),
    SignpostTitle: mockSitecoreField('SignpostTitle'),
    SortDefault: {
        fields: {
            Code: mockSitecoreField(AlternativeFlightsSortBy.PriceHightToLow),
            Title: mockSitecoreField('Price High To Low Sort'),
        },
        id: 'filter_default_id',
    },
    SortOrder: [
        {
            fields: {
                Code: mockSitecoreField(AlternativeFlightsSortBy.PriceHightToLow),
                Title: mockSitecoreField('Price High To Low Sort'),
            },
            id: 'sort_id',
        },
        {
            fields: {
                Code: mockSitecoreField(AlternativeFlightsSortBy.PriceLowToHigh),
                Title: mockSitecoreField('Price Low To High Sort'),
            },
            id: 'sort_id',
        },
    ],
    TimeFilters: [
        {
            fields: {
                Code: mockSitecoreField('TimeFilter_code'),
                EndTime: mockSitecoreField('2025-11-10'),
                Name: mockSitecoreField('TimeFilter_name'),
                StartTime: mockSitecoreField('2022-11-10'),
            },
            id: 'TimeFilters_id',
        },
    ],
    Title: mockSitecoreField('Title'),
};

let mockProps: IAmendAlternativeFlightsProps;
let mockStores;

const mockFlightFilterProps = jest.fn();
jest.mock('frontend/components/renderings/AmendFlights/components/AmendFlightsFilters/AmendFlightsFilters', () => ({
    __esModule: true,
    default: props => {
        mockFlightFilterProps(props);

        return <div data-tid='flight-filter' />;
    },
}));

const mockFlightCardProps = jest.fn();
jest.mock('frontend/components/renderings/AmendFlights/components/AmendFlightCard/AmendFlightCard', () => ({
    __esModule: true,
    default: ({ priceTooltipText, onClickSelect, ...props }) => {
        mockFlightCardProps(props);

        return (
            <div data-tid='flight-card' onClick={onClickSelect}>
                {priceTooltipText}
            </div>
        );
    },
}));

const mockFlightShimmerProps = jest.fn();
jest.mock('frontend/components/renderings/AlternativeFlights/components/FlightShimmer', () => ({
    __esModule: true,
    FlightShimmer: props => {
        mockFlightShimmerProps(props);

        return <div data-tid='flight-shimmer' />;
    },
}));

jest.mock('frontend/components/icons-new/WarningFilled', () => ({
    __esModule: true,
    default: () => <div data-tid='warning-field' />,
}));

jest.mock('frontend/components/icons-new/ChevronDown', () => ({
    __esModule: true,
    default: () => <div data-tid='chevron' />,
}));

jest.mock('frontend/components/icons/InfoCircle', () => ({
    __esModule: true,
    default: () => <div data-tid='info-circle' />,
}));

const mockErrorMessageProps = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: props => {
        mockErrorMessageProps(props);

        return <div data-tid='error-message' />;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, dataTid, ...props }) => {
        mockButtonProps(props);

        return <div data-tid={dataTid} onClick={onClick} />;
    },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: ({ name }) => <div data-tid={`placeholder-${name}`} />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AmendAlternativeFlights />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            amendFlightsStore: {
                isPreFilteredMessageShown: true,
            },
        });
        mockProps = {
            currency: CurrencyCode.GBP,
            flights: mockValidatedFlights.transports,
            isFlightSelected: jest.fn(() => false),
            onChangeFlight: jest.fn(),
            onLoadMoreClick: jest.fn(),
            status: DataStatus.Loaded,
            title: 'title',
            totalFlights: 10,
            fields: mockAmendFlightsFields,
            priceTooltipText: <div>priceTooltipText</div>,
        };
    });

    it('Should render component', () => {
        render(<AmendAlternativeFlights {...mockProps} />);

        expect(screen.getByTestId('alternative-flights')).toHaveClass('container amend-flights__alt-flights');
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByTestId('flight-filter')).toBeInTheDocument();
        expect(screen.getByTestId('show-more')).toBeInTheDocument();
        expect(mockFlightFilterProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isShowPrefilteredMessage: true,
            }),
        );
        expect(screen.getByTestId('alternative-flights-total')).toHaveTextContent(
            SitecoreDictionary.AlternativeFlightsLabelsTotalFlightsPlural,
        );
    });

    it('Should render loading shimmer when status is loading', () => {
        mockProps.status = DataStatus.Loading;
        render(<AmendAlternativeFlights {...mockProps} />);

        expect(screen.getByTestId('shimmer')).toBeInTheDocument();
        expect(screen.getAllByTestId('flight-shimmer')).toHaveLength(2);
    });

    it("Should NOT render title if it hasn't been provided", () => {
        mockProps.title = undefined;

        render(<AmendAlternativeFlights {...mockProps} />);

        expect(screen.queryByText('title')).not.toBeInTheDocument();
    });

    it('Should NOT render total flight label when it is 0', () => {
        mockProps.totalFlights = 0;

        render(<AmendAlternativeFlights {...mockProps} />);

        expect(screen.queryByTestId('alternative-flights-total')).not.toBeInTheDocument();
    });

    it('Should render total flights label in single form when flight is only one', () => {
        mockProps.totalFlights = 1;

        render(<AmendAlternativeFlights {...mockProps} />);

        expect(screen.getByTestId('alternative-flights-total')).toHaveTextContent(
            SitecoreDictionary.AlternativeFlightsLabelsTotalFlightsSingular,
        );
    });

    it('Should NOT render load-more-flight button when count of rendered flight equals total flights', () => {
        mockProps.totalFlights = 4;

        render(<AmendAlternativeFlights {...mockProps} />);

        expect(screen.queryByTestId('show-more')).not.toBeInTheDocument();
    });

    describe('No flights', () => {
        it('Should render no-flights-block when count of flights is 0', () => {
            mockProps.flights = [];

            render(<AmendAlternativeFlights {...mockProps} />);

            expect(screen.getByTestId('amend-flights-no-flights')).toBeInTheDocument();
            expect(screen.getByTestId('amend-flights-no-flights-icon')).toBeInTheDocument();
            expect(screen.getByTestId('info-circle')).toBeInTheDocument();
            expect(screen.getByTestId('amend-flights-no-flights-title')).toHaveTextContent('NoFlightsAvailableTitle');
            expect(screen.getByTestId('amend-flights-no-flights-text')).toHaveTextContent('NoFlightsAvailableText');
        });

        it('Should NOT render no-flights-title as an empty string when noFlightsTitle has not been provided', () => {
            mockProps.flights = [];
            mockProps.fields!.NoFlightsAvailableTitle.value = '';

            render(<AmendAlternativeFlights {...mockProps} />);

            expect(screen.queryByTestId('amend-flights-no-flights-title')).not.toBeInTheDocument();
        });
    });

    it('Should render error message when status isError', () => {
        mockProps.status = DataStatus.Error;

        render(<AmendAlternativeFlights {...mockProps} />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(mockErrorMessageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'AmendFlights.Errors.GenericMessage',
                errorMessageClass: 'row',
            }),
        );
    });

    it('Should call onLoadMoreClick when click on show-more button', async () => {
        render(<AmendAlternativeFlights {...mockProps} />);

        const showMoreButton = screen.getByTestId('show-more');

        await userEvent.click(showMoreButton);

        expect(mockProps.onLoadMoreClick).toHaveBeenCalled();
    });

    it('Should render alternativeFlightsTotal before change fee info', () => {
        mockStores.amendFlightsStore.isFromBooking = true;
        render(<AmendAlternativeFlights {...mockProps} />);

        const alternativeFlightsTotal = screen.getByTestId('alternative-flights-total');
        const placeholder = screen.getByTestId('placeholder-change-fee-info');

        expect(alternativeFlightsTotal.compareDocumentPosition(placeholder)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('Should NOT render change fee info when isFromBooking is false', () => {
        mockStores.amendFlightsStore.isFromBooking = false;
        render(<AmendAlternativeFlights {...mockProps} />);

        expect(screen.queryByTestId('placeholder-change-fee-info')).not.toBeInTheDocument();
    });

    describe('Flight cards', () => {
        it('Should render all flight cards', () => {
            render(<AmendAlternativeFlights {...mockProps} />);

            expect(screen.getAllByTestId('flight-card')).toHaveLength(4);
            expect(screen.getAllByTestId('flight-card')[0]).toHaveTextContent('priceTooltipText');
            expect(mockFlightCardProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    routes: mockProps.flights[0].routes,
                    priceDifference: 226,
                    isSelected: false,
                    errataFlightInfo: [
                        'Errata for Kacper',
                        '<span>We will <strong>remove</strong> the <em>refund</em> amount from your <u>holiday</u> balance Please confirm your changes. <span>We will remove the refund amount from your holiday balance Please confirm your changes.</span></span>',
                        'NotValidPromoText',
                    ],
                    notAvailable: undefined,
                    currency: 'GBP',
                }),
            );
            expect(mockFlightCardProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    routes: mockProps.flights[1].routes,
                    priceDifference: 234,
                    isSelected: false,
                    errataFlightInfo: [
                        'Errata for Kacper',
                        '<span>We will <strong>remove</strong> the <em>refund</em> amount from your <u>holiday</u> balance Please confirm your changes. <span>We will remove the refund amount from your holiday balance Please confirm your changes.</span></span>',
                    ],
                    notAvailable: undefined,
                    currency: 'GBP',
                }),
            );
            expect(mockFlightCardProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    routes: mockProps.flights[2].routes,
                    priceDifference: 226,
                    isSelected: false,
                    errataFlightInfo: [
                        'Errata for Kacper',
                        '<span>We will <strong>remove</strong> the <em>refund</em> amount from your <u>holiday</u> balance Please confirm your changes. <span>We will remove the refund amount from your holiday balance Please confirm your changes.</span></span>',
                    ],
                    notAvailable: undefined,
                    currency: 'GBP',
                }),
            );
            expect(mockFlightCardProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    routes: mockProps.flights[3].routes,
                    priceDifference: 226,
                    isSelected: false,
                    errataFlightInfo: [
                        'Errata for Kacper',
                        '<span>We will <strong>remove</strong> the <em>refund</em> amount from your <u>holiday</u> balance Please confirm your changes. <span>We will remove the refund amount from your holiday balance Please confirm your changes.</span></span>',
                    ],
                    notAvailable: undefined,
                    currency: 'GBP',
                }),
            );
        });

        it('Should NOT render flight cards when not isLoadingMoreStatus and not isLoadedStatus', () => {
            mockProps.status = DataStatus.NotLoaded;

            render(<AmendAlternativeFlights {...mockProps} />);

            expect(screen.queryByTestId('flight-card')).not.toBeInTheDocument();
        });

        it('Should render flight cards when isErrorStatus and flight more then 0', () => {
            mockProps.status = DataStatus.Error;

            render(<AmendAlternativeFlights {...mockProps} />);

            expect(screen.getAllByTestId('flight-card')).toHaveLength(4);
        });

        it('Should call onChangeFlight when click on card', async () => {
            render(<AmendAlternativeFlights {...mockProps} />);

            const card = screen.getAllByTestId('flight-card')[0];
            await userEvent.click(card);

            expect(mockProps.onChangeFlight).toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendAlternativeFlights {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});

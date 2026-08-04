import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { altOffer } from 'frontend/__mocks__/altOffer';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { AlternativeFlightsList, IAlternativeFlightsListProps } from './AlternativeFlightsList';

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

jest.mock('./AlternativeFlightsFilters', () => ({
    __esModule: true,
    default: () => <div data-tid='alternative-flights-filters' />,
}));

jest.mock('./FlightCard', () => ({
    __esModule: true,
    default: () => <div data-tid='flight-card' />,
}));

const mockShowMoreButtonPropsCall = jest.fn();
jest.mock('frontend/components/common/ShowMoreButton', () => props => {
    mockShowMoreButtonPropsCall(props);

    return <div data-tid={props.dataTid} />;
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const resetMocks = (): IAlternativeFlightsListProps => ({
    seatsReservationNotification: null,
    totalFlights: 0,
    altRoutes: [altOffer],
    isShowMoreVisible: true,
    isShowLessVisible: false,
    isFlightSelected: jest.fn(),
    onClickShowMore: jest.fn(),
    onClickShowLess: jest.fn(),
    onClickSelect: jest.fn(),
    showMoreRef: {
        current: {
            align: '',
        } as HTMLDivElement,
    },
    nextFlightRef: {
        current: {
            align: '',
        } as HTMLDivElement,
    },
    nextFlightIndex: 0,
    offer: mockedOffer,
});

const resetStores = () =>
    createMockStores({
        bookingStore: { isLoadingOffer: false },
        alternativeFlightsStore: { hasSelectedFilters: false },
    });

let mockProps;
let mockStores;

describe('<AlternativeFlightsList />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = resetStores();
    });

    it('should be empty render if no routes and filters', () => {
        mockProps.altRoutes = [];
        const { container } = render(<AlternativeFlightsList {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render with filters, FlightCard, ShowMore button', () => {
        render(<AlternativeFlightsList {...mockProps} />);

        expect(screen.getByTestId('alternative-flights-filters')).toBeInTheDocument();
        expect(screen.getByTestId('flight-card')).toBeInTheDocument();
        expect(screen.getByTestId('show-more-button')).toBeInTheDocument();
        expect(mockShowMoreButtonPropsCall).toBeCalledWith(
            expect.objectContaining({
                onClick: mockProps.onClickShowMore,
                dataTid: 'show-more-button',
                title: SitecoreDictionary.AlternativeFlightsButtonsShowMore,
            }),
        );
    });

    it('should render less button when isShowMoreVisible is false and isShowLessVisible is true', () => {
        mockProps.nextFlightIndex = 1;
        mockProps.isShowMoreVisible = false;
        mockProps.isShowLessVisible = true;

        render(<AlternativeFlightsList {...mockProps} />);

        expect(screen.getByTestId('show-less-button')).toBeInTheDocument();
        expect(mockShowMoreButtonPropsCall).toBeCalledWith(
            expect.objectContaining({
                onClick: mockProps.onClickShowLess,
                dataTid: 'show-less-button',
                title: SitecoreDictionary.AlternativeFlightsButtonsShowLess,
            }),
        );
    });

    describe('countOfFlightsLabel', () => {
        it('should render singular countOfFlightsLabel when there is one available flight', () => {
            mockProps.totalFlights = 1;
            render(<AlternativeFlightsList {...mockProps} />);

            expect(
                screen.getByText(
                    `${SitecoreDictionary.AlternativeFlightsLabelsTotalFlightsSingular} ${mockProps.totalFlights}`,
                ),
            ).toBeInTheDocument();
        });

        it('should render plural countOfFlightsLabel when there is few available flight', () => {
            mockProps.totalFlights = 11;
            render(<AlternativeFlightsList {...mockProps} />);

            expect(
                screen.getByText(
                    `${SitecoreDictionary.AlternativeFlightsLabelsTotalFlightsPlural} ${mockProps.totalFlights}`,
                ),
            ).toBeInTheDocument();
        });
    });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { DataStatus } from 'models/enum/DataStatus';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import AmendAlternativeFlights from 'frontend/components/renderings/AmendFlights/components/AmendAlternativeFlights/AmendAlternativeFlights';

jest.mock('frontend/utils/tokenizer', () => ({
    Tokenizer: {
        replaceToken: mockReplaceToken,
    },
}));

expect.extend(toHaveNoViolations);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('../components/AmendFlightsFilters/AmendFlightsFilters', () => () => <div data-tid='filters' />);

jest.mock('frontend/components/renderings/AlternativeFlights/components/FlightShimmer', () => ({
    ...jest.requireActual('frontend/components/renderings/AlternativeFlights/components/FlightShimmer'),
    FlightShimmer: jest.fn(() => <div data-tid='shimmer' />),
}));

jest.mock('../components/AmendFlightCard/AmendFlightCard', () => () => (
    <div data-tid='card' key={mockProps.flights[0]} />
));

jest.mock('frontend/components/common/Button', () => ({ onClick }) => (
    <div data-tid='show-more-button' onClick={onClick} />
));

jest.mock('frontend/components/common/ErrorMessage', () => () => <div data-tid='error-message' />);

const createProps = () => ({
    flights: [{ routes: [{ id: '1' }, { id: '2' }], amendmentCharges: 1 }],
    status: DataStatus.Loaded,
    totalFlights: 0,
    title: 'title',
    fields: {
        NoFlightsAvailableTitle: mockSitecoreField('{number} flights available'),
        NoFlightsAvailableText: mockSitecoreField('Sorry, try again'),
    },

    isFlightSelected: jest.fn(() => true),
    onChangeFlight: jest.fn(),
    onLoadMoreClick: jest.fn(),
});

const createStores = () =>
    createMockStores({
        amendFlightsStore: {
            isPreFilteredMessageShown: true,
        },
    });

let mockProps;
let mockStores;

describe('<AmendAlternativeFlights />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render title if no title', () => {
        mockProps.title = '';
        const { queryByRole } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render title', () => {
        const { getByRole } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(getByRole('heading')).toHaveTextContent('title');
    });

    it('should NOT render shimmers if NOT loading', () => {
        const { queryAllByTestId } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(queryAllByTestId('shimmer').length).toBe(0);
    });

    it('should render 3 shimmers if loading', () => {
        mockProps.status = DataStatus.Loading;
        const { getAllByTestId } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(getAllByTestId('shimmer').length).toBe(3);
    });

    it('should NOT render AmendFlightCards if 0 flights', () => {
        mockProps.flights = [];
        const { queryAllByTestId } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(queryAllByTestId('card').length).toBe(0);
    });

    it('should NOT render AmendFlightCards if status is NotLoaded', () => {
        mockProps.status = DataStatus.NotLoaded;
        const { queryAllByTestId } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(queryAllByTestId('card').length).toBe(0);
    });

    it('should NOT render AmendFlightCards if status is Loading', () => {
        mockProps.status = DataStatus.Loading;
        const { queryAllByTestId } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(queryAllByTestId('card').length).toBe(0);
    });

    it('should render AmendFlightCard if status is LoadingMore', () => {
        mockProps.status = DataStatus.LoadingMore;
        const { getByTestId } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(getByTestId('card')).toBeInTheDocument();
    });

    it('should render AmendFlightCard if status is Loaded', () => {
        const { getByTestId } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(getByTestId('card')).toBeInTheDocument();
    });

    it('should render AmendFlightCard if status is Error', () => {
        mockProps.status = DataStatus.Error;
        const { getByTestId } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(getByTestId('card')).toBeInTheDocument();
    });

    it('should render ErrorMessage if status is Error', () => {
        mockProps.status = DataStatus.Error;
        render(<AmendAlternativeFlights {...mockProps} />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    it('should NOT render ErrorMessage if status is not Error', () => {
        render(<AmendAlternativeFlights {...mockProps} />);

        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should NOT render button if number of flights > total number of flights', () => {
        render(<AmendAlternativeFlights {...mockProps} />);

        expect(screen.queryByTestId('show-more-button')).not.toBeInTheDocument();
    });

    it('should NOT render button if number of flights = total number of flights', () => {
        mockProps.totalFlights = 1;
        render(<AmendAlternativeFlights {...mockProps} />);

        expect(screen.queryByTestId('show-more-button')).not.toBeInTheDocument();
    });

    it('should render button if number of flights < total number of flights', () => {
        mockProps.totalFlights = 2;
        const { getByTestId } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(getByTestId('show-more-button')).toBeInTheDocument();
    });

    it('should call onLoadMoreClick when "Show More" button is clicked', () => {
        mockProps.totalFlights = 2;
        render(<AmendAlternativeFlights {...mockProps} />);
        const showMoreButton = screen.getByTestId('show-more-button');

        expect(showMoreButton).toBeInTheDocument();

        fireEvent.click(showMoreButton);

        expect(mockProps.onLoadMoreClick).toHaveBeenCalledTimes(1);
    });

    it('should not render no flights available message if flights', () => {
        const { queryByTestId, queryByText } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(queryByTestId('amend-flights-no-flights')).not.toBeInTheDocument();
        expect(queryByText('0 flights available')).not.toBeInTheDocument();
        expect(queryByText('Sorry, try again')).not.toBeInTheDocument();
    });

    it('should render no flights available message if no flights', () => {
        mockProps.flights = [];
        const { getByTestId, getByText } = render(<AmendAlternativeFlights {...mockProps} />);

        expect(getByTestId('amend-flights-no-flights')).toBeInTheDocument();
        expect(
            getByText(`${mockProps.fields.NoFlightsAvailableTitle.value} ${mockProps.flights.length}`),
        ).toBeInTheDocument();
        expect(getByText('Sorry, try again')).toBeInTheDocument();
    });

    describe('countOfFlightsLabel', () => {
        it('should render singular total flights label if total flights is 1', () => {
            mockProps.totalFlights = 1;
            render(<AmendAlternativeFlights {...mockProps} />);

            expect(
                screen.getByText(
                    `${SitecoreDictionary.AlternativeFlightsLabelsTotalFlightsSingular} ${mockProps.totalFlights}`,
                ),
            ).toBeInTheDocument();
        });

        it('should render plural total flights label if total flights is more than 1', () => {
            mockProps.totalFlights = 11;
            render(<AmendAlternativeFlights {...mockProps} />);

            expect(
                screen.getByText(
                    `${SitecoreDictionary.AlternativeFlightsLabelsTotalFlightsPlural} ${mockProps.totalFlights}`,
                ),
            ).toBeInTheDocument();
        });

        it('should NOT render total flights label if total flights is 0', () => {
            render(<AmendAlternativeFlights {...mockProps} />);

            expect(screen.queryByTestId('alternative-flights-total')).not.toBeInTheDocument();
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

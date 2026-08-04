import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { AmendFlightsSortStore } from 'frontend/store/holidays/amend/amendFlight/AmendFlightsSortStore';

import AmendFlightsFilters from './AmendFlightsFilters';

const createProps = () => ({
    isShowPrefilteredMessage: true,
});

const createStores = () => ({
    appStore: { isScreenLessMedium: true },
    amendFlightsStore: {
        isPreFilteredMessageShown: true,
        filters: [1, 2],
        togglePreFilteredMessage: jest.fn(),
        sorting: new AmendFlightsSortStore(),
    },
});

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockFiltersContainerProps = jest.fn();
jest.mock('frontend/components/common/SearchFilters/FiltersContainer', () => ({
    __esModule: true,
    default: props => {
        mockFiltersContainerProps(props);

        return <div onClick={props.onOpenDrawer} data-tid='filter' />;
    },
}));

jest.mock('../FlightsPreFilteredMessage', () => ({
    ...jest.requireActual('../FlightsPreFilteredMessage'),
    FlightsPreFilteredMessage: jest.fn(() => <div data-tid='message' />),
}));

jest.mock('frontend/components/common/Amend/AmendmentSort/AmendmentSort', () => () => (
    <div data-tid='amendment-sort' />
));

describe('<AmendFlightsFilters />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('should NOT render if no filters', () => {
        mockStores.amendFlightsStore.filters = [];
        const { container } = render(<AmendFlightsFilters />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render all elements', () => {
        render(<AmendFlightsFilters {...mockProps} />);

        expect(screen.getByTestId('filter')).toBeInTheDocument();
        expect(screen.getByTestId('message')).toBeInTheDocument();
        expect(screen.getByTestId('amendment-sort')).toBeInTheDocument();
    });

    it('should NOT show the prefiltered message', () => {
        mockProps.isShowPrefilteredMessage = false;
        render(<AmendFlightsFilters {...mockProps} />);

        expect(screen.queryByTestId('message')).not.toBeInTheDocument();
    });

    it('should NOT render message if screen NOT less medium', () => {
        mockStores.appStore.isScreenLessMedium = false;
        render(<AmendFlightsFilters />);

        expect(screen.queryByTestId('message')).not.toBeInTheDocument();
    });

    it('should NOT render message if message NOT shown', () => {
        mockStores.amendFlightsStore.isPreFilteredMessageShown = false;
        render(<AmendFlightsFilters />);

        expect(screen.queryByTestId('message')).not.toBeInTheDocument();
    });

    it('should drawer click be invoked', () => {
        render(<AmendFlightsFilters {...mockProps} />);
        const filter = screen.getByTestId('filter');

        fireEvent.click(filter);

        expect(mockStores.amendFlightsStore.togglePreFilteredMessage).toHaveBeenCalled();
    });

    it('Should pass right parameters to the FiltersContainer', () => {
        render(<AmendFlightsFilters {...mockProps} />);
        expect(mockFiltersContainerProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isFiltersLoaded: true,
                hideFiltersLabel: true,
                onOpenDrawer: expect.any(Function),
                selectedDestinationCodesQuery: null,
                isApplyDisabled: false,
            }),
        );
    });
});

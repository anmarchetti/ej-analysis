import React from 'react';
import { render, screen } from '@testing-library/react';

import { IOffer } from 'models/data/IOffer';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';

import { IOtherRoutesPopupContentProps, OtherRoutesPopupContent } from './OtherRoutesPopupContent';

jest.mock('./NoResults/OtherRoutesNoResults', () => () => <div data-tid='no-results' />);
jest.mock('./RoutesList/OtherRoutesList', () => () => <div data-tid='results-list' />);
jest.mock('./Skeleton/OtherRoutesSkeleton', () => () => <div data-tid='loading-skeleton' />);
jest.mock('./TableHeader/OtherRoutesTableHeader', () => () => <div data-tid='table-header' />);
const mockPopupHeader = jest.fn();
jest.mock('./PopupHeader/OtherRoutesPopupHeader', () => ({
    __esModule: true,
    default: props => {
        mockPopupHeader(props);

        return <div data-tid='popup-header' />;
    },
}));

const createProps = () =>
    ({
        offer: {} as IOffer,
        alternativeFlights: [{} as IOffer, {} as IOffer, {} as IOffer],
        priceDisclaimer: '',
        isLoading: false,
        isMobile: false,
        isOpen: false,
        onClose: jest.fn(),
        onSelectRoute: jest.fn(),
        onFlightsSort: jest.fn(),
        selectedSortOption: {
            label: 'default code',
            value: 'default sort',
        },
        sortBy: AlternativeFlightsSortBy.PriceHightToLow,
        sortOptions: [
            {
                label: 'default code',
                value: 'default sort',
            },
            {
                label: 'default code 1 ',
                value: 'default sort 1',
            },
        ],
    } as IOtherRoutesPopupContentProps);

let mockProps;

describe('<OtherRoutesPopupContent />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('Should render no results when no flight', () => {
        mockProps.alternativeFlights = [];
        render(<OtherRoutesPopupContent {...mockProps} />);

        expect(screen.getByTestId('no-results')).toBeInTheDocument();
    });

    it('Should render no results when only one flight', () => {
        mockProps.alternativeFlights = [{} as IOffer];
        render(<OtherRoutesPopupContent {...mockProps} />);

        expect(screen.getByTestId('no-results')).toBeInTheDocument();
    });

    it('Should render header and loading skeleton', () => {
        mockProps.isLoading = true;
        render(<OtherRoutesPopupContent {...mockProps} />);

        expect(screen.getByTestId('popup-header')).toBeInTheDocument();
        expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
        expect(mockPopupHeader).toHaveBeenCalledWith({
            offer: mockProps.offer,
            onFlightsSort: expect.any(Function),
            selectedSortOption: mockProps.selectedSortOption,
            sortBy: mockProps.sortBy,
            sortOptions: mockProps.sortOptions,
        });
    });

    it('Should render header and results', () => {
        render(<OtherRoutesPopupContent {...mockProps} />);

        expect(screen.getByTestId('popup-header')).toBeInTheDocument();
        expect(screen.getByTestId('results-list')).toBeInTheDocument();
    });

    describe('Table header', () => {
        it('Should render table header on desktop', () => {
            render(<OtherRoutesPopupContent {...mockProps} />);

            expect(screen.getByTestId('table-header')).toBeInTheDocument();
        });

        it('Should not render table header on mobile', () => {
            mockProps.isMobile = true;
            render(<OtherRoutesPopupContent {...mockProps} />);

            expect(screen.queryByTestId('table-header')).not.toBeInTheDocument();
        });
    });
});

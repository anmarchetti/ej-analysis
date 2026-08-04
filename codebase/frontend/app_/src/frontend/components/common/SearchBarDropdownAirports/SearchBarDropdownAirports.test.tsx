import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { TStores } from 'frontend/store/IStores';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

import SearchBarDropdownAirports, { ISearchBarDropdownAirportsProps } from './SearchBarDropdownAirports';

jest.mock('frontend/components/common/AirportCheckboxColumns/AirportCheckboxColumns', () => ({
    __esModule: true,
    default: () => <div data-tid='airport-checkbox-columns' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

const resetMocks = (): ISearchBarDropdownAirportsProps => ({
    airports: [] as any,
    countries: [
        {
            name: 'United Kingdom',
            code: 'GB',
            airports: [
                {
                    code: 'LGW',
                    name: 'London Gatwick Airport',
                    isDepartureAirport: true,
                },
                {
                    code: 'LTN',
                    name: 'London Luton Airport',
                    isDepartureAirport: true,
                },
            ],
            hasDepartureAirports: true,
        },
    ],
    id: '',
    onAddAirport: jest.fn(),
    onClear: jest.fn(),
    onClose: jest.fn(),
    onRemoveAirport: jest.fn(),
    setOrigins: jest.fn(),
});

let mockStores: TStores;
let mockProps: ISearchBarDropdownAirportsProps;
let mockLocalStore;

describe('<SearchBarDropdownAirports />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createMockStores({
            searchStore: {
                searchFrom: {
                    isDisabledItem: jest.fn(),
                    isCheckItem: jest.fn(),
                },
            },
            trackingStore: {
                searchPod: {
                    trackFromFooterButtonsClick: jest.fn(),
                },
            },
        });
        mockLocalStore = createMockLocalStore();
    });

    it('should render', () => {
        render(<SearchBarDropdownAirports {...mockProps} />);

        expect(screen.getByTestId('airports-dropdown')).toBeInTheDocument();
        expect(screen.getByText(mockLocalStore.fields.FromDropdownLabel.value)).toBeInTheDocument();
        expect(screen.getByTestId('airport-checkbox-columns')).toBeInTheDocument();
        expect(screen.getByTestId('apply-button')).toBeInTheDocument();
        expect(screen.getByTestId('close-button')).toBeInTheDocument();
    });

    it('should call onClose when close btn click', () => {
        render(<SearchBarDropdownAirports {...mockProps} />);

        fireEvent.click(screen.getByTestId('close-button'));

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should not call onClose when apply btn click and nothing selected', () => {
        render(<SearchBarDropdownAirports {...mockProps} />);

        fireEvent.click(screen.getByTestId('apply-button'));

        expect(mockProps.onClose).not.toHaveBeenCalled();
    });

    it('should call onClose when apply btn click and if something selected', () => {
        mockProps.airports = ['LTN', 'LGV'];
        render(<SearchBarDropdownAirports {...mockProps} />);

        fireEvent.click(screen.getByTestId('apply-button'));

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should call onClear when clear selection button clicked', () => {
        mockProps.airports = ['LGW', 'LTN', 'SEN', 'STN'];

        render(<SearchBarDropdownAirports {...mockProps} />);

        fireEvent.click(screen.getByTestId('clear-button'));
        expect(mockProps.onClear).toHaveBeenCalled();
    });

    it('should render ariaStatusMessage with airportsCount', () => {
        render(<SearchBarDropdownAirports {...mockProps} />);

        expect(screen.getByRole('status')).toHaveTextContent('Found 2 airports');
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';

import { IOffer } from 'models/data/IOffer';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';

import { IOtherRoutesPopupProps, OtherRoutesPopup } from './OtherRoutesPopup';

jest.mock('frontend/utils/offer.utils');
jest.mock('frontend/components/common/Popup', () => ({
    Popup: ({ children }) => <div data-tid='popup'>{children}</div>,
}));
jest.mock('./OtherRoutesDrawer', () => () => <div data-tid='drawer' />);

const mockOtherRoutesPopupContent = jest.fn();
jest.mock(
    'frontend/components/renderings/SearchResults/components/other-routes/OtherRoutesPopup/PopupContent/OtherRoutesPopupContent',
    () => ({
        __esModule: true,
        default: props => {
            mockOtherRoutesPopupContent(props);

            return <div data-tid='other-routes-popup-content' />;
        },
    }),
);

const createProps = () =>
    ({
        offer: {} as IOffer,
        alternativeFlights: [],
        isLoading: false,
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
    } as IOtherRoutesPopupProps);

const createStores = () => ({
    appStore: { isScreenMedium: false },
    layoutStore: { tooltipSettings: null },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OtherRoutesPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    describe('Desktop', () => {
        beforeEach(() => {
            mockStores.appStore.isScreenMedium = true;
        });

        it('Should render popup when it opened with other routes popup content', () => {
            mockProps.isOpen = true;
            render(<OtherRoutesPopup {...mockProps} />);

            expect(screen.getByTestId('popup')).toBeInTheDocument();
            expect(screen.getByTestId('other-routes-popup-content')).toBeInTheDocument();
            expect(mockOtherRoutesPopupContent).toHaveBeenCalledWith({
                alternativeFlights: mockProps.alternativeFlights,
                isLoading: mockProps.isLoading,
                isOpen: mockProps.isOpen,
                offer: mockProps.offer,
                onClose: expect.any(Function),
                onFlightsSort: expect.any(Function),
                onSelectRoute: expect.any(Function),
                priceDisclaimer: mockProps.priceDisclaimer,
                selectedSortOption: mockProps.selectedSortOption,
                sortBy: mockProps.sortBy,
                sortOptions: mockProps.sortOptions,
            });
        });

        it('Should not render popup when it not opened', () => {
            mockProps.isOpen = false;
            render(<OtherRoutesPopup {...mockProps} />);

            expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
            expect(screen.queryByTestId('other-routes-popup-content')).not.toBeInTheDocument();
        });
    });

    it('Should render drawer on mobile', () => {
        mockStores.appStore.isScreenMedium = false;
        render(<OtherRoutesPopup {...mockProps} />);

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });
});

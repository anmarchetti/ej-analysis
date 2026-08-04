import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockTransferWithAmendmentCharges, mockValidatedFlights } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendmentBasket from './AmendmentBasket';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

jest.mock('frontend/components/renderings/AmendmentBasket/components/FlightsBasket/FlightsBasket', () => ({
    __esModule: true,
    default: () => <div data-tid='flights-basket' />,
}));

const mockTransfersBasketProps = jest.fn();
jest.mock('frontend/components/renderings/AmendmentBasket/components/TransfersBasket/TransfersBasket', () => ({
    __esModule: true,
    default: props => {
        mockTransfersBasketProps(props);

        return <div data-tid='transfers-basket' />;
    },
}));

jest.mock('frontend/components/common/StickyBox', () => ({
    __esModule: true,
    default: props => <div data-tid='sticky-box'>{props.render()}</div>,
}));

describe('<AmendmentBasket />', () => {
    beforeAll(() => {
        mockStores = createMockStores({
            amendTransfersStore: {
                selectedTransfer: null,
            },
            amendFlightsStore: {
                selectedFlight: mockValidatedFlights.transports[0],
            },
            layoutStore: {
                isAmendFlightsPage: true,
            },
        });
    });

    it('Should render StickyBox', () => {
        render(<AmendmentBasket />);

        expect(screen.getByTestId('sticky-box')).toBeInTheDocument();
        expect(screen.getByTestId('flights-basket')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsPriceLabelsTotal)).toBeInTheDocument();
        expect(screen.getByText('£226')).toBeInTheDocument();
    });

    it('Should show selected transport on transfer page', () => {
        mockStores.layoutStore.isAmendFlightsPage = false;
        mockStores.layoutStore.isAmendTransfersPage = true;
        mockStores.amendTransfersStore.selectedTransfer = mockTransferWithAmendmentCharges;
        render(<AmendmentBasket />);

        expect(screen.getByTestId('transfers-basket')).toBeInTheDocument();
        expect(mockTransfersBasketProps).toHaveBeenCalledWith({ transfer: mockTransferWithAmendmentCharges.transfer });
        expect(screen.getByText(SitecoreDictionary.GlobalsPriceLabelsTotal)).toBeInTheDocument();
        expect(screen.getByText('£13')).toBeInTheDocument();
    });

    it('Should NOT render when no transfer is selected', () => {
        mockStores.layoutStore.isAmendFlightsPage = false;
        mockStores.layoutStore.isAmendTransfersPage = true;
        mockStores.amendTransfersStore.selectedTransfer = null;
        const { container } = render(<AmendmentBasket />);

        expect(container.firstChild).toBeNull();
    });

    it('Should also render with zero price difference as well', () => {
        mockStores.layoutStore.isAmendFlightsPage = true;
        mockStores.amendFlightsStore.selectedFlight = {
            ...mockValidatedFlights.transports[0],
            amendmentCharges: 0,
        };
        render(<AmendmentBasket />);

        expect(screen.getByText('£0')).toBeInTheDocument();
    });

    it('Should NOT render for mobile', () => {
        mockUseMobileViewport = true;
        const { container } = render(<AmendmentBasket />);

        expect(container.firstChild).toBeNull();
    });
});

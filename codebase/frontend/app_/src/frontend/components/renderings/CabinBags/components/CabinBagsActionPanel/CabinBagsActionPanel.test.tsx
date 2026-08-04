import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockPassengersList } from 'frontend/__mocks__';
import { mockCabinBagsFields } from 'frontend/__mocks__/cabinBags';
import { luggageInfoMock, mockDefaultBags } from 'frontend/__mocks__/extraLuggage';

import { CabinBagsActionPanel, ICabinBagsActionPanelProps } from './CabinBagsActionPanel';

const createProps = (): ICabinBagsActionPanelProps => ({
    fields: mockCabinBagsFields,
});

const createStores = () => ({
    bookingStore: {
        extraLuggage: {
            getLargeCabinBagsFormattedPrice: jest.fn(() => '23$'),
            generatePassengerLCBItems: jest.fn(idx => idx),
            validateLCB: jest.fn(),
            existingExtraLuggageItems: luggageInfoMock.items,
            isLCBAlmostFull: false,
            passengersAvailableForLCBCount: 1,
            defaultBags: mockDefaultBags,
        },
        availableDepartureCabinBags: 50,
        availableReturnCabinBags: 50,
    },
    layoutStore: {
        isTradePortal: false,
        isPricesHidden: false,
        getPhrase: jest.fn(p => p),
    },
    flightsPassengersStore: {
        outBoundPassengers: mockPassengersList,
        isLCBAssignedToAllPassengers: false,
        LCBCount: 0,
    },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUrgencyMessageProps = jest.fn();
jest.mock('frontend/components/common/UrgencyMessage/UrgencyMessage', () => ({
    __esModule: true,
    default: props => {
        mockUrgencyMessageProps(props);

        return <div data-tid='urgency-message' />;
    },
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockButton(props);

        return <div data-tid='lcb-action-panel-button' {...props} />;
    },
}));

describe('<CabinBagsActionPanel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should skip when no fields', () => {
        render(<CabinBagsActionPanel />);

        expect(screen.queryByTestId('lcb-action-panel')).not.toBeInTheDocument();
    });

    it('should skip when no price', () => {
        mockStores.bookingStore.extraLuggage.getLargeCabinBagsFormattedPrice = jest.fn();

        render(<CabinBagsActionPanel />);

        expect(screen.queryByTestId('lcb-action-panel')).not.toBeInTheDocument();
    });

    it('should render default with AddCabinBagLabel', () => {
        const { SpeedyBoardingLabel, SpeedyBoardingIcon } = mockCabinBagsFields;

        render(<CabinBagsActionPanel {...mockProps} />);

        expect(screen.getByTestId('lcb-action-panel')).toBeInTheDocument();

        const lcbPriceInfo = screen.getByTestId('lcb-price-info');
        expect(lcbPriceInfo).toHaveTextContent('Add for 23$ per person, per flight');
        expect(lcbPriceInfo).toHaveClass('priceInfo');

        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImage).toHaveBeenCalledWith({
            field: SpeedyBoardingIcon,
            className: 'speedyIcon',
            'data-tid': 'speedy-boarding-icon',
        });

        const speedyBoarding = screen.getByTestId('lcb-speedy-boarding');
        expect(speedyBoarding).toHaveTextContent(SpeedyBoardingLabel.value);
        expect(speedyBoarding).toHaveClass('speedyBoarding');

        expect(screen.getByTestId('lcb-action-panel-button')).toHaveClass('button');
        expect(screen.getByTestId('lcb-action-panel-button-text')).toHaveClass('buttonText');

        expect(mockStores.bookingStore.extraLuggage.getLargeCabinBagsFormattedPrice).toHaveBeenCalled();
    });

    it('should render Selected label when isLCBAssignedToAllPassengers = true', () => {
        mockStores.flightsPassengersStore.isLCBAssignedToAllPassengers = true;

        render(<CabinBagsActionPanel {...mockProps} />);

        expect(screen.getByTestId('lcb-selected-label')).toHaveTextContent('Globals.Labels.Selected');
    });

    describe('onAddLCBClick', () => {
        it('should add LCB for all passengers according to availability', async () => {
            render(<CabinBagsActionPanel {...mockProps} />);

            await userEvent.click(screen.getByTestId('lcb-action-panel-button'));

            const { generatePassengerLCBItems, validateLCB, existingExtraLuggageItems } =
                mockStores.bookingStore.extraLuggage;

            expect(generatePassengerLCBItems).toHaveBeenCalledTimes(1);
            expect(generatePassengerLCBItems).toHaveBeenCalledWith('1');
            expect(validateLCB).toHaveBeenCalledWith([...mockDefaultBags, '1', ...existingExtraLuggageItems], false);
        });
    });

    describe('Button label', () => {
        it('should render AddCabinBagLabel when all passengers can have a bag', () => {
            render(<CabinBagsActionPanel {...mockProps} />);

            expect(screen.getByTestId('lcb-action-panel-button-text')).toHaveTextContent(
                mockCabinBagsFields.AddCabinBagLabel.value,
            );

            expect(mockButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isOutlined: false,
                }),
            );
        });

        it('should render AddMaxCabinBagsButton and apply different button styling when NOT all passengers can have a bag', () => {
            mockStores.bookingStore.extraLuggage.isLCBAlmostFull = true;

            render(<CabinBagsActionPanel {...mockProps} />);

            expect(screen.getByTestId('lcb-action-panel-button-text')).toHaveTextContent(
                mockCabinBagsFields.AddMaxCabinBagsButton.value,
            );

            expect(mockButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    isOutlined: true,
                }),
            );
        });
    });

    describe('Price visibility on Trade Portal', () => {
        beforeEach(() => {
            mockStores.layoutStore.isTradePortal = true;
        });

        it('should hide price when isPricesHidden=true', () => {
            mockStores.layoutStore.isPricesHidden = true;

            render(<CabinBagsActionPanel {...mockProps} />);

            expect(screen.queryByTestId('lcb-price-info')).not.toBeInTheDocument();
        });

        it('should show price when isPricesHidden=false', () => {
            mockStores.layoutStore.isPricesHidden = false;

            render(<CabinBagsActionPanel {...mockProps} />);

            expect(screen.getByTestId('lcb-price-info')).toBeInTheDocument();
        });
    });

    describe('Urgency message', () => {
        it('should render urgency message when the amount of cabin bags are under the show message threshold', () => {
            mockStores.bookingStore.availableDepartureCabinBags = 49;
            mockStores.bookingStore.availableReturnCabinBags = 49;

            render(<CabinBagsActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).toBeInTheDocument();
        });

        it('should render urgency message when the amount of cabin bags are equal to the show message threshold', () => {
            mockStores.bookingStore.availableDepartureCabinBags = 49;
            mockStores.bookingStore.availableReturnCabinBags = 49;

            render(<CabinBagsActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).toBeInTheDocument();
        });

        it('should NOT render urgency message when the amount of cabin bags are over the show message threshold', () => {
            mockStores.bookingStore.availableDepartureCabinBags = 51;
            mockStores.bookingStore.availableReturnCabinBags = 51;

            render(<CabinBagsActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
        });

        it('should NOT render urgency message when the threshold is met but there are already selected cabin bags', () => {
            mockStores.bookingStore.availableDepartureCabinBags = 49;
            mockStores.bookingStore.availableReturnCabinBags = 49;
            mockStores.flightsPassengersStore.LCBCount = 1;

            render(<CabinBagsActionPanel {...mockProps} />);

            expect(screen.queryByTestId('urgency-message')).not.toBeInTheDocument();
        });
    });
});

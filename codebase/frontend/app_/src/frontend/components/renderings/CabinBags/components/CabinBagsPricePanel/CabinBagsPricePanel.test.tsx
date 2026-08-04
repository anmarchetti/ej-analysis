import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockPassenger } from 'frontend/__mocks__';
import { mockCabinBagsFields } from 'frontend/__mocks__/cabinBags';
import {
    cabinBagsMock,
    generateLuggageInfoItemMock,
    luggageInfoMock,
    mockDefaultBags,
} from 'frontend/__mocks__/extraLuggage';

import { CabinBagsPricePanel, ICabinBagsPricePanelProps } from './CabinBagsPricePanel';

const generatedLCB = [
    generateLuggageInfoItemMock('1', '5', 'SCB1', 'CABI', 1, 5),
    generateLuggageInfoItemMock('2', '5', 'SCB1', 'CABI', 1, 5),
];
const createProps = (): ICabinBagsPricePanelProps => ({
    fields: mockCabinBagsFields,
    passenger: {
        outboundPassenger: { ...mockPassenger },
        inboundPassenger: { ...mockPassenger },
    },
    passengerIndex: 1,
});

const createStores = () => ({
    bookingStore: {
        extraLuggage: {
            getLargeCabinBagsFormattedPrice: jest.fn(() => '+23$'),
            validateLCB: jest.fn(),
            generatePassengerLCBItems: jest.fn().mockReturnValue(generatedLCB),
            existingExtraLuggageItems: luggageInfoMock.items,
            existingLCBItems: cabinBagsMock.items,
            LCBMaxQuantity: 6,
            defaultBags: mockDefaultBags,
        },
    },
    layoutStore: {
        getPhrase: jest.fn(p => p),
        isTradePortal: false,
        isPricesHidden: false,
        isCabinBagsEnabled: true,
        isPostBookingPages: false,
        isViewBookingPage: false,
    },
    flightsPassengersStore: {
        togglePassengerBag: jest.fn(),
    },
    viewBookingStore: {
        isBookingOutOfSync: false,
    },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

const mockAncillariesPassengerType = jest.fn();
jest.mock('frontend/components/common/AncillariesPassengerType/AncillariesPassengerType', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockAncillariesPassengerType(props);

        return <div data-tid='ancillaries-passenger-type' />;
    },
}));

const mockLCBIsNotAddedRow = jest.fn();
jest.mock('frontend/components/renderings/CabinBags/components/LCBIsNotAddedRow/LCBIsNotAddedRow', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockLCBIsNotAddedRow(props);

        return <div data-tid='lcb-is-not-added-row' />;
    },
}));

const mockLCBAddedRow = jest.fn();
jest.mock('frontend/components/renderings/CabinBags/components/LCBAddedRow/LCBAddedRow', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockLCBAddedRow(props);

        return <div data-tid='lcb-added-row' />;
    },
}));

const mockIncludedBagsRow = jest.fn();
jest.mock('frontend/components/renderings/CabinBags/components/IncludedBagsRow/IncludedBagsRow', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockIncludedBagsRow(props);

        return <div data-tid='included-bags-row' />;
    },
}));

describe('<CabinBagsPricePanel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should skip when no fields', () => {
        delete mockProps.fields;

        render(<CabinBagsPricePanel {...mockProps} />);

        expect(screen.queryByTestId('lcb-price-panel')).not.toBeInTheDocument();
    });

    it('should skip when no price', () => {
        mockStores.bookingStore.extraLuggage.getLargeCabinBagsFormattedPrice = jest.fn();

        render(<CabinBagsPricePanel {...mockProps} />);

        expect(screen.queryByTestId('lcb-price-panel')).not.toBeInTheDocument();
    });

    describe('Post Booking Flow', () => {
        beforeEach(() => {
            mockStores.layoutStore.isPostBookingPages = true;
        });

        it('should NOT skip when no price', () => {
            mockStores.bookingStore.extraLuggage.getLargeCabinBagsFormattedPrice = jest.fn();

            render(<CabinBagsPricePanel {...mockProps} />);

            expect(screen.getByTestId('lcb-price-panel')).toBeInTheDocument();
        });

        it('should apply different styling and should NOT display add action layout', () => {
            render(<CabinBagsPricePanel {...mockProps} />);

            expect(screen.getByTestId('lcb-price-panel-wrapper')).toHaveClass('wrapperFullAlt');
            expect(screen.queryByTestId('add-lcb-container')).not.toBeInTheDocument();
        });
    });

    describe('isCabinBagsEnabled', () => {
        beforeEach(() => {
            mockStores.layoutStore.isCabinBagsEnabled = false;
        });

        it('should NOT render added and not-added LCB when isCabinBagsEnabled is false', () => {
            render(<CabinBagsPricePanel {...mockProps} />);

            expect(screen.queryByTestId('lcb-is-not-added-row')).not.toBeInTheDocument();
            expect(screen.queryByTestId('lcb-added-row')).not.toBeInTheDocument();
        });

        it('should render added LCB when isCabinBagsEnabled is false on ViewBookingPage', () => {
            mockStores.layoutStore.isViewBookingPage = true;

            render(<CabinBagsPricePanel {...mockProps} />);

            expect(screen.queryByTestId('lcb-is-not-added-row')).not.toBeInTheDocument();
            expect(screen.queryByTestId('lcb-added-row')).toBeInTheDocument();
        });
    });

    describe('isBookingOutOfSync', () => {
        it('should NOT render LCBAddedRow when isBookingOutOfSync === true', () => {
            mockStores.viewBookingStore.isBookingOutOfSync = true;

            render(<CabinBagsPricePanel {...mockProps} />);
            expect(screen.queryByTestId('lcb-added-row')).not.toBeInTheDocument();
        });

        it('should NOT render LCBIsNotAddedRow when isBookingOutOfSync === true', () => {
            mockStores.viewBookingStore.isBookingOutOfSync = true;

            render(<CabinBagsPricePanel {...mockProps} />);
            expect(screen.queryByTestId('lcb-is-not-added-row')).not.toBeInTheDocument();
        });
    });

    it('should render without LCB', () => {
        render(<CabinBagsPricePanel {...mockProps} />);

        const wrapper = screen.getByTestId('lcb-price-panel-wrapper');
        expect(wrapper).toHaveClass('wrapper');
        expect(wrapper).not.toHaveClass('wrapperFull');

        expect(screen.getByTestId('ancillaries-passenger-type')).toBeInTheDocument();
        expect(mockAncillariesPassengerType).toHaveBeenCalledWith({
            className: 'passengerType',
            fields: { Children: mockCabinBagsFields.Children },
            numberOfPerson: 1,
            outboundPassenger: mockPassenger,
        });

        expect(screen.getByTestId('lcb-price-panel')).toHaveClass('container');

        expect(screen.getByTestId('included-bags-row')).toBeInTheDocument();
        expect(mockIncludedBagsRow).toHaveBeenCalledWith({
            withInfant: false,
            fields: mockCabinBagsFields,
        });

        expect(screen.getByTestId('lcb-added-row')).toBeInTheDocument();
        expect(mockLCBAddedRow).toHaveBeenCalledWith(
            expect.objectContaining({
                hasLCB: false,
                fields: mockCabinBagsFields,
                price: '+23$',
            }),
        );

        expect(screen.getByTestId('lcb-is-not-added-row')).toBeInTheDocument();
        expect(mockLCBIsNotAddedRow).toHaveBeenCalledWith({
            hasLCB: false,
            fields: mockCabinBagsFields,
            isLackOfCapacity: false,
        });

        const addContainer = screen.getByTestId('add-lcb-container');
        expect(addContainer).toHaveClass('addAction');
        expect(addContainer).toHaveTextContent(mockCabinBagsFields.AddLCBLabel.value);

        expect(screen.getByTestId('lcb-add-bag-action')).toHaveClass('btn addButton');

        const buttonText = screen.getByTestId('lcb-add-bag-action-text');
        expect(buttonText).toHaveTextContent(mockCabinBagsFields.AddButtonLabel.value);
        expect(buttonText).toHaveClass('buttonText');
    });

    describe('Price visibility on Trade Portal', () => {
        beforeEach(() => {
            mockStores.layoutStore.isTradePortal = true;
        });

        it('should hide price when isPricesHidden=true', () => {
            mockStores.layoutStore.isPricesHidden = true;

            render(<CabinBagsPricePanel {...mockProps} />);

            expect(screen.getByTestId('lcb-add-bag-action')).toHaveTextContent(
                mockCabinBagsFields.AddButtonLabel.value,
            );
        });

        it('should show price when isPricesHidden=false', () => {
            mockStores.layoutStore.isPricesHidden = false;

            render(<CabinBagsPricePanel {...mockProps} />);

            expect(screen.getByTestId('lcb-add-bag-action')).toHaveTextContent(
                mockCabinBagsFields.AddButtonLabel.value,
            );
        });
    });

    it('should add LCB to passenger when he did NOT have them when click on add button', async () => {
        mockProps.passenger.inboundPassenger.passengerId = '5';
        mockProps.passenger.outboundPassenger.passengerId = '5';

        render(<CabinBagsPricePanel {...mockProps} />);

        const addBtn = screen.getByTestId('lcb-add-bag-action');
        await userEvent.click(addBtn);

        const { generatePassengerLCBItems, validateLCB, existingExtraLuggageItems, existingLCBItems } =
            mockStores.bookingStore.extraLuggage;

        expect(generatePassengerLCBItems).toHaveBeenCalledWith('5');
        expect(validateLCB).toHaveBeenCalledWith(
            [...mockDefaultBags, ...existingExtraLuggageItems, ...existingLCBItems, ...generatedLCB],
            true,
            true,
        );
    });

    it('should render isLackOfCapacity when passengerIndex > LCBMaxQuantity', () => {
        mockProps.passengerIndex = 7;

        render(<CabinBagsPricePanel {...mockProps} />);

        expect(screen.getByTestId('lcb-price-panel-wrapper')).toHaveClass('wrapper wrapperFull');
        expect(mockLCBIsNotAddedRow).toHaveBeenCalledWith({
            hasLCB: false,
            fields: mockCabinBagsFields,
            isLackOfCapacity: true,
        });
        expect(screen.queryByTestId('add-lcb-container')).not.toBeInTheDocument();
    });
});

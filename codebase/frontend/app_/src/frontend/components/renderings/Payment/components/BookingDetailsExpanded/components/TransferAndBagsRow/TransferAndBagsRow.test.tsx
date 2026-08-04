import React from 'react';
import { render, screen } from '@testing-library/react';

import { guestsAmountByTypeMock, mockTransfer } from 'frontend/__mocks__';
import { extraLuggageInfoMock, mockDefaultBags } from 'frontend/__mocks__/extraLuggage';
import * as utils from 'frontend/utils/luggage.utils';
import { TransferType } from 'models/enum/transfer/TransferType';
import { TBookingDetailsFields } from 'frontend/components/renderings/Payment/components/BookingDetails/interfaces';

import { ITransferAndBagsRowProps, TransferAndBagsRow } from './TransferAndBagsRow';

const createProps = (): ITransferAndBagsRowProps => ({
    guestsAmountByType: guestsAmountByTypeMock,
    transfer: { ...mockTransfer },
    fields: {} as TBookingDetailsFields,
    extraLuggageItems: extraLuggageInfoMock.items,
});

const createStores = () => ({
    layoutStore: {
        sportEquipmentCategoryCodes: ['SEO', 'SEC'],
        holdLuggageCategoryCodes: ['BAGE'],
        largeCabinBagCode: 'SCB1',
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockLuggageInfo = jest.fn();
jest.mock('frontend/components/common/Booking/LuggageInfo/LuggageInfo', () => ({
    __esModule: true,
    default: props => {
        mockLuggageInfo(props);

        return <div data-tid='luggage-info' />;
    },
}));

const mockTransferInfo = jest.fn();
jest.mock(
    'frontend/components/renderings/Payment/components/BookingDetailsExpanded/components/TransferInfo/TransferInfo',
    () => ({
        __esModule: true,
        default: props => {
            mockTransferInfo(props);

            return <div data-tid='transfer-info' />;
        },
    }),
);

jest.mock('frontend/utils/luggage.utils', () => ({
    getDefaultBagsOneDirection: jest.fn().mockReturnValue([]),
    generateExtraLuggageFullInfo: jest.fn().mockReturnValue([{}, {}]),
}));

describe('TransferAndBagsRow', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should not render transfer when it does not exist', () => {
        mockProps.transfer = null;

        render(<TransferAndBagsRow {...mockProps} />);

        expect(mockLuggageInfo).toHaveBeenCalledWith({
            fields: mockProps.fields,
            infantsNumber: mockProps.guestsAmountByType.infants,
            defaultBagsOneDirection: [],
            extraLuggageFullInfo: [{}, {}],
            guestWithHoldLuggage: 3,
        });
        expect(screen.getByTestId('luggage-info')).toBeInTheDocument();
        expect(mockTransferInfo).not.toHaveBeenCalled();
    });

    it('should render transfer when they exist', () => {
        render(<TransferAndBagsRow {...mockProps} />);

        expect(mockTransferInfo).toHaveBeenCalledWith({
            transfer: mockProps.transfer,
        });
        expect(screen.getByTestId('transfer-info')).toBeInTheDocument();
    });

    describe('render Luggage', () => {
        it('when there is an infant', () => {
            mockProps.extraLuggageItems = [];

            render(<TransferAndBagsRow {...mockProps} />);

            expect(mockLuggageInfo).toHaveBeenCalledWith({
                fields: mockProps.fields,
                infantsNumber: mockProps.guestsAmountByType.infants,
                defaultBagsOneDirection: [],
                extraLuggageFullInfo: [{}, {}],
                guestWithHoldLuggage: 3,
            });
            expect(screen.getByTestId('luggage-info')).toBeInTheDocument();
        });

        it('when there is a defauld bags', () => {
            mockProps.extraLuggageItems = [];
            mockProps.guestsAmountByType.infants = 0;
            jest.spyOn(utils, 'getDefaultBagsOneDirection').mockReturnValueOnce(mockDefaultBags);

            render(<TransferAndBagsRow {...mockProps} />);

            expect(utils.getDefaultBagsOneDirection).toHaveBeenCalledWith(mockProps.extraLuggageItems);
            expect(mockLuggageInfo).toHaveBeenCalledWith({
                fields: mockProps.fields,
                infantsNumber: mockProps.guestsAmountByType.infants,
                defaultBagsOneDirection: mockDefaultBags,
                extraLuggageFullInfo: [{}, {}],
                guestWithHoldLuggage: 3,
            });
            expect(screen.getByTestId('luggage-info')).toBeInTheDocument();
        });

        it('when there is am extra luggage', () => {
            mockProps.guestsAmountByType.infants = 0;

            render(<TransferAndBagsRow {...mockProps} />);

            expect(utils.generateExtraLuggageFullInfo).toHaveBeenCalledWith(
                mockProps.extraLuggageItems,
                mockStores.layoutStore.sportEquipmentCategoryCodes,
                mockStores.layoutStore.holdLuggageCategoryCodes,
            );
            expect(mockLuggageInfo).toHaveBeenCalledWith({
                fields: mockProps.fields,
                infantsNumber: mockProps.guestsAmountByType.infants,
                defaultBagsOneDirection: [],
                extraLuggageFullInfo: [{}, {}],
                guestWithHoldLuggage: 3,
            });
            expect(screen.getByTestId('luggage-info')).toBeInTheDocument();
        });
    });

    it('should render nothing when NO transfer, infants, bags', () => {
        mockProps.transfer.type = TransferType.NoTransfer;
        mockProps.guestsAmountByType.infants = 0;
        mockProps.extraLuggageItems = [];

        const { container } = render(<TransferAndBagsRow {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
